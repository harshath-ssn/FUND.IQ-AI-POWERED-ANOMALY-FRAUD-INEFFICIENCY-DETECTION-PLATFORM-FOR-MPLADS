import React from 'react';

// Consistent section header used across all eight MP workspace sections
// (Session B, Part 3) so the workspace reads as one coherent system instead
// of eight differently-styled pages.
export default function MPSectionHeader({ title, subtitle, badge, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-slate-200">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          {badge}
        </div>
        {subtitle && <p className="text-sm text-slate-500 font-medium max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
