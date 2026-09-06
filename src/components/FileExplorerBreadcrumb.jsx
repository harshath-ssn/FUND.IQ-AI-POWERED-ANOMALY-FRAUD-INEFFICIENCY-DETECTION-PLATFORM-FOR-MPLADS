import React from 'react';
import { ChevronRight, Home, Folder, FileText, User, MapPin, Building2, Landmark, LogOut } from 'lucide-react';

export default function FileExplorerBreadcrumb({ 
  user, 
  breadcrumbs = [], 
  onBreadcrumbClick, 
  onLogout 
}) {
  return (
    <div className="w-full bg-white border-b border-slate-200 px-4 py-1.5 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
      <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar flex-1 mr-2">
        <button
          onClick={() => onBreadcrumbClick && onBreadcrumbClick(0)}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer shrink-0"
        >
          <Home className="w-3.5 h-3.5 text-indigo-700" />
          <span>MPLADS</span>
        </button>

        {breadcrumbs.map((item, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={() => onBreadcrumbClick && onBreadcrumbClick(idx + 1, item)}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors shrink-0 ${
                  isLast 
                    ? 'bg-indigo-50/80 text-indigo-900 font-bold border border-indigo-200/60' 
                    : 'hover:bg-slate-100 text-slate-700 font-medium'
                }`}
              >
                {item.type === 'state' && <Building2 className="w-3.5 h-3.5 text-blue-600" />}
                {item.type === 'district' && <MapPin className="w-3.5 h-3.5 text-amber-600" />}
                {item.type === 'mp' && <User className="w-3.5 h-3.5 text-indigo-600" />}
                {item.type === 'work' && <FileText className="w-3.5 h-3.5 text-emerald-600" />}
                {item.type === 'ministry' && <Landmark className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold">{user?.name}</span>
          <span className="text-slate-400">({user?.role?.toUpperCase()})</span>
        </div>

        <button
          onClick={onLogout}
          title="Sign out of current session"
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}