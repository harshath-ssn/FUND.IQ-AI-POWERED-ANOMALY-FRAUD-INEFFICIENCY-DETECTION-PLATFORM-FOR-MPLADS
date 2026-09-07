import React, { useMemo } from 'react';
import { useTranslation } from '../../../i18n';
import { formatINR } from '../../../utils/format';
import MPSectionHeader from './MPSectionHeader';
import MPFundPositionCard from './MPFundPositionCard';
import { computeFinancials, breakdownBy, stageDistribution } from './mpDerive';
import { LIFECYCLE_STAGES } from '../../ui/StageTracker';

function BreakdownList({ title, rows, maxAmount, onSelect, labelFor }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-2.5">
      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 py-3">No records available.</p>
      ) : (
        rows.slice(0, 8).map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={() => onSelect?.(row.key)}
            className="w-full text-left cursor-pointer hover:bg-slate-50 rounded-lg p-2 -m-1.5"
          >
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-semibold text-slate-800 truncate max-w-[60%]">{labelFor ? labelFor(row.key) : row.key}</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(row.sanctioned)}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-indigo-900 rounded-full" style={{ width: `${maxAmount > 0 ? (row.sanctioned / maxAmount) * 100 : 0}%` }} />
            </div>
            <div className="text-xs text-slate-400 mt-1">{row.count} works</div>
          </button>
        ))
      )}
    </div>
  );
}

export default function MPFundUtilisation({ currentMp, mpWorks, onNavigateWorks }) {
  const { t } = useTranslation();
  const financials = useMemo(() => computeFinancials(currentMp, mpWorks), [currentMp, mpWorks]);

  const byCategory = useMemo(() => breakdownBy(mpWorks, (w) => w.category), [mpWorks]);
  const byDistrict = useMemo(() => breakdownBy(mpWorks, (w) => w.district), [mpWorks]);
  const byAgency = useMemo(() => breakdownBy(mpWorks, (w) => w.implementingAgency), [mpWorks]);
  const byVendor = useMemo(() => breakdownBy(mpWorks, (w) => w.vendorName), [mpWorks]);
  const stageDist = useMemo(() => stageDistribution(mpWorks), [mpWorks]);
  const stageRows = stageDist.map((s) => ({ key: s.key, count: s.count, sanctioned: mpWorks.filter((w) => w.workStageIndex === LIFECYCLE_STAGES.indexOf(s.key)).reduce((sum, w) => sum + (Number(w.sanctionedAmount) || 0), 0) }));

  const paymentBreakdown = useMemo(() => {
    const groups = { Success: 0, 'In-Progress': 0, 'No Disbursement Recorded': 0 };
    const amounts = { Success: 0, 'In-Progress': 0, 'No Disbursement Recorded': 0 };
    mpWorks.forEach((w) => {
      const key = groups[w.paymentStatus] !== undefined ? w.paymentStatus : 'No Disbursement Recorded';
      groups[key] += 1;
      amounts[key] += Number(w.paymentReleased) || 0;
    });
    return { groups, amounts };
  }, [mpWorks]);

  const maxCategory = Math.max(1, ...byCategory.map((r) => r.sanctioned));
  const maxDistrict = Math.max(1, ...byDistrict.map((r) => r.sanctioned));
  const maxAgency = Math.max(1, ...byAgency.map((r) => r.sanctioned));
  const maxVendor = Math.max(1, ...byVendor.map((r) => r.sanctioned));
  const maxStage = Math.max(1, ...stageRows.map((r) => r.sanctioned));

  return (
    <div className="space-y-4">
      <MPSectionHeader title={t('mp.fund.title')} subtitle={t('mp.fund.chain')} />

      <MPFundPositionCard financials={financials} />

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-2.5">
        <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('table.status')}: {t('mp.fund.paymentReleased')}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(paymentBreakdown.groups).map(([status, count]) => (
            <button
              key={status}
              type="button"
              onClick={() => onNavigateWorks({ payment: status })}
              className="text-left p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <div className="text-xs font-semibold uppercase text-slate-400">{status}</div>
              <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">{count}</div>
              <div className="text-sm font-semibold text-blue-700 mt-0.5">{formatINR(paymentBreakdown.amounts[status])}</div>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 pt-1 leading-relaxed">
          "Success" and "In-Progress" are distinct disbursement states from eSAKSHI — an In-Progress payment is not counted as settled expenditure.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownList title={t('mp.fund.byCategory')} rows={byCategory} maxAmount={maxCategory} onSelect={(k) => onNavigateWorks({ category: k })} />
        <BreakdownList title={t('mp.fund.byDistrict')} rows={byDistrict} maxAmount={maxDistrict} />
        <BreakdownList title={t('mp.fund.byStage')} rows={stageRows} maxAmount={maxStage} labelFor={(k) => t(k)} onSelect={(k) => onNavigateWorks({ stageIndex: LIFECYCLE_STAGES.indexOf(k) })} />
        <BreakdownList title={t('mp.fund.byAgency')} rows={byAgency} maxAmount={maxAgency} onSelect={(k) => onNavigateWorks({ agency: k })} />
        <BreakdownList title={t('mp.fund.byVendor')} rows={byVendor} maxAmount={maxVendor} onSelect={(k) => onNavigateWorks({ vendor: k })} />
      </div>
    </div>
  );
}
