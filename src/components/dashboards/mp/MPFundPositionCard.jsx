import React, { useState } from 'react';
import { IndianRupee, Info } from 'lucide-react';
import { formatINR, formatINRAggregate } from '../../../utils/format';
import { useTranslation } from '../../../i18n';
import { MethodologyDrawer } from '../../ui';

// Shared "Entitlement -> Recommended -> Sanctioned -> Expenditure -> Balance"
// chain used both as the Overview KPI card and (expanded) in Fund
// Utilisation (Part 3, Rule 5 -- never a bare "Grant" KPI). "Recommended"
// has no field in the real per-MP/per-work data (data_quality.json only
// carries a national row count for it), so it is shown honestly as
// unavailable rather than invented.
export default function MPFundPositionCard({ financials, compact = false, onOpen }) {
  const { t } = useTranslation();
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const { entitlement, sanctioned, expenditure, balance, paymentReleasedTotal } = financials;

  const rows = [
    { label: t('mp.kpi.entitlement'), value: entitlement != null ? formatINRAggregate(entitlement) : t('mp.kpi.notAvailable') },
    { label: t('mp.kpi.recommended'), value: t('mp.kpi.notAvailable'), muted: true },
    { label: t('kpi.sanctioned'), value: sanctioned != null ? formatINRAggregate(sanctioned) : t('mp.kpi.notAvailable') },
    { label: t('kpi.expenditure'), value: expenditure != null ? formatINRAggregate(expenditure) : t('mp.kpi.notAvailable') },
    { label: t('mp.kpi.balance'), value: balance != null ? formatINRAggregate(balance) : t('mp.kpi.notAvailable') },
  ];

  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 ${onOpen ? 'cursor-pointer hover:border-indigo-300 transition-colors' : ''}`}
      onClick={onOpen}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={onOpen ? (e) => { if (e.key === 'Enter') onOpen(); } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">{t('mp.kpi.fundPosition')}</span>
        <div className="flex items-center gap-1.5">
          <IndianRupee className="w-4 h-4 text-slate-400" />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMethodologyOpen(true); }}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
            title={t('mp.kpi.viewMethodology')}
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-5'} gap-x-3 gap-y-2.5`}>
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400 truncate">{r.label}</div>
            <div className={`font-mono font-bold ${compact ? 'text-base' : 'text-lg'} truncate ${r.muted ? 'text-slate-400' : 'text-slate-950'}`}>{r.value}</div>
          </div>
        ))}
      </div>

      <div className="text-sm text-slate-500 font-medium pt-2.5 border-t border-slate-100">
        {t('mp.fund.paymentReleased')}: <span className="font-bold text-slate-700">{formatINR(paymentReleasedTotal)}</span>
        <span className="block text-xs text-slate-400 mt-1 leading-relaxed">{t('mp.fund.paymentNote')}</span>
      </div>

      <MethodologyDrawer
        open={methodologyOpen}
        onClose={() => setMethodologyOpen(false)}
        dataSource="Entitlement, Sanctioned and Expenditure come from the MP-level eSAKSHI rollup. Balance = Entitlement − Sanctioned. Payment Released is summed from each work's real paymentReleased field for this constituency."
        limitations={[
          '"Recommended" (pre-sanction stage) has no per-MP or per-work field in the exported dataset, so it is shown as unavailable rather than estimated.',
          'Payment Released is not the same figure as Expenditure -- a released payment can still relate to a work in an early execution stage.',
        ]}
      />
    </div>
  );
}
