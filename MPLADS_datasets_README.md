# MPLADS Dataset Guide — for anomaly & fraud detection modeling

This covers the six data sheets exported from the eSAKSHI MPLADS dashboard
(https://mplads.mospi.gov.in/digigov/dashboard.html). Each sheet is kept as a
separate CSV — do not merge them into one master file. Some detection tasks
use a single sheet as-is; others need an on-the-fly join between two sheets
at training time (join keys are given per sheet below).

---

## 1. allocated_limit.csv

**Fields:** Sr. No. | State | Hon'ble Members of Parliament | Constituency | Allocated Amount (₹)

**What it is:** A dimension table — one row per MP, not per work. This is
each MP's total entitlement under the scheme.

**Join key to other sheets:** `State + Hon'ble Member of Parliament + Constituency`

**Used for:**
- MP-level utilization ratio = SUM(sanctioned/disbursed amount for that MP) / Allocated Amount
- Flagging MPs who are near/over their limit, or who under-utilize funds for
  long periods (both are compliance-relevant patterns)
- Not useful alone for work-level fraud detection — always paired with a
  lifecycle sheet below

---

## 2. works_recommended.csv

**Fields:** Sr. No. | Work category | Work | State | IDA | Hon'ble Member of
Parliament | Constituency | Work description | Recommended date |
Recommended Amount (₹) | Sanction Date

**What it is:** Proposals as submitted by MPs, before district approval.

**Join key to works_sanctioned.csv:** composite —
`State + IDA + MP + Constituency + Work category + Work description +
Recommended date` (normalize text: trim whitespace, lowercase, collapse
extra spaces before matching — work descriptions repeat often and aren't
unique on their own)

**Used for:**
- **Duplicate/near-duplicate work detection** — this sheet alone. Run text
  similarity (e.g. TF-IDF + cosine, or fuzzy string match) on `Work
  description` grouped by `State + Constituency`, flag near-identical
  proposals submitted close in time.
- **Recommended → Sanctioned gap analysis** — join to works_sanctioned.csv,
  compare `Recommended Amount` vs `Sanction Amount` to catch proposals that
  get inflated or deflated at the approval stage.

---

## 3. works_sanctioned.csv

**Fields:** Sr. No. | Work category | Work | State | IDA | Hon'ble Member of
Parliament | Constituency | Work description | Recommended date | Sanction
Date | Sanction Amount (₹) | Work Status

**What it is:** Works after district-level approval. This is your central
lifecycle table — most other sheets join against it.

**Join key to works_recommended.csv / works_completed.csv:** same composite
key as above (State + IDA + MP + Constituency + Work category/description +
Recommended date)

**Join key to expenditure.csv:** `Work ID` if you can recover/match it, or
fall back to the composite key + Sanction Amount as a secondary check

**Used for:**
- **Delay detection** (alone or joined to works_completed) — gap between
  `Recommended date` and `Sanction Date`; unusually long gaps by district/IDA
  are a monitoring flag
- **Work Status monitoring** — works stuck in "in progress" far longer than
  peers of the same `Work category`
- **Cost overrun modeling** — this sheet is the anchor; join outward to
  works_recommended (proposed amount), works_completed (final amount), and
  expenditure (actual disbursed amount) to compute overrun/underrun ratios

---

## 4. works_completed.csv

**Fields:** Sr. No. | Work Category | Work | State | IDA | Work Description
| Hon'ble Member of Parliament | Constituency | Image | Completion Date |
Amount Disbursed (₹)

**What it is:** Works marked complete, with a disbursed amount and a link
to completion documentation (see the note on `Image` below).

**Join key:** same composite key as works_sanctioned.csv

**Used for:**
- **Delay detection** — join to works_sanctioned, compute `Completion Date -
  Sanction Date`, flag outliers by work category (a hand pump shouldn't take
  as long as a road)
- **Disbursement mismatch** — `Amount Disbursed` vs `Sanction Amount` from
  works_sanctioned.csv; large negative or positive gaps are worth a look
- **Document/photo cross-verification** — see the separate note below;
  `Image` is not usable directly from the CSV export

---

## 5. expenditure_on_works.csv

**Fields:** Sr. No. | State | Work | Work ID | IDA | Hon'ble Member of
Parliament | Constituency | Expenditure Date | Vendor Name | Payment Status
| Fund Disbursed Amount (₹)

**What it is:** Transaction-level payment records — multiple rows per work
possible (partial/staged payments). This is your richest table for fraud
signals since it's the only one with a real unique `Work ID` and a
`Vendor Name`.

**Join key to works_sanctioned.csv:** `Work ID` (best available; use this
sheet's Work ID as the anchor for any cross-table Work ID matching, since
none of the other sheets expose it directly)

**Used for (standalone, no join needed):**
- **Vendor risk scoring** — same `Vendor Name` appearing across an unusual
  number of distinct MPs/constituencies/IDAs; vendors receiving payments
  just under approval thresholds (split-payment pattern); vendors with a
  disproportionate share of `Payment Status` issues
- **Payment velocity anomalies** — multiple `Expenditure Date` entries for
  the same `Work ID` in an unusually short window
- **Aggregate spend concentration** — a small number of vendors absorbing a
  large share of total disbursement in a district/state

---

## Join key summary

| From | To | Key |
|---|---|---|
| allocated_limit | any lifecycle sheet | State + MP + Constituency |
| works_recommended | works_sanctioned | State + IDA + MP + Constituency + Work category/description + Recommended date |
| works_sanctioned | works_completed | same composite key as above |
| works_sanctioned / works_completed | expenditure | Work ID (best-effort; not present in sanctioned/completed sheets directly, match via composite key as fallback) |

## Known irregularity patterns (from CAG audit reports) mapped to CSV fields

The eSAKSHI CSVs have no labeled fraud examples built in, so treat the
Comptroller & Auditor General's audit reports as your ground truth for what
real irregularities look like. One case below is MPLADS-specific (CAG
Report No. 22 of 2025, Para 3.1); the rest are the same control failures
documented in other centrally-sponsored schemes, and translate directly to
these fields.

| CAG pattern | Concrete rule/feature | CSV(s) used |
|---|---|---|
| Work sanctioned/executed with no MP recommendation | Flag any row in `works_sanctioned` with no matching record in `works_recommended` on the composite key | works_recommended + works_sanctioned |
| Scope changed post-sanction, funds exhausted before completion (CAG Para 3.1: MPLADS work in Andaman foreclosed after scope changed without MP/District Authority concurrence, exhausting the sanctioned amount before completion) | Flag `Work Status = in progress/foreclosed` where `Amount Disbursed ≈ Sanction Amount` but work isn't marked completed | works_sanctioned + expenditure |
| Massive cost escalation vs original scope (CAG example: a contract's cost rose 103% over the awarded amount while work stayed incomplete for 4+ years) | Compute `Sanction Amount / Recommended Amount` ratio; flag outliers beyond a threshold (e.g. >1.5–2x) or beyond the category's own distribution | works_recommended + works_sanctioned |
| Fund blockage — works stalled for years | Flag works where `today − Sanction Date` exceeds the 90th percentile duration for that `Work category`, still `in progress` | works_sanctioned |
| Asset completed but unused / no follow-through (CAG example: a ₹14.57 crore building unused for 4+ years due to unresolved defects) | Flag `Completed` works with an old `Completion Date` and no further expenditure activity — weak signal from tabular data alone, better confirmed via the completion-document/photo module | works_completed + expenditure |
| Payments to non-existent/fake entities (CAG scholarship audit: national evaluation found 830 of 1,572 sampled institutes were fake/non-functional; referred to CBI) | Flag `Vendor Name`/`Vendor Unique Code` appearing only once, at an unusually high amount, with no other payment history | expenditure |
| Same "beneficiary" claiming multiple times (CAG example: thousands of students claimed multiple scholarships across schemes, in violation of the one-scholarship rule) | Flag a `Vendor Name` receiving payments across an implausibly high number of distinct works/MPs/IDAs in overlapping windows | expenditure |
| Excess payment beyond sanctioned ceiling | Flag `Fund Disbursed Amount > Sanction Amount` (should never happen; direct rule, no threshold needed) | works_sanctioned + expenditure |
| Payment delay / spillover to later periods | Flag `Expenditure Date − Sanction Date` gaps well beyond the median for that work category | works_sanctioned + expenditure |

The strongest, most defensible rules for a demo are the first row
(recommendation-bypass) and the excess-payment-beyond-ceiling rule — both
are deterministic violations rather than fuzzy statistical outliers, and
map to a documented, real CAG finding.

Source: CAG Report No. 22 of 2025 (Compliance Audit – Civil & Commercial),
https://cag.gov.in/uploads/download_audit_report/2025/Report-No.-22-of-2025_CAO-(Civil)_English-(03-10-2025)-06943aa88578c10.37125079.pdf

## A note on the "Image" field / completion certificates

The hyperlinked PDFs in works_completed.csv (utilization certificates,
completion certificates, quality test reports, geotagged site photos) don't
come through in the CSV export and aren't bulk-downloadable — each is a
per-row link. Treat this as a separate, smaller-scope module: OCR the
certificate's stated Sanction/Approved Amount, dates, and vendor against the
matching CSV row to catch mismatches, and run perceptual-hash duplicate
checks across site photos to catch reused images across different claimed
works. Build this on a curated sample (20-30 works across a few districts),
not the full corpus — the per-row PDF links make full-scale scraping
impractical.
