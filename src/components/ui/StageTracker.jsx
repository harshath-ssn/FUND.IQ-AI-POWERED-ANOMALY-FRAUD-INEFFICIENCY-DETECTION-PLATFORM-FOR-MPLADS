import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from '../../i18n';

// The real eSAKSHI six-stage execution pipeline (A4.6). This is an
// execution-STAGE tracker, not a fabricated completion percentage.
export const LIFECYCLE_STAGES = [
  'status.sanction',
  'status.timeEstimation',
  'status.vendorIdentification',
  'status.physicalInspection',
  'status.workPartiallyCompleted',
  'status.workCompleted',
];

export default function StageTracker({ currentStage, compact = false, showCaption = true }) {
  const { t } = useTranslation();
  const currentIndex = Math.max(0, LIFECYCLE_STAGES.indexOf(currentStage));

  return (
    <div>
      <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2'}`}>
        {LIFECYCLE_STAGES.map((stageKey, idx) => {
          const done = idx <= currentIndex;
          const isLast = idx === LIFECYCLE_STAGES.length - 1;
          return (
            <React.Fragment key={stageKey}>
              <div className="flex flex-col items-center gap-1" title={t(stageKey)}>
                {done ? (
                  <CheckCircle2 className={`${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-emerald-600`} />
                ) : (
                  <Circle className={`${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-slate-300`} />
                )}
                {!compact && (
                  <span className={`text-xs font-semibold text-center leading-tight max-w-16 ${done ? 'text-slate-700' : 'text-slate-400'}`}>
                    {t(stageKey)}
                  </span>
                )}
              </div>
              {!isLast && (
                <div className={`flex-1 h-0.5 ${idx < currentIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} style={{ minWidth: compact ? 8 : 16 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {showCaption && (
        <p className="text-xs text-slate-400 font-medium mt-2">
          eSAKSHI records execution stage, not a completion percentage.
        </p>
      )}
    </div>
  );
}
