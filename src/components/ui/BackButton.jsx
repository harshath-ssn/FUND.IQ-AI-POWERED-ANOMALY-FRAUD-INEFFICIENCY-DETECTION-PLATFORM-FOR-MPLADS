import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../../store/navigationStore';
import { useTranslation } from '../../i18n';

// Origin-aware Back (A4.7): reads the top of the shared navigation stack so
// a work opened from Map returns to Map, and one opened from Risk & Alerts
// returns there, instead of a single hardcoded destination.
export default function BackButton({ onNavigateBack, className = '' }) {
  const { current, popOrigin } = useNavigation();
  const { t } = useTranslation();

  if (!current) return null;

  const handleClick = () => {
    const popped = popOrigin();
    onNavigateBack?.(popped?.origin);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer shadow-sm ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      {t('nav.backTo', { origin: current.label })}
    </button>
  );
}
