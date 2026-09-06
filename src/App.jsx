import React, { useState, useEffect } from 'react';
import AIAuditAssistant from './components/AIAuditAssistant';
import LoginPage from './components/LoginPage';
import FileExplorerBreadcrumb from './components/FileExplorerBreadcrumb';
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

export default function App() {
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

  const buildBreadcrumbs = () => {
    const crumbs = [];
    if (activeRole === 'ministry') {
      crumbs.push({ label: 'MoSPI National Sentinel', type: 'ministry' });
    }
    return crumbs;
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen w-screen bg-[#fcf9f2] text-slate-900 font-sans relative overflow-x-hidden flex flex-col selection:bg-amber-100 selection:text-indigo-950">
      {currentUser.role !== 'mp' && (
        <FileExplorerBreadcrumb
          user={currentUser}
          breadcrumbs={buildBreadcrumbs()}
          onBreadcrumbClick={() => setSelectedWorkId(null)}
          onLogout={handleLogout}
        />
      )}

      {worksLoading && (
        <div className="fixed top-2 right-4 z-50 px-3 py-1.5 rounded-full bg-indigo-950 text-white text-[11px] font-bold shadow-lg animate-pulse">
          Loading works data…
        </div>
      )}

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-6 overflow-y-auto space-y-6">
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
              onSelectWork={(id) => setSelectedWorkId(id)}
              scopedDistrict={currentUser.district && currentUser.district !== 'ALL' ? currentUser.district : activeDistrict}
              currentUser={currentUser}
              onLogout={handleLogout}
              pinnedWorkId={pinnedWorkId}
              onClearPinnedWork={() => setPinnedWorkId(null)}
              onSelectMp={(mpId) => {
                setActiveMpId(mpId);
                setActiveRole('mp');
              }}
            />
          )}

          {activeRole === 'state' && (
            <StateDashboard
              works={works}
              onSelectWork={(id) => setSelectedWorkId(id)}
              scopedState={activeState !== 'ALL' && activeState !== 'All India' ? activeState : (currentUser.state || 'All India')}
              onSelectDistrict={(dist) => {
                setActiveDistrict(dist);
                setActiveRole('district');
              }}
            />
          )}

          {activeRole === 'ministry' && (
            <MinistryDashboard
              works={works}
              onSelectWork={(id) => setSelectedWorkId(id)}
              onSelectState={(st) => {
                setActiveState(st);
                setActiveRole('state');
              }}
              activeState={activeState}
              setActiveState={setActiveState}
              activeDistrict={activeDistrict}
              setActiveDistrict={setActiveDistrict}
              activeMpId={activeMpId}
              setActiveMpId={setActiveMpId}
            />
          )}
        </ErrorBoundary>
      </main>

      {selectedWorkId && activeWork && (
        <WorkDetailModal
          work={activeWork}
          onClose={() => setSelectedWorkId(null)}
          onEscalateToDistrict={
            currentUser.role === 'mp'
              ? (work) => { handleEscalateToDistrict(work); setSelectedWorkId(null); }
              : undefined
          }
        />
      )}

      {activeRole !== 'mp' && activeRole !== 'district' && (
        <AIAuditAssistant currentUser={currentUser} />
      )}

      <DataCoveragePanel />
    </div>
  );
}