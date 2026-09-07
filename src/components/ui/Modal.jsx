import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Rendered via a portal to document.body at a z-index above Leaflet's
// internal panes/controls (which run up to z-index 1000) -- without this,
// a modal opened from a map marker (any of the four workspaces) renders
// visually behind the map tiles/controls even though it's later in the
// component tree, because the map's own stacking context wins locally.
export default function Modal({ open = true, onClose, title, children, maxWidth = 'max-w-lg', footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`w-full ${maxWidth} rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {(title || onClose) && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="pt-3 border-t border-slate-100">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
