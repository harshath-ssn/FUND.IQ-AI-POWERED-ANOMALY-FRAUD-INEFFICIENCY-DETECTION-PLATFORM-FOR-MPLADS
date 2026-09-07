import React, { useMemo, useState } from 'react';
import { Landmark, MapPin, IndianRupee, ShieldAlert, LogOut } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { Breadcrumb, LoadingSkeleton } from '../ui';
import { MP_PROFILES } from '../../data/mpMaster';
import { AGENCIES } from '../../data/nationalMetrics';
import MinistryNationalOverview from './ministry/MinistryNationalOverview';
import MinistryMpMonitoring from './ministry/MinistryMpMonitoring';
import MinistryFinancialPerformance from './ministry/MinistryFinancialPerformance';
import MinistryRiskCompliance from './ministry/MinistryRiskCompliance';

const TABS = [
  { key: 'national', labelKey: 'ministry.tabs.national', icon: Landmark },
  { key: 'mp', labelKey: 'ministry.tabs.mp', icon: MapPin },
  { key: 'financial', labelKey: 'ministry.tabs.financial', icon: IndianRupee },
  { key: 'risk', labelKey: 'ministry.tabs.risk', icon: ShieldAlert },
];

// Ministry / MoSPI workspace (Session E). Exactly four major tabs (E1) --
// do not add a fifth. `works` is whatever App.jsx's data-loading layer has
// resolved for the current scope: the full real dataset for a specific
// state/district filter, or a top-risk national sample when no filter is
// active (fetchTopRiskNationalSample) -- national headline totals therefore
// come from the real, complete AGENCIES aggregate, not from `works`.
export default function MinistryDashboard({
  works = [],
  worksLoading = false,
  onSelectWork,
  onSelectState = null,
  activeState = "ALL",
  setActiveState = null,
  activeDistrict = "ALL",
  setActiveDistrict = null,
  activeMpId = "ALL",
  setActiveMpId = null,
  onLogout = null,
}) {
  const { t, language, setLanguage, languages } = useTranslation();
  const normalizeState = (s) => (!s || s === "All India" ? "ALL" : s);

  const [activeTab, setActiveTab] = useState('national');
  const [selectedState, setSelectedState] = useState(normalizeState(activeState));
  const [selectedDistrict, setSelectedDistrict] = useState(activeDistrict || "ALL");
  const [selectedMp, setSelectedMp] = useState(activeMpId || "ALL");
  const [selectedAgency, setSelectedAgency] = useState("ALL");

  React.useEffect(() => {
    const normalized = normalizeState(activeState);
    if (normalized !== selectedState) setSelectedState(normalized);
  }, [activeState]);
  React.useEffect(() => {
    if (activeDistrict && activeDistrict !== selectedDistrict) setSelectedDistrict(activeDistrict);
  }, [activeDistrict]);
  React.useEffect(() => {
    if (activeMpId && activeMpId !== selectedMp) setSelectedMp(activeMpId);
  }, [activeMpId]);

  const handleStateChange = (st) => {
    setSelectedState(st);
    setSelectedDistrict("ALL");
    setSelectedMp("ALL");
    if (setActiveState) setActiveState(st);
    if (setActiveDistrict) setActiveDistrict("ALL");
    if (setActiveMpId) setActiveMpId("ALL");
  };
  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    setSelectedMp("ALL");
    if (setActiveDistrict) setActiveDistrict(dist);
    if (setActiveMpId) setActiveMpId("ALL");
  };
  const handleMpChange = (mpId) => {
    setSelectedMp(mpId);
    if (setActiveMpId) setActiveMpId(mpId);
    if (mpId !== "ALL") {
      const mp = MP_PROFILES.find((m) => m.id === mpId);
      const mpDistrict = mp?.districts?.[0] || mp?.district;
      if (mpDistrict && selectedDistrict === "ALL") {
        setSelectedDistrict(mpDistrict);
        if (setActiveDistrict) setActiveDistrict(mpDistrict);
      }
    }
  };
  const handleResetFilters = () => {
    setSelectedState("ALL"); setSelectedDistrict("ALL"); setSelectedMp("ALL"); setSelectedAgency("ALL");
    if (setActiveState) setActiveState("ALL");
    if (setActiveDistrict) setActiveDistrict("ALL");
    if (setActiveMpId) setActiveMpId("ALL");
  };

  const filteredWorks = useMemo(() => works.filter((w) => {
    if (selectedState !== "ALL" && w.state && w.state !== selectedState) return false;
    if (selectedDistrict !== "ALL" && w.district !== selectedDistrict) return false;
    if (selectedMp !== "ALL" && w.mpId !== selectedMp) return false;
    if (selectedAgency !== "ALL") {
      const matchId = w.agencyId === selectedAgency;
      const matchName = w.implementingAgency && w.implementingAgency.toLowerCase().includes(selectedAgency.toLowerCase());
      if (!matchId && !matchName) return false;
    }
    return true;
  }), [works, selectedState, selectedDistrict, selectedMp, selectedAgency]);

  // Real, complete-dataset national aggregate (sum across every AGENCIES
  // record, which reconciles exactly with NATIONAL_METRICS.totalWorksSanctioned
  // / totalFlaggedWorksNational) -- independent of whatever sample `works`
  // currently holds, so National Overview and Financial & Work Performance
  // always agree (E11).
  const nationalTotals = useMemo(() => {
    const agencyVals = Object.values(AGENCIES);
    const sanctioned = agencyVals.reduce((s, a) => s + (a.totalSanctioned || 0), 0);
    const flagged = agencyVals.reduce((s, a) => s + (a.flaggedWorks || 0), 0);
    return { sanctionedCr: sanctioned / 1e7, expenditureCr: 2771.91, flagged };
  }, []);

  const scopeLabel = selectedState === 'ALL'
    ? t('ministry.mpMonitoring.allStates')
    : [selectedState, selectedDistrict !== 'ALL' ? selectedDistrict : null].filter(Boolean).join(' › ');

  const handleOpenStateWorkspace = (stateName) => {
    handleStateChange(stateName);
    if (onSelectState) onSelectState(stateName);
  };

  return (
    <div className="space-y-5">
      <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center font-bold">
              <Landmark size={22} />
            </div>
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">{t('ministry.header.title')}</span>
              <h1 className="text-3xl font-bold text-slate-950 tracking-tight mt-1">{t('ministry.header.workspaceLabel')}</h1>
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

      <Breadcrumb items={[{ label: t(TABS.find((s) => s.key === activeTab)?.labelKey) }]} rootLabel={t('ministry.header.workspaceLabel')} />

      <div className="flex flex-col lg:flex-row gap-4">
        <nav className="lg:w-64 shrink-0 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1" aria-label="Ministry workspace sections">
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
          {worksLoading && works.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-6">
              <LoadingSkeleton rows={6} />
            </div>
          ) : (
            <>
              {activeTab === 'national' && (
                <MinistryNationalOverview
                  nationalTotals={nationalTotals}
                  scopedWorksCount={filteredWorks.length}
                  onSelectState={handleOpenStateWorkspace}
                />
              )}
              {activeTab === 'mp' && (
                <MinistryMpMonitoring
                  works={works}
                  mpProfiles={MP_PROFILES}
                  onSelectWork={onSelectWork}
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  selectedMp={selectedMp}
                  selectedAgency={selectedAgency}
                  onStateChange={handleStateChange}
                  onDistrictChange={handleDistrictChange}
                  onMpChange={handleMpChange}
                  onAgencyChange={setSelectedAgency}
                  onResetFilters={handleResetFilters}
                />
              )}
              {activeTab === 'financial' && (
                <MinistryFinancialPerformance works={filteredWorks} nationalTotals={nationalTotals} scopeLabel={scopeLabel} />
              )}
              {activeTab === 'risk' && (
                <MinistryRiskCompliance
                  works={filteredWorks}
                  onSelectWork={onSelectWork}
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  selectedAgency={selectedAgency}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
