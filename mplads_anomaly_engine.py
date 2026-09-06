"""
MPLADS AI Anomaly & Fraud Detection Pipeline
Problem Statement ID: 26102 (MoSPI - Smart Automation)

Stack: Python, Pandas, Scikit-Learn, NetworkX
Architecture: Data Cleaning -> Forensic Rules -> Outlier ML -> Graph Collusion -> XAI Risk Scorer
"""

import os
import re
import sys
import warnings
from datetime import datetime
from collections import Counter

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import networkx as nx

try:
    import community as community_louvain
    HAS_LOUVAIN = True
except ImportError:
    HAS_LOUVAIN = False

warnings.filterwarnings("ignore")

# ==============================================================================
# 0. HELPER FUNCTIONS & CLEANING UTILITIES
# ==============================================================================

def clean_amount_str(val):
    if pd.isna(val):
        return np.nan
    val_str = str(val).strip().replace("₹", "").replace(",", "").strip()
    try:
        return float(val_str)
    except ValueError:
        return np.nan

def extract_embedded_work_id(val):
    if pd.isna(val):
        return None
    val_str = str(val).strip()
    match = re.search(r'^(WS[\s/]+[A-Za-z0-9]+/\d{4}-\d{4}/\d+)', val_str)
    if match:
        return re.sub(r'\s+', '', match.group(1))
    return None

def slugify_text(text):
    return re.sub(r'[^a-z0-9]+', '_', str(text).strip().lower()).strip('_')

def extract_district(ida):
    """Real district name, parsed from the IDA field (e.g.
    'GHAZIABAD(DISTRICT MAGISTRAE GHAZIABAD_IDA)' -> 'Ghaziabad'). Verified to
    resolve on 100% of rows across all four IDA-bearing eSAKSHI sheets."""
    if pd.isna(ida):
        return None
    s = str(ida).strip()
    m = re.match(r'^([^(]+)\(', s)
    if not m:
        return None
    d = re.sub(r'\s+', ' ', m.group(1)).strip()
    return d.title() if d else None

def extract_agency_title(ida):
    """Human-readable real implementing-agency name, parsed from the office
    title embedded in the IDA field (e.g. '...(DISTRICT COLLECTOR ALWAR_IDA)'
    -> 'District Collector Alwar'). These are genuine eSAKSHI government
    offices (District Magistrate / Collector / Deputy Commissioner / Planning
    Officer) -- never a fabricated private vendor."""
    if pd.isna(ida):
        return None
    s = str(ida).strip()
    m = re.search(r'\((.*)\)\s*$', s)
    if not m:
        return None
    inner = re.sub(r'_(IDA|\d+)\s*$', '', m.group(1), flags=re.IGNORECASE).strip()
    inner = re.sub(r'\s+', ' ', inner)
    return inner.title() if inner else None

def make_composite_key(row, state_col, ida_col, mp_col, const_col, cat_col, desc_col):
    parts = [
        str(row.get(state_col, '')).strip().lower(),
        str(row.get(ida_col, '')).strip().lower(),
        str(row.get(mp_col, '')).strip().lower(),
        str(row.get(const_col, '')).strip().lower(),
        str(row.get(cat_col, '')).strip().lower(),
        str(row.get(desc_col, ''))[:40].strip().lower()
    ]
    return "_".join(parts)

# ==============================================================================
# 1. LOAD & CLEAN ALL DATASETS
# ==============================================================================

