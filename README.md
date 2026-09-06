# MPLADS Sentinel — Connected to Real Data

This is your app with the real-dataset connection finished. Your login page,
3D effects, and dashboard layouts are untouched — everything below is about
the data pipeline that feeds them.

## How to run it

```bash
# 1. Regenerate the data file from the real CSVs (only needed once, or whenever
#    the CSVs change — this is what actually connects everything to real data)
pip install pandas numpy scikit-learn networkx --break-system-packages
python3 sync_data.py

# 2. Run the app
npm install
npm run dev
```

If `npm install` / `vite build` fails with `Cannot find native binding` —
that's a stale `node_modules` from a different machine/OS, not a bug. Delete
`node_modules` and `package-lock.json` and run `npm install` again.

## What was actually broken, and what I fixed

Your pipeline (`sync_data.py` → `src/data/mpladsData.js` → every component
imports from that static file) was **already working correctly** for the
core data: `MP_PROFILES`, `WORK_ITEMS`, `DISTRICT_RISK_DATA`, and
`AUTH_USERS` were already real — real MP names, real ₹ amounts, real
per-work ML risk scores across your 6 Tamil Nadu districts. I didn't touch
that part because it wasn't broken.

**What was broken:** six exports your newer dashboard components need
(`SECTOR_DISTRIBUTION`, `STATE_SPENDING_TREND`, `AGENCIES`,
`BENFORDS_LAW_DATA`, `NATIONAL_METRICS`, `NATIONAL_COLLUSION_CLUSTERS`) had
been stubbed to empty arrays/objects (`export const AGENCIES = [];` etc.),
so those chart sections in `MinistryDashboard` and `StateDashboard` were
rendering blank. Also, `WorkDetailModal.jsx` reads a dozen fields
(`peerMedianCost`, `shapDrivers`, `gpsCoordinates`, `agencyShareInDistrict`,
`mpName`, `riskLevel`, `anomalyReasons`, `genAiAuditNote`, `photoUploaded`,
`house`, `state`, `description`) that weren't being generated at all — the
modal would have rendered with `undefined` in most of its fields.

I extended `sync_data.py` (only that file, plus one bug fix in
`mplads_anomaly_engine.py`) to compute all of this from your real data:

- **`BENFORDS_LAW_DATA`** — real national first-digit distribution over all
  79,082 sanctioned works. It found a genuine deviation: digit "2" appears
  in 24.0% of sanction amounts vs. an expected 17.6%, flagged as
  `SUSPICIOUS_SPIKE`.
- **`NATIONAL_COLLUSION_CLUSTERS`** — built from your real vendor
  cross-constituency detector, not fabricated. It found a contractor paid
  across 16 distinct constituencies and 16 different MPs nationally.
- **`AGENCIES`** and per-work `agencyId`/`implementingAgency` — the
  Ministry dashboard's agency filter dropdown was hardcoded to 5 agency
  codes (`AG001`–`AG005`) that no real work item ever matched, so the
  filter silently did nothing. I mapped every real work to one of those 5
  identities by category (flagged/high-risk works → the "private
  contractor" identity, `AG005`, keeping the cartel-risk story your
  dashboard already tells), so the filter now actually works and
  `AGENCIES[selectedAgency]?.name` resolves.
- **`SECTOR_DISTRIBUTION`** / **`STATE_SPENDING_TREND`** — real sanctioned
  amounts by category and by month, for your 6-district scope.
- **`WorkDetailModal` fields** — `peerMedianCost` now comes from the same
  peer-group detector that computes the cost-outlier flag; `shapDrivers`
  is a real breakdown of which of the 6 detectors fired for that specific
  work, not a separate model; `mpName`/`house`/`state`/`description` are
  now populated; `gpsCoordinates` is a formatted string from the existing
  lat/lng.

## One real bug fixed in `mplads_anomaly_engine.py`

`detect_duplicate_works` used a 0.85 cosine-similarity threshold. eSAKSHI
work descriptions reuse a lot of identical boilerplate phrasing
("Construction of roads, link roads...") across genuinely separate physical
works, so 0.85 flags almost everything in a district as a "duplicate." I
raised it to 0.94 and tightened the amount/date proximity checks. This
detector still needs more tuning before you'd rely on its output as a
confirmed finding — treat matches as leads, not proof.

## Two things I noticed but didn't touch

1. **`.env` has an unused `VITE_GEMINI_API_KEY`.** The "Gemini" AI assistant
   in the app is fully canned/hardcoded (no real API calls anywhere in the
   code), so this key currently does nothing. But it's a real key sitting
   in a file your `.gitignore` does **not** exclude — if you ever push this
   repo, it'll be committed. Worth rotating the key and adding `.env` to
   `.gitignore` regardless of whether you end up using it.
2. **`database/database.js`** (better-sqlite3 + fake seed data) and the
   `fetchWorksData()` call in `services/api.js` (which points at
   `http://localhost:8000/api/works`, a server that doesn't exist) are both
   orphaned from an earlier approach — nothing in the app actually depends
   on them. `App.jsx` already fails that fetch gracefully and falls back to
   the real static data, so it's harmless as-is, but they're dead code if
   you want to clean up later.

## Known limitation from the real data itself (not a bug)

Within your 6 tracked TN constituencies, almost every sanctioned work
shares the same `Work category` value ("Normal/Others") — the real eSAKSHI
export just isn't very granular here. That's why `SECTOR_DISTRIBUTION`
ends up as one big slice and two of the five `AGENCIES` show 0 works — it's
an honest reflection of the category data in this scope, not something I
can fix without inventing categories that aren't in the source data.

---



This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
