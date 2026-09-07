import React, { useMemo, useState } from 'react';
import { Building2, MapPin, AlertTriangle, CheckCircle2, ArrowUpRight, Search, LayoutDashboard, ListChecks, IndianRupee, ShieldAlert, LogOut } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { DISTRICT_RISK_DATA } from '../../data/districtRisk';
import { formatINRAggregate } from '../../utils/format';
import { Breadcrumb, LoadingSkeleton, BackButton } from '../ui';
import StateOverview from './state/StateOverview';
import StateDistrictMonitoring from './state/StateDistrictMonitoring';
import StateFinancialPerformance from './state/StateFinancialPerformance';
import StateRiskCompliance from './state/StateRiskCompliance';

const TABS = [
  { key: 'overview', labelKey: 'state.tabs.overview', icon: LayoutDashboard },
  { key: 'districts', labelKey: 'state.tabs.districts', icon: ListChecks },
  { key: 'financial', labelKey: 'state.tabs.financial', icon: IndianRupee },
  { key: 'risk', labelKey: 'state.tabs.risk', icon: ShieldAlert },
];

// State Authority workspace (Session D). Exactly four major tabs (D1) --
// do not add a fifth. `works` arrives from App.jsx already fetched for
// every district in this state (fetchWorksByDistricts), so the filter
// below is a defensive no-op safety net, not the primary scoping mechanism.
export default function StateDashboard({
  works = [],
  worksLoading = false,
  onSelectWork,
  scopedState = "All India",
  onSelectDistrict = null,
  onNavigateBack = null,
  onLogout = null,
}) {
  const { t, language, setLanguage, languages } = useTranslation();
  const [selectedState, setSelectedState] = useState(scopedState || "All India");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingDistrict, setPendingDistrict] = useState(null);

  React.useEffect(() => {
    if (scopedState) setSelectedState(scopedState);
  }, [scopedState]);

  const dynamicStatesList = useMemo(() => {
    const stateMap = {};
    DISTRICT_RISK_DATA.forEach((d) => {
      const st = d.state || "All India";
      if (!stateMap[st]) {
        stateMap[st] = { name: st, code: st.slice(0, 2).toUpperCase(), districtsCount: 0, totalWorks: 0, sanctionedTotal: 0, criticalFlags: 0, avgRiskSum: 0 };
      }
      stateMap[st].districtsCount += 1;
      stateMap[st].totalWorks += (d.totalWorks || 0);
      stateMap[st].sanctionedTotal += (d.sanctionedAmount || 0);
      stateMap[st].criticalFlags += (d.flaggedWorks || 0);
      stateMap[st].avgRiskSum += (d.riskScore || 0);
    });
    return Object.values(stateMap).map((s) => {
      const avgScore = s.districtsCount ? Math.round(s.avgRiskSum / s.districtsCount) : 0;
      return { ...s, activeOutlay: formatINRAggregate(s.sanctionedTotal), isHighRisk: avgScore >= 50, avgScore };
    });
  }, []);

  const filteredStates = useMemo(
    () => dynamicStatesList.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [dynamicStatesList, searchQuery]
  );

  const stateDistricts = useMemo(() => {
    if (!selectedState || selectedState === "All India" || selectedState === "ALL") return DISTRICT_RISK_DATA;
    return DISTRICT_RISK_DATA.filter((d) => d.state?.toLowerCase() === selectedState.toLowerCase());
  }, [selectedState]);

  const stateWorks = useMemo(() => {
    if (!selectedState || selectedState === "All India" || selectedState === "ALL") return works;
    return works.filter((w) => (w.state || '').toLowerCase() === selectedState.toLowerCase());
  }, [works, selectedState]);

  const handleOpenDistrictAuthority = (districtName) => {
    if (onSelectDistrict) onSelectDistrict(districtName);
  };

  // -------------------------------------------------------------
  // STATE / UT DIRECTORY LANDING PAGE (used when no specific state is
  // resolved yet -- real State Authority logins always arrive scoped to a
  // specific state via App.jsx, so this mainly serves Ministry drill-down).
  // -------------------------------------------------------------
  if (!selectedState || selectedState === "DIRECTORY") {
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{t('state.header.title')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t('state.directory.title')}</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">{t('state.directory.subtitle')}</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('state.directory.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStates.map((st) => (
            <div
              key={st.name}
              onClick={() => setSelectedState(st.name)}
              className="group cursor-pointer p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-lg">{st.code}</div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                      {st.name}
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{st.districtsCount} {t('state.directory.districtsMonitored')}</span>
                      <span>&middot;</span>
                      <span>{st.totalWorks} {t('state.directory.projects')}</span>
                    </div>
                  </div>
                </div>
                {st.isHighRisk ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5" />{st.criticalFlags}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-sm font-bold text-blue-700">{t('state.directory.openWorkspace')} &rarr;</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE WORKSPACE -- exactly four tabs (D1)
  // -------------------------------------------------------------
  return (
    <div className="space-y-5">
      <BackButton onNavigateBack={onNavigateBack} />
      <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center font-bold">
              <Building2 size={22} />
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">{t('state.header.title')}</span>
              <h1 className="text-3xl font-bold text-slate-950 tracking-tight mt-1">{selectedState}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
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

      <Breadcrumb items={[{ label: t(TABS.find((s) => s.key === activeTab)?.labelKey) }]} rootLabel={t('state.header.workspaceLabel')} />

      <div className="flex flex-col lg:flex-row gap-4">
        <nav className="lg:w-64 shrink-0 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1" aria-label="State workspace sections">
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
          {worksLoading && stateWorks.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <LoadingSkeleton rows={6} />
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <StateOverview
                  stateName={selectedState}
                  stateWorks={stateWorks}
                  stateDistricts={stateDistricts}
                  onSelectDistrict={(dist) => { setPendingDistrict(dist); setActiveTab('districts'); }}
                />
              )}
              {activeTab === 'districts' && (
                <StateDistrictMonitoring
                  stateWorks={stateWorks}
                  stateDistricts={stateDistricts}
                  onSelectWork={onSelectWork}
                  onOpenDistrictAuthority={handleOpenDistrictAuthority}
                  initialDistrict={pendingDistrict}
                  onDistrictChange={setPendingDistrict}
                />
              )}
              {activeTab === 'financial' && (
                <StateFinancialPerformance stateWorks={stateWorks} />
              )}
              {activeTab === 'risk' && (
                <StateRiskCompliance stateWorks={stateWorks} onSelectWork={onSelectWork} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
