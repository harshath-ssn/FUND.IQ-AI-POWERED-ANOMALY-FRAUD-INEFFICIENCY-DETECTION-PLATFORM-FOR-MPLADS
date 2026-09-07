import React, { useState, useEffect } from 'react';
import AIAuditAssistant from './components/AIAuditAssistant';
import LoginPage from './components/LoginPage';
import notextBackground from './assets/notextbackground.png';
import MPDashboard from './components/dashboards/MPDashboard';
import DistrictDashboard from './components/dashboards/DistrictDashboard';
import StateDashboard from './components/dashboards/StateDashboard';
import MinistryDashboard from './components/dashboards/MinistryDashboard';
import WorkDetailModal from './components/WorkDetailModal';
import DataCoveragePanel from './components/DataCoveragePanel';
import ErrorBoundary from './components/ErrorBoundary';
import { MP_PROFILES } from './data/mpMaster';
import { AUTH_USERS } from './data/authUsers';
import { DISTRICT_RISK_DATA } from './data/districtRisk';
import { fetchWorksByConstituency, fetchWorksByDistrict, fetchWorksByDistricts, fetchTopRiskNationalSample } from './services/worksLoader';
import { useTranslation } from './i18n';
import { useWorkflowStore } from './store/workflowStore';
import { useNavigation } from './store/navigationStore';
import { formatINRAggregate } from './utils/format';

