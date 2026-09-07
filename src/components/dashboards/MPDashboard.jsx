import React, { useCallback, useMemo, useState } from 'react';
import {
  LayoutDashboard, ListChecks, ShieldAlert, IndianRupee, ClipboardCheck,
  MapPin, BarChart3, FileText, User, UserCheck, LogOut, Volume2, VolumeX,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { isSoundMuted, setSoundMuted } from '../../utils/sound';
import { Breadcrumb } from '../ui';
import MPOverview from './mp/MPOverview';
import MPWorks from './mp/MPWorks';
import MPRiskAlerts from './mp/MPRiskAlerts';
import MPFundUtilisation from './mp/MPFundUtilisation';
import MPCompliance from './mp/MPCompliance';
import MPConstituencyMap from './mp/MPConstituencyMap';
import MPInsights from './mp/MPInsights';
import MPReports from './mp/MPReports';

const SECTIONS = [
  { key: 'overview', labelKey: 'mp.sidebar.overview', icon: LayoutDashboard },
  { key: 'works', labelKey: 'mp.sidebar.myWorks', icon: ListChecks },
  { key: 'risk', labelKey: 'mp.sidebar.riskAlerts', icon: ShieldAlert },
  { key: 'fund', labelKey: 'mp.sidebar.fundUtilisation', icon: IndianRupee },
  { key: 'compliance', labelKey: 'mp.sidebar.compliance', icon: ClipboardCheck },
  { key: 'map', labelKey: 'mp.sidebar.constituencyMap', icon: MapPin },
  { key: 'insights', labelKey: 'mp.sidebar.insights', icon: BarChart3 },
  { key: 'reports', labelKey: 'mp.sidebar.reports', icon: FileText },
];

// MP Workspace container (Session B). One member of Parliament, scoped to
// their own constituency only -- `works` arrives from App.jsx already
// fetched per-constituency via fetchWorksByConstituency (worksLoader.js), so
// no national/district-wide/other-MP data ever reaches this tree.
export default function MPDashboard({
  mpProfiles = [],
  works = [],
  onSelectWork,
  scopedMpId = null,
  onLogout,
  currentUser,
}) {
  const { t, language, setLanguage, languages } = useTranslation();
  const [muted, setMuted] = useState(() => isSoundMuted());
  const [activeSection, setActiveSection] = useState('overview');
  const [presetFilter, setPresetFilter] = useState(null);
  const [presetNonce, setPresetNonce] = useState(0);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setSoundMuted(next);
  };

  const navigateTo = useCallback((section, filter = null) => {
    setActiveSection(section);
    if (filter) {
      setPresetFilter(filter);
      setPresetNonce((n) => n + 1);
    }
  }, []);

  const effectiveMpId = scopedMpId || currentUser?.mpId || currentUser?.id;
  const currentMp = useMemo(
    () => mpProfiles.find((m) => m.id === effectiveMpId) || mpProfiles[0] || {},
    [mpProfiles, effectiveMpId]
  );
  const currentMpId = currentMp?.id || effectiveMpId || 'MP0001';
  const constituencyName = currentMp?.constituency || currentMp?.district || currentUser?.district || '';
  const mpName = currentUser?.name || currentMp?.name || '—';

  // `works` is already scoped to this constituency by App.jsx's data-loading
  // layer; this filter is a defensive no-op safety net, not the primary
  // scoping mechanism (Part 2, Rule 2 -- MP must only see their own works).
  const mpWorks = useMemo(() => {
    const targetMpId = String(currentMpId || '').toLowerCase();
    const targetConstituency = String(constituencyName || '').toLowerCase();
    return (Array.isArray(works) ? works : []).filter((w) => {
      const wMpId = String(w.mpId || '').toLowerCase();
      const wConstituency = String(w.constituency || '').toLowerCase();
      if (targetMpId && wMpId === targetMpId) return true;
      if (targetConstituency && wConstituency === targetConstituency) return true;
      return !targetMpId && !targetConstituency;
    });
  }, [works, currentMpId, constituencyName]);

  const activeMeta = SECTIONS.find((s) => s.key === activeSection) || SECTIONS[0];

  return (
    <div className="w-full text-slate-900 font-sans space-y-4 pb-16">
      {/* HEADER / CONTEXT */}
      <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 flex">
          <div className="w-1/3 bg-[#FF9933]" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-[#138808]" />
        </div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center shrink-0 relative">
              <User size={26} />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white" title="Verified">
                <UserCheck size={10} />
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-950 text-amber-300">
                  {t('mp.header.house')}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {t('mp.header.workspaceLabel')}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-950 tracking-tight">{mpName}</h1>
              <p className="text-sm text-slate-600 font-medium flex items-center gap-1.5 flex-wrap">
                <MapPin size={15} className="text-indigo-900 shrink-0" />
                <span>{t('mp.header.constituency')}: <strong className="font-semibold text-slate-800">{constituencyName}</strong></span>
                {Array.isArray(currentMp.districts) && currentMp.districts.length > 0 && (
                  <span className="text-slate-400">
                    &middot; {t('mp.header.nodalDistricts')}: {currentMp.districts.join(', ')}
                  </span>
                )}
              </p>
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
            <button
              type="button"
              onClick={toggleMute}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              title={muted ? t('login.unmuteSound') : t('login.muteSound')}
            >
              {muted ? <VolumeX size={16} className="text-rose-500" /> : <Volume2 size={16} className="text-emerald-600" />}
            </button>
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

      <Breadcrumb
        items={[{ label: t(activeMeta.labelKey) }]}
        onNavigate={(idx) => { if (idx === 0) navigateTo('overview'); }}
        rootLabel={t('mp.header.workspaceLabel')}
      />

      <div className="flex flex-col lg:flex-row gap-4">
        {/* SIDEBAR */}
        <nav className="lg:w-60 shrink-0 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1" aria-label="MP workspace sections">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = section.key === activeSection;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => navigateTo(section.key)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-left shrink-0 lg:shrink transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-950 text-amber-400 shadow-sm font-semibold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium'
                }`}
              >
                <Icon size={16} className={active ? 'text-amber-400' : 'text-slate-400'} />
                <span className="whitespace-nowrap">{t(section.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* ACTIVE SECTION */}
        <div className="flex-1 min-w-0 rounded-2xl bg-transparent">
          {activeSection === 'overview' && (
            <MPOverview currentMp={currentMp} mpWorks={mpWorks} onSelectWork={onSelectWork} onNavigate={navigateTo} />
          )}
          {activeSection === 'works' && (
            <MPWorks mpWorks={mpWorks} onSelectWork={onSelectWork} presetFilter={presetFilter} presetNonce={presetNonce} />
          )}
          {activeSection === 'risk' && (
            <MPRiskAlerts mpWorks={mpWorks} onSelectWork={onSelectWork} presetFilter={presetFilter} presetNonce={presetNonce} />
          )}
          {activeSection === 'fund' && (
            <MPFundUtilisation currentMp={currentMp} mpWorks={mpWorks} onNavigateWorks={(filter) => navigateTo('works', filter)} />
          )}
          {activeSection === 'compliance' && (
            <MPCompliance currentMp={currentMp} mpWorks={mpWorks} />
          )}
          {activeSection === 'map' && (
            <MPConstituencyMap currentMp={currentMp} mpWorks={mpWorks} onSelectWork={onSelectWork} currentUser={currentUser} />
          )}
          {activeSection === 'insights' && (
            <MPInsights currentMp={currentMp} mpWorks={mpWorks} onSelectWork={onSelectWork} />
          )}
          {activeSection === 'reports' && (
            <MPReports currentMp={currentMp} mpWorks={mpWorks} />
          )}
        </div>
      </div>
    </div>
  );
}