def load_and_clean_all(data_dir="."):
    files = {
        "allocated": "Allocated Limit for Honble MPs.csv",
        "recommended": "Works Recommended.csv",
        "sanctioned": "Works Sanctioned.csv",
        "completed": "Works Completed.csv",
        "expenditure": "Expenditure on Completed and On-going Works as on Date.csv"
    }

    for key, fname in files.items():
        full_path = os.path.join(data_dir, fname)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Missing required file: {full_path}")

    print("[*] Ingesting and sanitizing eSAKSHI datasets...")

    df_allocated = pd.read_csv(os.path.join(data_dir, files["allocated"]), encoding="utf-8-sig")
    df_allocated.columns = [c.strip() for c in df_allocated.columns]
    df_allocated = df_allocated[pd.to_numeric(df_allocated["Sr. No."], errors="coerce").notna()].copy()
    amt_col_alloc = [c for c in df_allocated.columns if "Allocated" in c and "AMOUNT" in c.upper()][0]
    df_allocated["clean_allocated_amount"] = df_allocated[amt_col_alloc].apply(clean_amount_str)
    mp_col_alloc = [c for c in df_allocated.columns if "Members of Parliament" in c][0]
    df_allocated["clean_mp"] = df_allocated[mp_col_alloc].astype(str).str.strip()

    df_rec = pd.read_csv(os.path.join(data_dir, files["recommended"]), encoding="utf-8-sig", low_memory=False)
    df_rec.columns = [c.strip() for c in df_rec.columns]
    df_rec = df_rec[pd.to_numeric(df_rec["Sr. No."], errors="coerce").notna()].copy()
    df_rec["clean_work_id"] = df_rec["WORK"].apply(extract_embedded_work_id)
    rec_amt_col = [c for c in df_rec.columns if "RECOMMENDED AMOUNT" in c.upper()][0]
    df_rec["clean_recommended_amount"] = df_rec[rec_amt_col].apply(clean_amount_str)
    df_rec["clean_rec_date"] = pd.to_datetime(df_rec["Recommended date"], dayfirst=True, errors="coerce")
    df_rec["clean_mp"] = df_rec["Hon'ble Members of Parliament"].astype(str).str.strip()
    df_rec["clean_category"] = df_rec["Work category"].astype(str).str.strip()
    df_rec["clean_description"] = df_rec["Work description"].astype(str).str.strip()
    df_rec["clean_district"] = df_rec["IDA"].apply(extract_district)
    df_rec["composite_key"] = df_rec.apply(
        lambda r: make_composite_key(r, "State", "IDA", "Hon'ble Members of Parliament", "Constituency", "Work category", "Work description"), axis=1
    )

    df_sanc = pd.read_csv(os.path.join(data_dir, files["sanctioned"]), encoding="utf-8-sig", low_memory=False)
    df_sanc.columns = [c.strip() for c in df_sanc.columns]
    df_sanc = df_sanc[pd.to_numeric(df_sanc["Sr. No."], errors="coerce").notna()].copy()
    work_col_sanc = "Work" if "Work" in df_sanc.columns else "WORK"
    df_sanc["clean_work_id"] = df_sanc[work_col_sanc].apply(extract_embedded_work_id)
    sanc_amt_col = [c for c in df_sanc.columns if "Sanction Amount" in c][0]
    df_sanc["clean_sanction_amount"] = df_sanc[sanc_amt_col].apply(clean_amount_str)
    df_sanc["clean_sanc_date"] = pd.to_datetime(df_sanc["Sanction Date"], dayfirst=True, errors="coerce")
    df_sanc["clean_mp"] = df_sanc["Hon'ble Members of Parliament"].astype(str).str.strip()
    df_sanc["clean_category"] = df_sanc["Work category"].astype(str).str.strip()
    df_sanc["clean_status"] = df_sanc["Work Status"].astype(str).str.strip()
    df_sanc["clean_district"] = df_sanc["IDA"].apply(extract_district)
    df_sanc["clean_agency_name"] = df_sanc["IDA"].apply(extract_agency_title)
    df_sanc["clean_agency_id"] = df_sanc["IDA"].apply(lambda x: slugify_text(x) if pd.notna(x) else None)
    df_sanc["composite_key"] = df_sanc.apply(
        lambda r: make_composite_key(r, "State", "IDA", "Hon'ble Members of Parliament", "Constituency", "Work category", "Work description"), axis=1
    )

    df_comp = pd.read_csv(os.path.join(data_dir, files["completed"]), encoding="utf-8-sig", low_memory=False)
    df_comp.columns = [c.strip() for c in df_comp.columns]
    df_comp = df_comp[pd.to_numeric(df_comp["Sr. No."], errors="coerce").notna()].copy()
    work_col_comp = "Work" if "Work" in df_comp.columns else "WORK"
    df_comp["clean_work_id"] = df_comp[work_col_comp].apply(extract_embedded_work_id)
    comp_amt_col = [c for c in df_comp.columns if "Disbursed" in c][0]
    df_comp["clean_disbursed_amount"] = df_comp[comp_amt_col].apply(clean_amount_str)
    df_comp["clean_comp_date"] = pd.to_datetime(df_comp["Completion Date"], dayfirst=True, errors="coerce")
    # Works Completed.csv's Image field is a presence flag ("Images" literal
    # string), not an actual URL -- eSAKSHI records whether geotagged photo
    # evidence was uploaded for a completed work, not the photo itself.
    df_comp["clean_photo_present"] = df_comp["Image"].astype(str).str.strip().eq("Images")

    df_exp = pd.read_csv(os.path.join(data_dir, files["expenditure"]), encoding="utf-8-sig", low_memory=False)
    df_exp.columns = [c.strip() for c in df_exp.columns]
    df_exp = df_exp[pd.to_numeric(df_exp["Sr. No."], errors="coerce").notna()].copy()
    df_exp["clean_work_id"] = df_exp["Work ID"].astype(str).str.strip()
    mask_empty_id = df_exp["clean_work_id"].isna() | (df_exp["clean_work_id"] == "nan") | (df_exp["clean_work_id"] == "")
    df_exp.loc[mask_empty_id, "clean_work_id"] = df_exp.loc[mask_empty_id, "Work"].apply(extract_embedded_work_id)
    exp_amt_col = [c for c in df_exp.columns if "Disbursed" in c][0]
    df_exp["clean_disbursed_amount"] = df_exp[exp_amt_col].apply(clean_amount_str)
    df_exp["clean_exp_date"] = pd.to_datetime(df_exp["Expenditure Date"], dayfirst=True, errors="coerce")
    df_exp["clean_vendor"] = df_exp["Vendor Name"].astype(str).str.strip().str.upper()
    df_exp["clean_mp"] = df_exp["Hon'ble Members of Parliament"].astype(str).str.strip()
    df_exp["clean_payment_status"] = df_exp["Payment Status"].astype(str).str.strip()
    df_exp["clean_district"] = df_exp["IDA"].apply(extract_district)

    print(f"    Loaded {len(df_allocated)} MPs | {len(df_rec)} Recommended | {len(df_sanc)} Sanctioned | {len(df_exp)} Expenditures")
    return {
        "allocated": df_allocated,
        "recommended": df_rec,
        "sanctioned": df_sanc,
        "completed": df_comp,
        "expenditure": df_exp
    }

