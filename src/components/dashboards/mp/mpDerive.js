// Pure derivation helpers shared by every MP workspace section (Session B).
// No fabricated fields: everything here is computed from real A0 work
// records (public/data/works/by-constituency/*.json) and real MP_PROFILES
// rollups (src/data/mpMaster.js). Where a value genuinely isn't in the
// source data (e.g. a pre-sanction "Recommended" amount, or a statutory
// SLA deadline), the caller must render "Not available in source data"
// rather than this module inventing one.

import { LIFECYCLE_STAGES } from '../../ui/StageTracker';
import { riskLevelFromScore } from '../../ui/RiskBadge';

// Platform-selected reference thresholds for the payment-vs-execution-stage
// monitoring signal. These are NOT statutory rules -- just the cut points
// this platform uses to decide when to surface the signal. Keep both the
// values and their rationale visible wherever the signal is shown.
export const PAYMENT_STAGE_SIGNAL_THRESHOLD_PCT = 75;
export const PAYMENT_STAGE_SIGNAL_MAX_STAGE_INDEX = 2; // before "Physical Inspection" (index 3)
export const PROCESSING_TIMELINE_REFERENCE_DAYS = 45;

export function stageKeyForWork(work) {
  const idx = typeof work?.workStageIndex === 'number' ? work.workStageIndex : 0;
  const clamped = Math.min(Math.max(idx, 0), LIFECYCLE_STAGES.length - 1);
  return LIFECYCLE_STAGES[clamped];
}

export function paymentPct(work) {
  const sanctioned = Number(work?.sanctionedAmount);
  if (!sanctioned) return null;
  return (Number(work?.paymentReleased) || 0) / sanctioned * 100;
}

// "high disbursed share while still in an early lifecycle stage" (Part 2,
// Rule 9) -- never called fraud, only ever a monitoring signal.
export function hasPaymentStageSignal(work) {
  const pct = paymentPct(work);
  if (pct == null) return false;
  const idx = work?.workStageIndex;
  return typeof idx === 'number'
    && idx <= PAYMENT_STAGE_SIGNAL_MAX_STAGE_INDEX
    && pct >= PAYMENT_STAGE_SIGNAL_THRESHOLD_PCT;
}

export function hasEvidenceGap(work) {
  return work?.workStage === 'Work Completed' && work?.photoEvidence !== 'present';
}

export function costDeviationRatio(work) {
  const peer = Number(work?.peerMedianCost);
  if (!peer) return null;
  return Number(work?.sanctionedAmount || 0) / peer;
}

export function isElevatedRisk(work) {
  return Boolean(work?.isNegative) || (Number(work?.riskScore) || 0) >= 70;
}

// Normalizes heuristic driver magnitudes into percentage shares of the total
// signal weight, so a work dossier / alert never shows contribution numbers
// that (a) aren't percentages or (b) sum past the actual displayed score
// (Part 2, Rule 10 -- "risk contributions must be shown as percentages").
export function normalizeRiskDrivers(shapDrivers) {
  const drivers = Array.isArray(shapDrivers) ? shapDrivers : [];
  const magnitudes = drivers.map((d) => Math.abs(parseFloat(d.impact)) || 0);
  const total = magnitudes.reduce((s, v) => s + v, 0);
  if (total <= 0) return drivers.map((d) => ({ ...d, pct: 0 }));
  return drivers
    .map((d, i) => ({ ...d, pct: Math.round((magnitudes[i] / total) * 1000) / 10 }))
    .sort((a, b) => b.pct - a.pct);
}

// Monitoring Priority = risk x financial exposure x urgency (Part 2, Rule 6
// -- explicitly a platform-derived heuristic, never called an official
// MPLADS/statutory formula). Each factor is normalized 0..1 and explainable.
export function monitoringPriority(work, maxSanctioned) {
  const riskNorm = Math.max(0, Math.min(1, (Number(work?.riskScore) || 0) / 100));
  const exposureNorm = maxSanctioned > 0
    ? Math.max(0, Math.min(1, (Number(work?.sanctionedAmount) || 0) / maxSanctioned))
    : 0;

  let urgencyNorm = 0.2;
  const reasons = [];

  if (hasPaymentStageSignal(work)) {
    urgencyNorm = Math.max(urgencyNorm, 0.9);
    reasons.push('Payment released ahead of execution stage');
  }
  if (hasEvidenceGap(work)) {
    urgencyNorm = Math.max(urgencyNorm, 0.8);
    reasons.push('Completion recorded without photographic evidence');
  }
  if (isElevatedRisk(work)) {
    urgencyNorm = Math.max(urgencyNorm, 0.6);
    reasons.push(work.anomalyType || 'Risk signal flagged for review');
  } else if ((Number(work?.riskScore) || 0) >= 40) {
    urgencyNorm = Math.max(urgencyNorm, 0.4);
    reasons.push('Elevated risk score');
  }
  if (work?.agencyShareInDistrict === '100.0%') {
    urgencyNorm = Math.max(urgencyNorm, 0.5);
    reasons.push('Single implementing agency holds full local share');
  }

  if (reasons.length === 0) reasons.push('Routine monitoring — no elevated signal');

  return {
    priority: riskNorm * exposureNorm * urgencyNorm,
    riskNorm,
    exposureNorm,
    urgencyNorm,
    reasons,
  };
}

