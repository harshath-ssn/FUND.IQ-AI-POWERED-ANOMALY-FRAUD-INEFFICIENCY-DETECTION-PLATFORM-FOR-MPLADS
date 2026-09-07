import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../ui';
import { useTranslation } from '../../../i18n';
import { useWorkflowStore, EVENT_TYPES } from '../../../store/workflowStore';

// MP -> District "Request Information" workflow (Part 3, Rule 15). Routes
// through the shared workflowStore event bus (A4.5) so the request carries a
// real event id, full history, and survives refresh via the store's own
// localStorage persistence -- this is not a local-only toast.
export default function RequestInformationModal({ work, onClose }) {
  const { t } = useTranslation();
  const workflow = useWorkflowStore();
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [sentEventId, setSentEventId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    workflow.createEvent(EVENT_TYPES.REQUEST_INFORMATION, {
      fromRole: 'mp',
      toRole: 'district',
      workId: work.id,
      reason: reason.trim(),
      priority,
      dueDate: dueDate || null,
    });
    setSentEventId('sent');
  };

  return (
    <Modal open onClose={onClose} title={t('mp.actions.requestInfo')} maxWidth="max-w-md">
      {sentEventId ? (
        <div className="text-center py-4 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <p className="text-base font-bold text-slate-900">{t('mp.actions.sent')}</p>
          <p className="text-sm text-slate-500">{work.id} — {work.title}</p>
          <button type="button" onClick={onClose} className="mt-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold cursor-pointer">
            {t('buttons.close')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{t('mp.actions.requestInfoDesc')}</p>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm">
            <span className="font-mono font-bold text-indigo-950">{work.id}</span>
            <span className="block font-bold text-slate-800 mt-0.5">{work.title}</span>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">{t('mp.actions.reasonLabel')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('mp.actions.reasonPlaceholder')}
              rows={3}
              required
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">{t('workflow.priority')}</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm cursor-pointer">
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">{t('workflow.dueDate')}</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold cursor-pointer">
              {t('buttons.cancel')}
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-amber-400 text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
              <Send size={15} /> {t('buttons.submit')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
