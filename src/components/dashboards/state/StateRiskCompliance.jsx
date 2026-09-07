import React, { useMemo } from 'react';
import { AlertTriangle, Camera, ArrowUpCircle, Network } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useWorkflowStore, EVENT_TYPES } from '../../../store/workflowStore';
import { EmptyState, RiskBadge, PrototypeDataBadge } from '../../ui';
import { buildConcentration, ConcentrationPanel } from '../shared/agencyConcentration';

const LEVEL_KEYS = {
  high: 'district.agencyIntel.highConcentration',
  moderate: 'district.agencyIntel.moderateConcentration',
  distributed: 'district.agencyIntel.distributed',
  single: 'district.agencyIntel.singleEntity',
};

// Risk, Compliance & Escalation (Session D, D5). Language stays in the
// "signal requires review" register throughout -- never a fraud
// confirmation. Escalations are read from the shared workflowStore
// (district -> state ESCALATE_FOR_REVIEW events), not a parallel store.
export default function StateRiskCompliance({ stateWorks, onSelectWork }) {
  const { t } = useTranslation();
  const workflow = useWorkflowStore();

  const flaggedWorks = useMemo(() => stateWorks.filter((w) => w.isNegative || w.riskScore >= 70), [stateWorks]);
  const evidenceGapWorks = useMemo(() => stateWorks.filter((w) => w.photoEvidence === 'absent'), [stateWorks]);

  const stateWorkIds = useMemo(() => new Set(stateWorks.map((w) => w.id)), [stateWorks]);
  const escalations = useMemo(
    () => workflow.events.filter((e) => e.type === EVENT_TYPES.ESCALATE_FOR_REVIEW && e.toRole === 'state' && stateWorkIds.has(e.workId)),
    [workflow.events, stateWorkIds]
  );

  const agencyRows = useMemo(
    () => buildConcentration(stateWorks, (w) => w.agency || w.implementingAgency),
    [stateWorks]
  );

  const labels = {
    works: t('district.agencyIntel.worksCount'),
    sanctioned: t('district.agencyIntel.sanctionedTotal'),
    share: t('district.agencyIntel.shareOfDistrict'),
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">{t('state.risk.title')}</h2>
        <p className="text-sm text-slate-600 max-w-3xl mt-1">{t('state.risk.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-700" />
            {t('state.risk.anomalySignals')} ({flaggedWorks.length})
          </h3>
          {flaggedWorks.length === 0 ? (
            <EmptyState message={t('empty.noAlerts')} />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {flaggedWorks.slice(0, 15).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onSelectWork(w.id)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 line-clamp-1">{w.title}</span>
                    <RiskBadge score={w.riskScore} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{w.district}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Camera size={18} className="text-amber-700" />
            {t('state.risk.evidenceGaps')} ({evidenceGapWorks.length})
          </h3>
          {evidenceGapWorks.length === 0 ? (
            <EmptyState message={t('empty.noData')} />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {evidenceGapWorks.slice(0, 15).map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onSelectWork(w.id)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                >
                  <span className="text-sm font-semibold text-slate-900 line-clamp-1">{w.title}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{w.district}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ArrowUpCircle size={18} className="text-indigo-800" />
          {t('state.risk.escalationsTitle')} ({escalations.length})
        </h3>
        {escalations.length === 0 ? (
          <EmptyState message={t('state.risk.escalationsEmpty')} />
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {escalations.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => onSelectWork(e.workId)}
                className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-800">{e.workId}</span>
                  <div className="flex items-center gap-1.5">
                    {e.source === 'prototype_workflow' && <PrototypeDataBadge />}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${e.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {e.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-700">{e.reason}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <ConcentrationPanel
        title={t('state.risk.concentrationTitle')}
        icon={Network}
        rows={agencyRows}
        emptyMessage={t('district.agencyIntel.noAgencyData')}
        t={t}
        i18nKeys={LEVEL_KEYS}
        labels={labels}
      />
    </div>
  );
}
