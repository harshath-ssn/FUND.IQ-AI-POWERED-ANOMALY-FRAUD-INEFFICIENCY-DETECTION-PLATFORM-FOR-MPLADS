import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, ExternalLink, MapPin } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { formatINR, formatINRAggregate } from '../../../utils/format';
import { DataTable, RiskBadge, EmptyState } from '../../ui';

// District & Constituency Monitoring (Session D, D3). Real district data
// only; drills State -> District -> Constituency -> Work where the actual
// data relationships support it. A single-district state/UT gets an honest
// "District Risk Profile" instead of a fabricated inter-district disparity
// comparison (D3 explicit requirement).
export default function StateDistrictMonitoring({
  stateWorks, stateDistricts, onSelectWork, onOpenDistrictAuthority,
  initialDistrict = null, onDistrictChange,
}) {
  const { t } = useTranslation();
  const isSingleDistrict = stateDistricts.length <= 1;
  const [selectedDistrict, setSelectedDistrictState] = useState(
    initialDistrict || (isSingleDistrict ? (stateDistricts[0]?.district || null) : null)
  );

  const setSelectedDistrict = (name) => {
    setSelectedDistrictState(name);
    if (onDistrictChange) onDistrictChange(name);
  };

  useEffect(() => {
    if (isSingleDistrict) setSelectedDistrictState(stateDistricts[0]?.district || null);
  }, [isSingleDistrict, stateDistricts]);

  useEffect(() => {
    if (initialDistrict) setSelectedDistrictState(initialDistrict);
  }, [initialDistrict]);

  const districtColumns = [
    { key: 'district', header: t('state.districts.districtTable'), render: (d) => <span className="font-semibold text-slate-900">{d.district}</span> },
    { key: 'totalWorks', header: t('kpi.totalWorks'), align: 'right' },
    { key: 'flaggedWorks', header: t('kpi.flagged'), align: 'right', render: (d) => <span className={d.flaggedWorks > 0 ? 'text-red-700 font-bold' : 'text-slate-500'}>{d.flaggedWorks}</span> },
    { key: 'riskScore', header: t('table.risk'), render: (d) => <RiskBadge score={d.riskScore} size="sm" /> },
    { key: 'sanctionedAmount', header: t('table.sanctioned'), align: 'right', render: (d) => <span className="font-mono font-bold">{formatINRAggregate(d.sanctionedAmount)}</span> },
  ];

  const districtWorks = useMemo(
    () => (selectedDistrict ? stateWorks.filter((w) => (w.district || '').toLowerCase() === selectedDistrict.toLowerCase()) : []),
    [stateWorks, selectedDistrict]
  );

  const constituencyRows = useMemo(() => {
    const map = new Map();
    districtWorks.forEach((w) => {
      const key = w.constituency || 'Unspecified';
      if (!map.has(key)) map.set(key, { name: key, works: 0, sanctioned: 0, flagged: 0 });
      const row = map.get(key);
      row.works += 1;
      row.sanctioned += Number(w.sanctionedAmount) || 0;
      if (w.isNegative || w.riskScore >= 70) row.flagged += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.sanctioned - a.sanctioned);
  }, [districtWorks]);

  const workColumns = [
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
    { key: 'constituency', header: t('table.district') },
    { key: 'sanctionedAmount', header: t('table.sanctioned'), align: 'right', render: (w) => <span className="font-mono font-bold">{formatINR(w.sanctionedAmount)}</span> },
    { key: 'riskScore', header: t('table.risk'), render: (w) => <RiskBadge score={w.riskScore} size="sm" /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('state.districts.title')}</h2>
        <p className="text-sm text-slate-600 mt-1">{t('state.districts.subtitle')}</p>
      </div>

      {!selectedDistrict && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900">{t('state.districts.disparityTitle')}</h3>
          <p className="text-sm text-slate-500">{t('state.districts.disparitySubtitle')}</p>
          {stateDistricts.length === 0 ? (
            <EmptyState message={t('empty.noData')} />
          ) : (
            <DataTable
              columns={districtColumns}
              data={stateDistricts}
              onRowClick={(d) => setSelectedDistrict(d.district)}
              searchable
              searchKeys={['district']}
              pageSize={15}
            />
          )}
        </div>
      )}

      {selectedDistrict && (
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {!isSingleDistrict && (
                <button
                  type="button"
                  onClick={() => setSelectedDistrict(null)}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-indigo-800" />
                {isSingleDistrict ? t('state.districts.singleDistrictTitle') : selectedDistrict}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenDistrictAuthority(selectedDistrict)}
              className="px-3.5 py-2 rounded-xl bg-indigo-950 text-amber-400 text-sm font-bold flex items-center gap-1.5 cursor-pointer hover:bg-indigo-900 transition"
            >
              {t('state.districts.openAsDistrictAuthority')} <ExternalLink size={14} />
            </button>
          </div>

          {isSingleDistrict && (
            <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
              {t('state.districts.singleDistrictNote')}
            </p>
          )}

          <div className="space-y-2">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-800" />
              {t('state.districts.constituencyTable', { district: selectedDistrict })}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {constituencyRows.map((row) => (
                <div key={row.name} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                  <p className="text-sm font-bold text-slate-900 line-clamp-1">{row.name}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{row.works} {t('kpi.totalWorks')}</span>
                    <span className="font-mono font-semibold text-slate-800">{formatINRAggregate(row.sanctioned)}</span>
                  </div>
                  {row.flagged > 0 && <p className="text-xs text-red-700 font-semibold">{row.flagged} {t('risk.requiresReview')}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-slate-900">{t('state.districts.worksTable', { district: selectedDistrict })}</h4>
            <DataTable
              columns={workColumns}
              data={districtWorks}
              onRowClick={(w) => onSelectWork(w.id)}
              searchable
              searchKeys={['id', 'title', 'constituency']}
              pageSize={10}
            />
          </div>
        </div>
      )}
    </div>
  );
}