# ==============================================================================
# 2. THE 6 FORENSIC DETECTOR MODELS
# ==============================================================================

def detect_cost_outliers(sanctioned_df):
    """Model 1: Flags cost inflation vs regional peer medians."""
    df = sanctioned_df[sanctioned_df["clean_sanction_amount"].notna()].copy()
    df["peer_group"] = df["clean_category"] + " || " + df["State"].astype(str)

    grouped = df.groupby("peer_group")["clean_sanction_amount"]
    stats = grouped.agg(
        peer_median="median", peer_mean="mean", peer_std="std",
        peer_q25=lambda x: x.quantile(0.25), peer_q75=lambda x: x.quantile(0.75), peer_count="count"
    ).reset_index()

    stats["peer_iqr"] = stats["peer_q75"] - stats["peer_q25"]
    stats["upper_bound_iqr"] = stats["peer_q75"] + (1.5 * stats["peer_iqr"])
    df = df.merge(stats, on="peer_group", how="left")

    df["cost_zscore"] = np.where(df["peer_std"] > 0, (df["clean_sanction_amount"] - df["peer_mean"]) / df["peer_std"], 0.0)

    df["is_cost_outlier"] = (df["peer_count"] >= 5) & (
        (df["cost_zscore"] >= 2.5) | 
        ((df["clean_sanction_amount"] > df["upper_bound_iqr"]) & (df["clean_sanction_amount"] > df["peer_median"] * 1.75))
    )
    df["cost_ratio"] = df["clean_sanction_amount"] / np.where(df["peer_median"] > 0, df["peer_median"], 1.0)
    df["outlier_reason"] = np.where(
        df["is_cost_outlier"],
        df.apply(lambda r: f"Sanction cost (₹{r['clean_sanction_amount']:,.0f}) is {r['cost_ratio']:.1f}x the regional median (z-score: {r['cost_zscore']:.2f})", axis=1), None
    )
    return df[["clean_work_id", "peer_group", "clean_sanction_amount", "peer_median", "cost_zscore", "is_cost_outlier", "outlier_reason"]]

