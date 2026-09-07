import React from 'react';
import { Inbox } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function EmptyState({ message, icon: Icon = Inbox, action }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Icon className="w-8 h-8 text-slate-300" />
      <p className="text-sm text-slate-500 font-medium">{message || t('empty.noData')}</p>
      {action}
    </div>
  );
}
