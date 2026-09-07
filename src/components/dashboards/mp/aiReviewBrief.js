// Template-generated "AI Review Brief" (Part 3, Rule 13). Deterministic and
// built only from real recorded fields on the work -- not a live model call,
// no fabricated confidence score, no SHAP claim. Replaces the old
// "Gemini AI Note" wording entirely. Generated on demand (on click) by the
// caller, never automatically on every render.

import { hasPaymentStageSignal, hasEvidenceGap, costDeviationRatio, paymentPct } from './mpDerive';

export function generateAiReviewBrief(work) {
  const riskScore = work.riskScore ?? 0;
  const elevated = Boolean(work.isNegative) || riskScore >= 40;
  const paymentStage = hasPaymentStageSignal(work);
  const evidenceGap = hasEvidenceGap(work);
  const costRatio = costDeviationRatio(work);

  const finding = elevated
    ? `This work carries a monitoring signal (risk score ${riskScore}/100, ${work.riskLevel || 'signal'} band) based on the rule-based signals recorded against it. This is a monitoring indicator requiring review -- it is not a finding of fraud, guilt, or any legal determination.`
    : `This work currently carries no elevated monitoring signal (risk score ${riskScore}/100) based on the rule-based signals recorded against it.`;

  const supportingSignals = [];
  (work.anomalyReasons || []).forEach((r) => supportingSignals.push(r));
  if (paymentStage) {
    const pct = Math.round(paymentPct(work) || 0);
    supportingSignals.push(`Payment released (${pct}% of sanctioned amount) while the work is still recorded at the "${work.workStage}" stage, ahead of Physical Inspection.`);
  }
  if (evidenceGap) {
    supportingSignals.push('Work is recorded as Work Completed with no photographic evidence on file.');
  }
  if (costRatio != null && costRatio >= 1.5) {
    supportingSignals.push(`Sanctioned amount is ${costRatio.toFixed(2)}x the peer median cost recorded for this category/district.`);
  }
  if (work.agencyShareInDistrict === '100.0%') {
    supportingSignals.push('Implementing agency holds a 100% local share among comparable works on file (potential vendor/agency concentration).');
  }
  if (supportingSignals.length === 0) {
    supportingSignals.push('No rule-based signals are currently recorded against this work.');
  }

  const suggestedFollowup = [];
  if (paymentStage) suggestedFollowup.push('Request the District Authority confirm execution status before any further disbursement.');
  if (evidenceGap) suggestedFollowup.push('Request photographic evidence of the completed work from the implementing agency.');
  if (costRatio != null && costRatio >= 1.5) suggestedFollowup.push('Request a cost justification for the sanctioned amount relative to comparable works.');
  if (suggestedFollowup.length === 0) suggestedFollowup.push('No specific follow-up is indicated at this time -- continue routine monitoring.');

  let evidence;
  if (work.photoEvidence === 'present') evidence = 'Photographic evidence is on file for this work.';
  else if (work.photoEvidence === 'absent') evidence = 'Photographic evidence is recorded as absent for this work.';
  else evidence = "Photographic evidence is not applicable at this work's current recorded stage.";

  return {
    finding,
    supportingSignals,
    supportingSignalsNote: (work.anomalyReasons || []).length > 0
      ? 'Signal text sourced verbatim from the eSAKSHI-derived record; any "statutory SLA" reference reflects the source dataset\'s own labeling, not an independently verified statutory deadline.'
      : null,
    suggestedFollowup,
    evidence,
    disclaimer: 'This is an AI-assisted monitoring explanation generated from real recorded signals to support human review. It does not confirm fraud, guilt, or any legal determination -- verify against source records before acting.',
    generatedAt: new Date().toISOString(),
  };
}