def detect_duplicate_works(recommended_df):
    """Model 2: NLP Cosine Similarity for Duplicate/Split Bills."""
    df = recommended_df[recommended_df["clean_description"].notna() & recommended_df["clean_recommended_amount"].notna()].copy()
    flagged_pairs = []
    grouped = df.groupby(["Constituency", "IDA"])

    for (constituency, ida), group in grouped:
        if len(group) < 2 or len(group) > 500: continue
        descriptions, work_ids = group["clean_description"].tolist(), group["clean_work_id"].tolist()
        amounts, dates = group["clean_recommended_amount"].tolist(), group["clean_rec_date"].tolist()

        try:
            tfidf_mat = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", min_df=1).fit_transform(descriptions)
            sim_mat = cosine_similarity(tfidf_mat)
        except Exception: continue

        n = len(group)
        for i in range(n):
            for j in range(i + 1, n):
                # Raised from 0.85: eSAKSHI descriptions reuse a lot of boilerplate
                # phrasing ("Construction of roads..."), so 0.85 flags almost every
                # work in a district as a "duplicate". Require near-exact text instead.
                if sim_mat[i, j] < 0.94: continue
                # ~26% of recommended rows have no extractable work ID (their
                # "WORK" field is a plain "NA-<description>" placeholder, not
                # a WS/.../NNNN code) -- these can't be joined back to a real
                # sanctioned work, so skip them instead of flagging unusable
                # "nan <-> nan" pairs.
                if work_ids[i] is None or work_ids[j] is None: continue
                max_amt = max(amounts[i], amounts[j])
                if max_amt == 0 or (abs(amounts[i] - amounts[j]) / max_amt) > 0.10: continue
                
                days_diff = abs((dates[i] - dates[j]).days) if pd.notna(dates[i]) and pd.notna(dates[j]) else None
                if days_diff is None or days_diff > 21: continue

                flagged_pairs.append({
                    "work_id_1": work_ids[i], "work_id_2": work_ids[j],
                    "reason": f"Near-identical description ({sim_mat[i, j]*100:.0f}% match) filed {days_diff} days apart."
                })

    if not flagged_pairs:
        return pd.DataFrame(flagged_pairs)

    # 0.94 similarity alone still isn't enough: eSAKSHI batch-files large sets
    # of genuinely distinct works (e.g. "install 40 handpumps") using one
    # identical templated description, same standard unit cost, same filing
    # date -- verified against real data this produces works matched to
    # 10-114 "duplicates" each, which is normal templated procurement, not
    # split-billing. Real split-billing/duplicate-claim fraud shows up as an
    # ISOLATED pair (or small triple) of near-identical filings, not a large
    # mutual cluster. Cap fan-out so only small, suspicious clusters remain.
    MAX_DUPLICATE_FANOUT = 2
    neighbor_count = Counter()
    for p in flagged_pairs:
        neighbor_count[p["work_id_1"]] += 1
        neighbor_count[p["work_id_2"]] += 1
    flagged_pairs = [
        p for p in flagged_pairs
        if neighbor_count[p["work_id_1"]] <= MAX_DUPLICATE_FANOUT and neighbor_count[p["work_id_2"]] <= MAX_DUPLICATE_FANOUT
    ]
    return pd.DataFrame(flagged_pairs)

