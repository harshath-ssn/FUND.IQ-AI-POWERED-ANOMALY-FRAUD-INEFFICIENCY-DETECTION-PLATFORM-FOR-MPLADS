import React, { useState, useMemo } from 'react';
import Hologram3DCard from '../Hologram3DCard';
import StateHeatmap from '../StateHeatmap';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line
} from 'recharts';
import { 
  Building, MapPin, AlertTriangle, Search, ArrowUpRight,
  CheckCircle2, ChevronDown, ChevronUp, Sparkles, TrendingUp
} from 'lucide-react';
import { DISTRICT_RISK_DATA } from '../../data/districtRisk';
import { STATE_SPENDING_TREND, SECTOR_DISTRIBUTION } from '../../data/nationalMetrics';

export default function StateDashboard({ 
  works = [], // <-- Default prop array instead of massive bundle import
  onSelectWork,
  scopedState = "All India",
  onSelectDistrict = null 
}) {
// ... The rest of the component remains exactly the same as provided previously
  const [selectedState, setSelectedState] = useState(scopedState || "All India");
  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [showSpendingTrend, setShowSpendingTrend] = useState(false);

  React.useEffect(() => {
    if (scopedState) {
      setSelectedState(scopedState);
    }
  }, [scopedState]);

  // Dynamically group districts by state to create national State Directory
  const dynamicStatesList = useMemo(() => {
    const stateMap = {};
    DISTRICT_RISK_DATA.forEach(d => {
      const st = d.state || "All India";
      if (!stateMap[st]) {
        stateMap[st] = {
          name: st,
          code: st.slice(0, 2).toUpperCase(),
          districtsCount: 0,
          totalWorks: 0,
          sanctionedTotal: 0,
          criticalFlags: 0,
          avgRiskSum: 0
        };
      }
      stateMap[st].districtsCount += 1;
      stateMap[st].totalWorks += (d.totalWorks || d.works || 0);
      stateMap[st].sanctionedTotal += (d.sanctionedAmount || 0);
      stateMap[st].criticalFlags += (d.flaggedWorks || d.flagged || 0);
      stateMap[st].avgRiskSum += (d.riskScore || d.risk || 0);
    });

    return Object.values(stateMap).map(s => {
      const avgScore = s.districtsCount ? Math.round(s.avgRiskSum / s.districtsCount) : 0;
      return {
        id: s.code,
        name: s.name,
        code: s.code,
        districtsCount: s.districtsCount,
        totalWorks: s.totalWorks,
        activeOutlay: `₹${(s.sanctionedTotal / 1e7).toFixed(1)} Cr`,
        criticalFlags: s.criticalFlags,
        status: avgScore >= 50 ? `High Risk Alert (${avgScore})` : `${100 - avgScore}% Compliance`,
        isHighRisk: avgScore >= 50
      };
    });
  }, []);

  const filteredStates = useMemo(() => {
    return dynamicStatesList.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [dynamicStatesList, searchQuery]);

  // Filter districts belonging to the selected state
  const stateDistricts = useMemo(() => {
    if (!selectedState || selectedState === "All India" || selectedState === "ALL") {
      return DISTRICT_RISK_DATA;
    }
    return DISTRICT_RISK_DATA.filter(d => d.state?.toLowerCase() === selectedState.toLowerCase());
  }, [selectedState]);

  // Filter works by active district
  const filteredWorks = useMemo(() => {
    let result = works;
    if (selectedState && selectedState !== "All India" && selectedState !== "ALL") {
      result = result.filter(w => w.state?.toLowerCase() === selectedState.toLowerCase());
    }
    if (districtFilter !== "ALL") {
      result = result.filter(w => w.district?.toLowerCase() === districtFilter.toLowerCase());
    }
    return result;
  }, [works, selectedState, districtFilter]);

  const totalHighRisk = useMemo(() => {
    return filteredWorks.filter(w => w.isNegative || (w.riskScore && w.riskScore >= 70)).length;
  }, [filteredWorks]);

  const totalOutlayCr = useMemo(() => {
    const sum = filteredWorks.reduce((acc, w) => acc + (w.sanctionedAmount || 0), 0);
    return (sum / 1e7).toFixed(2);
  }, [filteredWorks]);

  // -------------------------------------------------------------
  // STATE 1: SEARCH BAR & STATE DIRECTORY LANDING PAGE
  // -------------------------------------------------------------
  if (!selectedState || selectedState === "DIRECTORY") {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span>State Nodal Authority Command Deck</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Inter-District Risk Index & National State Directory
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Search and select a State Nodal Agency across all 36 States & UTs to inspect district allocations, inter-district risk disparities, and sector-wise distribution.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search State name (e.g. Maharashtra, Uttar Pradesh, Tamil Nadu)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStates.map((st) => (
            <div
              key={st.id + st.name}
              onClick={() => setSelectedState(st.name)}
              className="group cursor-pointer p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold text-lg">
                    {st.code}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                      {st.name}
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{st.districtsCount} Districts Monitored</span>
                      <span>•</span>
                      <span>{st.totalWorks} Projects</span>
                    </div>
                  </div>
                </div>

                {st.isHighRisk ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    {st.criticalFlags} Anomalies
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Compliant
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
                <div className="p-2 rounded-lg bg-slate-50">
                  <div className="text-[11px] text-slate-500 font-medium">Active Outlay</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{st.activeOutlay}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <div className="text-[11px] text-slate-500 font-medium">Risk Status</div>
                  <div className={`text-xs font-bold mt-0.5 truncate ${st.isHighRisk ? 'text-red-600' : 'text-emerald-700'}`}>
                    {st.status}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-700">Open Command Deck →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE COMMAND DECK VIEW
  // -------------------------------------------------------------
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. State Interactive Heatmap */}
      <div className="w-full">
        <StateHeatmap
          stateName={selectedState}
          selectedDistrict={districtFilter === "ALL" ? null : districtFilter}
          onSelectDistrict={(dist) => {
            setDistrictFilter(dist);
            if (onSelectDistrict) onSelectDistrict(dist);
          }}
        />
      </div>

      {/* 2. Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Hologram3DCard className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>State Sanctioned Outlay</span>
            <Building className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">₹{totalOutlayCr} Cr</p>
          <div className="text-[10px] text-emerald-600 font-medium truncate">
            {filteredWorks.length} audited works
          </div>
        </Hologram3DCard>

        <Hologram3DCard className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>Monitored Districts</span>
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{stateDistricts.length} Constituencies</p>
          <div className="text-[10px] text-slate-500 font-medium truncate">
            {selectedState} Jurisdiction
          </div>
        </Hologram3DCard>

        <Hologram3DCard className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>Critical Anomaly Flags</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <p className="text-xl font-bold text-red-600 mt-1">{totalHighRisk} Flags</p>
          <div className="text-[10px] text-red-600 font-semibold truncate">
            {totalHighRisk > 0 ? "ML Anomaly Alerts Active" : "100% Compliant"}
          </div>
        </Hologram3DCard>

        <Hologram3DCard className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>Primary Contractor Hub</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-sm font-bold text-slate-900 mt-1 truncate">State Infrastructure Div.</p>
          <div className="text-[10px] text-indigo-600 font-semibold truncate">
            Inter-agency verification on
          </div>
        </Hologram3DCard>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* District Risk Index Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Inter-District Risk Disparity Index</h3>
              <p className="text-xs text-slate-500">
                Average ML risk score calculated from works, payment lags, and vendor collusion in {selectedState}.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {stateDistricts.length} Districts Mapped
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateDistricts.slice(0, 15)}>
                <XAxis dataKey="district" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                  formatter={(val) => [`${val} / 100`, 'Average Risk Score']}
                />
                <Bar dataKey="riskScore" radius={[6, 6, 0, 0]}>
                  {stateDistricts.slice(0, 15).map((d, idx) => {
                    const score = d.riskScore || d.risk || 0;
                    return (
                      <Cell 
                        key={`cell-${idx}`} 
                        fill={score >= 70 ? '#dc2626' : score >= 40 ? '#f59e0b' : '#059669'} 
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              <span>Critical Risk (≥70)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Moderate Discrepancy (40–69)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span>Compliant (&lt;40)</span>
            </div>
          </div>
        </div>

        {/* Sector Allocation Donut Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sectoral Outlay Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution across sanctioned works.</p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SECTOR_DISTRIBUTION}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {SECTOR_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px' }}
                  formatter={(val) => [`${val}%`, 'Allocation']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {SECTOR_DISTRIBUTION.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-semibold text-slate-900">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DROPDOWN: MONTHLY FINANCIAL EXPENDITURE TREND */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowSpendingTrend(!showSpendingTrend)}
          className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                Monthly Expenditure vs Sanction Trajectory
              </div>
              <div className="text-xs text-slate-500">
                Click to {showSpendingTrend ? 'collapse' : 'view'} monthly release curves and anomaly occurrence milestones.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-700 px-2.5 py-1 rounded bg-blue-50 border border-blue-200">
              {showSpendingTrend ? 'Hide Trend' : 'Show Trend'}
            </span>
            {showSpendingTrend ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {showSpendingTrend && (
          <div className="p-6 border-t border-slate-200 space-y-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={STATE_SPENDING_TREND}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} unit="L" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px' }}
                    formatter={(val, name) => [`₹${val} Lakhs`, name === 'sanctioned' ? 'Sanctioned' : 'Expenditure']}
                  />
                  <Line type="monotone" dataKey="sanctioned" stroke="#6366f1" strokeWidth={2} name="Sanctioned Capital" />
                  <Line type="monotone" dataKey="expenditure" stroke="#059669" strokeWidth={2} name="Expended Capital" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Works Preview */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {selectedState} Works Roster ({filteredWorks.length} Items)
            </h4>
            <p className="text-[11px] text-slate-500">
              Active projects in {districtFilter === "ALL" ? "all constituencies" : districtFilter}. Click any project to open detailed forensics & enforcement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {filteredWorks.slice(0, 100).map((work) => (
            <div
              key={work.id}
              onClick={() => onSelectWork(work.id || work.work_id)}
              className={`cursor-pointer p-2.5 rounded-xl border transition-all duration-150 hover:shadow-xs flex flex-col justify-between ${
                work.isNegative 
                  ? 'bg-red-50/40 border-red-200 hover:border-red-400' 
                  : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-xs font-bold text-slate-800">{work.id}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    work.isNegative 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {work.riskScore}
                  </span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{work.title}</h5>
                <p className="text-[10px] text-slate-500 line-clamp-1">{work.district} • {work.implementingAgency}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] mt-2 pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-700">₹{(work.sanctionedAmount / 100000).toFixed(1)}L</span>
                <span className="text-blue-600 font-bold hover:underline flex items-center gap-0.5 text-[11px]">
                  Inspect →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}