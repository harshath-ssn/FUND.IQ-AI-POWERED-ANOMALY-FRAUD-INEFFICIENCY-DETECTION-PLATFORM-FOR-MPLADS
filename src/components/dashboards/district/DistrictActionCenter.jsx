import React, { useMemo } from 'react';
import { ClipboardCheck, ShieldAlert, MessageCircleQuestion, CalendarClock } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useWorkflowStore, EVENT_TYPES } from '../../../store/workflowStore';
import { EmptyState, RiskBadge } from '../../ui';
import DistrictMPRequestsInbox from '../DistrictMPRequestsInbox';
import DistrictRecommendedWorks from './DistrictRecommendedWorks';

// District Action Center (Session C, C2). Landing surface for the District
// workspace: work requiring attention comes before any analytical chart.
// Categories are application/workflow processing states, never described as
// statutory deadlines (C7).
export default function DistrictActionCenter({ districtWorks, onOpenDossier, onSelectWork, targetDistrict }) {
  const { t } = useTranslation();
  const workflow = useWorkflowStore();

  const workById = useMemo(() => {
    const map = new Map();
    districtWorks.forEach((w) => map.set(w.id, w));
    return map;
  }, [districtWorks]);

  const districtWorkIds = useMemo(() => new Set(districtWorks.map((w) => w.id)), [districtWorks]);

  const caseEvents = useMemo(
    () => workflow.events.filter((e) => e.type === EVENT_TYPES.DISTRICT_CASE && districtWorkIds.has(e.workId)),
    [workflow.events, districtWorkIds]
  );

  const casedWorkIds = useMemo(() => new Set(caseEvents.map((e) => e.workId)), [caseEvents]);

  const verificationDue = useMemo(
    () => districtWorks.filter((w) => (w.isNegative || w.riskScore >= 70) && !casedWorkIds.has(w.id)),
    [districtWorks, casedWorkIds]
  );

  const decisionDue = useMemo(() => caseEvents.filter((e) => e.status === 'Decision Due'), [caseEvents]);
  const clarificationPending = useMemo(() => caseEvents.filter((e) => e.status === 'Clarification Pending'), [caseEvents]);

  const followUpDue = useMemo(
    () => workflow.events.filter((e) => e.type === EVENT_TYPES.DISTRICT_FOLLOW_UP && e.status === 'Open' && districtWorkIds.has(e.workId)),
    [workflow.events, districtWorkIds]
  );

  const totalItems = verificationDue.length + decisionDue.length + clarificationPending.length + followUpDue.length;

  const buckets = [
    {
      key: 'verificationDue',
      icon: ShieldAlert,
      tone: 'bad',
      items: verificationDue.map((w) => ({ id: w.id, work: w, title: w.title, sub: `${t('district.actionCenter.priority')}: ${w.riskScore >= 70 ? t('risk.high') : t('risk.medium')}` })),
    },
    {
      key: 'decisionDue',
      icon: ClipboardCheck,
      tone: 'warn',
      items: decisionDue.map((e) => ({ id: e.id, work: workById.get(e.workId), title: workById.get(e.workId)?.title || e.workId, sub: e.reason })),
    },
    {
      key: 'clarificationPending',
      icon: MessageCircleQuestion,
      tone: 'warn',
      items: clarificationPending.map((e) => ({ id: e.id, work: workById.get(e.workId), title: workById.get(e.workId)?.title || e.workId, sub: e.reason })),
    },
    {
      key: 'followUpDue',
      icon: CalendarClock,
      tone: 'neutral',
      items: followUpDue.map((e) => ({ id: e.id, work: workById.get(e.workId), title: workById.get(e.workId)?.title || e.workId, sub: e.dueDate ? `${t('district.actionCenter.due')}: ${e.dueDate}` : t('district.actionCenter.noDueDate') })),
    },
  ];

  const toneCls = {
    bad: 'border-red-200 bg-red-50/50 text-red-800',
    warn: 'border-amber-200 bg-amber-50/50 text-amber-800',
    neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('district.actionCenter.title')}</h2>
          <p className="text-sm text-slate-600 max-w-2xl mt-1">{t('district.actionCenter.subtitle')}</p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-950 text-amber-400">
          {totalItems} {t('district.actionCenter.title')}
        </span>
      </div>

      {totalItems === 0 ? (
        <EmptyState message={t('district.actionCenter.empty')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buckets.map((bucket) => {
            const Icon = bucket.icon;
            return (
              <div key={bucket.key} className={`rounded-2xl border p-4 space-y-3 ${toneCls[bucket.tone]} bg-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Icon size={18} />
                    {t(`district.actionCenter.${bucket.key}`)}
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-sm font-bold bg-white border border-slate-200 text-slate-700">
                    {bucket.items.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{t(`district.actionCenter.${bucket.key}Desc`)}</p>
                {bucket.items.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">{t('district.actionCenter.empty')}</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {bucket.items.slice(0, 8).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => item.work && onOpenDossier(item.work)}
                        disabled={!item.work}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900 line-clamp-1">{item.title}</span>
                          {item.work && <RiskBadge score={item.work.riskScore} size="sm" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.sub}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DistrictMPRequestsInbox onSelectWork={onSelectWork} districtWorkIds={districtWorkIds} />
      <DistrictRecommendedWorks targetDistrict={targetDistrict} />
    </div>
  );
}