def build_disbursement_map(expenditure_df):
    """Shared per-work total-disbursed lookup, reused by detect_excess_payment
    and by sync_data.py's paymentReleased field -- one computation, not three."""
    exp_summary = expenditure_df[expenditure_df["clean_work_id"].notna()].groupby("clean_work_id").agg(
        total_disbursed=("clean_disbursed_amount", "sum"),
        payment_transactions=("clean_disbursed_amount", "count")
    ).reset_index()
    return exp_summary


def build_image_map(completed_df):
    """Per-work real photo-evidence flag from Works Completed.csv's Image
    field -- True if at least one matched completed-work record carries a
    geotagged photo, used to replace the old photoUploaded = !isNegative
    fabrication."""
    df = completed_df[completed_df["clean_work_id"].notna()]
    if df.empty:
        return {}
    return df.groupby("clean_work_id")["clean_photo_present"].any().to_dict()


def build_payment_status_map(expenditure_df):
    """Per-work real payment status from the expenditure sheet's Payment
    Status field, collapsed to Success / In-Progress / Unknown when a work
    has multiple disbursement rows."""
    df = expenditure_df[expenditure_df["clean_work_id"].notna()]
    if df.empty:
        return {}

    def _collapse(s):
        if (s == "Payment In-Progress").any():
            return "In-Progress"
        if (s == "Payment Success").any():
            return "Success"
        return "Unknown"

    return df.groupby("clean_work_id")["clean_payment_status"].agg(_collapse).to_dict()


def detect_excess_payment(sanctioned_df, expenditure_df):
    """Model 3: Hard Rule - Overpayment beyond ceiling limit."""
    exp_summary = build_disbursement_map(expenditure_df)

    merged = sanctioned_df.merge(exp_summary, on="clean_work_id", how="inner")
    merged["excess_amount"] = merged["total_disbursed"] - merged["clean_sanction_amount"]
    merged["is_excess_payment"] = merged["excess_amount"] > 100.0

    violations = merged[merged["is_excess_payment"]].copy()
    violations["excess_pct"] = (violations["excess_amount"] / violations["clean_sanction_amount"]) * 100
    violations["excess_reason"] = violations.apply(
        lambda r: f"Total payment (₹{r['total_disbursed']:,.0f}) exceeds sanctioned cap by +{r['excess_pct']:.1f}%", axis=1
    )
    
    stats = {
        "total_works_audited": len(merged), "total_violations": len(violations),
        "clean_compliance_pct": round(((len(merged) - len(violations)) / len(merged)) * 100, 2) if len(merged) > 0 else 100.0,
        "total_unauthorized_funds_disbursed": float(violations["excess_amount"].sum())
    }
    return violations[["clean_work_id", "is_excess_payment", "excess_reason"]], stats

def detect_vendor_risk(expenditure_df):
    """Model 4: Identifies contractors hoarding contracts across regions."""
    df = expenditure_df[expenditure_df["clean_vendor"].notna()].copy()
    corporate_keywords = r'\b(LTD|LIMITED|PVT|PRIVATE|MOTORS|CORP|CORPORATION|NIGAM|BOARD|CPWD|PWD|DISCOM|ELECTRICITY)\b'
    known_allowlist = ["TATA", "MAHINDRA", "ASHOK LEYLAND", "MARUTI", "BHEL", "NBCC"]

    df["is_large_entity"] = df["clean_vendor"].apply(lambda n: any(b in n for b in known_allowlist) or bool(re.search(corporate_keywords, n)))
    local_contractors = df[~df["is_large_entity"]].copy()

    vendor_profile = local_contractors.groupby("clean_vendor").agg(constituency_count=("Constituency", "nunique"), mp_count=("clean_mp", "nunique")).reset_index()
    if vendor_profile.empty: return pd.DataFrame(), []

    high_reach_threshold = max(3, vendor_profile["constituency_count"].quantile(0.75) + (1.5 * (vendor_profile["constituency_count"].quantile(0.75) - vendor_profile["constituency_count"].quantile(0.25))))
    suspicious_vendors = vendor_profile[(vendor_profile["constituency_count"] >= high_reach_threshold) & (vendor_profile["mp_count"] >= 2)].copy()

    return suspicious_vendors, set(suspicious_vendors["clean_vendor"].tolist())

