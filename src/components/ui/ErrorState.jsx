import React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function ErrorState({ message, onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
      <AlertOctagon className="w-8 h-8 text-red-400" />
      <p className="text-sm text-slate-600 font-medium">{message || t('error.generic')}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer hover:bg-slate-800"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('buttons.retry')}
        </button>
      )}
    </div>
  );
}
