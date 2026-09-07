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

// Financial & Work Performance (Session E, E7). National headline totals
// come from the authoritative full-dataset aggregate (nationalTotals, real
// sum across every AGENCIES record -- reconciles with the National
// Overview tab); the stage/category breakdowns operate on whatever scope
// is currently loaded (`works`), labeled honestly so it's never confused
// with the national ledger when scope is unfiltered.
export default function MinistryFinancialPerformance({ works, nationalTotals, scopeLabel }) {
  const { t } = useTranslation();

  const stageRows = useMemo(() => LIFECYCLE_STAGES.map((key, idx) => {
    const stageWorks = works.filter((w) => w.workStageIndex === idx);
    return { key, count: stageWorks.length, sanctioned: stageWorks.reduce((s, w) => s + (Number(w.sanctionedAmount) || 0), 0) };
  }), [works]);

  const categoryRows = useMemo(() => breakdownBy(works, (w) => w.category), [works]);

  const maxStage = Math.max(1, ...stageRows.map((r) => r.sanctioned));
  const maxCategory = Math.max(1, ...categoryRows.map((r) => r.sanctioned));

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('ministry.financial.title')}</h2>
      <p className="text-sm text-slate-500">{t('ministry.financial.note')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard label={t('ministry.financial.sanctioned')} value={formatINRAggregate(nationalTotals.sanctionedCr * 1e7)} subtext={t('ministry.national.sanctionedTotal')} />
        <KpiCard label={t('ministry.financial.expenditure')} value={formatINRAggregate(nationalTotals.expenditureCr * 1e7)} subtext={t('ministry.national.expenditureTotal')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">{t('ministry.financial.byStage')}</h3>
            <span className="text-xs font-semibold text-slate-400">{scopeLabel}</span>
          </div>
          <div className="space-y-3">
            {stageRows.map((row) => (
              <BarRow key={row.key} label={t(row.key)} count={row.count} amount={row.sanctioned} maxAmount={maxStage} t={t} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">{t('ministry.financial.byCategory')}</h3>
            <span className="text-xs font-semibold text-slate-400">{scopeLabel}</span>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {categoryRows.map((row) => (
              <BarRow key={row.key} label={row.key} count={row.count} amount={row.sanctioned} maxAmount={maxCategory} t={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