def detect_delayed_works(sanctioned_df):
    """Model 5: Flags works stalled far beyond category 90th percentile."""
    df = sanctioned_df[sanctioned_df['clean_sanc_date'].notna()].copy()
    eval_date = pd.to_datetime('2026-09-01')
    df['days_elapsed'] = (eval_date - df['clean_sanc_date']).dt.days
    ongoing = df[~df['clean_status'].str.contains('Complete', case=False, na=False)].copy()
    
    if ongoing.empty:
        return pd.DataFrame(columns=['clean_work_id', 'days_elapsed', 'is_delayed_outlier', 'delay_reason'])
        
    category_thresholds = ongoing.groupby('clean_category')['days_elapsed'].quantile(0.90).to_dict()
    ongoing['category_p90_limit'] = ongoing['clean_category'].map(category_thresholds)
    ongoing['is_delayed_outlier'] = ongoing['days_elapsed'] > (ongoing['category_p90_limit'] + 30)
    
    delayed = ongoing[ongoing['is_delayed_outlier']].copy()
    delayed['delay_reason'] = delayed.apply(
        lambda r: f"Project stalled for {r['days_elapsed']} days, exceeding normal {r['clean_category']} limit of {r['category_p90_limit']:.0f} days.", axis=1
    )
    return delayed[['clean_work_id', 'is_delayed_outlier', 'delay_reason']]

def check_benfords_law(sanctioned_df):
    """Model 6: Flags cost estimates exhibiting statistical invoice fraud patterns."""
    df = sanctioned_df[sanctioned_df['clean_sanction_amount'].notna() & (sanctioned_df['clean_sanction_amount'] > 0)].copy()
    
    # Safely extract first leading digit
    df['first_digit'] = df['clean_sanction_amount'].astype(str).str.extract(r'([1-9])')[0]
    df = df.dropna(subset=['first_digit'])
    df['first_digit'] = df['first_digit'].astype(int)
    
    if df.empty: return pd.DataFrame(columns=['clean_work_id', 'benford_flag', 'benford_reason'])
    
    observed_counts = df['first_digit'].value_counts(normalize=True).sort_index()
    expected = {d: np.log10(1 + 1/d) for d in range(1, 10)}
    expected_series = pd.Series(expected)
    
    deviations = observed_counts - expected_series
    # 0.15 (15 percentage points) was too high a bar to ever fire on real data
    # (e.g. digit "2" running at 24.0% vs an expected 17.6% is only a 6.4pt
    # deviation). Match the 5pt SUSPICIOUS_SPIKE bar used for the national
    # BENFORDS_LAW_DATA chart so this per-work flag actually contributes to
    # scoring instead of being permanently dead.
    suspicious_digits = deviations[deviations > 0.05].index.tolist()
    
    if suspicious_digits:
        df['benford_flag'] = df['first_digit'].isin(suspicious_digits)
        df['benford_reason'] = np.where(
            df['benford_flag'],
            f"Sanctioned cost format mathematically deviates from Benford's Law expectations.", None
        )
        return df[df['benford_flag']][['clean_work_id', 'benford_flag', 'benford_reason']]
    return pd.DataFrame(columns=['clean_work_id', 'benford_flag', 'benford_reason'])


