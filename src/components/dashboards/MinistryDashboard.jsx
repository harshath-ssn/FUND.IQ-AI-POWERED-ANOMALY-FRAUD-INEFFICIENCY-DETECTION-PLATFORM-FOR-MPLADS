import React, { useState, useMemo } from 'react';
import Hologram3DCard from '../Hologram3DCard';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  ShieldCheck, FileSpreadsheet, AlertCircle, Database, Network,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Eye, Download,
  Sparkles, Landmark, ArrowUpRight, Scale, ShieldAlert, Filter, RotateCcw,
  Building2, MapPin, User, Briefcase
} from 'lucide-react';
import { BENFORDS_LAW_DATA } from '../../data/benfordsLaw';
import { NATIONAL_COLLUSION_CLUSTERS } from '../../data/collusionClusters';
import { NATIONAL_METRICS, AGENCIES } from '../../data/nationalMetrics';
import { MP_PROFILES } from '../../data/mpMaster';
import { DISTRICT_RISK_DATA } from '../../data/districtRisk';

export default function MinistryDashboard({
  works = [],
  onSelectWork,
  onSelectState = null,
  activeState = "ALL",
  setActiveState = null,
  activeDistrict = "ALL",
  setActiveDistrict = null,
  activeMpId = "ALL",
  setActiveMpId = null
}) {
  // App.jsx's shared state uses "All India" as its no-filter sentinel for
  // breadcrumbs/other dashboards, but this dashboard's own filter logic
  // uses "ALL" -- normalize on the way in so a ministry login (which starts
  // at activeState="All India") doesn't silently filter every work out.
  const normalizeState = (s) => (!s || s === "All India" ? "ALL" : s);

  // Dropdown filter selections
  const [selectedState, setSelectedState] = useState(normalizeState(activeState));
  const [selectedDistrict, setSelectedDistrict] = useState(activeDistrict || "ALL");
  const [selectedMp, setSelectedMp] = useState(activeMpId || "ALL");
  const [selectedAgency, setSelectedAgency] = useState("ALL");

  // Sync internal state when parent props change
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

  // Progressive disclosure dropdown states
  const [showCollusionSyndicates, setShowCollusionSyndicates] = useState(true);
  const [showBenfordDetails, setShowBenfordDetails] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Handle filter changes and notify parent for breadcrumb sync
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
      const mp = MP_PROFILES.find(m => m.id === mpId);
      if (mp) {
        // mp.districts holds the real true district(s) this MP's works fall
        // in (parsed from IDA) -- a constituency can span more than one, so
        // this picks the first as the representative default.
        const mpDistrict = mp.districts?.[0] || mp.district;
        if (mpDistrict && selectedDistrict === "ALL") {
          setSelectedDistrict(mpDistrict);
          if (setActiveDistrict) setActiveDistrict(mpDistrict);
        }
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedState("ALL");
    setSelectedDistrict("ALL");
    setSelectedMp("ALL");
    setSelectedAgency("ALL");
    if (setActiveState) setActiveState("ALL");
    if (setActiveDistrict) setActiveDistrict("ALL");
    if (setActiveMpId) setActiveMpId("ALL");
  };

  // Filter works by the chosen State, District, Constituency/MP, and Implementing Agency
  const filteredWorks = useMemo(() => {
    return works.filter((w) => {
      if (selectedState !== "ALL" && w.state && w.state !== selectedState) return false;
      if (selectedDistrict !== "ALL" && w.district !== selectedDistrict) return false;
      if (selectedMp !== "ALL" && w.mpId !== selectedMp) return false;
      if (selectedAgency !== "ALL") {
        const matchId = w.agencyId === selectedAgency;
        const matchName = w.implementingAgency && w.implementingAgency.toLowerCase().includes(selectedAgency.toLowerCase());
        if (!matchId && !matchName) return false;
      }
      return true;
    });
  }, [works, selectedState, selectedDistrict, selectedMp, selectedAgency]);

  // Dynamic statistics
  const totalSanctioned = filteredWorks.reduce((acc, w) => acc + (w.sanctionedAmount || w.cost || 0), 0);
  const totalDisbursed = filteredWorks.reduce((acc, w) => acc + (w.paymentReleased || 0), 0);
  const criticalWorks = filteredWorks.filter(w => w.isNegative || (w.riskScore && w.riskScore >= 70));
  const avgRisk = filteredWorks.length > 0 
    ? (filteredWorks.reduce((acc, w) => acc + (w.riskScore || 0), 0) / filteredWorks.length).toFixed(1)
    : 0;

  // Filter collusion clusters according to selected scope
  const relevantClusters = useMemo(() => {
    const matching = NATIONAL_COLLUSION_CLUSTERS.filter((c) => {
      if (selectedAgency !== "ALL" && c.agencyId !== selectedAgency) return false;
      if (selectedDistrict !== "ALL" && c.district && c.district !== selectedDistrict) return false;
      if (selectedState !== "ALL" && c.state && c.state !== selectedState) return false;
      return true;
    });
    return matching.length > 0 ? matching : NATIONAL_COLLUSION_CLUSTERS;
  }, [selectedAgency, selectedDistrict, selectedState]);

  // Benford's Law is only statistically meaningful over a large sample --
  // computing it live from whatever handful of works the current filter
  // leaves (sometimes a single district) produced a second chart that
  // routinely disagreed with the real national finding shown in the table
  // below it. There is exactly one Benford finding: the one computed from
  // all 79,082 real sanctioned works nationally (BENFORDS_LAW_DATA).
  const worstBenfordDigit = BENFORDS_LAW_DATA.reduce(
    (worst, row) => (row.observedPct - row.expectedPct) > (worst.observedPct - worst.expectedPct) ? row : worst,
    BENFORDS_LAW_DATA[0] || { digit: '-', observedPct: 0, expectedPct: 0, status: 'NORMAL_RANGE' }
  );

  // Real all-India state list, derived from the actual district dataset
  // (543 constituencies) instead of a hardcoded 4-state lookup.
  const stateOptions = useMemo(() => {
    return [...new Set(DISTRICT_RISK_DATA.map(d => d.state).filter(Boolean))].sort();
  }, []);

  // District options based on State -- real constituencies for the selected
  // state, not a hardcoded 4-state lookup that silently broke for the other
  // ~539 MPs in the real dataset.
  const districtOptions = useMemo(() => {
    const pool = selectedState === "ALL" ? DISTRICT_RISK_DATA : DISTRICT_RISK_DATA.filter(d => d.state === selectedState);
    return [...new Set(pool.map(d => d.district))].sort();
  }, [selectedState]);

  // MP options based on State and District
  const mpOptions = useMemo(() => {
    return MP_PROFILES.filter(mp => {
      if (selectedState !== "ALL" && mp.state !== selectedState) return false;
      // selectedDistrict is a real true district (DISTRICT_RISK_DATA is
      // grouped that way); an MP's works can span more than one, so match
      // against the full set rather than a single mp.district scalar.
      if (selectedDistrict !== "ALL" && !(mp.districts || [mp.district]).includes(selectedDistrict)) return false;
      return true;
    });
  }, [selectedState, selectedDistrict]);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* 1. National Apex Header Bar */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold shadow-xs">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>MoSPI Apex National Sentinel</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.2 rounded-full font-mono font-bold border border-indigo-200">
                All-India Surveillance
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Filter by State, District, Constituency, and Implementing Agency to inspect sanctions & collusion rings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Dossier</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Multi-Level Surveillance & Filter Control Center */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>Scope Surveillance Target:</span>
            <span className="text-[11px] font-normal text-slate-500">
              (Viewing {filteredWorks.length} of {works.length} total monitored works)
            </span>
          </div>

          {(selectedState !== "ALL" || selectedDistrict !== "ALL" || selectedMp !== "ALL" || selectedAgency !== "ALL") && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* State Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>State / UT</span>
            </label>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All States (Pan-India)</option>
              {stateOptions.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            {selectedState !== "ALL" && onSelectState && (
              <button
                type="button"
                onClick={() => onSelectState(selectedState)}
                className="text-[10px] font-bold text-indigo-700 hover:underline flex items-center gap-1"
              >
                Open {selectedState} Command Deck <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* District Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-600" />
              <span>District Jurisdiction</span>
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Districts in Scope</option>
              {districtOptions.map((dist) => {
                const risk = DISTRICT_RISK_DATA.find(d => d.district === dist)?.riskScore;
                return (
                  <option key={dist} value={dist}>
                    {dist}{risk != null ? ` (Risk ${risk})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Constituency / MP Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3 text-indigo-600" />
              <span>Parliamentary MP / Constituency</span>
            </label>
            <select
              value={selectedMp}
              onChange={(e) => handleMpChange(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All MPs & Constituencies</option>
              {mpOptions.map((mp) => (
                <option key={mp.id} value={mp.id}>
                  {mp.name} ({mp.constituency?.replace(" Constituency", "") || mp.district})
                </option>
              ))}
            </select>
          </div>

          {/* Implementing Agency Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-emerald-600" />
              <span>Implementing Agency / Vendor</span>
            </label>
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Implementing Agencies</option>
              {Object.values(AGENCIES).map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.id}: {ag.name} ({ag.type}, {ag.worksCount} works, {ag.flaggedWorks} flagged)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Active Scope Pill */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400">Current Scope:</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-semibold text-[11px]">
            {selectedState === "ALL" ? "All India" : selectedState}
          </span>
          <span className="text-slate-300">❯</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-semibold text-[11px]">
            {selectedDistrict === "ALL" ? "All Districts" : selectedDistrict}
          </span>
          <span className="text-slate-300">❯</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-semibold text-[11px]">
            {selectedMp === "ALL" ? "All MPs" : MP_PROFILES.find(m => m.id === selectedMp)?.name || selectedMp}
          </span>
          <span className="text-slate-300">❯</span>
          <span className={`px-2 py-0.5 rounded-md font-mono font-semibold text-[11px] ${
            selectedAgency === "AG005" ? "bg-red-100 text-red-800 border border-red-200" : "bg-slate-100 text-slate-800"
          }`}>
            {selectedAgency === "ALL" ? "All Agencies" : AGENCIES[selectedAgency]?.name || selectedAgency}
          </span>
        </div>
      </div>

      {/* 3. Dynamically Recalculated Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Hologram3DCard className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>Sanctioned in Scope</span>
            <Database className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            ₹{(totalSanctioned / 100000).toFixed(2)} Lakhs
          </p>
          <div className="text-[10px] text-emerald-700 font-medium truncate">
            ₹{(totalDisbursed / 100000).toFixed(2)}L Disbursed ({totalSanctioned > 0 ? Math.round((totalDisbursed/totalSanctioned)*100) : 0}%)
          </div>
        </Hologram3DCard>

        <Hologram3DCard className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>Critical Anomaly Flags</span>
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <p className={`text-xl font-bold mt-1 font-mono ${criticalWorks.length > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
            {criticalWorks.length} Flagged
          </p>
          <div className="text-[10px] text-slate-600 font-semibold truncate">
            {criticalWorks.length > 0 ? `${criticalWorks[0]?.id}: ${criticalWorks[0]?.title}` : "Zero Critical Alerts"}
          </div>
        </Hologram3DCard>

        <Hologram3DCard className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>Average Risk Score</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className={`text-xl font-bold mt-1 font-mono ${
            avgRisk >= 60 ? 'text-red-600' : avgRisk >= 30 ? 'text-amber-700' : 'text-emerald-700'
          }`}>
            {avgRisk} / 100
          </p>
          <div className="text-[10px] text-slate-500 font-medium truncate">
            {avgRisk >= 60 ? "High Anomaly Concentration" : "Normal Risk Band"}
          </div>
        </Hologram3DCard>

        <Hologram3DCard className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>Monitored Works</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
            {filteredWorks.length} Works
          </p>
          <div className="text-[10px] text-slate-500 font-medium truncate">
            Click table row to inspect details
          </div>
        </Hologram3DCard>
      </div>

      {/* 4. Multi-Agency Collusion & Cartel Syndicates Radar */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowCollusionSyndicates(!showCollusionSyndicates)}
          className="w-full px-5 py-3 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Agency & Vendor Forensic Radar ({relevantClusters.length} Target Syndicates & Audits)
              </div>
              <div className="text-[11px] text-slate-500">
                Intelligence covering Coimbatore Private Monopoly, Salem PWD Rates, Chennai Packaging, and Madurai Benchmarks
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-600 px-2 py-0.5 rounded bg-white border border-slate-200">
              {showCollusionSyndicates ? 'Hide Radar' : 'Expand Radar'}
            </span>
            {showCollusionSyndicates ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {showCollusionSyndicates && (
          <div className="p-4 border-t border-slate-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {relevantClusters.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-xl border space-y-1.5 relative transition-all ${
                    c.severity === 'CRITICAL' 
                      ? 'border-red-200 bg-red-50/40 hover:border-red-300' 
                      : c.severity === 'HIGH'
                        ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                      c.severity === 'CRITICAL' ? 'bg-red-200 text-red-900' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {c.id}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                      c.riskScore >= 75
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : c.riskScore >= 40
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      Risk: {c.riskScore}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{c.title}</h4>
                  <div className="text-[11px] text-slate-600 font-medium">
                    Entity: <strong className="text-slate-900">{c.entity}</strong>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                    <span className="font-bold text-red-700">Outlay: {c.impactAmount}</span>
                    <span className="text-slate-500 italic truncate max-w-[140px]" title={c.action}>
                      {c.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. National Audit Queue Works Table */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>National Audit Target Works</span>
              <span className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.2 rounded text-slate-700">
                {filteredWorks.length} Projects Listed
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Click any project row or the Inspect button to open forensics, Freeze Payment Tranche, or Dispatch Inspection Squad.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-56 overflow-y-auto pr-1">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 text-[10px] sticky top-0 bg-white">
              <tr>
                <th className="py-2 px-3">Work ID</th>
                <th className="py-2 px-3">Work Description</th>
                <th className="py-2 px-3">MP / Constituency</th>
                <th className="py-2 px-3">District</th>
                <th className="py-2 px-3">Implementing Agency</th>
                <th className="py-2 px-3">Sanctioned</th>
                <th className="py-2 px-3">Risk Score</th>
                <th className="py-2 px-3 text-right">Enforcement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs font-medium">
                    No works found matching the active State, District, MP, and Agency criteria.
                  </td>
                </tr>
              ) : (
                filteredWorks
                  .slice()
                  .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
                  .map((w) => (
                    <tr
                      key={w.id}
                      onClick={() => onSelectWork && onSelectWork(w.id || w.work_id)}
                      className={`cursor-pointer transition-colors group ${
                        w.isNegative ? 'bg-red-50/50 hover:bg-red-100/60' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2 px-3 font-mono font-bold text-indigo-700 text-xs">{w.id}</td>
                      <td className="py-2 px-3 font-medium text-slate-900 max-w-xs truncate text-xs group-hover:text-indigo-700 transition-colors">
                        {w.title}
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-xs whitespace-nowrap">
                        {w.mpName} ({w.constituency?.replace(' Constituency', '') || w.district})
                      </td>
                      <td className="py-2 px-3 text-slate-600 text-xs whitespace-nowrap">{w.district}</td>
                      <td className="py-2 px-3 text-slate-600 max-w-[150px] truncate text-xs" title={w.implementingAgency}>
                        {w.implementingAgency}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900 text-xs whitespace-nowrap">
                        ₹{((w.sanctionedAmount || w.cost || 0) / 100000).toFixed(1)}L
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          w.isNegative 
                            ? 'bg-red-100 text-red-700 border border-red-300' 
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}>
                          {w.riskScore} / 100
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectWork && onSelectWork(w.id || w.work_id);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          Inspect <Eye className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Benford's Law Financial Forensics Chart Card */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <span>Benford's Law Leading Digit Distribution</span>
              <span className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${
                worstBenfordDigit.status === 'SUSPICIOUS_SPIKE'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {worstBenfordDigit.status === 'SUSPICIOUS_SPIKE'
                  ? `Digit '${worstBenfordDigit.digit}' spike: +${(worstBenfordDigit.observedPct - worstBenfordDigit.expectedPct).toFixed(1)}pt`
                  : 'No significant deviation'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              National distribution across all 79,082 real sanctioned works -- this is a statistical property of the
              whole ledger, so it stays constant regardless of the scope filter above.
            </p>
          </div>
          <button
            onClick={() => setShowBenfordDetails(!showBenfordDetails)}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            {showBenfordDetails ? 'Hide Distribution Table' : 'View Numerical Table →'}
          </button>
        </div>

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={BENFORDS_LAW_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="digit" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '11px' }}
                formatter={(val, name) => [`${val}%`, name === 'observedPct' ? 'Observed Rate' : "Benford's Expected"]}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line
                type="monotone"
                dataKey="observedPct"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ r: 3, fill: "#dc2626" }}
                name="Observed Rate %"
              />
              <Line
                type="monotone"
                dataKey="expectedPct"
                stroke="#059669"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: "#059669" }}
                name="Expected Benford Curve %"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {showBenfordDetails && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 overflow-x-auto text-[11px]">
            <table className="w-full text-left">
              <thead className="text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="pb-1">First Digit</th>
                  <th className="pb-1">Observed</th>
                  <th className="pb-1">Benford Expected</th>
                  <th className="pb-1">Diagnostic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {BENFORDS_LAW_DATA.map((row) => (
                  <tr key={row.digit}>
                    <td className="py-1 font-mono font-bold text-slate-900">{row.digit}</td>
                    <td className="py-1 font-semibold text-slate-800">{row.observedPct}%</td>
                    <td className="py-1 text-slate-600">{row.expectedPct}%</td>
                    <td className="py-1">
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        row.status === 'SUSPICIOUS_SPIKE'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Modal Notice */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">National Audit Dossier Ready</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consolidated audit dossier for scope: <strong>{selectedState} ❯ {selectedDistrict} ❯ {selectedAgency}</strong> ({filteredWorks.length} works, {criticalWorks.length} critical flags) prepared in PDF/CSV format for MoSPI parliamentary reporting.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("National Audit Dossier exported successfully.");
                  setShowExportModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              >
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
