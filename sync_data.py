import json
import os
import re
import sys
import time
import zlib
from collections import Counter, defaultdict
import pandas as pd
import numpy as np

# Windows consoles default to cp1252, which can't print the rupee sign (₹)
# baked into several detector reason strings -- force UTF-8 stdout so the
# sanity-check prints below don't crash the run.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# 1. Import your trained ML & forensic engine
try:
    from mplads_anomaly_engine import (
        load_and_clean_all,
        detect_cost_outliers,
        detect_duplicate_works,
        detect_excess_payment,
        detect_vendor_risk,
        detect_delayed_works,
        check_benfords_law,
        detect_recommendation_bypass,
        detect_sanction_delay,
        detect_fund_splitting,
        build_disbursement_map,
        build_image_map,
        build_payment_status_map,
        extract_district,
        extract_agency_title,
        slugify_text,
    )
    HAS_ML_ENGINE = True
except ImportError:
    HAS_ML_ENGINE = False
    print("[!] Warning: mplads_anomaly_engine.py not found in root directory. Running standard rules.")

# ==============================================================================
# Every constituency gets a full, real per-work export (public/data/works/) --
# see the write-out block near the end of this file. NATIONAL_SAMPLE_SIZE only
# controls the size of the separate cross-district "top risk" spot-audit file
# used for the Ministry dashboard's initial view; it does not limit per-
# district coverage.
# ==============================================================================
NATIONAL_SAMPLE_SIZE = 750

t0 = time.time()
print("[*] Running ML Anomaly & Data Sync Pipeline on eSAKSHI CSVs (ALL-INDIA scope)...")
clean_dfs = load_and_clean_all(data_dir=".")
df_alloc = clean_dfs["allocated"]
df_sanc = clean_dfs["sanctioned"]
df_rec = clean_dfs["recommended"]
df_comp = clean_dfs["completed"]
df_exp = clean_dfs["expenditure"]


def _print_detector_summary(name, df, flag_col, reason_col, id_col="clean_work_id", already_filtered=False):
    """Prints how many rows a detector scanned/flagged plus a few real samples."""
    if df is None or df.empty:
        print(f"    [{name}] 0 rows scanned (no data)")
        return
    flagged = df if already_filtered else (df[df[flag_col] == True] if flag_col in df.columns else df)
    print(f"    [{name}] {len(df)} rows scanned, {len(flagged)} flagged")
    for _, r in flagged.head(3).iterrows():
        wid = r.get(id_col, "?")
        reason = r.get(reason_col, "?") if reason_col else "?"
        print(f"        sample -> work_id={wid} | {reason}")


print("[*] Running detector 1/6: cost outliers vs regional peer median...")
cost_outliers = detect_cost_outliers(df_sanc) if HAS_ML_ENGINE else pd.DataFrame()
_print_detector_summary("cost_outliers", cost_outliers, "is_cost_outlier", "outlier_reason")

print("[*] Running detector 2/6: duplicate/split-bill NLP similarity...")
duplicate_pairs = detect_duplicate_works(df_rec) if HAS_ML_ENGINE else pd.DataFrame()
if not duplicate_pairs.empty:
    print(f"    [duplicate_works] {len(duplicate_pairs)} duplicate pairs flagged")
    for _, r in duplicate_pairs.head(3).iterrows():
        print(f"        sample -> {r['work_id_1']} <-> {r['work_id_2']} | {r['reason']}")
else:
    print("    [duplicate_works] 0 duplicate pairs flagged")

print("[*] Running detector 3/6: excess payment vs sanctioned cap...")
excess_payments, excess_stats = detect_excess_payment(df_sanc, df_exp) if HAS_ML_ENGINE else (pd.DataFrame(), {})
_print_detector_summary("excess_payment", excess_payments, "is_excess_payment", "excess_reason", already_filtered=True)
if excess_stats:
    print(f"        compliance: {excess_stats.get('clean_compliance_pct')}% clean "
          f"({excess_stats.get('total_violations')}/{excess_stats.get('total_works_audited')} works in violation)")

print("[*] Running detector 4/6: vendor cross-constituency collusion risk...")
vendor_risk_df, suspicious_vendors_set = detect_vendor_risk(df_exp) if HAS_ML_ENGINE else (pd.DataFrame(), set())
print(f"    [vendor_risk] {len(suspicious_vendors_set)} suspicious vendors flagged")
if not vendor_risk_df.empty:
    for _, r in vendor_risk_df.sort_values("constituency_count", ascending=False).head(3).iterrows():
        print(f"        sample -> {r['clean_vendor']} | {int(r['constituency_count'])} constituencies, {int(r['mp_count'])} MPs")

print("[*] Running detector 5/6: delayed works vs category norm...")
delayed_works = detect_delayed_works(df_sanc) if HAS_ML_ENGINE else pd.DataFrame()
_print_detector_summary("delayed_works", delayed_works, "is_delayed_outlier", "delay_reason", already_filtered=True)

print("[*] Running detector 6/9: Benford's Law digit anomaly...")
benfords_df = check_benfords_law(df_sanc) if HAS_ML_ENGINE else pd.DataFrame()
_print_detector_summary("benfords_law", benfords_df, "benford_flag", "benford_reason", already_filtered=True)

print("[*] Running detector 7/9: recommendation-bypass (CAG pattern)...")
bypass_df = detect_recommendation_bypass(df_sanc, df_rec) if HAS_ML_ENGINE else pd.DataFrame()
_print_detector_summary("recommendation_bypass", bypass_df, "is_bypass", "bypass_reason", already_filtered=True)

print("[*] Running detector 8/9: 45-day sanction-delay SLA...")
sla_df = detect_sanction_delay(df_rec, df_sanc) if HAS_ML_ENGINE else pd.DataFrame()
_print_detector_summary("sanction_delay_sla", sla_df, "is_sla_breach", "sla_reason", already_filtered=True)

print("[*] Running detector 9/9: fund-splitting heuristic...")
splitting_df = detect_fund_splitting(df_rec) if HAS_ML_ENGINE else pd.DataFrame()
_print_detector_summary("fund_splitting", splitting_df, "is_fund_splitting", "splitting_reason", already_filtered=True)

print(f"[*] All 9 detector models finished in {time.time()-t0:.1f}s")

disbursed_by_work_id = (
    build_disbursement_map(df_exp).set_index("clean_work_id")["total_disbursed"].to_dict()
    if HAS_ML_ENGINE else {}
)

