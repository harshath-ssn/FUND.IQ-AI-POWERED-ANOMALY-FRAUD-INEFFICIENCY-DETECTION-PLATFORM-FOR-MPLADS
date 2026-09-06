import React, { useEffect, useState } from 'react';
import { Database, X, ShieldCheck } from 'lucide-react';

// A0.8: surfaces public/data/data_quality.json -- how much of each field this
// build claims is "real"/"resolved" is actually measured, not just asserted
// in a code comment. Purely additive: reads its own data file, renders as a
// small dismissible corner widget, and touches no other dashboard's state.
export default function DataCoveragePanel() {
  const [quality, setQuality] = useState(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/data_quality.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) setQuality(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!quality || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-xs">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-300 shadow-md text-[11px] font-bold text-slate-700 hover:bg-slate-50"
          title="Data coverage & real-vs-prototype breakdown"
        >
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          Data Coverage
        </button>
      )}

      {open && (
        <div className="rounded-xl bg-white border border-slate-300 shadow-xl p-4 text-xs text-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Data Coverage
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 text-[11px] font-semibold">
                Hide
              </button>
              <button onClick={() => setDismissed(true)} className="p-0.5 text-slate-400 hover:text-slate-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            {quality.totalWorks?.toLocaleString()} real eSAKSHI works · {quality.districtCoverage?.uniqueTrueDistricts} real districts · {quality.agencyCoverage?.uniqueRealAgencies} real agencies
          </p>

          <dl className="space-y-1">
            <Row label="District resolved from IDA" value={`${quality.districtCoverage?.resolvedFromIdaPct}%`} />
            <Row label="Agency resolved from IDA" value={`${quality.agencyCoverage?.resolvedFromIdaPct}%`} />
            <Row label="Works with matched vendor" value={`${quality.vendorCoverage?.worksWithMatchedVendorPct}%`} />
            <Row label="Works with payment status" value={`${quality.paymentStatusCoverage?.worksWithPaymentStatusPct}%`} />
            <Row label="Completed works w/ photo evidence" value={quality.photoEvidenceCoverage?.present?.toLocaleString()} />
            <Row label="Completed, no photo evidence" value={quality.photoEvidenceCoverage?.completedWithoutPhotoEvidence?.toLocaleString()} warn />
          </dl>

          <div className="pt-2 border-t border-slate-200 text-[10px] text-amber-700 bg-amber-50 rounded-lg p-2 leading-relaxed">
            District/state centroids are a deterministic approximation ({quality.geoCentroids?.districtsCovered} districts) -- eSAKSHI has no surveyed GPS field. Verification tasks, decisions, clarifications and follow-ups shown elsewhere are seeded prototype workflow data, not eSAKSHI records.
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, warn }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-mono font-bold ${warn ? 'text-amber-700' : 'text-slate-900'}`}>{value ?? '—'}</dd>
    </div>
  );
}
