import React, { useState, useMemo } from 'react';
import { Building2, AlertTriangle, ArrowRight, MapPin } from 'lucide-react';
import { DISTRICT_RISK_DATA } from '../data/districtRisk';

export default function StateHeatmap({ 
  stateName = "All India", 
  selectedDistrict, 
  onSelectDistrict 
}) {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  // Normalize state name query
  const cleanState = (stateName || "All India").replace(/^State of\s+/i, '').trim();

  // Filter districts dynamically from nationwide DISTRICT_RISK_DATA
  const districtList = useMemo(() => {
    if (!cleanState || cleanState.toLowerCase() === "all india" || cleanState.toLowerCase() === "all") {
      return DISTRICT_RISK_DATA;
    }
    const filtered = DISTRICT_RISK_DATA.filter(d => d.state?.toLowerCase() === cleanState.toLowerCase());
    return filtered.length > 0 ? filtered : DISTRICT_RISK_DATA.slice(0, 30);
  }, [cleanState]);

  // Compute dynamic geographic bounding box for coordinates
  const bounds = useMemo(() => {
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    
    districtList.forEach(d => {
      const lat = parseFloat(d.latitude);
      const lng = parseFloat(d.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
    });

    if (minLat >= maxLat) { minLat = 8.0; maxLat = 37.0; }
    if (minLng >= maxLng) { minLng = 68.0; maxLng = 97.0; }

    const latPad = (maxLat - minLat) * 0.12 || 1.5;
    const lngPad = (maxLng - minLng) * 0.12 || 1.5;

    return {
      minLat: minLat - latPad,
      maxLat: maxLat + latPad,
      minLng: minLng - lngPad,
      maxLng: maxLng + lngPad
    };
  }, [districtList]);

  // Project lat/lng to SVG space (400 x 500)
  const project = (lat, lng) => {
    const width = 400;
    const height = 500;
    const pad = 30;

    const x = pad + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * (width - 2 * pad);
    const y = (height - pad) - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * (height - 2 * pad);
    return { x: Math.max(pad, Math.min(width - pad, x)), y: Math.max(pad, Math.min(height - pad, y)) };
  };

  const activeDistrictKey = selectedDistrict || districtList[0]?.district;
  const activeIntel = districtList.find(d => d.district?.toLowerCase() === activeDistrictKey?.toLowerCase()) || districtList[0] || {
    district: "National Overview",
    riskScore: 35,
    status: "Nominal",
    sanctionedCr: 0,
    totalWorks: 0,
    flaggedWorks: 0,
    topVendor: "State PWD"
  };

  const getSeverity = (score) => {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  };

  const getBadgeColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500 text-white border-red-600 shadow-xs shadow-red-200';
      case 'medium':
        return 'bg-amber-500 text-white border-amber-600';
      default:
        return 'bg-emerald-500 text-white border-emerald-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {cleanState} Risk Surveillance Heatmap
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                GPS Projection
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Interactive geographic anomaly detection projected across {districtList.length} constituencies in {cleanState}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-red-200 inline-block animate-pulse" />
            <span className="text-slate-700 font-medium">High Risk (≥70)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 inline-block" />
            <span className="text-slate-700 font-medium">Moderate (40–69)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 inline-block" />
            <span className="text-slate-700 font-medium">Compliant (&lt;40)</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Map & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left/Center: Dynamic Vector SVG Map with Live Hotspots */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-2 sm:p-3 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[420px] aspect-[400/500] select-none">
            <svg 
              viewBox="0 0 400 500" 
              className="w-full h-full drop-shadow-sm rounded-xl overflow-hidden"
            >
              <defs>
                <pattern id="state-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.8" />
                </pattern>
                <radialGradient id="map-radar-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="100%" height="100%" fill="url(#state-grid)" />
              <circle cx="200" cy="250" r="180" fill="url(#map-radar-glow)" />

              {/* Hotspot Beacons */}
              {districtList.map((dist) => {
                const lat = parseFloat(dist.latitude) || 20.59;
                const lng = parseFloat(dist.longitude) || 78.96;
                const { x, y } = project(lat, lng);
                const score = dist.riskScore || dist.risk || 20;
                const severity = getSeverity(score);
                const isSelected = activeDistrictKey?.toLowerCase() === dist.district?.toLowerCase();
                const isHigh = severity === 'high';
                const isMed = severity === 'medium';
                
                const pinColor = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';
                const pulseRingColor = isHigh ? 'rgba(239, 68, 68, 0.45)' : isMed ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)';

                return (
                  <g 
                    key={dist.id || dist.district}
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setHoveredDistrict(dist)}
                    onMouseLeave={() => setHoveredDistrict(null)}
                    onClick={() => onSelectDistrict && onSelectDistrict(dist.district)}
                  >
                    {(isSelected || isHigh) && (
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={isSelected ? "18" : "12"} 
                        fill={pulseRingColor}
                        className="animate-ping origin-center"
                        style={{ transformOrigin: `${x}px ${y}px`, animationDuration: isHigh ? '1.4s' : '2.5s' }}
                      />
                    )}

                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isSelected ? "11" : "7"} 
                      fill={pinColor} 
                      opacity={isSelected ? "0.35" : "0.2"} 
                    />

                    <circle 
                      cx={x} 
                      cy={y} 
                      r={isSelected ? "5.5" : "4"} 
                      fill={pinColor} 
                      stroke="#ffffff" 
                      strokeWidth={isSelected ? "2" : "1.2"} 
                    />

                    {/* Label */}
                    <g transform={`translate(${x}, ${y - 10})`}>
                      <rect 
                        x="-34" 
                        y="-8" 
                        width="68" 
                        height="12" 
                        rx="3" 
                        fill={isSelected ? "#0f172a" : "rgba(15, 23, 42, 0.85)"}
                        stroke={isSelected ? pinColor : "rgba(255,255,255,0.4)"}
                        strokeWidth="0.8"
                      />
                      <text 
                        x="0" 
                        y="0" 
                        fill="#ffffff" 
                        fontSize="7" 
                        fontWeight="bold" 
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {dist.district?.slice(0, 10)} ({score})
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredDistrict && (
              <div 
                className="absolute z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md text-white px-3 py-2 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 w-52"
                style={{
                  left: `30%`,
                  top: `20%`
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                  <span className="font-bold">{hoveredDistrict.district}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getBadgeColor(getSeverity(hoveredDistrict.riskScore || hoveredDistrict.risk || 0))}`}>
                    Score {hoveredDistrict.riskScore || hoveredDistrict.risk || 0}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  <span className="text-slate-400">Works:</span> {hoveredDistrict.totalWorks || hoveredDistrict.works || 0} projects
                </p>
                <p className="text-[10px] text-amber-300 leading-tight">
                  Flagged: {hoveredDistrict.flaggedWorks || hoveredDistrict.flagged || 0} high-risk items
                </p>
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-800">
            <span>State: {cleanState}</span>
            <span>Click any node to inspect district</span>
          </div>
        </div>

        {/* Right: District Forensic Intelligence Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Quick Select District Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Constituency Jump ({districtList.length} Monitored):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {districtList.slice(0, 16).map((dist) => {
                const isSelected = activeDistrictKey?.toLowerCase() === dist.district?.toLowerCase();
                const severity = getSeverity(dist.riskScore || dist.risk || 0);
                return (
                  <button
                    key={dist.id || dist.district}
                    onClick={() => onSelectDistrict && onSelectDistrict(dist.district)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span 
                      className={`w-2 h-2 rounded-full ${
                        severity === 'high' 
                          ? 'bg-red-500' 
                          : severity === 'medium' 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      }`} 
                    />
                    <span className="truncate max-w-[100px]">{dist.district}</span>
                    <span className={`text-[10px] px-1 rounded font-mono ${
                      isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {dist.riskScore || dist.risk || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* District Forensic Scorecard */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Focused Surveillance District
                </span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  {activeIntel.district}
                </h3>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${getBadgeColor(getSeverity(activeIntel.riskScore || activeIntel.risk || 0))}`}>
                {activeIntel.status || 'Active Surveillance'}
              </span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block">Risk Index</span>
                <span className={`text-base font-black font-mono ${
                  getSeverity(activeIntel.riskScore || activeIntel.risk || 0) === 'high' ? 'text-red-600' : 'text-slate-800'
                }`}>
                  {activeIntel.riskScore || activeIntel.risk || 0} / 100
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Sanctioned</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  ₹{activeIntel.sanctionedCr || (activeIntel.sanctionedAmount ? (activeIntel.sanctionedAmount / 1e7).toFixed(2) : '0')} Cr
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Flagged Works</span>
                <span className={`text-base font-bold font-mono ${activeIntel.flaggedWorks > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {activeIntel.flaggedWorks || activeIntel.flagged || 0} / {activeIntel.totalWorks || activeIntel.works || 0}
                </span>
              </div>
            </div>

            {/* Top Vendor */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Primary Implementing Entity:
              </span>
              <p className="text-slate-700 text-[11px] leading-relaxed bg-white p-2 rounded-lg border border-slate-200 font-medium">
                {activeIntel.topVendor || "State Infrastructure Division"}
              </p>
            </div>

            {/* Drill Down Action Button */}
            <button
              onClick={() => onSelectDistrict && onSelectDistrict(activeIntel.district)}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Inspect {activeIntel.district} District Command Deck</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}