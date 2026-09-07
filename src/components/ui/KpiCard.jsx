import React from 'react';

// Large, readable KPI value + label used across all four workspaces.
// Restrained: white card, subtle border, no glow/gradient gimmicks.
// onClick is optional -- when provided the card becomes a keyboard-accessible
// button so a KPI can double as a shortcut into a filtered detail view.
export default function KpiCard({ label, value, subtext, icon: Icon, tone = 'neutral', className = '', onClick }) {
  const toneCls = {
    neutral: 'text-slate-950',
    good: 'text-emerald-700',
    warn: 'text-amber-700',
    bad: 'text-red-700',
  }[tone] || 'text-slate-950';

  return (
    <div
      className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : undefined}
    >
      <span className="text-sm font-semibold uppercase tracking-wide text-slate-500 flex items-center justify-between">
        <span>{label}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </span>
      <div className={`text-2xl sm:text-3xl font-bold font-mono ${toneCls}`}>{value}</div>
      {subtext && <div className="text-sm text-slate-500 font-medium pt-1.5 border-t border-slate-100">{subtext}</div>}
    </div>
  );
}
