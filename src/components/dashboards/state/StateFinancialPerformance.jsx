import React, { useMemo } from 'react';
import { useTranslation } from '../../../i18n';
import { formatINRAggregate } from '../../../utils/format';
import { KpiCard, LIFECYCLE_STAGES } from '../../ui';
import { breakdownBy } from '../mp/mpDerive';

function BarRow({ label, count, amount, maxAmount, t }) {
  const pct = maxAmount > 0 ? Math.max(4, (amount / maxAmount) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800">{label}</span>
        <span className="text-slate-500">{count} {t('kpi.totalWorks')} &middot; <strong className="text-slate-900">{formatINRAggregate(amount)}</strong></span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-indigo-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// Financial & Work Performance (Session D, D4). Sanctioned / expenditure /
// payment / balance kept visually distinct; execution stage uses the real
// six-stage lifecycle (StageTracker's LIFECYCLE_STAGES), never a fabricated
// completion percentage or payment-as-completion conflation.
export default function StateFinancialPerformance({ stateWorks }) {
  const { t } = useTranslation();

  const totals = useMemo(() => {
    const sanctioned = stateWorks.reduce((s, w) => s + (Number(w.sanctionedAmount) || 0), 0);
    const paymentReleased = stateWorks.reduce((s, w) => s + (Number(w.paymentReleased) || 0), 0);
    return { sanctioned, paymentReleased, balance: Math.max(0, sanctioned - paymentReleased) };
  }, [stateWorks]);

  const stageRows = useMemo(() => LIFECYCLE_STAGES.map((key, idx) => {
    const works = stateWorks.filter((w) => w.workStageIndex === idx);
    return { key, count: works.length, sanctioned: works.reduce((s, w) => s + (Number(w.sanctionedAmount) || 0), 0) };
  }), [stateWorks]);

  const categoryRows = useMemo(() => breakdownBy(stateWorks, (w) => w.category), [stateWorks]);

  const evidence = useMemo(() => {
    const present = stateWorks.filter((w) => w.photoEvidence === 'present').length;
    const absent = stateWorks.filter((w) => w.photoEvidence === 'absent').length;
    const notApplicable = stateWorks.filter((w) => w.photoEvidence === 'not_applicable').length;
    return { present, absent, notApplicable };
  }, [stateWorks]);

  const maxStage = Math.max(1, ...stageRows.map((r) => r.sanctioned));
  const maxCategory = Math.max(1, ...categoryRows.map((r) => r.sanctioned));

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('state.financial.title')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label={t('state.financial.sanctioned')} value={formatINRAggregate(totals.sanctioned)} />
        <KpiCard label={t('state.financial.paymentReleased')} value={formatINRAggregate(totals.paymentReleased)} subtext={t('state.financial.paymentNote')} />
        <KpiCard label={t('state.financial.balance')} value={formatINRAggregate(totals.balance)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="text-lg font-bold text-slate-900">{t('state.financial.byStage')}</h3>
          <div className="space-y-3">
            {stageRows.map((row) => (
              <BarRow key={row.key} label={t(row.key)} count={row.count} amount={row.sanctioned} maxAmount={maxStage} t={t} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="text-lg font-bold text-slate-900">{t('state.financial.byCategory')}</h3>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {categoryRows.map((row) => (
              <BarRow key={row.key} label={row.key} count={row.count} amount={row.sanctioned} maxAmount={maxCategory} t={t} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-lg font-bold text-slate-900">{t('state.financial.evidenceAvailability')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <KpiCard label={t('district.dossier.present')} value={evidence.present} tone="good" />
          <KpiCard label={t('district.dossier.absent')} value={evidence.absent} tone={evidence.absent > 0 ? 'warn' : 'good'} />
          <KpiCard label={t('district.dossier.notApplicable')} value={evidence.notApplicable} />
        </div>
      </div>
    </div>
  );
}