export default function App() {
  const { t } = useTranslation();
  const workflow = useWorkflowStore();
  const { pushOrigin } = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRole, setActiveRole] = useState('district');
  const [works, setWorks] = useState([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [pinnedWorkId, setPinnedWorkId] = useState(null);

  const [activeDistrict, setActiveDistrict] = useState(AUTH_USERS[0]?.district || "ALL");
  const [activeState, setActiveState] = useState(AUTH_USERS[0]?.state || "All India");
  const [activeMpId, setActiveMpId] = useState(MP_PROFILES[0]?.id || "MP0001");

  // Real, full-coverage work data is fetched on demand per scope instead of
  // being statically bundled. Two independent real groupings of the same
  // records exist on disk (see sync_data.py/worksLoader.js): by parliamentary
  // constituency (MP dashboard, 1:1 with an MP) and by true district (parsed
  // from IDA -- District/State/Ministry dashboards, since one real district
  // can pool works from several constituencies/MPs).
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    async function load() {
      setWorksLoading(true);
      let result;
      if (activeRole === 'mp') {
        const targetConstituency = currentUser.constituency || currentUser.district || null;
        result = targetConstituency
          ? await fetchWorksByConstituency(targetConstituency)
          : await fetchTopRiskNationalSample();
      } else {
        const targetDistrict = currentUser.district && currentUser.district !== 'ALL'
          ? currentUser.district
          : (activeDistrict !== 'ALL' ? activeDistrict : null);

        if (targetDistrict) {
          result = await fetchWorksByDistrict(targetDistrict);
        } else if (activeState && activeState !== 'ALL' && activeState !== 'All India') {
          const districtsInState = DISTRICT_RISK_DATA
            .filter(d => d.state === activeState)
            .map(d => d.district);
          result = await fetchWorksByDistricts(districtsInState);
        } else {
          result = await fetchTopRiskNationalSample();
        }
      }
      if (!cancelled) {
        setWorks(result);
        setWorksLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [currentUser, activeRole, activeDistrict, activeState]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setActiveRole(user.role);

    const resolvedState = user.state && user.state !== 'ALL' ? user.state : 'All India';
    const resolvedDistrict = user.district && user.district !== 'ALL' && user.district !== 'Statewide' && user.district !== 'National HQ'
      ? user.district
      : 'ALL';

    if (user.role === 'mp') {
      setActiveMpId(user.mpId || user.id || MP_PROFILES[0]?.id || "MP0001");
      setActiveDistrict(user.district || user.constituency || "ALL");
      setActiveState(resolvedState);
    } else if (user.role === 'district') {
      setActiveDistrict(resolvedDistrict);
      setActiveState(resolvedState);
      setActiveMpId(user.id || "DIST0001");
    } else if (user.role === 'state') {
      setActiveState(resolvedState);
      setActiveDistrict("ALL");
      setActiveMpId("ALL");
    } else if (user.role === 'ministry') {
      setActiveState("All India");
      setActiveDistrict("ALL");
      setActiveMpId("ALL");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedWorkId(null);
  };

  const activeWork = works.find(w => (w.id || w.work_id) === selectedWorkId);

  // Origin-aware "Back" for cross-role drill-down (Ministry -> State,
  // State -> District). Only pushed when a higher role explores a lower
  // one from within the same session -- a user who logged in directly as
  // District/State never has anything on the stack, so BackButton renders
  // nothing for them (its own empty-stack check).
  const handleNavigateBack = (origin) => {
    if (origin === 'ministry') {
      setActiveRole('ministry');
      setActiveState('All India');
      setActiveDistrict('ALL');
      setActiveMpId('ALL');
    } else if (origin === 'state') {
      setActiveRole('state');
      setActiveDistrict('ALL');
      setActiveMpId('ALL');
    }
  };

  // MP -> District escalation: pin the flagged work at the top of the
  // District view and jump roles, simulating "MP flags something, District
  // gets notified."
  const handleEscalateToDistrict = (work) => {
    if (!work) return;
    setPinnedWorkId(work.id);
    setActiveDistrict(work.district || work.constituency || "ALL");
    setActiveState(work.state || activeState);
    setActiveRole('district');
  };

  // Grounding context for the assistant (Phase 5) -- a compact snapshot of
  // exactly what's already computed and visible, never a dump of every raw
  // record. The system instruction forbids the model from stating anything
  // outside this object.
  const buildAssistantContext = () => {
    const sanctionedTotal = works.reduce((s, w) => s + (Number(w.sanctionedAmount) || 0), 0);
    const paymentTotal = works.reduce((s, w) => s + (Number(w.paymentReleased) || 0), 0);
    const flagged = works.filter((w) => w.isNegative || w.riskScore >= 70);
    const evidenceGaps = works.filter((w) => w.photoEvidence === 'absent').length;

    const summarizeWork = (w) => ({
      id: w.id,
      title: w.title,
      district: w.district,
      constituency: w.constituency,
      mpName: w.mpName,
      agency: w.agency || w.implementingAgency,
      riskScore: w.riskScore,
      anomalyType: w.anomalyType,
      workStage: w.workStage,
      sanctionedAmount: w.sanctionedAmount,
      paymentReleased: w.paymentReleased,
      photoEvidence: w.photoEvidence,
    });

    return {
      role: currentUser?.role,
      userName: currentUser?.name,
      scope: {
        state: activeState !== 'ALL' ? activeState : null,
        district: activeDistrict !== 'ALL' ? activeDistrict : null,
        constituency: currentUser?.role === 'mp' ? (currentUser?.constituency || currentUser?.district) : null,
      },
      aggregates: {
        totalWorksInScope: works.length,
        sanctionedTotal: formatINRAggregate(sanctionedTotal),
        paymentReleasedTotal: formatINRAggregate(paymentTotal),
        flaggedWorksCount: flagged.length,
        evidenceGapCount: evidenceGaps,
      },
      topFlaggedWorks: flagged.slice(0, 5).map(summarizeWork),
      selectedWork: activeWork ? summarizeWork(activeWork) : null,
      // Scoped to workIds actually present in the current view -- the raw
      // workflow.getInboxCount(role) counts every open event nationally
      // routed to this role, which would misrepresent a district/state
      // scope as "your inbox" when almost none of it is this jurisdiction's.
      workflowInboxOpenCount: (() => {
        if (!currentUser?.role) return 0;
        const scopedIds = new Set(works.map((w) => w.id));
        return workflow.events.filter((e) => e.toRole === currentUser.role && e.status === 'Open' && scopedIds.has(e.workId)).length;
      })(),
    };
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen w-screen text-slate-900 font-sans relative overflow-x-hidden flex flex-col selection:bg-amber-100 selection:text-indigo-950">
      {worksLoading && (
        <div className="fixed top-2 right-4 z-50 px-3 py-1.5 rounded-full bg-indigo-950 text-white text-[11px] font-bold shadow-lg animate-pulse">
          Loading works data…
        </div>
      )}

      {/* `<main>` is the app-shell's one scrollable region (html/body are
          pinned to 100vh, overflow hidden -- see index.css). The backdrop
          image lives here (bg-fixed: painted relative to `<main>`'s own
          frame, so it stays still while the content inside scrolls past
          it) instead of a flat beige fill -- shown at close to full
          strength (light wash only, to keep body text readable) rather
          than faded down to near-invisibility. */}
      <main
        className="flex-1 w-full overflow-y-auto bg-fixed bg-cover bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.25)), url(${notextBackground})`,
          backgroundPosition: 'center bottom',
        }}
      >
        <div className="px-4 sm:px-6 lg:px-10 py-6 space-y-6">
        <ErrorBoundary>
          {activeRole === 'mp' && (
            <MPDashboard 
              mpProfiles={MP_PROFILES} 
              works={works} 
              onSelectWork={(id) => setSelectedWorkId(id)} 
              scopedMpId={currentUser.role === 'mp' ? (currentUser.mpId || currentUser.id) : activeMpId}
              onLogout={handleLogout}
              currentUser={currentUser}
            />
          )}

          {activeRole === 'district' && (
            <DistrictDashboard
              works={works}
              worksLoading={worksLoading}
              onSelectWork={(id) => setSelectedWorkId(id)}
              scopedDistrict={currentUser.district && currentUser.district !== 'ALL' ? currentUser.district : activeDistrict}
              currentUser={currentUser}
              onLogout={handleLogout}
              pinnedWorkId={pinnedWorkId}
              onClearPinnedWork={() => setPinnedWorkId(null)}
              onNavigateBack={handleNavigateBack}
              onSelectMp={(mpId) => {
                setActiveMpId(mpId);
                setActiveRole('mp');
              }}
            />
          )}

          {activeRole === 'state' && (
            <StateDashboard
              works={works}
              worksLoading={worksLoading}
              onSelectWork={(id) => setSelectedWorkId(id)}
              scopedState={activeState !== 'ALL' && activeState !== 'All India' ? activeState : (currentUser.state || 'All India')}
              onNavigateBack={handleNavigateBack}
              onLogout={handleLogout}
              onSelectDistrict={(dist) => {
                // Only a genuine drill-down (this session's role is above
                // 'district') gets a way back -- a District-role user
                // clicking a district row on their own map stays in
                // District, no origin to push.
                if (currentUser.role !== 'district') {
                  pushOrigin('state', activeState !== 'ALL' && activeState !== 'All India' ? activeState : t('state.header.title'));
                }
                setActiveDistrict(dist);
                setActiveRole('district');
              }}
            />
          )}

          {activeRole === 'ministry' && (
            <MinistryDashboard
              works={works}
              worksLoading={worksLoading}
              onSelectWork={(id) => setSelectedWorkId(id)}
              onSelectState={(st) => {
                if (currentUser.role !== 'state') {
                  pushOrigin('ministry', t('ministry.header.workspaceLabel'));
                }
                setActiveState(st);
                setActiveRole('state');
              }}
              activeState={activeState}
              setActiveState={setActiveState}
              activeDistrict={activeDistrict}
              setActiveDistrict={setActiveDistrict}
              activeMpId={activeMpId}
              setActiveMpId={setActiveMpId}
              onLogout={handleLogout}
            />
          )}
        </ErrorBoundary>
        </div>
      </main>

      {selectedWorkId && activeWork && (
        <WorkDetailModal
          work={activeWork}
          onClose={() => setSelectedWorkId(null)}
          currentUser={currentUser}
          onEscalateToDistrict={
            currentUser.role === 'mp'
              ? (work) => { handleEscalateToDistrict(work); setSelectedWorkId(null); }
              : undefined
          }
        />
      )}

      <AIAuditAssistant currentUser={currentUser} context={buildAssistantContext()} />

      <DataCoveragePanel />
    </div>
  );
}