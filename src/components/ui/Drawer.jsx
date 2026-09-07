import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Portaled to document.body at a z-index above Leaflet's panes/controls
// (up to z-index 1000) so a drawer opened while a map is on screen (e.g.
// the District Work Dossier from the District Map tab) never renders
// behind the map.
export default function Drawer({ open, onClose, title, children, side = 'right', width = 'max-w-md' }) {
  if (!open) return null;
  const sideCls = side === 'right' ? 'right-0 border-l' : 'left-0 border-r';
  const animateCls = side === 'right' ? 'animate-in slide-in-from-right' : 'animate-in slide-in-from-left';

  return createPortal(
    <div className="fixed inset-0 z-[2000] bg-slate-950/50 backdrop-blur-sm flex" onClick={onClose}>
      <div
        className={`ml-auto h-full w-full ${width} bg-white ${sideCls} border-slate-200 shadow-2xl flex flex-col ${animateCls} duration-200 ${side === 'left' ? 'mr-auto ml-0' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
