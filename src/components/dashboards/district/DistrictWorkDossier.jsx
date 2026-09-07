import React, { useMemo, useState } from 'react';
import {
  MapPin, IndianRupee, Camera, History, ClipboardList, ExternalLink,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useWorkflowStore, EVENT_TYPES } from '../../../store/workflowStore';
import { formatINR } from '../../../utils/format';
import { Drawer, RiskBadge, StageTracker, PrototypeDataBadge } from '../../ui';
import { stageKeyForWork } from '../mp/mpDerive';

const CASE_STATUS_KEY = {
  'Verification In Progress': 'district.caseStatus.verificationInProgress',
  'Decision Due': 'district.caseStatus.decisionDue',
  'Clarification Pending': 'district.caseStatus.clarificationPending',
  'Decision Recorded': 'district.caseStatus.decisionRecorded',
  'Escalated for Review': 'district.caseStatus.escalated',
};

// District-specific operational dossier (Session C, C5). Distinct from the
// shared MP-flavored WorkDetailModal -- this is a Drawer (not a full modal)
// so it can stay open alongside the Works Register/Action Center, and it
// surfaces the verification/decision case-file workflow the MP dossier has
// no reason to carry.
export default function DistrictWorkDossier({ work, open, onClose, onOpenFullRecord, onSelectMp }) {
  const { t } = useTranslation();
  const workflow = useWorkflowStore();
  const [pendingAction, setPendingAction] = useState(null); // action key awaiting a note
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');

  const workId = work?.id;
  const caseEvent = workId ? workflow.getCaseForWork(workId) : null;
  const followUps = workId ? workflow.getFollowUpsForWork(workId) : [];
  const infoEvents = useMemo(
    () => (workId ? workflow.getEventsForWork(workId).filter((e) => e.type === EVENT_TYPES.REQUEST_INFORMATION) : []),
    [workflow, workId]
  );

  const historyEntries = useMemo(() => {
    const rows = [];
    if (caseEvent) {
      caseEvent.history.forEach((h) => rows.push({ ...h, source: caseEvent.source, label: 'district.dossier.title' }));
    }
    followUps.forEach((fu) => {
      fu.history.forEach((h) => rows.push({ ...h, source: fu.source, label: 'district.dossier.addFollowUp' }));
    });
    infoEvents.forEach((ev) => {
      ev.history.forEach((h) => rows.push({ ...h, source: ev.source, label: 'nav.workDossier' }));
    });
    return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [caseEvent, followUps, infoEvents]);

  if (!work) return null;

  const openForm = (actionKey) => {
    setPendingAction(actionKey);
    setNote('');
    setDueDate('');
  };

  const closeForm = () => {
    setPendingAction(null);
    setNote('');
    setDueDate('');
  };

  const ensureCase = (initialStatus, actionLabel) => {
    if (caseEvent) return caseEvent.id;
    workflow.createEvent(EVENT_TYPES.DISTRICT_CASE, {
      fromRole: 'district',
      toRole: 'district',
      workId: work.id,
      reason: `${actionLabel}: ${note.trim()}`,
      priority: 'normal',
      status: initialStatus,
    });
    return null; // new case will be picked up on next render via getCaseForWork
  };

  const submitAction = () => {
    if (!note.trim()) return;
    const trimmed = note.trim();

    if (pendingAction === 'assign') {
      ensureCase('Verification In Progress', t('district.dossier.assignVerification'));
    } else if (pendingAction === 'finding') {
      if (!caseEvent) {
        ensureCase('Decision Due', t('district.dossier.recordFinding'));
      } else {
        workflow.updateEventStatus(caseEvent.id, 'Decision Due', 'district', trimmed);
      }
    } else if (pendingAction === 'clarify') {
      if (!caseEvent) {
        ensureCase('Clarification Pending', t('district.dossier.requestClarification'));
      } else {
        workflow.updateEventStatus(caseEvent.id, 'Clarification Pending', 'district', trimmed);
      }
    } else if (pendingAction === 'decision') {
      if (caseEvent) {
        workflow.updateEventStatus(caseEvent.id, 'Decision Recorded', 'district', trimmed);
      }
    } else if (pendingAction === 'followup') {
      workflow.createEvent(EVENT_TYPES.DISTRICT_FOLLOW_UP, {
        fromRole: 'district',
        toRole: 'district',
        workId: work.id,
        reason: trimmed,
        priority: 'normal',
        dueDate: dueDate || null,
      });
    } else if (pendingAction === 'escalate') {
      if (caseEvent) {
        workflow.updateEventStatus(caseEvent.id, 'Escalated for Review', 'district', trimmed);
      } else {
        ensureCase('Escalated for Review', t('district.dossier.escalate'));
      }
      workflow.createEvent(EVENT_TYPES.ESCALATE_FOR_REVIEW, {
        fromRole: 'district',
        toRole: 'state',
        workId: work.id,
        reason: trimmed,
        priority: 'high',
      });
    }

    closeForm();
  };

  const evidenceAbsent = work.photoEvidence === 'absent' || work.photoUploaded === false;
  const hasCoordinates = work.latitude != null && work.longitude != null;

  const actionButtons = [
    { key: 'assign', labelKey: 'district.dossier.assignVerification' },
    { key: 'finding', labelKey: 'district.dossier.recordFinding' },
    { key: 'clarify', labelKey: 'district.dossier.requestClarification' },
    { key: 'decision', labelKey: 'district.dossier.recordDecision', disabled: !caseEvent || caseEvent.status !== 'Decision Due' },
    { key: 'followup', labelKey: 'district.dossier.addFollowUp' },
    { key: 'escalate', labelKey: 'district.dossier.escalate' },
  ];

  return (
    <Drawer open={open} onClose={onClose} title={t('district.dossier.title')} width="max-w-xl">
      <div className="space-y-5">
        {/* Identity */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('district.dossier.identity')}</h4>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-mono text-sm font-bold text-indigo-900">{work.id}</span>
              <RiskBadge score={work.riskScore} size="sm" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{work.title}</h3>
            <p className="text-sm text-slate-600">
              {work.category} &middot; {work.district}
              {work.mpName && (
                <>
                  {' '}&middot;{' '}
                  <button
                    type="button"
                    onClick={() => onSelectMp && onSelectMp(work.mpId)}
                    className="text-indigo-700 font-semibold hover:underline cursor-pointer"
                  >
                    {work.mpName}
                  </button>
                </>
              )}
            </p>
          </div>
        </section>

        {/* Financials + Stage */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('district.dossier.financials')}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-xs text-slate-500 flex items-center gap-1"><IndianRupee size={12} />{t('district.dossier.sanctioned')}</span>
              <p className="text-base font-bold font-mono text-slate-900">{formatINR(work.sanctionedAmount)}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-xs text-slate-500 flex items-center gap-1"><IndianRupee size={12} />{t('district.dossier.paymentReleased')}</span>
              <p className="text-base font-bold font-mono text-slate-900">{formatINR(work.paymentReleased)}</p>
              <p className="text-xs text-slate-400">{work.paymentStatus}</p>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-slate-200">
            <span className="text-xs text-slate-500">{t('district.dossier.executionStage')}</span>
            <div className="mt-2">
              <StageTracker currentStage={stageKeyForWork(work)} compact showCaption={false} />
              <p className="text-sm font-semibold text-slate-800 mt-1">{work.statusLabel || work.workStage}</p>
            </div>
          </div>
        </section>

        {/* Evidence */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">{t('district.dossier.evidence')}</h4>
          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600"><Camera size={14} />{t('district.dossier.photoEvidence')}</span>
              <span className={`font-semibold ${evidenceAbsent ? 'text-amber-700' : 'text-emerald-700'}`}>
                {work.photoEvidence === 'not_applicable' ? t('district.dossier.notApplicable') : evidenceAbsent ? t('district.dossier.absent') : t('district.dossier.present')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600"><MapPin size={14} />{t('district.dossier.location')}</span>
              <span className={`font-semibold ${hasCoordinates ? 'text-slate-700' : 'text-amber-700'}`}>
                {hasCoordinates ? t('district.dossier.gpsAvailable') : t('district.dossier.gpsUnavailable')}
              </span>
            </div>
          </div>
        </section>

        {/* Case status + actions */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
            <ClipboardList size={14} />{t('district.dossier.actions')}
          </h4>

          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-sm">
            <span className="font-semibold text-indigo-900">{t('district.dossier.status')}</span>
            <span className="font-bold text-indigo-950">
              {caseEvent ? t(CASE_STATUS_KEY[caseEvent.status] || caseEvent.status) : t('district.dossier.noCaseYet')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {actionButtons.map((btn) => (
              <button
                key={btn.key}
                type="button"
                disabled={btn.disabled}
                onClick={() => openForm(btn.key)}
                className="px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                {t(btn.labelKey)}
              </button>
            ))}
          </div>

          {pendingAction && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-2.5">
              <p className="text-sm font-bold text-amber-900">{t(actionButtons.find((b) => b.key === pendingAction)?.labelKey)}</p>
              {pendingAction === 'escalate' && (
                <p className="text-xs text-amber-800">{t('district.dossier.escalatedNote')}</p>
              )}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('district.dossier.notePlaceholder')}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
              />
              {pendingAction === 'followup' && (
                <div>
                  <label className="text-xs font-semibold text-slate-600">{t('district.dossier.dueDateLabel')}</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                  />
                </div>
              )}
              {!note.trim() && <p className="text-xs text-red-600 font-medium">{t('district.dossier.reasonRequired')}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={submitAction}
                  disabled={!note.trim()}
                  className="px-4 py-2 rounded-lg bg-indigo-950 text-amber-400 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t('district.dossier.confirm')}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm font-semibold text-slate-700 cursor-pointer"
                >
                  {t('district.dossier.cancel')}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* History */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
            <History size={14} />{t('district.dossier.caseHistory')}
          </h4>
          {historyEntries.length === 0 ? (
            <p className="text-sm text-slate-400 py-3">{t('district.dossier.noHistory')}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {historyEntries.map((h, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="font-semibold text-slate-800">{h.action}</span>
                    {h.source === 'prototype_workflow' && <PrototypeDataBadge />}
                  </div>
                  {h.note && <p className="text-slate-600">{h.note}</p>}
                  <p className="text-xs text-slate-400">
                    {h.actorRole} &middot; {new Date(h.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={() => onOpenFullRecord && onOpenFullRecord(work.id)}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
        >
          {t('district.dossier.openFullRecord')} <ExternalLink size={14} />
        </button>
      </div>
    </Drawer>
  );
}
