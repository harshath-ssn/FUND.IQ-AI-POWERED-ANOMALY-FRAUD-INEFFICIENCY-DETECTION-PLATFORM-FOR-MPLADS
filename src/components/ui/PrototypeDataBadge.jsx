import React from 'react';
import { FlaskConical } from 'lucide-react';
import { useTranslation } from '../../i18n';

// Quiet but visible marker for Layer 2 (prototype workflow) data -- must
// never be silently merged with real eSAKSHI records (Part 2, Rule 3).
export default function PrototypeDataBadge({ className = '' }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold uppercase tracking-wide ${className}`}
      title="Verification tasks, decisions, clarifications and follow-ups are seeded demo data, not eSAKSHI records."
    >
      <FlaskConical className="w-3 h-3" />
      {t('workflow.prototypeLabel')}
    </span>
  );
}