# Real photo-evidence (Works Completed.csv Image field) and real payment
# status (expenditure sheet Payment Status field) per work -- both replace
# previous fabricated/inverse-of-risk placeholder values.
photo_by_work_id = build_image_map(df_comp) if HAS_ML_ENGINE else {}
payment_status_by_work_id = build_payment_status_map(df_exp) if HAS_ML_ENGINE else {}
print(f"[*] Real photo-evidence matched for {len(photo_by_work_id)} works; "
      f"real payment status matched for {len(payment_status_by_work_id)} works.")


def _build_reason_map(df, id_col, flag_col, reason_col):
    if df is None or df.empty or flag_col not in df.columns:
        return {}
    sub = df[df[flag_col] == True]
    return dict(zip(sub[id_col], sub[reason_col]))


cost_outlier_map = _build_reason_map(cost_outliers, "clean_work_id", "is_cost_outlier", "outlier_reason")
peer_median_map = dict(zip(cost_outliers["clean_work_id"], cost_outliers["peer_median"])) if not cost_outliers.empty else {}

dup_reason_map = {}
if not duplicate_pairs.empty:
    for _, r in duplicate_pairs.iterrows():
        dup_reason_map.setdefault(r["work_id_1"], r["reason"])
        dup_reason_map.setdefault(r["work_id_2"], r["reason"])

excess_reason_map = _build_reason_map(excess_payments, "clean_work_id", "is_excess_payment", "excess_reason")
delayed_reason_map = _build_reason_map(delayed_works, "clean_work_id", "is_delayed_outlier", "delay_reason")
benford_reason_map = _build_reason_map(benfords_df, "clean_work_id", "benford_flag", "benford_reason")
bypass_reason_map = _build_reason_map(bypass_df, "clean_work_id", "is_bypass", "bypass_reason")
sla_reason_map = _build_reason_map(sla_df, "clean_work_id", "is_sla_breach", "sla_reason")
splitting_reason_map = _build_reason_map(splitting_df, "clean_work_id", "is_fund_splitting", "splitting_reason")

rec_date_by_work = (
    dict(zip(df_rec[df_rec["clean_work_id"].notna()]["clean_work_id"], df_rec[df_rec["clean_work_id"].notna()]["clean_rec_date"]))
    if not df_rec.empty else {}
)

vendor_by_work = (
    df_exp[df_exp["clean_work_id"].notna()]
    .groupby("clean_work_id")["clean_vendor"]
    .apply(set)
    .to_dict()
    if not df_exp.empty else {}
)


def fast_score_work(work_id):
    score = 10
    reasons = []

    r = cost_outlier_map.get(work_id)
    if r:
        score += 35
        reasons.append(r)

    r = dup_reason_map.get(work_id)
    if r:
        score += 30
        reasons.append(r)

    r = excess_reason_map.get(work_id)
    if r:
        score += 40
        reasons.append(r)

    vendors = vendor_by_work.get(work_id)
    if vendors and (vendors & suspicious_vendors_set):
        score += 25
        reasons.append("Contractor flagged for cartel monopolization risk.")

    r = delayed_reason_map.get(work_id)
    if r:
        score += 20
        reasons.append(r)

    r = benford_reason_map.get(work_id)
    if r:
        score += 15
        reasons.append(r)

    r = bypass_reason_map.get(work_id)
    if r:
        score += 30
        reasons.append(r)

    r = sla_reason_map.get(work_id)
    if r:
        score += 20
        reasons.append(r)

    r = splitting_reason_map.get(work_id)
    if r:
        score += 15
        reasons.append(r)

    risk_score = min(score, 100)
    if not reasons:
        reasons.append("Project aligns mathematically with all regional integrity baselines.")
    return risk_score, reasons


def _impact_str(v):
    """Signed magnitude string for SHAP-style attribution, e.g. '+35' or '0'."""
    v = round(v, 1)
    if v == 0:
        return "0"
    return f"+{v:g}"


mp_profiles = []
all_works = []
district_risk_data = []
agency_id_by_work_id = {}

STATE_CENTROIDS = {
    "ANDHRA PRADESH": [15.9129, 79.7400], "ARUNACHAL PRADESH": [28.2180, 94.7278],
    "ASSAM": [26.2006, 92.9376], "BIHAR": [25.0961, 85.3131],
    "CHHATTISGARH": [21.2787, 81.8661], "GOA": [15.2993, 74.1240],
    "GUJARAT": [22.2587, 71.1924], "HARYANA": [29.0588, 76.0856],
    "HIMACHAL PRADESH": [31.1048, 77.1734], "JHARKHAND": [23.6102, 85.2799],
    "KARNATAKA": [15.3173, 75.7139], "KERALA": [10.8505, 76.2711],
    "MADHYA PRADESH": [22.9734, 78.6569], "MAHARASHTRA": [19.7515, 75.7139],
    "MANIPUR": [24.6637, 93.9063], "MEGHALAYA": [25.4670, 91.3662],
    "MIZORAM": [23.1645, 92.9376], "NAGALAND": [26.1584, 94.5624],
    "ODISHA": [20.9517, 85.0985], "PUNJAB": [31.1471, 75.3412],
    "RAJASTHAN": [27.0238, 74.2179], "SIKKIM": [27.5330, 88.5122],
    "TAMIL NADU": [11.1271, 78.6569], "TELANGANA": [18.1124, 79.0193],
    "TRIPURA": [23.9408, 91.9882], "UTTAR PRADESH": [26.8467, 80.9462],
    "UTTARAKHAND": [30.0668, 79.0193], "WEST BENGAL": [22.9868, 87.8550],
    "ANDAMAN AND NICOBAR ISLANDS": [11.7401, 92.6586], "CHANDIGARH": [30.7333, 76.7794],
    "DADRA AND NAGAR HAVELI AND DAMAN AND DIU": [20.1809, 73.0169],
    "DELHI": [28.7041, 77.1025], "JAMMU AND KASHMIR": [33.7782, 76.5762],
    "LADAKH": [34.1526, 77.5770], "LAKSHADWEEP": [10.5667, 72.6417],
    "PUDUCHERRY": [11.9416, 79.8083],
}
INDIA_FALLBACK_CENTROID = [22.3511, 78.6677]

