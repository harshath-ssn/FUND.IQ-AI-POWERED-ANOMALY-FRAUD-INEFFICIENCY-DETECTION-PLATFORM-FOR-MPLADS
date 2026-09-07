import React, { useMemo } from 'react';
import { Building2, MapPin, User, Briefcase, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { formatINR } from '../../../utils/format';
import { DataTable, RiskBadge } from '../../ui';
import { DISTRICT_RISK_DATA } from '../../../data/districtRisk';
import { AGENCIES } from '../../../data/nationalMetrics';

// MP & Constituency Monitoring (Session E, E6). Operational monitoring with
// a real State -> District -> Constituency/MP -> Agency filter chain (no
// hardcoded state lookup) and no political MP ranking anywhere (E5/E6).
export default function MinistryMpMonitoring({
  works, mpProfiles, onSelectWork,
  selectedState, selectedDistrict, selectedMp, selectedAgency,
  onStateChange, onDistrictChange, onMpChange, onAgencyChange, onResetFilters,
}) {
  const { t } = useTranslation();

  const stateOptions = useMemo(() => [...new Set(DISTRICT_RISK_DATA.map((d) => d.state).filter(Boolean))].sort(), []);
  const districtOptions = useMemo(() => {
    const pool = selectedState === 'ALL' ? DISTRICT_RISK_DATA : DISTRICT_RISK_DATA.filter((d) => d.state === selectedState);
    return [...new Set(pool.map((d) => d.district))].sort();
  }, [selectedState]);
  const mpOptions = useMemo(() => mpProfiles.filter((mp) => {
    if (selectedState !== 'ALL' && mp.state !== selectedState) return false;
    if (selectedDistrict !== 'ALL' && !(mp.districts || [mp.district]).includes(selectedDistrict)) return false;
    return true;
  }), [mpProfiles, selectedState, selectedDistrict]);

  const filteredWorks = useMemo(() => works.filter((w) => {
    if (selectedState !== 'ALL' && w.state && w.state !== selectedState) return false;
    if (selectedDistrict !== 'ALL' && w.district !== selectedDistrict) return false;
    if (selectedMp !== 'ALL' && w.mpId !== selectedMp) return false;
    if (selectedAgency !== 'ALL') {
      const matchId = w.agencyId === selectedAgency;
      const matchName = w.implementingAgency && w.implementingAgency.toLowerCase().includes(selectedAgency.toLowerCase());
      if (!matchId && !matchName) return false;
    }
    return true;
  }), [works, selectedState, selectedDistrict, selectedMp, selectedAgency]);

  const hasActiveFilter = selectedState !== 'ALL' || selectedDistrict !== 'ALL' || selectedMp !== 'ALL' || selectedAgency !== 'ALL';

  const columns = [
    {
      key: 'id',
      header: t('table.workId'),
      render: (w) => (
        <div className="min-w-0">
          <span className="font-mono text-xs font-bold text-indigo-950 block">{w.id}</span>
          <span className="text-sm font-semibold text-slate-900 line-clamp-1">{w.title}</span>
        </div>
      ),
    },
    { key: 'mpName', header: t('table.mp'), render: (w) => <span>{w.mpName}</span> },
    { key: 'district', header: t('table.district') },
    { key: 'implementingAgency', header: t('table.agency'), render: (w) => <span className="line-clamp-1">{w.implementingAgency}</span> },
    { key: 'sanctionedAmount', header: t('table.sanctioned'), align: 'right', render: (w) => <span className="font-mono font-bold">{formatINR(w.sanctionedAmount)}</span> },
    { key: 'riskScore', header: t('table.risk'), render: (w) => <RiskBadge score={w.riskScore} size="sm" /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('ministry.mpMonitoring.title')}</h2>
        <p className="text-sm text-slate-600 mt-1">{t('ministry.mpMonitoring.subtitle')}</p>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-500">{t('ministry.mpMonitoring.scope')}: {filteredWorks.length} / {works.length}</span>
          {hasActiveFilter && (
            <button type="button" onClick={onResetFilters} className="flex items-center gap-1 text-sm font-bold text-rose-600 hover:underline cursor-pointer">
              <RotateCcw size={13} />{t('ministry.mpMonitoring.resetFilters')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1"><Building2 size={12} />{t('ministry.mpMonitoring.filterState')}</label>
            <select value={selectedState} onChange={(e) => onStateChange(e.target.value)} className="w-full text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="ALL">{t('ministry.mpMonitoring.allStates')}</option>
              {stateOptions.map((st) => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1"><MapPin size={12} />{t('ministry.mpMonitoring.filterDistrict')}</label>
            <select value={selectedDistrict} onChange={(e) => onDistrictChange(e.target.value)} className="w-full text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="ALL">{t('ministry.mpMonitoring.allDistricts')}</option>
              {districtOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1"><User size={12} />{t('ministry.mpMonitoring.filterMp')}</label>
            <select value={selectedMp} onChange={(e) => onMpChange(e.target.value)} className="w-full text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="ALL">{t('ministry.mpMonitoring.allMps')}</option>
              {mpOptions.map((mp) => <option key={mp.id} value={mp.id}>{mp.name} ({mp.constituency})</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1"><Briefcase size={12} />{t('ministry.mpMonitoring.filterAgency')}</label>
            <select value={selectedAgency} onChange={(e) => onAgencyChange(e.target.value)} className="w-full text-sm font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="ALL">{t('ministry.mpMonitoring.allAgencies')}</option>
              {Object.values(AGENCIES).slice(0, 300).map((ag) => (
                <option key={ag.id} value={ag.id}>{ag.name} ({ag.worksCount} works, {ag.flaggedWorks} flagged)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-900">{t('ministry.mpMonitoring.worksInScope')}</h3>
        <DataTable
          columns={columns}
          data={filteredWorks}
          onRowClick={(w) => onSelectWork(w.id)}
          searchable
          searchKeys={['id', 'title', 'mpName', 'district', 'implementingAgency']}
          pageSize={12}
        />
      </div>
    </div>
  );
}
