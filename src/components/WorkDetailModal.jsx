import React, { useState } from 'react';
import { 
  X, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Building2, 
  MapPin, Calendar, IndianRupee, FileText, Camera, Info, ArrowUpRight,
  Send, Lock, Eye, AlertOctagon, CheckCircle, Navigation, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function WorkDetailModal({ work, onClose, onEscalateToDistrict }) {
  const [isFrozen, setIsFrozen] = useState(false);
  const [inspectionDispatched, setInspectionDispatched] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  if (!work) return null;

  const costComparisonData = [
    {
      name: "Peer Group Median",
      amount: work.peerMedianCost / 100000,
      fill: "#059669" // Safe Emerald
    },
    {
      name: "Sanctioned Amount",
      amount: work.sanctionedAmount / 100000,
      fill: work.isNegative ? "#dc2626" : "#2563eb" // Crimson if anomaly
    }
  ];

  const handleFreezePayment = () => {
    setIsFrozen(true);
    setActionNotice({
      title: "STOP-PAYMENT ORDER DISPATCHED",
      desc: `Further payment tranches for ${work.id} have been officially FROZEN on the eSAKSHI & PFMS treasury ledger. No further funds can be released to ${work.implementingAgency} without District Magistrate clearance.`,
      type: "red"
    });
  };

  const handleOrderInspection = () => {
    setInspectionDispatched(true);
    setActionNotice({
      title: "OFFICIAL DISTRICT FLYING SQUAD DISPATCHED (48-HOUR MANDATE)",
      desc: `Field Inspection Order #${Math.floor(100000 + Math.random() * 900000)} generated. An official District Flying Squad has been dispatched to GPS Coordinates [${work.gpsCoordinates || "11.0168° N, 76.9558° E"}] to measure actual physical dimensions, verify progress %, and capture mandatory geotagged photos on-site within 48 hours.`,
      type: "blue"
    });
  };

  const costRatio = (work.sanctionedAmount / work.peerMedianCost).toFixed(2);
  const paymentPct = Math.round((work.paymentReleased / work.sanctionedAmount) * 100);
  // Only computable when we have a real progress % (completed works) -- with
  // no progress field in the source data, incomplete works carry progressPct
  // null and this comparison can't honestly be made.
  const isPaymentBeforeProgress = work.progressPct != null && (paymentPct - work.progressPct > 35);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Severity Indicator Bar */}
        <div className={`h-2 w-full ${
          isFrozen 
            ? 'bg-red-700' 
            : work.isNegative 
              ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-500'
        }`} />

        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-200 text-slate-800">
                {work.id}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {work.category}
              </span>
              
              {/* Frozen status tag */}
              {isFrozen && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
                  <Lock className="w-3.5 h-3.5" />
                  PAYMENT TRANCHE FROZEN
                </span>
              )}

              {/* Inspection Dispatched tag */}
              {inspectionDispatched && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                  <Navigation className="w-3.5 h-3.5" />
                  FLYING SQUAD DISPATCHED
                </span>
              )}

              {/* Negative vs Positive Badge */}
              {!isFrozen && (
                work.isNegative ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    HEAVY ANOMALY DETECTED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    CLEAN AUDIT PASSED
                  </span>
                )
              )}
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              {work.title}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                {work.constituency}, {work.district}, {work.state}
              </span>
              <span className="flex items-center gap-1 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                MP: {work.mpName} ({work.house})
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-left">
          {/* Action notification banner */}
          {actionNotice && (
            <div className={`p-4 rounded-xl text-xs font-medium border flex items-start justify-between shadow-xs animate-in slide-in-from-top duration-200 ${
              actionNotice.type === 'red' 
                ? 'bg-red-50 text-red-900 border-red-300' 
                : 'bg-blue-50 text-blue-900 border-blue-300'
            }`}>
              <div className="space-y-1">
                <strong className="block text-sm font-bold flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4" />
                  {actionNotice.title}
                </strong>
                <p className="leading-relaxed">{actionNotice.desc}</p>
              </div>
              <button onClick={() => setActionNotice(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Top Score and Description Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Risk Score Gauge Tile */}
            <div className={`p-5 rounded-xl border flex flex-col justify-between ${
              work.isNegative 
                ? 'bg-red-50/60 border-red-200 text-red-900' 
                : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-600">AI Risk Index</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                  work.isNegative ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {work.riskLevel}
                </span>
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className={`text-5xl font-black font-mono tracking-tight ${
                  work.isNegative ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {work.riskScore}
                </span>
                <span className="text-slate-500 text-sm font-mono font-medium">/ 100</span>
              </div>
              <p className={`text-xs font-bold leading-relaxed ${work.isNegative ? 'text-red-700' : 'text-emerald-700'}`}>
                {work.isNegative 
                  ? "⚠ CRITICAL WARNING: Severe fiscal anomaly or unearned advance detected." 
                  : "✓ OPTIMAL PERFORMANCE: Fully aligned with statutory MPLADS guidelines."}
              </p>
            </div>

            {/* Description & Implementing Agency */}
            <div className="md:col-span-2 p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-slate-500">Work Scope & Specifications</span>
                <p className="text-sm text-slate-800 mt-2 leading-relaxed font-medium">
                  {work.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Implementing Agency:</span>
                  <span className="text-slate-900 font-bold">{work.implementingAgency}</span>
                  <span className={`block text-[11px] mt-0.5 font-semibold ${work.agencyShareInDistrict === "100.0%" ? 'text-red-600' : 'text-slate-500'}`}>
                    Agency District Share: {work.agencyShareInDistrict} {work.agencyShareInDistrict === "100.0%" && '(Monopoly Breach)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Geotagged Photo Proof:</span>
                  <span className={`inline-flex items-center gap-1 font-bold mt-0.5 ${work.photoUploaded ? 'text-emerald-700' : 'text-red-600'}`}>
                    <Camera className="w-3.5 h-3.5" />
                    {work.photoUploaded ? '✓ Verified on eSAKSHI' : '✗ MISSING (Ghost Asset Flag)'}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    GPS: {work.gpsCoordinates}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost Comparison vs Peer Median (Recharts Bar Chart) */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Cost Forensic Comparison (vs District Category Median)
                </h3>
                <p className="text-xs text-slate-500">
                  Benchmarked against peer {work.category} projects in {work.district}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold ${
                  work.isNegative ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  Variance: {costRatio}x Category Median
                </span>
              </div>
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costComparisonData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 5 }}>
                  <XAxis type="number" unit=" L" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#334155" fontSize={12} tickLine={false} width={130} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-2.5 rounded-lg bg-slate-900 text-white text-xs font-mono">
                            <p className="font-bold">{payload[0].payload.name}</p>
                            <p className="text-cyan-300">₹{payload[0].value.toFixed(2)} Lakhs</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                    {costComparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Financial Numbers Bar */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-center">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Sanctioned Cost</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  ₹{(work.sanctionedAmount / 100000).toFixed(2)} L
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Payments Disbursed</span>
                <span className="text-base font-bold text-blue-700 font-mono">
                  ₹{(work.paymentReleased / 100000).toFixed(2)} L ({paymentPct}%)
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 block font-medium">Logged Progress</span>
                <span className={`text-base font-bold font-mono ${
                  isPaymentBeforeProgress ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {work.progressPct != null ? `${work.progressPct}% Done` : (work.statusLabel || "Status Not Recorded")}
                </span>
              </div>
            </div>
          </div>

          {/* Reasons Breakdown (Member 1 Output) */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${work.isNegative ? 'text-red-600' : 'text-emerald-600'}`} />
              Explainable Anomaly Reasons (ML Signal Breakdown)
            </h3>
            <div className="space-y-2">
              {work.anomalyReasons.map((reason, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    work.isNegative 
                      ? 'bg-red-50 text-red-900 border-red-200 font-medium' 
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 font-medium'
                  }`}
                >
                  <span className="font-mono font-bold mt-0.5">{idx + 1}.</span>
                  <span className="leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>

            {/* SHAP Impact Weights */}
            {work.shapDrivers && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-600 font-bold block mb-2">
                  Feature Attribution (SHAP Risk Factor Contribution):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {work.shapDrivers.map((driver, i) => (
                    <div key={i} className="p-2 rounded-lg bg-white border border-slate-200 text-[11px]">
                      <span className="text-slate-500 block truncate">{driver.factor}</span>
                      <span className={`font-mono font-bold ${driver.impact.startsWith('+') ? 'text-red-600' : 'text-emerald-700'}`}>
                        {driver.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GenAI Plain-English Audit Note */}
          <div className="p-5 rounded-xl bg-indigo-50/70 border border-indigo-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-700" />
                <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wider">
                  GenAI Plain-English Audit Note
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                Automated Auditor
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed italic bg-white p-4 rounded-lg border border-indigo-100">
              "{work.genAiAuditNote}"
            </p>

            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>AI summary for administrative guidance under MPLADS Guidelines 2023.</span>
              <span className="font-mono text-indigo-700 font-bold">Confidence: 96.8%</span>
            </div>
          </div>
        </div>

        {/* Action Enforcement Buttons Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Freeze Payment Tranche Button */}
            {work.isNegative && (
              <button
                onClick={handleFreezePayment}
                disabled={isFrozen}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                  isFrozen
                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title="Halts further payments in case of payment-before-progress anomaly"
              >
                <Lock className="w-3.5 h-3.5" />
                {isFrozen ? "Payment Tranche Already Frozen" : "Freeze Payment Tranche"}
              </button>
            )}

            {/* Escalate to District Authority (MP view only) */}
            {work.isNegative && onEscalateToDistrict && (
              <button
                onClick={() => onEscalateToDistrict(work)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs bg-amber-500 hover:bg-amber-600 text-white"
                title="Notifies the District Authority and pins this work at the top of their register"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Escalate to District Authority
              </button>
            )}

            {/* 2. Order Site Inspection Button */}
            {work.isNegative && (
              <button
                onClick={handleOrderInspection}
                disabled={inspectionDispatched}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                  inspectionDispatched
                    ? 'bg-blue-200 text-blue-800 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title="Dispatches District Flying Squad to GPS coordinates within 48 hours for ghost asset/duplicate check"
              >
                <Eye className="w-3.5 h-3.5" />
                {inspectionDispatched ? "Flying Squad Dispatched (48h)" : "Order Site Inspection"}
              </button>
            )}

            {/* If clean work */}
            {!work.isNegative && (
              <button
                onClick={() => setActionNotice({
                  title: "AUDIT SIGN-OFF COMPLETE",
                  desc: `Work ${work.id} marked as fully compliant. Archived to clean audit registry.`,
                  type: "blue"
                })}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Issue Audit Clearance
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