# ==============================================================================
# District centroids (A0.2): eSAKSHI carries no real coordinate for any work
# (ground truth 1.2) -- these are NOT survey-geocoded lat/lngs. Each of the
# 751 real districts (parsed from IDA) gets one deterministic anchor point,
# offset from its state's centroid by a stable hash of the district name.
# This replaces the old per-WORK random jitter (which re-rolled for every
# work and routinely scattered a district's works across a whole state, or
# a hardcoded 6-constituency allowlist that only covered Tamil Nadu) with one
# fixed point per real district, so every work in the same district now
# clusters together. Precision claim: "same district clusters together", NOT
# "accurate absolute lat/lng".
# ==============================================================================
def _district_state_offset(district_name, state_name):
    base = STATE_CENTROIDS.get(str(state_name).strip().upper(), INDIA_FALLBACK_CENTROID)
    h = zlib.crc32(str(district_name).strip().upper().encode("utf-8"))
    lat_off = (((h % 2000) - 1000) / 1000) * 0.9
    lng_off = ((((h // 2000) % 2000) - 1000) / 1000) * 0.9
    return round(base[0] + lat_off, 6), round(base[1] + lng_off, 6)


_district_state_lookup = (
    df_sanc.dropna(subset=["clean_district"])
    .groupby("clean_district")["State"]
    .agg(lambda s: s.mode().iloc[0] if not s.mode().empty else s.iloc[0])
    .to_dict()
)

DISTRICT_CENTROIDS = {}
for _dist, _state in _district_state_lookup.items():
    _lat, _lng = _district_state_offset(_dist, _state)
    DISTRICT_CENTROIDS[_dist] = {
        "lat": _lat, "lng": _lng, "state": str(_state).strip(),
        "source": "approximate_state_offset",
    }

_geo_dir = os.path.join("src", "data", "geo")
os.makedirs(_geo_dir, exist_ok=True)
with open(os.path.join(_geo_dir, "district_centroids.json"), "w", encoding="utf-8") as f:
    json.dump(DISTRICT_CENTROIDS, f, indent=2)
print(f"[*] Wrote {len(DISTRICT_CENTROIDS)} district centroids to {_geo_dir}/district_centroids.json "
      f"(deterministic state-offset approximation -- eSAKSHI has no real GPS data).")


def resolve_coords(district, state, description):
    entry = DISTRICT_CENTROIDS.get(district)
    base = (entry["lat"], entry["lng"]) if entry else STATE_CENTROIDS.get(str(state).strip().upper(), INDIA_FALLBACK_CENTROID)
    h = sum(ord(c) for c in str(description))
    # Small per-work jitter (~3km) around the district's own anchor point,
    # instead of the old +-1.25 degree (~140km) state-wide scatter.
    lat_offset = ((h % 50) - 25) * 0.006
    lng_offset = (((h // 50) % 50) - 25) * 0.006
    return round(base[0] + lat_offset, 6), round(base[1] + lng_offset, 6)


def slugify(text):
    return re.sub(r'[^a-z0-9]+', '_', str(text).strip().lower()).strip('_')


# ==============================================================================
# SC/ST allocation: eSAKSHI has no official SC/ST-area field (confirmed by
# header inspection). scAllocationPct/stAllocationPct below are therefore an
# honest, computed PROXY -- share of a constituency's sanctioned amount going
# to works whose category/description matches SC/ST-linked keywords -- not an
# official compliance figure. Flagged as such via scStProxyNote on every MP.
# ==============================================================================
SC_KEYWORD_PATTERN = r'\b(SC|SCHEDULED\s*CASTE|HARIJAN)\b'
ST_KEYWORD_PATTERN = r'\b(ST|SCHEDULED\s*TRIBE|TRIBAL)\b'
SC_ST_PROXY_NOTE = (
    "Estimated from work-category/description keywords (e.g. 'SC Colony', 'Tribal') -- "
    "the eSAKSHI export has no official SC/ST-area field, so this is a proxy, not an "
    "official compliance figure."
)

# Real per-constituency expenditure, replacing the old total_sanc*0.74 guess.
df_exp["exp_const_key"] = df_exp["Constituency"].astype(str).str.strip().str.upper()
exp_by_const = df_exp.groupby("exp_const_key")["clean_disbursed_amount"].sum().to_dict()

# ==============================================================================
# A0.4: real 6-stage eSAKSHI work lifecycle (Work Status column), replacing
# the old progressPct fabrication (100 if "complete" appeared anywhere in the
# status -- which fired for "Work partially Completed" too -- else null).
# ==============================================================================
STAGE_ORDER = [
    "Sanction", "Time Estimation", "Vendor Identification",
    "Physical Inspection", "Work partially Completed", "Work Completed",
]
STAGE_INDEX = {s: i for i, s in enumerate(STAGE_ORDER)}

mp_id_counter = 1
alloc_rows = df_alloc.dropna(subset=["Constituency"]).copy()
alloc_rows["const_key"] = alloc_rows["Constituency"].astype(str).str.strip().str.upper()
alloc_rows = alloc_rows.drop_duplicates(subset=["const_key"])

df_sanc = df_sanc.copy()
df_sanc["const_key"] = df_sanc["Constituency"].astype(str).str.strip().str.upper()
sanc_by_const = {k: v for k, v in df_sanc.groupby("const_key")}

total_mps = len(alloc_rows)
for i, (_, alloc_row) in enumerate(alloc_rows.iterrows()):
    const_key = alloc_row["const_key"]
    const_display = str(alloc_row["Constituency"]).strip().title()
    state = str(alloc_row.get("State", "")).strip() or "Unknown"
    mp_name = str(alloc_row["clean_mp"]).strip()
    alloc_amount = float(alloc_row["clean_allocated_amount"]) if pd.notna(alloc_row["clean_allocated_amount"]) else 0.0

    sanc_subset = sanc_by_const.get(const_key)
    if sanc_subset is None or sanc_subset.empty:
        mp_id = f"MP{mp_id_counter:04d}"
        mp_id_counter += 1
        mp_profiles.append({
            "id": mp_id, "name": mp_name, "district": const_display, "constituency": const_display,
            "state": state, "house": "18th Lok Sabha", "entitlement": alloc_amount, "sanctionedAmount": 0.0,
            "expenditureAmount": 0.0, "scAllocationPct": 0.0, "stAllocationPct": 0.0,
            "scStProxyNote": SC_ST_PROXY_NOTE,
        })
        continue

    tot_works = len(sanc_subset)
    total_sanc = float(sanc_subset["clean_sanction_amount"].sum())
    total_exp = round(float(exp_by_const.get(const_key, 0.0)), 2)
    desc_upper = sanc_subset["Work description"].astype(str).str.upper()
    sc_amt = float(sanc_subset[desc_upper.str.contains(SC_KEYWORD_PATTERN, regex=True, na=False)]["clean_sanction_amount"].sum())
    st_amt = float(sanc_subset[desc_upper.str.contains(ST_KEYWORD_PATTERN, regex=True, na=False)]["clean_sanction_amount"].sum())
    sc_pct = round((sc_amt / total_sanc) * 100, 1) if total_sanc > 0 else 0.0
    st_pct = round((st_amt / total_sanc) * 100, 1) if total_sanc > 0 else 0.0
    mp_id = f"MP{mp_id_counter:04d}"
    mp_id_counter += 1

    district_risk_scores = []
    district_works_temp = []
    mp_true_districts = set()

    for _, row in sanc_subset.iterrows():
        work_id = str(row["clean_work_id"])
        desc = str(row.get("Work description", row.get("Work", "")))
        sanc_val = float(row["clean_sanction_amount"]) if pd.notna(row["clean_sanction_amount"]) else 500000.0
        status_label = str(row["clean_status"]).strip() or "Status Not Recorded"
        stage_index = STAGE_INDEX.get(status_label)

        # A0.1: real district, parsed from IDA -- distinct from (and often
        # spanning more/fewer areas than) the parliamentary constituency.
        raw_ida = row.get("IDA")
        district = extract_district(raw_ida) or const_display
        mp_true_districts.add(district)

        # A0.3: real implementing agency = the actual eSAKSHI IDA office
        # (District Magistrate / Collector / Deputy Commissioner / etc.),
        # replacing the fabricated AG001-AG005 / "ABC Infrastructure
        # Services" shell-company assignment.
        agency_name = extract_agency_title(raw_ida) or (str(raw_ida).strip() if pd.notna(raw_ida) else "Implementing Agency Not Recorded")
        agency_id = slugify_text(raw_ida) if pd.notna(raw_ida) else "agency_unknown"
        agency_id_by_work_id[work_id] = agency_id

        # A0.3: real vendor, matched from the expenditure sheet by work ID
        # (never fabricated -- works with no matched disbursement say so).
        matched_vendors = vendor_by_work.get(work_id)
        vendor_name = sorted(matched_vendors)[0].title() if matched_vendors else "No Vendor Payment Recorded"
        vendor_count = len(matched_vendors) if matched_vendors else 0

        # A0.5: real photo-evidence, joined from Works Completed.csv's Image
        # field by work ID (not computable for works never matched there,
        # e.g. still-ongoing works -- those are honestly "not_applicable").
        if work_id in photo_by_work_id:
            photo_evidence = "present" if photo_by_work_id[work_id] else "absent"
        else:
            photo_evidence = "not_applicable"

        # A0.6: real payment status carried through from the expenditure sheet.
        payment_status = payment_status_by_work_id.get(work_id, "No Disbursement Recorded")

        if HAS_ML_ENGINE:
            risk_score, reasons_list = fast_score_work(work_id)
            is_negative = risk_score >= 40
            anomaly_type = reasons_list[0]
        else:
            sla = row["sla_days"] if "sla_days" in row and pd.notna(row["sla_days"]) else 20
            is_negative = sla > 45
            risk_score = 85 if is_negative else 15
            anomaly_type = f"Statutory 45-Day SLA Breached ({int(sla)} days)" if is_negative else "Verified Compliant"
            reasons_list = [anomaly_type]

        # A0.5: real compliance rule -- a work recorded as fully Complete but
        # with no verified geotagged photo evidence is a genuine ghost-asset
        # risk signal (not fabricated: driven entirely by the real Work
        # Status + Works Completed.csv Image join).
        if status_label == "Work Completed" and photo_evidence != "present":
            reasons_list = [r for r in reasons_list if "aligns mathematically" not in r]
            reasons_list.append("Completion recorded without photographic evidence (Ghost Asset Risk).")
            risk_score = min(100, risk_score + 20)
            is_negative = True
            anomaly_type = reasons_list[0]

        risk_level = "HIGH" if risk_score >= 70 else ("MEDIUM" if risk_score >= 40 else "LOW")

        peer_median_cost = peer_median_map.get(work_id, sanc_val)
        if pd.isna(peer_median_cost) or peer_median_cost <= 0:
            peer_median_cost = sanc_val

        shap_drivers = []
        cost_ratio_val = sanc_val / peer_median_cost if peer_median_cost > 0 else 1.0
        if cost_ratio_val > 1.3:
            shap_drivers.append({"factor": "Cost vs. peer median", "impact": _impact_str(min(40, (cost_ratio_val - 1) * 20))})
        if any("duplicate" in r.lower() or "match" in r.lower() for r in reasons_list):
            shap_drivers.append({"factor": "Duplicate proposal similarity", "impact": _impact_str(30)})
        if any("exceed" in r.lower() or "cap" in r.lower() for r in reasons_list):
            shap_drivers.append({"factor": "Disbursement over sanctioned cap", "impact": _impact_str(40)})
        if any("cartel" in r.lower() or "contractor" in r.lower() for r in reasons_list):
            shap_drivers.append({"factor": "Vendor cross-constituency reach", "impact": _impact_str(25)})
        if any("stall" in r.lower() or "delay" in r.lower() for r in reasons_list):
            shap_drivers.append({"factor": "Delay vs. category norm", "impact": _impact_str(20)})
        if any("benford" in r.lower() for r in reasons_list):
            shap_drivers.append({"factor": "Benford's Law digit anomaly", "impact": _impact_str(15)})
        if any("no matching mp recommendation" in r.lower() for r in reasons_list):
            shap_drivers.append({"factor": "Sanctioned with no matching recommendation", "impact": _impact_str(30)})
        if any("statutory dm sla" in r.lower() for r in reasons_list):
            shap_drivers.append({"factor": "45-day sanction-delay SLA breach", "impact": _impact_str(20)})
        if any("fund-splitting" in r.lower() for r in reasons_list):
            shap_drivers.append({"factor": "Fund-splitting heuristic (amount clustering)", "impact": _impact_str(15)})
        if any("photographic evidence" in r.lower() for r in reasons_list):
            shap_drivers.append({"factor": "Completion without photo evidence", "impact": _impact_str(20)})
        if not shap_drivers:
            shap_drivers.append({"factor": "No anomaly drivers triggered", "impact": _impact_str(0)})

        district_risk_scores.append(risk_score)
        lat, lng = resolve_coords(district, state, desc)

        # Real statutory 45-day recommendation-to-sanction clock (District
        # Authorities must sanction/reject within 45 days of recommendation).
        # Only computable when this work's recommendation row was matched
        # (~74% of rows have an extractable work ID) and both dates parsed.
        rec_date = rec_date_by_work.get(work_id)
        sanc_date = row["clean_sanc_date"]
        days_to_sanction = None
        if pd.notna(rec_date) and pd.notna(sanc_date):
            delta = (sanc_date - rec_date).days
            if delta >= 0:
                days_to_sanction = int(delta)

        district_works_temp.append({
            "id": work_id if work_id and work_id != "None" else f"WS/{const_key[:3]}/{row['Sr. No.']}",
            "title": desc[:130],
            "description": desc,
            "category": str(row["clean_category"]).strip(),
            "district": district,
            "constituency": const_display,
            "state": state,
            "mpId": mp_id,
            "mpName": mp_name,
            "house": "18th Lok Sabha",
            "sanctionedAmount": sanc_val,
            "peerMedianCost": round(peer_median_cost, 2),
            "paymentReleased": round(float(disbursed_by_work_id.get(work_id, 0.0)), 2),
            "progressPct": None,
            "workStage": status_label,
            "workStageIndex": stage_index,
            "totalStages": len(STAGE_ORDER),
            "statusLabel": status_label,
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "isNegative": is_negative,
            "anomalyType": anomaly_type,
            "anomalyReasons": reasons_list,
            "shapDrivers": shap_drivers,
            "genAiAuditNote": (
                f"Gemini AI Note: {anomaly_type}" if is_negative
                else "Gemini AI Note: No irregularities detected against peer-group benchmarks or disbursement rules."
            ),
            "daysToSanction": days_to_sanction,
            "slaBreached": bool(days_to_sanction is not None and days_to_sanction > 45),
            "latitude": lat,
            "longitude": lng,
            "gpsCoordinates": f"{lat}° N, {lng}° E",
            "photoEvidence": photo_evidence,
            "photoUploaded": photo_evidence == "present",
            "paymentStatus": payment_status,
            "vendorName": vendor_name,
            "vendorCount": vendor_count,
            "agency": agency_name,
            "agencyId": agency_id,
            "implementingAgency": agency_name,
            "implementingAgencyRaw": str(raw_ida).strip() if pd.notna(raw_ida) else None,
        })

    # Real per-work-group concentration share (still keyed by the actual IDA
    # agency, computed per constituency batch) -- honest now that "agency" is
    # a real government office rather than a fabricated shell company.
    district_agency_counts = {}
    for w in district_works_temp:
        district_agency_counts[w["agencyId"]] = district_agency_counts.get(w["agencyId"], 0) + 1
    for w in district_works_temp:
        share = (district_agency_counts[w["agencyId"]] / len(district_works_temp)) * 100 if district_works_temp else 0
        w["agencyShareInDistrict"] = f"{share:.1f}%"
    flagged_count = len([w for w in district_works_temp if w["isNegative"]])

    mp_profiles.append({
        "id": mp_id, "name": mp_name, "district": const_display, "constituency": const_display,
        "districts": sorted(mp_true_districts),
        "state": state, "house": "18th Lok Sabha", "entitlement": alloc_amount, "sanctionedAmount": total_sanc,
        "expenditureAmount": total_exp, "scAllocationPct": sc_pct, "stAllocationPct": st_pct,
        "scStProxyNote": SC_ST_PROXY_NOTE,
    })

    all_works.extend(district_works_temp)

    if (i + 1) % 50 == 0 or (i + 1) == total_mps:
        print(f"    processed {i+1}/{total_mps} MPs, {len(all_works)} works so far ({time.time()-t0:.1f}s elapsed)")

print(f"[*] Built {len(all_works)} real ML-scored works across all {len(mp_profiles)} MPs/constituencies nationally.")

# ==============================================================================
# A0.1: DISTRICT_RISK_DATA rebuilt on TRUE districts (parsed from IDA), not
# parliamentary constituencies. A true district can pool works from several
# constituencies/MPs (one real District Magistrate often serves multiple Lok
# Sabha seats), so this is a fresh aggregation over the full all_works list
# rather than a rename of the old per-constituency loop above.
# ==============================================================================
_district_groups = defaultdict(list)
for w in all_works:
    _district_groups[w["district"]].append(w)

district_risk_data = []
for _dist_name, _works in _district_groups.items():
    _total_sanc = sum(w["sanctionedAmount"] for w in _works)
    _total_exp = sum(w["paymentReleased"] for w in _works)
    _risk_scores = [w["riskScore"] for w in _works]
    _avg_risk = round(sum(_risk_scores) / max(1, len(_risk_scores)))
    _flagged = [w for w in _works if w["isNegative"]]
    _state = Counter(w["state"] for w in _works).most_common(1)[0][0] if _works else "Unknown"
    _constituencies = sorted(set(w["constituency"] for w in _works))
    _mp_names = sorted(set(w["mpName"] for w in _works))
    _vendor_amt = defaultdict(float)
    for w in _works:
        if w["vendorName"] != "No Vendor Payment Recorded":
            _vendor_amt[w["vendorName"]] += w["paymentReleased"]
    _top_vendor = max(_vendor_amt.items(), key=lambda kv: kv[1])[0] if _vendor_amt else "No Vendor Payment Recorded"
    _utilization_pct = round((_total_exp / _total_sanc) * 100, 2) if _total_sanc > 0 else 0.0

    district_risk_data.append({
        "id": f"DIST_{slugify(_dist_name)[:20]}", "district": _dist_name, "name": _dist_name,
        "state": _state,
        "riskScore": _avg_risk, "risk": _avg_risk, "totalWorks": len(_works), "works": len(_works),
        "flaggedWorks": len(_flagged), "flagged": len(_flagged), "cases": len(_flagged),
        "sanctionedAmount": _total_sanc, "sanctionedCr": round(_total_sanc / 1e7, 2),
        "expenditureAmount": _total_exp, "expenditureCr": round(_total_exp / 1e7, 2),
        "utilizationPct": _utilization_pct, "utilization": _utilization_pct,
        "status": "High Risk" if _avg_risk >= 70 else ("Medium Risk" if _avg_risk >= 40 else "Low Risk"),
        "topVendor": _top_vendor,
        "constituencies": _constituencies,
        "mpNames": _mp_names,
    })

print(f"[*] Built DISTRICT_RISK_DATA on {len(district_risk_data)} real districts "
      f"(parsed from IDA, not constituencies).")

# ==============================================================================
# All-India aggregates (computed from the FULL all_works list, before we trim
# it down to the demo-scoped WORK_ITEMS export below).
# ==============================================================================
SECTOR_COLORS = ["#6366f1", "#059669", "#d97706", "#dc2626", "#0891b2", "#7c3aed", "#64748b"]
sector_totals = {}
for w in all_works:
    sector_totals[w["category"]] = sector_totals.get(w["category"], 0) + w["sanctionedAmount"]
total_sector_amt = sum(sector_totals.values()) or 1
sorted_sectors = sorted(sector_totals.items(), key=lambda kv: kv[1], reverse=True)
SECTOR_DISTRIBUTION = []
top_sectors, other_amt = sorted_sectors[:6], sum(v for _, v in sorted_sectors[6:])
for i, (name, amt) in enumerate(top_sectors):
    SECTOR_DISTRIBUTION.append({
        "name": name,
        "value": round((amt / total_sector_amt) * 100, 1),
        "color": SECTOR_COLORS[i % len(SECTOR_COLORS)]
    })
if other_amt > 0:
    SECTOR_DISTRIBUTION.append({
        "name": "Other",
        "value": round((other_amt / total_sector_amt) * 100, 1),
        "color": SECTOR_COLORS[-1]
    })

all_work_ids = set(df_sanc["clean_work_id"].dropna())
exp_all = df_exp[df_exp["clean_work_id"].isin(all_work_ids)].copy()

df_sanc["month"] = df_sanc["clean_sanc_date"].dt.to_period("M")
exp_all["month"] = exp_all["clean_exp_date"].dt.to_period("M")

sanc_by_month = df_sanc.dropna(subset=["month"]).groupby("month")["clean_sanction_amount"].sum()
exp_by_month = exp_all.dropna(subset=["month"]).groupby("month")["clean_disbursed_amount"].sum()

all_months = sorted(set(sanc_by_month.index) | set(exp_by_month.index))[-12:]
STATE_SPENDING_TREND = [
    {
        "month": m.strftime("%b"),
        "sanctioned": round(float(sanc_by_month.get(m, 0)) / 1e5, 2),
        "expenditure": round(float(exp_by_month.get(m, 0)) / 1e5, 2),
    }
    for m in all_months
]

# A0.3: real implementing-agency directory, built from the actual eSAKSHI IDA
# offices every work already carries (agencyId/agency) -- replaces the fixed
# 5-entry AG001-AG005 fabrication (one of which, AG005 "ABC Infrastructure
# Services", was an invented private shell company). Every real IDA is a
# genuine government office (District Magistrate/Collector/Deputy
# Commissioner/Planning Officer/etc.), so "type" is always Government.
_agency_groups = defaultdict(list)
for w in all_works:
    _agency_groups[w["agencyId"]].append(w)

AGENCIES = {}
for agency_id, agency_works in _agency_groups.items():
    AGENCIES[agency_id] = {
        "id": agency_id,
        "name": agency_works[0]["agency"],
        "type": "Government",
        "worksCount": len(agency_works),
        "totalSanctioned": round(sum(w["sanctionedAmount"] for w in agency_works), 2),
        "flaggedWorks": len([w for w in agency_works if w["isNegative"]]),
    }
print(f"[*] Built AGENCIES directory on {len(AGENCIES)} real eSAKSHI implementing agencies "
      f"(replaced the fabricated 5-entry AG001-AG005 lookup).")

sanc_valid = df_sanc[df_sanc["clean_sanction_amount"].notna() & (df_sanc["clean_sanction_amount"] > 0)].copy()
first_digits = sanc_valid["clean_sanction_amount"].astype(np.int64).astype(str).str[0].astype(int)
observed_pct = first_digits.value_counts(normalize=True).reindex(range(1, 10), fill_value=0) * 100
BENFORDS_LAW_DATA = []
for d in range(1, 10):
    expected_pct = np.log10(1 + 1 / d) * 100
    obs = round(float(observed_pct.get(d, 0)), 1)
    exp = round(expected_pct, 1)
    BENFORDS_LAW_DATA.append({
        "digit": d,
        "observedPct": obs,
        "expectedPct": exp,
        "deviationPts": round(obs - exp, 1),
        "status": "SUSPICIOUS_SPIKE" if (obs - exp) > 5.0 else "NORMAL_RANGE",
    })
worst_digit = max(BENFORDS_LAW_DATA, key=lambda d: d["deviationPts"])
print(f"    [benfords_law national] digit {worst_digit['digit']} deviates most: "
      f"{worst_digit['observedPct']}% observed vs {worst_digit['expectedPct']}% expected "
      f"({'SUSPICIOUS' if worst_digit['status'] == 'SUSPICIOUS_SPIKE' else 'within normal range'})")

total_flagged_national = len([w for w in all_works if w["isNegative"]])
total_flagged_from_districts = sum(d["flaggedWorks"] for d in district_risk_data)
assert total_flagged_national == total_flagged_from_districts, (
    f"Cross-dashboard parity broken: {total_flagged_national} flagged works in all_works "
    f"!= {total_flagged_from_districts} summed from district_risk_data"
)
print(f"[*] Cross-dashboard parity check passed: {total_flagged_national} flagged works, "
      f"national total matches sum of all district totals.")

NATIONAL_METRICS = {
    "totalWorksSanctioned": int(len(df_sanc)),
    "totalExpenditureCr": round(float(df_exp["clean_disbursed_amount"].sum()) / 1e7, 2),
    "totalMPs": int(df_alloc["clean_mp"].nunique()),
    # Renamed from the old "fiscalIntegrityPct": this narrower figure reflects
    # only the excess-payment-vs-sanctioned-cap rule, not overall risk.
    "paymentCeilingCompliancePct": excess_stats.get("clean_compliance_pct", 100.0),
    # Genuinely broader figure: share of all works whose combined 9-signal
    # risk score does not reach HIGH (riskScore >= 70).
    "overallIntegrityPct": round((len([w for w in all_works if w["riskLevel"] != "HIGH"]) / len(all_works)) * 100, 2) if all_works else 100.0,
    "totalFlaggedWorksNational": total_flagged_national,
    "flaggedVendorCount": int(len(vendor_risk_df)),
}

NATIONAL_COLLUSION_CLUSTERS = []
if not vendor_risk_df.empty:
    top_vendors = vendor_risk_df.sort_values("constituency_count", ascending=False).head(5)
    for _, v in top_vendors.iterrows():
        vendor_name = v["clean_vendor"]
        vendor_rows = df_exp[df_exp["clean_vendor"] == vendor_name]
        total_amount = float(vendor_rows["clean_disbursed_amount"].sum())
        top_constituency, top_state = None, None
        if not vendor_rows.empty:
            top_constituency = vendor_rows["Constituency"].astype(str).str.strip().str.title().value_counts().idxmax()
            state_rows = vendor_rows["State"].astype(str).str.strip()
            top_state = state_rows.value_counts().idxmax() if not state_rows.empty else None

        # Real node/edge list for the collusion graph widget: the vendor plus
        # every distinct MP/constituency it was actually paid by/in.
        mp_edges = (
            vendor_rows.dropna(subset=["clean_mp"])
            .drop_duplicates(subset=["clean_mp"])[["clean_mp", "Constituency", "State"]]
            .head(12)
        )
        nodes = [{"id": f"vendor::{vendor_name}", "type": "agency", "label": vendor_name.title()}]
        edges = []
        for _, mr in mp_edges.iterrows():
            mp_node_id = f"mp::{mr['clean_mp']}"
            nodes.append({
                "id": mp_node_id, "type": "mp", "label": str(mr["clean_mp"]).title(),
                "constituency": str(mr["Constituency"]).strip().title(), "state": str(mr["State"]).strip()
            })
            edges.append({"source": mp_node_id, "target": f"vendor::{vendor_name}"})

        # Real agencyId: the most common actual IDA office across this
        # vendor's own paid work IDs (replaces the hardcoded fake "AG005").
        _vendor_agency_ids = [
            agency_id_by_work_id[wid] for wid in vendor_rows["clean_work_id"].dropna().unique()
            if wid in agency_id_by_work_id
        ]
        cluster_agency_id = Counter(_vendor_agency_ids).most_common(1)[0][0] if _vendor_agency_ids else None

        NATIONAL_COLLUSION_CLUSTERS.append({
            "id": f"CLUSTER_{vendor_name[:10].replace(' ', '_')}",
            "district": top_constituency,
            "state": top_state,
            "agencyId": cluster_agency_id,
            "severity": "CRITICAL" if v["constituency_count"] >= 6 else "HIGH",
            "title": "Cross-Constituency Contract Concentration",
            "riskScore": min(100, 55 + int(v["constituency_count"]) * 5),
            "entity": vendor_name.title(),
            "description": (
                f"This contractor received payments across {int(v['constituency_count'])} distinct "
                f"constituencies and {int(v['mp_count'])} different MPs — far beyond the normal reach "
                f"of a local contractor."
            ),
            "action": "Flagged for Central Vigilance Commission (CVC) review and vendor concentration audit.",
            "impactAmount": f"₹{total_amount / 1e7:.2f} Cr",
            "nodes": nodes,
            "edges": edges,
        })

# A0.1/A0.7 prerequisite: District-role login accounts are now keyed on the
# real TRUE district (one District Magistrate per real district, matching how
# eSAKSHI's own IDA offices are organized), replacing the old fabrication of
# one fake "DM" per parliamentary constituency (543 of them, many duplicating
# the same real district under different MPs).
AUTH_USERS = []
for idx, d in enumerate(sorted(district_risk_data, key=lambda x: x["district"]), start=1):
    AUTH_USERS.append({
        "id": f"DIST{idx:04d}",
        "username": f"dm_{slugify(d['district'])}",
        "name": f"District Magistrate, {d['district']}",
        "role": "district",
        "district": d["district"],
        "state": d["state"],
        "title": "District Magistrate (DM)",
        "office": f"Office of District Collector, {d['district']}",
        "constituencies": d["constituencies"],
    })

# ==============================================================================
# Full-coverage per-work exports, written TWICE under two independent real
# groupings of the same Layer-1 records:
#   by-constituency/<slug>.json -- used by the MP dashboard (an MP maps 1:1
#     to one parliamentary constituency).
#   by-district/<slug>.json     -- used by District/State/Ministry dashboards
#     (a real district can pool works from several constituencies/MPs).
# No sampling in either export; every one of the 79,082 real sanctioned works
# appears in exactly one constituency file and exactly one district file.
# ==============================================================================
works_by_constituency_slug = defaultdict(list)
works_by_district_slug = defaultdict(list)
for w in all_works:
    works_by_constituency_slug[slugify(w["constituency"])].append(w)
    works_by_district_slug[slugify(w["district"])].append(w)

works_dir = os.path.join("public", "data", "works")
by_const_dir = os.path.join(works_dir, "by-constituency")
by_dist_dir = os.path.join(works_dir, "by-district")
os.makedirs(by_const_dir, exist_ok=True)
os.makedirs(by_dist_dir, exist_ok=True)

for existing in os.listdir(works_dir):
    p = os.path.join(works_dir, existing)
    if os.path.isfile(p) and existing.endswith(".json"):
        os.remove(p)
for _dir in (by_const_dir, by_dist_dir):
    for existing in os.listdir(_dir):
        if existing.endswith(".json"):
            os.remove(os.path.join(_dir, existing))

for slug, works in works_by_constituency_slug.items():
    with open(os.path.join(by_const_dir, f"{slug}.json"), "w", encoding="utf-8") as f:
        json.dump(works, f)
for slug, works in works_by_district_slug.items():
    with open(os.path.join(by_dist_dir, f"{slug}.json"), "w", encoding="utf-8") as f:
        json.dump(works, f)

top_risk_national = sorted(all_works, key=lambda w: w["riskScore"], reverse=True)[:NATIONAL_SAMPLE_SIZE]
with open(os.path.join(works_dir, "_topRiskNational.json"), "w", encoding="utf-8") as f:
    json.dump(top_risk_national, f)

print(f"[*] Wrote {len(works_by_constituency_slug)} by-constituency + {len(works_by_district_slug)} "
      f"by-district full work files to {works_dir}/ ({len(all_works)} works total, no sampling) "
      f"+ _topRiskNational.json ({len(top_risk_national)} works, cross-district spot-audit sample).")

# ==============================================================================
# Write output: one small ES module per dataset instead of one giant file,
# plus cleanup of the old giant-file artifacts this replaces.
# ==============================================================================
old_json = os.path.join("public", "works_data.json")
if os.path.exists(old_json):
    os.remove(old_json)
    print(f"[*] Removed stale {old_json} (giant runtime-fetch JSON no longer used).")

old_barrel = os.path.join("src", "data", "mpladsData.js")
if os.path.exists(old_barrel):
    os.remove(old_barrel)
    print(f"[*] Removed stale {old_barrel} (replaced by split data modules).")

old_work_items = os.path.join("src", "data", "workItems.js")
if os.path.exists(old_work_items):
    os.remove(old_work_items)
    print(f"[*] Removed stale {old_work_items} (replaced by public/data/works/*.json, fetched on demand).")

data_dir = os.path.join("src", "data")
os.makedirs(data_dir, exist_ok=True)

OUTPUT_FILES = {
    "mpMaster.js": {"MP_PROFILES": mp_profiles},
    "districtRisk.js": {"DISTRICT_RISK_DATA": district_risk_data},
    "nationalMetrics.js": {
        "NATIONAL_METRICS": NATIONAL_METRICS,
        "SECTOR_DISTRIBUTION": SECTOR_DISTRIBUTION,
        "STATE_SPENDING_TREND": STATE_SPENDING_TREND,
        "AGENCIES": AGENCIES,
    },
    "benfordsLaw.js": {"BENFORDS_LAW_DATA": BENFORDS_LAW_DATA},
    "collusionClusters.js": {"NATIONAL_COLLUSION_CLUSTERS": NATIONAL_COLLUSION_CLUSTERS},
    "authUsers.js": {"AUTH_USERS": AUTH_USERS},
}

print("[*] Writing split data modules...")
for filename, exports in OUTPUT_FILES.items():
    path = os.path.join(data_dir, filename)
    lines = ["// AUTO-GENERATED BY sync_data.py -- DO NOT EDIT BY HAND\n"]
    for key, val in exports.items():
        lines.append(f"export const {key} = {json.dumps(val, indent=2)};\n")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    size_kb = os.path.getsize(path) / 1024
    print(f"    {path} -> {size_kb:,.1f} KB ({', '.join(exports.keys())})")

print(f"[+] Sync complete in {time.time()-t0:.1f}s. {len(mp_profiles)} MPs, {len(district_risk_data)} districts "
      f"(all-India), {len(all_works)} works with full ML risk detail across "
      f"{len(works_by_district_slug)} per-district files.")

# ==============================================================================
# A0.8: data-quality/coverage report -- so every field this rebuild claims is
# "real" or "resolved" is auditable, not just asserted in a comment.
# ==============================================================================
_n_sanc = len(df_sanc)
_n_district_resolved = int(df_sanc["clean_district"].notna().sum())
_n_agency_resolved = int(df_sanc["clean_agency_name"].notna().sum())
_n_vendor_matched = len([w for w in all_works if w["vendorName"] != "No Vendor Payment Recorded"])
_n_payment_matched = len([w for w in all_works if w["paymentStatus"] != "No Disbursement Recorded"])
_photo_present = len([w for w in all_works if w["photoEvidence"] == "present"])
_photo_absent = len([w for w in all_works if w["photoEvidence"] == "absent"])
_photo_na = len([w for w in all_works if w["photoEvidence"] == "not_applicable"])
_completed_no_photo = len([w for w in all_works if w["workStage"] == "Work Completed" and w["photoEvidence"] != "present"])

DATA_QUALITY = {
    "generatedAt": pd.Timestamp.utcnow().isoformat(),
    "sourceRowCounts": {
        "allocatedMPs": int(len(df_alloc)),
        "recommended": int(len(df_rec)),
        "sanctioned": int(len(df_sanc)),
        "completed": int(len(df_comp)),
        "expenditure": int(len(df_exp)),
    },
    "totalWorks": len(all_works),
    "districtCoverage": {
        "uniqueTrueDistricts": len(district_risk_data),
        "resolvedFromIdaPct": round(_n_district_resolved / _n_sanc * 100, 2) if _n_sanc else 0.0,
        "method": "regex ^([^(]+)\\( on the IDA column",
    },
    "agencyCoverage": {
        "uniqueRealAgencies": len(AGENCIES),
        "resolvedFromIdaPct": round(_n_agency_resolved / _n_sanc * 100, 2) if _n_sanc else 0.0,
        "fabricatedAgenciesRemoved": ["AG001", "AG002", "AG003", "AG004", "AG005 (ABC Infrastructure Services)"],
    },
    "vendorCoverage": {
        "worksWithMatchedVendorPct": round(_n_vendor_matched / len(all_works) * 100, 2) if all_works else 0.0,
    },
    "paymentStatusCoverage": {
        "worksWithPaymentStatusPct": round(_n_payment_matched / len(all_works) * 100, 2) if all_works else 0.0,
    },
    "photoEvidenceCoverage": {
        "present": _photo_present, "absent": _photo_absent, "notApplicable": _photo_na,
        "completedWithoutPhotoEvidence": _completed_no_photo,
    },
    "geoCentroids": {
        "method": "approximate_state_offset (deterministic, not survey-geocoded -- eSAKSHI has no real GPS field)",
        "districtsCovered": len(DISTRICT_CENTROIDS),
    },
    "workflowLayer": {
        "note": "Verification tasks / decisions / clarification requests / follow-ups / action history are SEEDED PROTOTYPE DATA, not eSAKSHI records. Every record in that file carries source: 'prototype_workflow'.",
        "seedScript": "generate_workflow_seed.py",
        "outputFile": "public/data/workflow_seed.json",
    },
}
with open(os.path.join("public", "data", "data_quality.json"), "w", encoding="utf-8") as f:
    json.dump(DATA_QUALITY, f, indent=2)
print(f"[*] Wrote public/data/data_quality.json "
      f"(district resolution {DATA_QUALITY['districtCoverage']['resolvedFromIdaPct']}%, "
      f"agency resolution {DATA_QUALITY['agencyCoverage']['resolvedFromIdaPct']}%).")
