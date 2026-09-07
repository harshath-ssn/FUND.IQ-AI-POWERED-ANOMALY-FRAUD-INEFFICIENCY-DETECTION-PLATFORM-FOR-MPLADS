import React, { useMemo } from 'react';
import { IndianRupee, ListChecks, ShieldAlert, Camera, MapPinned } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { formatINRAggregate } from '../../../utils/format';
import { KpiCard } from '../../ui';
import FundMap from '../../map/FundMap';

// State Overview (Session D, D2). Real KPIs only, financial terminology
// kept distinct (sanctioned / expenditure / payment released / balance) --
// never implies payment % = completion %.
export default function StateOverview({ stateName, stateWorks, stateDistricts, onSelectDistrict }) {
  const { t } = useTranslation();

  const totals = useMemo(() => {
    const sanctioned = stateWorks.reduce((s, w) => s + (Number(w.sanctionedAmount) || 0), 0);
    const paymentReleased = stateWorks.reduce((s, w) => s + (Number(w.paymentReleased) || 0), 0);
    const flagged = stateWorks.filter((w) => w.isNegative || w.riskScore >= 70).length;
    const evidencePresent = stateWorks.filter((w) => w.photoEvidence === 'present').length;
    const evidenceApplicable = stateWorks.filter((w) => w.photoEvidence !== 'not_applicable').length;
    return {
      sanctioned,
      paymentReleased,
      balance: Math.max(0, sanctioned - paymentReleased),
      flagged,
      evidencePresent,
      evidenceApplicable,
    };
  }, [stateWorks]);

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('state.overview.title')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={t('state.overview.fundPosition')}
          value={formatINRAggregate(totals.sanctioned)}
          subtext={`${t('state.financial.paymentReleased')}: ${formatINRAggregate(totals.paymentReleased)}`}
          icon={IndianRupee}
        />
        <KpiCard
          label={t('state.overview.workPortfolio')}
          value={stateWorks.length}
          subtext={`${stateDistricts.length} ${t('state.overview.districtsCovered')}`}
          icon={ListChecks}
        />
        <KpiCard
          label={t('state.overview.riskSignals')}
          value={totals.flagged}
          tone={totals.flagged > 0 ? 'bad' : 'good'}
          subtext={t('risk.requiresReview')}
          icon={ShieldAlert}
        />
        <KpiCard
          label={t('state.overview.evidencePosition')}
          value={`${totals.evidencePresent} / ${totals.evidenceApplicable}`}
          subtext={t('state.overview.evidenceComplete')}
          icon={Camera}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MapPinned size={18} className="text-indigo-800" />
          {t('state.overview.mapTitle')}
        </h3>
        <FundMap level="state" stateName={stateName} onSelectDistrict={onSelectDistrict} />
      </div>
    </div>
  );
}
