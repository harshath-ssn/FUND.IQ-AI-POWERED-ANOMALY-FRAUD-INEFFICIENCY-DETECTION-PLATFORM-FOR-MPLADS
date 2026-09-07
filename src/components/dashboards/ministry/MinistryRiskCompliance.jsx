import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Network, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { formatINR } from '../../../utils/format';
import { DataTable, RiskBadge, EmptyState } from '../../ui';
import { BENFORDS_LAW_DATA } from '../../../data/benfordsLaw';
import { NATIONAL_COLLUSION_CLUSTERS } from '../../../data/collusionClusters';
import { buildConcentration, ConcentrationPanel } from '../shared/agencyConcentration';

const LEVEL_KEYS = {
  high: 'district.agencyIntel.highConcentration',
  moderate: 'district.agencyIntel.moderateConcentration',
  distributed: 'district.agencyIntel.distributed',
  single: 'district.agencyIntel.singleEntity',
};

// Risk, Compliance & Escalation (Session E, E8-E10). Legacy sensational
// naming replaced throughout: "National Audit Target Works" ->
// "National Priority Works", collusion "syndicates" -> "Priority
// Monitoring Signals", framed as statistical patterns requiring review,
// never a fraud confirmation or invented enforcement power.
export default function MinistryRiskCompliance({ works, onSelectWork, selectedState, selectedDistrict, selectedAgency }) {
  const { t } = useTranslation();
  const [showBenfordDetails, setShowBenfordDetails] = useState(false);

  const priorityWorks = useMemo(
    () => [...works].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 100),
    [works]
  );

  const relevantSignals = useMemo(() => {
    const matching = NATIONAL_COLLUSION_CLUSTERS.filter((c) => {
      if (selectedAgency !== 'ALL' && c.agencyId !== selectedAgency) return false;
      if (selectedDistrict !== 'ALL' && c.district && c.district !== selectedDistrict) return false;
      if (selectedState !== 'ALL' && c.state && c.state !== selectedState) return false;
      return true;
    });
    return matching.length > 0 ? matching : NATIONAL_COLLUSION_CLUSTERS;
  }, [selectedAgency, selectedDistrict, selectedState]);

  const vendorRows = useMemo(() => buildConcentration(works, (w) => w.vendorName && w.vendorName.trim()), [works]);
  const agencyRows = useMemo(() => buildConcentration(works, (w) => w.agency || w.implementingAgency), [works]);
  const labels = {
    works: t('district.agencyIntel.worksCount'),
    sanctioned: t('district.agencyIntel.sanctionedTotal'),
    share: t('district.agencyIntel.shareOfDistrict'),
  };

  const worstBenfordDigit = BENFORDS_LAW_DATA.reduce(
    (worst, row) => (row.observedPct - row.expectedPct) > (worst.observedPct - worst.expectedPct) ? row : worst,
    BENFORDS_LAW_DATA[0] || { digit: '-', observedPct: 0, expectedPct: 0, status: 'NORMAL_RANGE' }
  );

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
    { key: 'district', header: t('table.district') },
    { key: 'sanctionedAmount', header: t('table.sanctioned'), align: 'right', render: (w) => <span className="font-mono font-bold">{formatINR(w.sanctionedAmount)}</span> },
    { key: 'riskScore', header: t('table.risk'), render: (w) => <RiskBadge score={w.riskScore} size="sm" /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('ministry.risk.title')}</h2>
        <p className="text-sm text-slate-600 max-w-3xl mt-1">{t('ministry.risk.subtitle')}</p>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{t('ministry.risk.agencyIntelTitle')}</h3>
        <p className="text-sm text-slate-500 mb-3">{t('ministry.risk.agencyIntelSubtitle')}</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ConcentrationPanel title={t('district.agencyIntel.vendorConcentration')} icon={Network} rows={vendorRows} emptyMessage={t('district.agencyIntel.noVendorData')} t={t} i18nKeys={LEVEL_KEYS} labels={labels} />
          <ConcentrationPanel title={t('district.agencyIntel.agencyConcentration')} icon={Network} rows={agencyRows} emptyMessage={t('district.agencyIntel.noAgencyData')} t={t} i18nKeys={LEVEL_KEYS} labels={labels} />
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert size={18} className="text-red-700" />
          {t('ministry.risk.priorityMonitoring')} ({relevantSignals.length})
        </h3>
        {relevantSignals.length === 0 ? (
          <EmptyState message={t('empty.noAlerts')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {relevantSignals.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-200 text-slate-800">{c.id}</span>
                  <RiskBadge score={c.riskScore} size="sm" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h4>
                <p className="text-xs text-slate-600">{t('district.agencyIntel.agencyConcentration')}: <strong className="text-slate-900">{c.entity}</strong></p>
                <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-red-700">{c.impactAmount}</span>
                  <span className="text-slate-500 italic truncate max-w-[45%]" title={c.action}>{c.action}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-slate-900">{t('ministry.risk.priorityWorks')} ({priorityWorks.length})</h3>
        <DataTable columns={workColumns} data={priorityWorks} onRowClick={(w) => onSelectWork(w.id)} searchable searchKeys={['id', 'title', 'district']} pageSize={10} />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {t('ministry.risk.benfordTitle')}
              <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${worstBenfordDigit.status === 'SUSPICIOUS_SPIKE' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {worstBenfordDigit.status === 'SUSPICIOUS_SPIKE'
                  ? t('ministry.risk.benfordSpike', { digit: worstBenfordDigit.digit, delta: (worstBenfordDigit.observedPct - worstBenfordDigit.expectedPct).toFixed(1) })
                  : t('ministry.risk.benfordNoDeviation')}
              </span>
            </h3>
            <p className="text-sm text-slate-500 max-w-2xl">{t('ministry.risk.benfordSubtitle')}</p>
          </div>
          <button type="button" onClick={() => setShowBenfordDetails((v) => !v)} className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
            {showBenfordDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={BENFORDS_LAW_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="digit" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} unit="%" />
              <Tooltip formatter={(val, name) => [`${val}%`, name === 'observedPct' ? 'Observed' : 'Expected']} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="observedPct" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Observed %" />
              <Line type="monotone" dataKey="expectedPct" stroke="#059669" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2.5 }} name="Expected (Benford)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {showBenfordDetails && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto text-sm">
            <table className="w-full text-left">
              <thead className="text-slate-500 font-semibold border-b border-slate-200">
                <tr><th className="pb-1">{t('ministry.risk.digitLabel')}</th><th className="pb-1">{t('ministry.risk.observedLabel')}</th><th className="pb-1">{t('ministry.risk.expectedLabel')}</th><th className="pb-1">{t('ministry.risk.diagnosticLabel')}</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {BENFORDS_LAW_DATA.map((row) => (
                  <tr key={row.digit}>
                    <td className="py-1 font-mono font-bold">{row.digit}</td>
                    <td className="py-1">{row.observedPct}%</td>
                    <td className="py-1 text-slate-600">{row.expectedPct}%</td>
                    <td className="py-1"><span className={`px-2 py-0.5 rounded text-xs font-bold ${row.status === 'SUSPICIOUS_SPIKE' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