export function topAttentionItems(works, limit = 5) {
  const maxSanctioned = works.reduce((m, w) => Math.max(m, Number(w.sanctionedAmount) || 0), 0);
  return works
    .map((w) => ({ work: w, ...monitoringPriority(w, maxSanctioned) }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

export function computeFinancials(currentMp, mpWorks) {
  const entitlement = currentMp?.entitlement ?? null;
  const sanctioned = currentMp?.sanctionedAmount ?? null;
  const expenditure = currentMp?.expenditureAmount ?? null;
  const balance = (entitlement != null && sanctioned != null) ? entitlement - sanctioned : null;
  const paymentReleasedTotal = mpWorks.reduce((s, w) => s + (Number(w.paymentReleased) || 0), 0);
  const workPortfolioSanctioned = mpWorks.reduce((s, w) => s + (Number(w.sanctionedAmount) || 0), 0);
  return { entitlement, sanctioned, expenditure, balance, paymentReleasedTotal, workPortfolioSanctioned };
}

export function breakdownBy(works, keyFn) {
  const map = new Map();
  works.forEach((w) => {
    const key = keyFn(w) || 'Unspecified';
    if (!map.has(key)) map.set(key, { key, count: 0, sanctioned: 0, payment: 0 });
    const bucket = map.get(key);
    bucket.count += 1;
    bucket.sanctioned += Number(w.sanctionedAmount) || 0;
    bucket.payment += Number(w.paymentReleased) || 0;
  });
  return [...map.values()].sort((a, b) => b.sanctioned - a.sanctioned);
}

export function stageDistribution(works) {
  const buckets = LIFECYCLE_STAGES.map((key) => ({ key, count: 0 }));
  works.forEach((w) => {
    const idx = typeof w.workStageIndex === 'number'
      ? Math.min(Math.max(w.workStageIndex, 0), LIFECYCLE_STAGES.length - 1)
      : 0;
    buckets[idx].count += 1;
  });
  return buckets;
}

export function riskDistribution(works) {
  const buckets = { high: 0, medium: 0, low: 0, nominal: 0 };
  works.forEach((w) => { buckets[riskLevelFromScore(w.riskScore)] += 1; });
  return buckets;
}

export function scStComplianceStatus(currentMp) {
  const scPct = currentMp?.scAllocationPct;
  const stPct = currentMp?.stAllocationPct;
  const hasData = scPct != null && stPct != null;
  if (!hasData) return 'unavailable';
  return (scPct >= 15 && stPct >= 7.5) ? 'met' : 'below-reference';
}

export function complianceChecks(currentMp, mpWorks) {
  const paymentStageWorks = mpWorks.filter(hasPaymentStageSignal);
  const completedWorks = mpWorks.filter((w) => w.workStage === 'Work Completed');
  const evidenceGapWorks = mpWorks.filter(hasEvidenceGap);

  const processingDays = mpWorks
    .map((w) => w.daysToSanction)
    .filter((d) => typeof d === 'number');
  const avgProcessing = processingDays.length
    ? Math.round(processingDays.reduce((s, d) => s + d, 0) / processingDays.length)
    : null;
  const longProcessing = mpWorks.filter(
    (w) => typeof w.daysToSanction === 'number' && w.daysToSanction > PROCESSING_TIMELINE_REFERENCE_DAYS
  );

  const scPct = currentMp?.scAllocationPct;
  const stPct = currentMp?.stAllocationPct;
  const scstStatus = scStComplianceStatus(currentMp);

  return [
    {
      id: 'scst-proxy',
      title: 'SC/ST Allocation Proxy',
      status: scstStatus === 'unavailable' ? 'unavailable' : (scstStatus === 'met' ? 'met' : 'below'),
      measured: (scPct != null && stPct != null) ? `${scPct}% SC / ${stPct}% ST` : 'Not available in source data',
      threshold: 'Commonly cited MPLADS reference figures (15% SC / 7.5% ST) -- not verified as a statutory field in this dataset.',
      source: currentMp?.scStProxyNote || 'Estimated from work-category/description keywords -- eSAKSHI has no official SC/ST-area field.',
    },
    {
      id: 'payment-stage',
      title: 'Payment vs Execution-Stage Signal',
      status: paymentStageWorks.length > 0 ? 'review' : 'nominal',
      measured: `${paymentStageWorks.length} of ${mpWorks.length} works show payment released at or above ${PAYMENT_STAGE_SIGNAL_THRESHOLD_PCT}% of sanctioned amount while still at or before the Vendor Identification stage.`,
      threshold: `Platform-selected reference: payment share >= ${PAYMENT_STAGE_SIGNAL_THRESHOLD_PCT}%, stage index <= ${PAYMENT_STAGE_SIGNAL_MAX_STAGE_INDEX} (before Physical Inspection).`,
      source: 'Derived from paymentReleased, sanctionedAmount and workStageIndex (eSAKSHI-derived).',
    },
    {
      id: 'evidence-gap',
      title: 'Completion Without Photographic Evidence',
      status: evidenceGapWorks.length > 0 ? 'review' : 'nominal',
      measured: `${evidenceGapWorks.length} of ${completedWorks.length} completed works have no photo evidence on file.`,
      threshold: 'A work recorded as Work Completed is expected to carry photoEvidence = present.',
      source: 'Derived from photoEvidence and workStage (eSAKSHI-derived).',
    },
    {
      id: 'processing-timeline',
      title: 'Recommendation Processing Timeline',
      status: 'info',
      measured: avgProcessing != null
        ? `Average ${avgProcessing} days from recommendation to sanction across ${processingDays.length} works with data on file (${longProcessing.length} exceed ${PROCESSING_TIMELINE_REFERENCE_DAYS} days).`
        : 'Not available in source data',
      threshold: `${PROCESSING_TIMELINE_REFERENCE_DAYS} days is a commonly cited reference point for comparison, not confirmed as a verified statutory deadline in this dataset.`,
      source: 'Derived from daysToSanction (eSAKSHI-derived).',
    },
  ];
}
