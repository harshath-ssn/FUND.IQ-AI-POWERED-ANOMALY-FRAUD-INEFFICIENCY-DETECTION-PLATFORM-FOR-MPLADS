import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Building2,
  MapPin, Camera, CameraOff, ArrowUpRight,
  Send, Lock, Eye, AlertOctagon, Navigation, Loader2,
  MessageSquareQuote
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { formatINR } from '../utils/format';
import { useTranslation } from '../i18n';
import { useWorkflowStore, EVENT_TYPES } from '../store/workflowStore';
import { generateAiReviewBrief } from './dashboards/mp/aiReviewBrief';
import RequestInformationModal from './dashboards/mp/RequestInformationModal';
import { normalizeRiskDrivers } from './dashboards/mp/mpDerive';

export default function WorkDetailModal({ work, onClose, onEscalateToDistrict, currentUser }) {
  const { t } = useTranslation();
  const workflow = useWorkflowStore();
  const [paymentFlagged, setPaymentFlagged] = useState(false);
  const [inspectionRequested, setInspectionRequested] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);

  const isMp = currentUser?.role === 'mp';

  if (!work) return null;

  const handleGenerateBrief = () => {
    setBriefLoading(true);
    setBrief(null);
    // Deterministic, template-based generation from real recorded fields --
    // the artificial delay only signals "this was generated just now", it is
    // not a live model call (Part 3, Rule 13: generate on click, never on
    // every render, and never fabricate confidence/SHAP/model claims).
    setTimeout(() => {
      setBrief(generateAiReviewBrief(work));
      setBriefLoading(false);
    }, 500);
  };

  const workEvents = workflow.getEventsForWork(work.id).filter((e) => e.type === EVENT_TYPES.REQUEST_INFORMATION);

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

  // These log a request/flag for the District Authority to act on -- they do
  // not execute a treasury or field action themselves (Part 2, Rule 5: never
  // invent government powers this dashboard doesn't actually have).
  const handleFlagPaymentForReview = () => {
    setPaymentFlagged(true);
    setActionNotice({
      title: "PAYMENT FLAGGED FOR REVIEW",
      desc: `This work has been flagged for the District Authority's review of further payment releases to ${work.implementingAgency}. No payment action has been executed by this dashboard.`,
      type: "red"
    });
  };

  const handleRequestInspection = () => {
    setInspectionRequested(true);
    setActionNotice({
      title: "PHYSICAL INSPECTION REQUESTED",
      desc: `A physical inspection request for ${work.id} has been logged for the District Authority to schedule. Site verification and geotagged photo capture remain the District Authority's responsibility.`,
      type: "blue"
    });
  };

  const costRatio = (work.sanctionedAmount / work.peerMedianCost).toFixed(2);
  const paymentPct = Math.round((work.paymentReleased / work.sanctionedAmount) * 100);
  // Only computable when we have a real progress % (completed works) -- with
  // no progress field in the source data, incomplete works carry progressPct
  // null and this comparison can't honestly be made.
  const isPaymentBeforeProgress = work.progressPct != null && (paymentPct - work.progressPct > 35);

  // Portaled to document.body at a z-index above Leaflet's internal
  // panes/controls (up to z-index 1000) -- otherwise opening this from a
  // map marker on any workspace renders it visually behind the map tiles.
  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Severity Indicator Bar */}
        <div className={`h-2 w-full ${
          paymentFlagged 
            ? 'bg-red-700' 
            : work.isNegative 
              ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-500'
        }`} />

        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between bg-slate-50/70">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded text-sm font-mono font-bold bg-slate-200 text-slate-800">
                {work.id}
              </span>
              <span className="px-2.5 py-1 rounded text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {work.category}
              </span>

              {/* Payment-flagged status tag */}
              {paymentFlagged && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-600 text-white animate-pulse">
                  <Lock className="w-3.5 h-3.5" />
                  PAYMENT FLAGGED FOR REVIEW
                </span>
              )}

              {/* Inspection requested tag */}
              {inspectionRequested && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-blue-600 text-white">
                  <Navigation className="w-3.5 h-3.5" />
                  INSPECTION REQUESTED
                </span>
              )}

              {/* Negative vs Positive Badge */}
              {!paymentFlagged && (
                work.isNegative ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-red-50 text-red-700 border border-red-200">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    ANOMALY DETECTED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    NO ACTIVE FLAG
                  </span>
                )
              )}
            </div>

            <h2 className="text-xl font-semibold text-slate-900 tracking-tight mt-1">
              {work.title}
            </h2>
            <p className="text-sm text-slate-500 flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-indigo-600" />
                {work.constituency}, {work.district}, {work.state}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Building2 className="w-4 h-4 text-slate-600" />
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
            <div className={`p-4 rounded-xl text-sm font-medium border flex items-start justify-between shadow-xs animate-in slide-in-from-top duration-200 ${
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
                <span className="text-sm uppercase tracking-wide font-bold text-slate-600">AI Risk Index</span>
                <span className={`text-sm px-2.5 py-1 rounded font-mono font-bold ${
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
                <span className="text-slate-500 text-base font-mono font-medium">/ 100</span>
              </div>
              <p className={`text-sm font-semibold leading-relaxed ${work.isNegative ? 'text-red-700' : 'text-emerald-700'}`}>
                {work.isNegative
                  ? "⚠ Risk signal: potential fiscal anomaly or unearned advance identified -- requires review."
                  : "✓ Monitoring signal: no anomaly indicators triggered for this work."}
              </p>
            </div>

            {/* Description & Implementing Agency */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-sm uppercase tracking-wide font-bold text-slate-500">Work Scope & Specifications</span>
                <p className="text-base text-slate-800 mt-2 leading-relaxed font-medium">
                  {work.description}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-sm">
                <span className="text-slate-500 block">Implementing Agency:</span>
                <span className="text-slate-900 font-bold">{work.implementingAgency}</span>
                <span className={`block text-sm mt-0.5 font-semibold ${work.agencyShareInDistrict === "100.0%" ? 'text-amber-700' : 'text-slate-500'}`}>
                  Agency District Share: {work.agencyShareInDistrict} {work.agencyShareInDistrict === "100.0%" && '(Concentration Signal)'}
                </span>
                <span className="text-xs text-slate-500 block mt-2">
                  GPS: {work.gpsCoordinates}
                </span>
              </div>
            </div>

            {/* Photographic evidence slot (Phase 7.1) -- never a stock/generated
                photo here; a real compliance finding is styled as a finding,
                not as a broken image. */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
              <span className="text-sm uppercase tracking-wide font-bold text-slate-500 mb-2">Photographic Evidence</span>
              {work.photoEvidence === 'not_applicable' ? (
                <div className="flex-1 rounded-lg border border-dashed border-slate-300 bg-slate-100 flex flex-col items-center justify-center gap-1.5 py-6 text-center">
                  <Camera className="w-6 h-6 text-slate-400" aria-hidden="true" />
                  <span className="text-xs font-semibold text-slate-500">Not applicable for this work</span>
                </div>
              ) : work.photoEvidence === 'absent' || !work.photoUploaded ? (
                <div className="flex-1 rounded-lg border border-amber-300 bg-amber-50 flex flex-col items-center justify-center gap-1.5 py-6 text-center px-3">
                  <CameraOff className="w-6 h-6 text-amber-600" aria-hidden="true" />
                  <span className="text-sm font-bold text-amber-900">Evidence Gap</span>
                  <span className="text-xs text-amber-800">No photographic evidence on record.</span>
                </div>
              ) : (
                <div className="flex-1 rounded-lg border border-emerald-300 bg-emerald-50 flex flex-col items-center justify-center gap-1.5 py-6 text-center px-3">
                  <Camera className="w-6 h-6 text-emerald-700" aria-hidden="true" />
                  <span className="text-sm font-bold text-emerald-900">Photograph on Record</span>
                  <span className="text-xs text-emerald-800">Image file not included in this export.</span>
                </div>
              )}
            </div>
          </div>

          {/* Cost Comparison vs Peer Median (Recharts Bar Chart) */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Cost Forensic Comparison (vs District Category Median)
                </h3>
                <p className="text-sm text-slate-500">
                  Benchmarked against peer {work.category} projects in {work.district}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-sm px-2.5 py-1 rounded-md font-mono font-bold ${
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
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-sm text-slate-500 block font-medium">Sanctioned Cost</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {formatINR(work.sanctionedAmount)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-sm text-slate-500 block font-medium">Payments Disbursed</span>
                <span className="text-lg font-bold text-blue-700 font-mono">
                  {formatINR(work.paymentReleased)} ({paymentPct}%)
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-sm text-slate-500 block font-medium">Logged Progress</span>
                <span className={`text-lg font-bold font-mono ${
                  isPaymentBeforeProgress ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {work.progressPct != null ? `${work.progressPct}% Done` : (work.statusLabel || "Status Not Recorded")}
                </span>
              </div>
            </div>
          </div>

          {/* Reasons Breakdown (Member 1 Output) */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-3 flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${work.isNegative ? 'text-red-600' : 'text-emerald-600'}`} />
              Anomaly Reasons (Rule-Based Signal Breakdown)
            </h3>
            <div className="space-y-2">
              {work.anomalyReasons.map((reason, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border text-sm flex items-start gap-2.5 ${
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
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Reason text above is sourced verbatim from the eSAKSHI-derived record. Any reference to a "statutory SLA" reflects the source dataset's own labeling and has not been independently verified by this platform as a confirmed statutory deadline.
            </p>

            {/* Rule-based contributing factors, normalized to percentage
                shares of the total signal weight -- heuristic magnitudes,
                not a trained model's SHAP values, and never additive point
                values that could exceed the displayed score (Part 2, Rule
                6 & 10). */}
            {work.shapDrivers && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <span className="text-sm text-slate-600 font-bold block mb-2">
                  Contributing Risk Factors (Rule-Based Heuristic, % of Signal Weight):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {normalizeRiskDrivers(work.shapDrivers).map((driver, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white border border-slate-200 text-sm">
                      <span className="text-slate-500 text-xs block truncate">{driver.factor}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {driver.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Review Brief (Part 3, Rule 13) -- template-generated from real
              recorded fields, on demand only (never automatically on every
              render). Replaces the old "Gemini AI Note" wording entirely. */}
          <div className="p-5 rounded-xl bg-indigo-50/70 border border-indigo-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-700" />
                <h3 className="text-lg font-bold text-indigo-950 tracking-tight">
                  {t('mp.dossier.aiReviewBrief')}
                </h3>
              </div>
              {!brief && !briefLoading && (
                <button
                  type="button"
                  onClick={handleGenerateBrief}
                  className="px-3.5 py-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-amber-400 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('mp.dossier.generate')}
                </button>
              )}
              {brief && (
                <button
                  type="button"
                  onClick={handleGenerateBrief}
                  className="text-sm font-semibold text-indigo-700 hover:underline cursor-pointer"
                >
                  {t('mp.dossier.regenerate')}
                </button>
              )}
            </div>

            {briefLoading && (
              <div className="flex items-center gap-2 text-sm text-indigo-800 font-semibold py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('mp.dossier.generating')}
              </div>
            )}

            {!brief && !briefLoading && (
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <MessageSquareQuote className="w-4 h-4" />
                Click "{t('mp.dossier.generate')}" to produce a review brief from this work's recorded signals.
              </p>
            )}

            {brief && (
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <span className="text-sm font-bold uppercase tracking-wide text-indigo-900">{t('mp.dossier.finding')}</span>
                  <p className="text-slate-800 leading-relaxed bg-white p-3.5 rounded-lg border border-indigo-100 mt-1.5">{brief.finding}</p>
                </div>
                <div>
                  <span className="text-sm font-bold uppercase tracking-wide text-indigo-900">{t('mp.dossier.supportingSignals')}</span>
                  <ul className="bg-white p-3.5 rounded-lg border border-indigo-100 mt-1.5 space-y-1.5 list-disc pl-4">
                    {brief.supportingSignals.map((s, i) => <li key={i} className="text-slate-800 leading-relaxed">{s}</li>)}
                  </ul>
                  {brief.supportingSignalsNote && (
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{brief.supportingSignalsNote}</p>
                  )}
                </div>
                <div>
                  <span className="text-sm font-bold uppercase tracking-wide text-indigo-900">{t('mp.dossier.suggestedFollowup')}</span>
                  <ul className="bg-white p-3.5 rounded-lg border border-indigo-100 mt-1.5 space-y-1.5 list-disc pl-4">
                    {brief.suggestedFollowup.map((s, i) => <li key={i} className="text-slate-800 leading-relaxed">{s}</li>)}
                  </ul>
                </div>
                <div>
                  <span className="text-sm font-bold uppercase tracking-wide text-indigo-900">{t('mp.dossier.evidence')}</span>
                  <p className="text-slate-800 leading-relaxed bg-white p-3.5 rounded-lg border border-indigo-100 mt-1.5">{brief.evidence}</p>
                </div>
                <div>
                  <span className="text-sm font-bold uppercase tracking-wide text-amber-800">{t('mp.dossier.disclaimer')}</span>
                  <p className="text-sm text-amber-900 leading-relaxed bg-amber-50 p-3.5 rounded-lg border border-amber-200 mt-1.5">{brief.disclaimer}</p>
                </div>
              </div>
            )}
          </div>

          {/* MP-only Request Information workflow (Part 3, Rule 15) -- routes
              through the shared workflowStore event bus, not a local toast. */}
          {isMp && (
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Send className="w-5 h-5 text-indigo-700" />
                  {t('mp.actions.requestInfo')}
                </h3>
                <button
                  type="button"
                  onClick={() => setRequestInfoOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-amber-400 text-sm font-semibold cursor-pointer"
                >
                  {t('mp.actions.requestInfo')}
                </button>
              </div>

              {workEvents.length === 0 ? (
                <p className="text-sm text-slate-400">No information requests logged for this work yet.</p>
              ) : (
                <div className="space-y-2">
                  {workEvents.map((evt) => (
                    <div key={evt.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-sm space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-700">{evt.id}</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${evt.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {evt.status}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{evt.reason}</p>
                      {evt.status !== 'Open' ? (
                        <p className="text-emerald-800 font-semibold">
                          {t('mp.actions.response')}: {evt.history[evt.history.length - 1]?.note || evt.history[evt.history.length - 1]?.action}
                        </p>
                      ) : (
                        <p className="text-slate-400">{t('mp.actions.noResponseYet')}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {requestInfoOpen && (
          <RequestInformationModal work={work} onClose={() => setRequestInfoOpen(false)} />
        )}

        {/* Request/flag actions -- these log a request for the District
            Authority to act on, they do not execute any treasury or field
            action themselves (Part 2, Rule 5). */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {work.isNegative && (
              <button
                onClick={handleFlagPaymentForReview}
                disabled={paymentFlagged}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                  paymentFlagged
                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title="Flags this work for the District Authority's payment review"
              >
                <Lock className="w-4 h-4" />
                {paymentFlagged ? "Payment Flagged for Review" : "Flag Payment for Review"}
              </button>
            )}

            {/* Escalate to District Authority (MP view only) */}
            {work.isNegative && onEscalateToDistrict && (
              <button
                onClick={() => onEscalateToDistrict(work)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 shadow-xs bg-amber-500 hover:bg-amber-600 text-white"
                title="Notifies the District Authority and pins this work at the top of their register"
              >
                <ArrowUpRight className="w-4 h-4" />
                Escalate to District Authority
              </button>
            )}

            {work.isNegative && (
              <button
                onClick={handleRequestInspection}
                disabled={inspectionRequested}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                  inspectionRequested
                    ? 'bg-blue-200 text-blue-800 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title="Logs a physical inspection request for the District Authority to schedule"
              >
                <Eye className="w-4 h-4" />
                {inspectionRequested ? "Inspection Requested" : "Request Physical Inspection"}
              </button>
            )}

            {!work.isNegative && (
              <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                No outstanding flags -- no action required.
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
