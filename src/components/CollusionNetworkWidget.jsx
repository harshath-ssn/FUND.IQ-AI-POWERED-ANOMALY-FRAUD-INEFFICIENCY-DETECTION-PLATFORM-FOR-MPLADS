import React from 'react';
import { Network, AlertOctagon, Building2, UserX, ArrowRight, ShieldAlert } from 'lucide-react';
import { NATIONAL_COLLUSION_CLUSTERS } from '../data/collusionClusters';

export default function CollusionNetworkWidget({ districtName }) {
  // Filter clusters for the current district, or show a critical national one if none
  const clusters = NATIONAL_COLLUSION_CLUSTERS.filter(c => c.district === districtName || districtName === "ALL");
  const activeCluster = clusters.length > 0 ? clusters[0] : null;

  if (!activeCluster || activeCluster.severity !== 'CRITICAL') return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-red-500/30 shadow-2xl p-6 relative overflow-hidden mt-4">
      {/* Background Pulse Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
      
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/50">
            <Network className="text-red-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">AI Collusion Network Detected</h3>
            <p className="text-red-400 text-sm">{activeCluster.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/30">
          <AlertOctagon size={16} className="text-red-400" />
          <span className="text-red-100 font-mono text-sm font-semibold">Risk: {activeCluster.riskScore}/100</span>
        </div>
      </div>

      {/* Visual Network Graph using Tailwind Flex/Grid */}
      <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-700/50 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
        
        {/* Node 1: The MP */}
        <div className="flex flex-col items-center gap-2 relative">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <UserX className="text-slate-300" size={28} />
          </div>
          <span className="text-slate-300 text-xs font-mono bg-slate-800 px-2 py-1 rounded">MP/Sanc. Auth</span>
        </div>

        {/* Animated Connection Line */}
        <div className="hidden md:flex flex-1 items-center relative h-1">
          <div className="w-full h-0.5 bg-gradient-to-r from-slate-600 via-red-500 to-slate-600"></div>
          <ArrowRight className="absolute left-1/2 -translate-x-1/2 text-red-500 animate-pulse" size={20} />
          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-red-400 uppercase tracking-widest font-bold whitespace-nowrap">
            100% Contract Monopoly
          </span>
        </div>

        {/* Node 2: The Monopolizing Vendor */}
        <div className="flex flex-col items-center gap-2 relative">
          <div className="w-20 h-20 rounded-full bg-red-950 border-2 border-red-500 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(239,68,68,0.4)] ring-4 ring-red-500/20 animate-pulse">
            <Building2 className="text-red-400" size={32} />
          </div>
          <span className="text-red-200 text-xs font-mono bg-red-900/50 border border-red-500/30 px-2 py-1 rounded text-center">
            {activeCluster.agencyId}<br/>{activeCluster.entity.split('(')[0]}
          </span>
        </div>

      </div>

      <div className="mt-6 flex items-start gap-3 bg-red-950/30 p-4 rounded-xl border border-red-900/50">
        <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={20} />
        <p className="text-slate-300 text-sm leading-relaxed">
          <strong className="text-white">Forensic Note:</strong> {activeCluster.description} 
          <br/><span className="text-red-400 font-semibold mt-1 inline-block">Action Taken: {activeCluster.action}</span>
        </p>
      </div>
    </div>
  );
}