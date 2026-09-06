import React from 'react';
import { 
  ShieldCheck, UserCheck, Landmark, Building, MapPin, 
  Layers, AlertTriangle 
} from 'lucide-react';

export default function Header({ 
  activeRole, 
  setActiveRole, 
  houseFilter, 
  setHouseFilter, 
  flaggedCount = 4,
  currentUser = null,
  isRoleLocked = false
}) {
  const allRoles = [
    {
      id: "mp",
      title: "MP View",
      subtitle: "Constituency Funds",
      icon: UserCheck
    },
    {
      id: "district",
      title: "District Authority",
      subtitle: "DM / Collector Triage",
      icon: MapPin
    },
    {
      id: "state",
      title: "State Nodal View",
      subtitle: "Inter-District Index",
      icon: Building
    },
    {
      id: "ministry",
      title: "Ministry (MoSPI)",
      subtitle: "National Sentinel",
      icon: Landmark
    }
  ];

  // Filter accessible tabs based on authenticated role permissions
  const roles = allRoles.filter((r) => {
    if (!currentUser) return true;
    if (currentUser.role === 'mp') return r.id === 'mp';
    if (currentUser.role === 'district') return r.id === 'district' || r.id === 'mp';
    if (currentUser.role === 'state') return r.id === 'state' || r.id === 'district' || r.id === 'mp';
    return true; // Ministry has access to all
  });

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Government Scheme Bar */}
      <div className="bg-slate-900 text-slate-200 text-[11px] py-1 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span className="font-medium text-slate-300">
              Government of India • Ministry of Statistics & Programme Implementation (MoSPI)
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <span>eSAKSHI Unified Sentinel System • Secure Audit Node</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-blue-600 p-[2px] shadow-sm">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-indigo-700" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 m-0">
                    MPLADS <span className="text-indigo-700">AI SENTINEL</span>
                  </h1>
                </div>
                <p className="text-xs text-slate-500 m-0 font-medium">
                  DIID Data Engine • eSAKSHI Anomaly, Fraud & Inefficiency Platform
                </p>
              </div>
            </div>

            {/* Mobile Flagged Indicator */}
            <div className="md:hidden flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              {flaggedCount} Flags
            </div>
          </div>

          {/* 4 Role Selector Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 w-full md:w-auto overflow-x-auto justify-start sm:justify-center">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/80 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <span className="block leading-tight">{r.title}</span>
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {r.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Desktop Live Status Badges */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>eSAKSHI Synced</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{flaggedCount} Active Flags</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
