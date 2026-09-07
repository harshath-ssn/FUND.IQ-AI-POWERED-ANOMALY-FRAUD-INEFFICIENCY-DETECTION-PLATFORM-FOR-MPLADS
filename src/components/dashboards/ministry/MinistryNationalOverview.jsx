import React, { useMemo, useState } from 'react';
import { Landmark, MapPin, IndianRupee, ShieldAlert, ListChecks, ArrowUpRight } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { formatINRAggregate } from '../../../utils/format';
import { KpiCard, RiskBadge } from '../../ui';
import FundMap from '../../map/FundMap';
import { DISTRICT_RISK_DATA } from '../../../data/districtRisk';

// Current-dataset coverage, stated honestly (E2) -- never implied to be
// complete national MPLADS coverage. These five figures are the real,
// reconciling counts behind this platform's dataset (751 districts =
// DISTRICT_RISK_DATA.length, 79,082 works and 543 MPs = NATIONAL_METRICS,
// matching the sum across every real AGENCIES record).
const COVERAGE = { statesUts: '28 States + 8 UTs', districts: 751, constituencies: 536, mps: 543, works: 79082 };

// National Overview (Session E, E3/E4). The India map is the visual
// centrepiece (~65-70% width) with a selected-region detail panel
// (~30-35%) alongside it -- never a ranked list of MPs (E5).
export default function MinistryNationalOverview({ nationalTotals, scopedWorksCount, onSelectState }) {
  const { t } = useTranslation();
  const [selectedRegion, setSelectedRegion] = useState(null);

  const stateRiskMap = useMemo(() => {
    const map = {};
    const byState = {};
    DISTRICT_RISK_DATA.forEach((d) => {
      const st = d.state || 'Unknown';
      if (!byState[st]) byState[st] = { riskSum: 0, count: 0, totalWorks: 0, flagged: 0, sanctioned: 0 };
      byState[st].riskSum += d.riskScore || 0;
      byState[st].count += 1;
      byState[st].totalWorks += d.totalWorks || 0;
      byState[st].flagged += d.flaggedWorks || 0;
      byState[st].sanctioned += d.sanctionedAmount || 0;
    });
    Object.entries(byState).forEach(([st, v]) => {
      map[st] = { riskScore: Math.round(v.riskSum / v.count), totalWorks: v.totalWorks, flagged: v.flagged, sanctioned: v.sanctioned, districts: v.count };
    });
    return map;
  }, []);

  const regionStats = selectedRegion ? stateRiskMap[selectedRegion] : null;

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('ministry.national.title')}</h2>

      {/* Current Dataset Coverage -- honest framing, E2 */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Landmark size={18} className="text-indigo-800" />
          {t('ministry.coverage.title')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xl font-bold font-mono text-slate-900">{COVERAGE.statesUts}</p>
            <p className="text-xs text-slate-500">{t('ministry.coverage.statesUts')}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xl font-bold font-mono text-slate-900">{COVERAGE.districts}</p>
            <p className="text-xs text-slate-500">{t('ministry.coverage.districts')}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xl font-bold font-mono text-slate-900">{COVERAGE.constituencies}</p>
            <p className="text-xs text-slate-500">{t('ministry.coverage.constituencies')}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xl font-bold font-mono text-slate-900">{COVERAGE.mps}</p>
            <p className="text-xs text-slate-500">{t('ministry.coverage.mps')}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xl font-bold font-mono text-slate-900">{COVERAGE.works.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-500">{t('ministry.coverage.works')}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">{t('ministry.coverage.note')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t('ministry.national.sanctionedTotal')} value={formatINRAggregate(nationalTotals.sanctionedCr * 1e7)} icon={IndianRupee} />
        <KpiCard label={t('ministry.national.expenditureTotal')} value={formatINRAggregate(nationalTotals.expenditureCr * 1e7)} icon={IndianRupee} />
        <KpiCard label={t('ministry.national.flaggedTotal')} value={nationalTotals.flagged.toLocaleString('en-IN')} tone="bad" icon={ShieldAlert} />
        <KpiCard label={t('ministry.national.monitoredInScope')} value={scopedWorksCount} icon={ListChecks} />
      </div>

      {/* Map centrepiece (~68%) + selected-region panel (~32%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <div className="lg:col-span-7 space-y-2">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin size={18} className="text-indigo-800" />
            {t('ministry.national.mapTitle')}
          </h3>
          <FundMap level="national" stateRisk={stateRiskMap} onSelectState={setSelectedRegion} height={560} />
        </div>

        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3 h-fit">
          <h3 className="text-lg font-bold text-slate-900">{t('ministry.national.selectedRegion')}</h3>
          {!selectedRegion ? (
            <p className="text-sm text-slate-400">{t('ministry.national.selectRegionPrompt')}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-950">{selectedRegion}</h4>
                {regionStats && <RiskBadge score={regionStats.riskScore} size="sm" />}
              </div>
              {regionStats && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">{t('state.overview.districtsCovered')}</span><strong>{regionStats.districts}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t('kpi.totalWorks')}</span><strong>{regionStats.totalWorks}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t('kpi.flagged')}</span><strong className="text-red-700">{regionStats.flagged}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t('table.sanctioned')}</span><strong>{formatINRAggregate(regionStats.sanctioned)}</strong></div>
                </div>
              )}
              <button
                type="button"
                onClick={() => onSelectState(selectedRegion)}
                className="w-full py-2.5 rounded-xl bg-indigo-950 text-amber-400 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-indigo-900 transition"
              >
                {t('ministry.national.openStateWorkspace')} <ArrowUpRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