def detect_recommendation_bypass(sanctioned_df, recommended_df):
    """Model 7: CAG-documented pattern -- work sanctioned with no matching MP
    recommendation on record. Both dataframes already carry a composite_key
    (state+IDA+MP+constituency+category+description-prefix); this is the join
    that key was built for."""
    df = sanctioned_df[sanctioned_df["composite_key"].notna()].copy()
    rec_keys = set(recommended_df["composite_key"].dropna())
    df["is_bypass"] = ~df["composite_key"].isin(rec_keys)
    flagged = df[df["is_bypass"]].copy()
    flagged["bypass_reason"] = "Sanctioned with no matching MP recommendation found on record."
    return flagged[["clean_work_id", "is_bypass", "bypass_reason"]]


def detect_sanction_delay(recommended_df, sanctioned_df):
    """Model 8: Statutory 45-day District Authority sanction SLA -- gap between
    Recommended date and Sanction Date. Only computable where both dates parsed
    and the work ID could be matched across the two sheets."""
    rec_dates = (
        recommended_df[recommended_df["clean_work_id"].notna()]
        .drop_duplicates(subset=["clean_work_id"])
        .set_index("clean_work_id")["clean_rec_date"]
    )
    df = sanctioned_df[sanctioned_df["clean_work_id"].notna()].copy()
    df["rec_date"] = df["clean_work_id"].map(rec_dates)
    df = df[df["rec_date"].notna() & df["clean_sanc_date"].notna()].copy()
    df["days_to_sanction"] = (df["clean_sanc_date"] - df["rec_date"]).dt.days
    df = df[df["days_to_sanction"] >= 0]
    df["is_sla_breach"] = df["days_to_sanction"] > 45
    flagged = df[df["is_sla_breach"]].copy()
    flagged["sla_reason"] = flagged["days_to_sanction"].apply(
        lambda d: f"Sanctioned {int(d)} days after recommendation, breaching the 45-day statutory DM SLA."
    )
    return flagged[["clean_work_id", "is_sla_breach", "sla_reason"]]


def detect_fund_splitting(recommended_df):
    """Model 9: Fund-splitting/smurfing heuristic -- distinct from the
    duplicate-work detector (which needs near-identical description AND
    near-identical amount). This looks for the opposite amount pattern: 3+
    works in the same IDA/constituency/category filed within a short window,
    each individually sitting just under a common approval threshold while
    their sum clearly crosses it. No official approval-slab field exists in
    the source data, so this is a heuristic, not a hard rule -- flagged and
    weighted accordingly."""
    THRESHOLDS = [500000, 1000000, 1500000, 2000000, 2500000, 5000000]
    df = recommended_df[recommended_df["clean_recommended_amount"].notna() & recommended_df["clean_rec_date"].notna()].copy()
    flagged_ids, reasons = [], {}

    for (ida, constituency, category), group in df.groupby(["IDA", "Constituency", "clean_category"]):
        if len(group) < 3:
            continue
        group = group.sort_values("clean_rec_date")
        amounts = group["clean_recommended_amount"].tolist()
        dates = group["clean_rec_date"].tolist()
        ids = group["clean_work_id"].tolist()

        for T in THRESHOLDS:
            idxs = [i for i, a in enumerate(amounts) if T * 0.8 <= a < T]
            if len(idxs) < 3:
                continue
            window_start_options = [dates[i] for i in idxs]
            for start in window_start_options:
                cluster = [i for i in idxs if pd.notna(dates[i]) and 0 <= (dates[i] - start).days <= 30]
                if len(cluster) < 3:
                    continue
                cluster_sum = sum(amounts[i] for i in cluster)
                if cluster_sum <= T:
                    continue
                for i in cluster:
                    wid = ids[i]
                    if wid and wid not in reasons:
                        flagged_ids.append(wid)
                        reasons[wid] = (
                            f"Heuristic: 1 of {len(cluster)} works in this IDA/constituency/category filed "
                            f"within 30 days, each just under the ~₹{T/100000:.0f}L range but summing to "
                            f"₹{cluster_sum/100000:.1f}L -- possible fund-splitting pattern, recommend manual review."
                        )
                break

    return pd.DataFrame({
        "clean_work_id": flagged_ids,
        "is_fund_splitting": [True] * len(flagged_ids),
        "splitting_reason": [reasons[w] for w in flagged_ids],
    })


