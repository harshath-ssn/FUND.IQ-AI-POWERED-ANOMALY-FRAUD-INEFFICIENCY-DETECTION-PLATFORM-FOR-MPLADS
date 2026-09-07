import React, { useState, useMemo } from 'react';
import {
  ShieldAlert, Activity, Flame, Clock, CheckCircle2, LogOut,
  UserCheck, ShieldCheck, X, LayoutDashboard, ListChecks, Network, MapPin,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { formatINR } from '../../utils/format';
import { KpiCard, DataTable, RiskBadge, Breadcrumb, LoadingSkeleton, BackButton } from '../ui';
import FundMap from '../map/FundMap';
import DistrictActionCenter from './district/DistrictActionCenter';
import DistrictAgencyIntel from './district/DistrictAgencyIntel';
import DistrictWorkDossier from './district/DistrictWorkDossier';

const TABS = [
  { key: 'action', labelKey: 'district.sidebar.actionCenter', icon: LayoutDashboard },
  { key: 'works', labelKey: 'district.sidebar.worksRegister', icon: ListChecks },
  { key: 'agency', labelKey: 'district.sidebar.agencyIntel', icon: Network },
  { key: 'map', labelKey: 'district.sidebar.map', icon: MapPin },
];

// District Authority workspace (Session C). Reads real works already scoped
// to this district by App.jsx's data-loading layer; the filter below is a
// defensive no-op safety net, not the primary scoping mechanism.
export default function DistrictDashboard({
  works = [],
  worksLoading = false,
  onSelectWork,
  scopedDistrict = "Coimbatore",
  currentUser,
  onLogout,
  onSelectMp,
  pinnedWorkId = null,
  onClearPinnedWork,
  onNavigateBack = null,
}) {
  const { t, language, setLanguage, languages } = useTranslation();
  const [activeTab, setActiveTab] = useState('action');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [dossierWork, setDossierWork] = useState(null);

  const targetDistrict = (scopedDistrict || currentUser?.district || "Coimbatore").trim();
  const districtDignitary = currentUser?.name || `${t('district.header.title')}, ${targetDistrict}`;

  const worksPool = Array.isArray(works) ? works : [];

  const districtWorks = useMemo(() => {
    const targetLower = targetDistrict.toLowerCase().trim();
    return worksPool.filter((w) => {
      const wDist = (w.district || w.constituency || w.Constituency || "").toLowerCase().trim();
      return wDist && (wDist === targetLower || wDist.includes(targetLower) || targetLower.includes(wDist));
    });
  }, [worksPool, targetDistrict]);

  const flaggedWorks = useMemo(() => districtWorks.filter((w) => w.isNegative || w.riskScore >= 70), [districtWorks]);
  const stalledWorks = useMemo(
    () => districtWorks.filter((w) => (w.progressPct === null || w.progressPct < 50) && w.paymentReleased > 300000),
    [districtWorks]
  );
  const verifiedWorks = useMemo(() => districtWorks.filter((w) => !w.isNegative && w.riskScore < 70), [districtWorks]);

  const pinnedWork = pinnedWorkId ? districtWorks.find((w) => w.id === pinnedWorkId) : null;

  const openDossierById = (workId) => {
    const work = districtWorks.find((w) => w.id === workId);
    if (work) setDossierWork(work);
    else if (onSelectWork) onSelectWork(workId);
  };

  const filteredRegister = useMemo(() => {
    const base = riskFilter === 'FLAGGED'
      ? districtWorks.filter((w) => w.isNegative || w.riskScore >= 70)
      : districtWorks;
    if (!pinnedWorkId) return base;
    const pinned = base.filter((w) => w.id === pinnedWorkId);
    const rest = base.filter((w) => w.id !== pinnedWorkId);
    return [...pinned, ...rest];
  }, [districtWorks, riskFilter, pinnedWorkId]);

  const columns = [
    {
      key: 'id',
      header: t('table.workId'),
      render: (w) => (
        <div className="min-w-0">
          <span className="font-mono text-xs font-bold text-indigo-950 block">{w.id === pinnedWorkId ? '📌 ' : ''}{w.id}</span>
          <span className="text-sm font-semibold text-slate-900 line-clamp-1">{w.title}</span>
        </div>
      ),
    },
    { key: 'mpName', header: t('table.mp'), render: (w) => w.mpName ? (
      <button type="button" onClick={(e) => { e.stopPropagation(); if (onSelectMp) onSelectMp(w.mpId); }} className="text-indigo-700 font-semibold hover:underline cursor-pointer">
        {w.mpName}
      </button>
    ) : <span className="text-slate-400">—</span> },
    { key: 'agency', header: t('table.agency'), render: (w) => w.agency || 'Unassigned' },
    { key: 'sanctionedAmount', header: t('table.sanctioned'), align: 'right', render: (w) => <span className="font-mono font-bold">{formatINR(w.sanctionedAmount)}</span> },
    { key: 'riskScore', header: t('table.risk'), render: (w) => <RiskBadge score={w.riskScore} size="sm" /> },
  ];

  return (
    <div className="w-full text-slate-900 font-sans space-y-5 pb-16">
      <BackButton onNavigateBack={onNavigateBack} />
      {pinnedWork && (
        <div className="w-full rounded-2xl bg-amber-50 border-2 border-amber-400 shadow-sm p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Escalated by MP {pinnedWork.mpName}</p>
              <p className="text-sm font-bold text-slate-900">{pinnedWork.title} — risk {pinnedWork.riskScore}/100</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => setDossierWork(pinnedWork)} className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition cursor-pointer">
              {t('district.actionCenter.openDossier')}
            </button>
            <button type="button" onClick={() => onClearPinnedWork && onClearPinnedWork()} className="p-2 rounded-xl hover:bg-amber-100 text-amber-700 cursor-pointer">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="w-1/3 bg-[#FF9933]" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-[#138808]" />
        </div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center shrink-0 relative">
              <UserCheck size={26} />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white">
                <ShieldCheck size={10} />
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950 text-amber-300">
                  {targetDistrict}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {t('district.header.title')}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-950 tracking-tight">{districtDignitary}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    language === lang.code ? 'bg-indigo-950 text-amber-400' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-sm flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={15} className="text-rose-600" />
                {t('nav.logout')}
              </button>
            )}
          </div>
        </div>
      </div>

      <Breadcrumb items={[{ label: t(TABS.find((s) => s.key === activeTab)?.labelKey) }]} rootLabel={t('district.header.workspaceLabel')} />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label={t('district.kpi.totalWorks')} value={districtWorks.length} subtext={t('district.kpi.totalNote')} icon={Activity} />
        <KpiCard
          label={t('district.kpi.highRisk')}
          value={flaggedWorks.length}
          tone={flaggedWorks.length > 0 ? 'bad' : 'good'}
          subtext={flaggedWorks.length > 0 ? t('risk.requiresReview') : t('district.kpi.cleanNote')}
          icon={Flame}
        />
        <KpiCard label={t('district.kpi.stalled')} value={stalledWorks.length} tone={stalledWorks.length > 0 ? 'warn' : 'good'} subtext={t('district.kpi.stalledNote')} icon={Clock} />
        <KpiCard label={t('district.kpi.clean')} value={verifiedWorks.length} tone="good" subtext={t('district.kpi.cleanNote')} icon={CheckCircle2} />
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <nav className="lg:w-56 shrink-0 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1" aria-label="District workspace sections">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-left shrink-0 lg:shrink transition-colors cursor-pointer ${
                  active ? 'bg-indigo-950 text-amber-400 shadow-sm font-semibold' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                }`}
              >
                <Icon size={16} className={active ? 'text-amber-400' : 'text-slate-400'} />
                <span className="whitespace-nowrap">{t(tab.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0">
          {worksLoading && districtWorks.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <LoadingSkeleton rows={6} />
            </div>
          ) : (
            <>
          {activeTab === 'action' && (
            <DistrictActionCenter districtWorks={districtWorks} onOpenDossier={setDossierWork} onSelectWork={openDossierById} targetDistrict={targetDistrict} />
          )}

          {activeTab === 'works' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
                  {t('district.sidebar.worksRegister')} ({filteredRegister.length})
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRiskFilter('ALL')}
                    className={`px-3 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${riskFilter === 'ALL' ? 'bg-indigo-950 text-amber-400' : 'bg-white text-slate-700 border border-slate-300'}`}
                  >
                    {t('filters.all')} ({districtWorks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskFilter('FLAGGED')}
                    className={`px-3 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${riskFilter === 'FLAGGED' ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}
                  >
                    {t('kpi.flagged')} ({flaggedWorks.length})
                  </button>
                </div>
              </div>

              <DataTable
                columns={columns}
                data={filteredRegister}
                onRowClick={(w) => setDossierWork(w)}
                searchable
                searchKeys={['id', 'title', 'agency', 'vendorName']}
                pageSize={12}
                emptyMessage={t('empty.noWorks')}
              />
            </div>
          )}

          {activeTab === 'agency' && (
            <DistrictAgencyIntel districtWorks={districtWorks} />
          )}

          {activeTab === 'map' && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('district.sidebar.map')}</h2>
              <FundMap level="district" districtName={targetDistrict} works={districtWorks} onSelectWork={openDossierById} />
            </div>
          )}
            </>
          )}
        </div>
      </div>

      <DistrictWorkDossier
        work={dossierWork}
        open={!!dossierWork}
        onClose={() => setDossierWork(null)}
        onOpenFullRecord={(id) => { setDossierWork(null); if (onSelectWork) onSelectWork(id); }}
        onSelectMp={onSelectMp}
      />
    </div>
  );
}
