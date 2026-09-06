import React from 'react';

export default function ThreeDHeroBanner({ activeRole, onOpenFlaggedModal }) {
  // Hide the banner completely for MP role
  if (activeRole === 'mp') {
    return null;
  }

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
      <div>
        <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
          Governance Surveillance Node
        </span>
        <h2 className="text-base font-bold text-slate-900 mt-1">
          {activeRole === 'district' && "District Implementation Authority Command Console"}
          {activeRole === 'state' && "State Nodal Planning & Heatmap Matrix"}
          {activeRole === 'ministry' && "MoSPI National Forensic Surveillance Grid"}
        </h2>
      </div>

      <button
        type="button"
        onClick={onOpenFlaggedModal}
        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors"
      >
        Inspect High Risk Anomaly
      </button>
    </div>
  );
}