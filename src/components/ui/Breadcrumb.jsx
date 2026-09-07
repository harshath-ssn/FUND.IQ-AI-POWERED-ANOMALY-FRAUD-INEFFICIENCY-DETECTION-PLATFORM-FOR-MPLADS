import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [], onNavigate, rootLabel = 'FUND·IQ' }) {
  return (
    <nav className="flex items-center gap-1 text-sm overflow-x-auto no-scrollbar" aria-label="Breadcrumb">
      <button
        type="button"
        onClick={() => onNavigate?.(0)}
        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer shrink-0"
      >
        <Home className="w-3.5 h-3.5 text-indigo-700" />
        <span>{rootLabel}</span>
      </button>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <button
              type="button"
              onClick={() => onNavigate?.(idx + 1, item)}
              className={`px-2 py-1 rounded shrink-0 transition-colors ${
                isLast ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200/60' : 'hover:bg-slate-100 text-slate-700 font-medium'
              }`}
            >
              {item.label}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
