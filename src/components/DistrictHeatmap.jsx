import React, { useState, useMemo } from 'react';
import { MapPin, AlertTriangle, User, ArrowRight, Layers, Eye } from 'lucide-react';

export default function DistrictHeatmap({ 
  district = "Unspecified",
  works = [], // <-- Added works prop here!
  selectedRegion, 
  onSelectRegion, 
  onSelectMp 
}) {
  const [viewMode, setViewMode] = useState('cartographic'); // 'cartographic' | 'contour'
  const [hoveredWork, setHoveredWork] = useState(null);

  // Performance Safeguard: Filter and cap to the top 200 items for the district
  const districtWorks = useMemo(() => {
    if (!district || district === "ALL") {
      return works.slice(0, 150);
    }
    const matched = works.filter(w => 
      (w.district && w.district.toLowerCase() === district.toLowerCase()) ||
      (w.constituency && w.constituency.toLowerCase() === district.toLowerCase())
    );
    return matched
      .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
      .slice(0, 200);
  }, [district, works]);

// ... The rest of the component remains exactly the same as provided previously

  // Dynamic Geographic Envelope
  const bounds = useMemo(() => {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    
    districtWorks.forEach(w => {
      const lat = parseFloat(w.latitude);
      const lng = parseFloat(w.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
    });

    if (minLat >= maxLat) { minLat = 10.0; maxLat = 28.0; }
    if (minLng >= maxLng) { minLng = 72.0; maxLng = 88.0; }

    const latPad = (maxLat - minLat) * 0.15 || 0.1;
    const lngPad = (maxLng - minLng) * 0.15 || 0.1;

    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad
    };
  }, [districtWorks]);

  // Project latitude/longitude onto SVG
  const project = (lat, lng) => {
    const width = 380;
    const height = 480;
    const pad = 24;
    const x = pad + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (width - 2 * pad);
    const y = (height - pad) - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (height - 2 * pad);
    return { 
      x: Math.max(pad, Math.min(width - pad, x)), 
      y: Math.max(pad, Math.min(height - pad, y)) 
    };
  };

  const activeWork = hoveredWork || districtWorks[0] || {
    id: "N/A",
    title: "No works recorded in this view",
    riskScore: 10,
    sanctionedAmount: 0,
    mpName: "District Representative",
    anomalyType: "Nominal"
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {district} District Operational Risk Surveillance Heatmap
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Audited Work Sites
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Live coordinate-plotted audit sites ({districtWorks.length} highest-priority works displayed)
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('cartographic')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'cartographic'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setViewMode('contour')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'contour'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Contour Grid</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 text-[10px] font-semibold bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-pulse" />
              <span>High (≥70)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Medium</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Low</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Heatmap & Work Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left: Dynamic SVG Scatter Viewport */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-3 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] shadow-xl">
          <div className="relative w-full max-w-[380px] aspect-[380/480] select-none">
            <svg 
              viewBox="0 0 380 480" 
              className="w-full h-full drop-shadow-sm rounded-xl overflow-hidden"
            >
              <defs>
                <pattern id="dist-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dist-grid)" />

              {/* Render Works Nodes */}
              {districtWorks.map((work) => {
                const lat = parseFloat(work.latitude) || (bounds.minLat + bounds.maxLat) / 2;
                const lng = parseFloat(work.longitude) || (bounds.minLng + bounds.maxLng) / 2;
                const { x, y } = project(lat, lng);
                const isHigh = (work.riskScore || 0) >= 70 || work.isNegative;
                const isMed = (work.riskScore || 0) >= 40 && !isHigh;
                const color = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';

                return (
                  <g 
                    key={work.id}
                    className="cursor-pointer transition-transform duration-150"
                    onMouseEnter={() => setHoveredWork(work)}
                    onClick={() => {
                      if (onSelectMp && work.mpId) onSelectMp(work.mpId);
                      if (onSelectRegion) onSelectRegion(work);
                    }}
                  >
                    {isHigh && (
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="12" 
                        fill="rgba(239, 68, 68, 0.35)"
                        className="animate-ping origin-center"
                        style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '1.5s' }}
                      />
                    )}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isHigh ? "6.5" : "4.5"} 
                      fill={color} 
                      stroke="#ffffff" 
                      strokeWidth={isHigh ? "1.8" : "1"} 
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-800">
            <span>Constituency: {district}</span>
            <span>Hover on node for audit summary</span>
          </div>
        </div>

        {/* Right: Selected Work Inspector */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              High-Risk Work Items in Constituency:
            </span>
            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
              {districtWorks.slice(0, 5).map((w) => (
                <div
                  key={w.id}
                  onClick={() => setHoveredWork(w)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    activeWork?.id === w.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="truncate max-w-[200px]">
                    <span className="text-xs font-bold block truncate">{w.title || w.description}</span>
                    <span className="text-[10px] text-slate-400">{w.category} • ₹{(w.sanctionedAmount / 100000).toFixed(1)}L</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    (w.riskScore || 0) >= 70 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {w.riskScore || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Selected Work Telemetry
                </span>
                <h3 className="text-sm font-black text-slate-900 line-clamp-1 mt-0.5">
                  {activeWork.title || activeWork.description}
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${
                (activeWork.riskScore || 0) >= 70 ? 'bg-red-600' : (activeWork.riskScore || 0) >= 40 ? 'bg-amber-500' : 'bg-emerald-600'
              }`}>
                Risk {activeWork.riskScore || 0}/100
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block">Sanctioned</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  ₹{(activeWork.sanctionedAmount / 100000).toFixed(1)}L
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Progress</span>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {activeWork.progressPct != null ? `${activeWork.progressPct}%` : (activeWork.statusLabel || "N/A")}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Assigned MP</span>
                <span className="text-[11px] font-bold text-indigo-700 truncate block mt-0.5">
                  {activeWork.mpName || "Hon'ble MP"}
                </span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <AlertTriangle className={`w-3.5 h-3.5 ${(activeWork.riskScore || 0) >= 70 ? 'text-red-600' : 'text-amber-600'}`} />
                Anomaly Diagnostic:
              </span>
              <p className="text-slate-600 text-[11px] leading-relaxed bg-white p-2 rounded-lg border border-slate-200">
                {activeWork.anomalyType || activeWork.genAiAuditNote || "Standard milestone timeline compliance."}
              </p>
            </div>

            {activeWork.mpId && (
              <button
                onClick={() => onSelectMp && onSelectMp(activeWork.mpId)}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Jump to {activeWork.mpName || "MP"}'s Constituency Deck</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}