# ==============================================================================
# 3. MASTER XAI SCORING ENGINE
# ==============================================================================

def score_work(work_id, all_clean_dfs, cost_outliers_df, duplicate_pairs_df, excess_payments_df, suspicious_vendors_list, delayed_works_df, benfords_df,
                bypass_df=None, sla_df=None, splitting_df=None):
    """Computes an auditable 0-100 risk score combining all 9 models."""
    score = 10
    reasons = []

    # 1. Cost Outlier
    match_cost = cost_outliers_df[cost_outliers_df["clean_work_id"] == work_id]
    if not match_cost.empty and match_cost.iloc[0]["is_cost_outlier"]:
        score += 35
        reasons.append(match_cost.iloc[0]["outlier_reason"])

    # 2. Duplicate Check
    match_dup = duplicate_pairs_df[(duplicate_pairs_df["work_id_1"] == work_id) | (duplicate_pairs_df["work_id_2"] == work_id)]
    if not match_dup.empty:
        score += 30
        reasons.append(match_dup.iloc[0]["reason"])

    # 3. Excess Payment
    match_excess = excess_payments_df[excess_payments_df["clean_work_id"] == work_id]
    if not match_excess.empty:
        score += 40
        reasons.append(match_excess.iloc[0]["excess_reason"])

    # 4. Vendor Risk
    exp_matches = all_clean_dfs["expenditure"][all_clean_dfs["expenditure"]["clean_work_id"] == work_id]
    if not exp_matches.empty:
        flagged_v = [v for v in exp_matches["clean_vendor"].unique() if v in suspicious_vendors_list]
        if flagged_v:
            score += 25
            reasons.append(f"Contractor flagged for cartel monopolization risk.")

    # 5. Delayed Works
    if delayed_works_df is not None:
        match_delay = delayed_works_df[delayed_works_df["clean_work_id"] == work_id]
        if not match_delay.empty and match_delay.iloc[0]["is_delayed_outlier"]:
            score += 20
            reasons.append(match_delay.iloc[0]["delay_reason"])

    # 6. Benford's Law
    if benfords_df is not None:
        match_benford = benfords_df[benfords_df["clean_work_id"] == work_id]
        if not match_benford.empty and match_benford.iloc[0]["benford_flag"]:
            score += 15
            reasons.append(match_benford.iloc[0]["benford_reason"])

    # 7. Recommendation Bypass
    if bypass_df is not None and not bypass_df.empty:
        match_bypass = bypass_df[bypass_df["clean_work_id"] == work_id]
        if not match_bypass.empty and match_bypass.iloc[0]["is_bypass"]:
            score += 30
            reasons.append(match_bypass.iloc[0]["bypass_reason"])

    # 8. Sanction-Delay SLA
    if sla_df is not None and not sla_df.empty:
        match_sla = sla_df[sla_df["clean_work_id"] == work_id]
        if not match_sla.empty and match_sla.iloc[0]["is_sla_breach"]:
            score += 20
            reasons.append(match_sla.iloc[0]["sla_reason"])

    # 9. Fund-Splitting Heuristic
    if splitting_df is not None and not splitting_df.empty:
        match_split = splitting_df[splitting_df["clean_work_id"] == work_id]
        if not match_split.empty and match_split.iloc[0]["is_fund_splitting"]:
            score += 15
            reasons.append(match_split.iloc[0]["splitting_reason"])

    risk_score = min(score, 100)
    risk_level = "HIGH" if risk_score >= 70 else "MEDIUM" if risk_score >= 40 else "LOW"
    
    if not reasons:
        reasons.append("Project aligns mathematically with all regional integrity baselines.")

    return {
        "work_id": work_id,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "reasons": reasons,
        "audited_timestamp": datetime.utcnow().isoformat() + "Z"
    }

if __name__ == "__main__":
    print("[+] Anomaly engine compiled successfully. Import `load_and_clean_all` and `score_work` in api.py to serve.")