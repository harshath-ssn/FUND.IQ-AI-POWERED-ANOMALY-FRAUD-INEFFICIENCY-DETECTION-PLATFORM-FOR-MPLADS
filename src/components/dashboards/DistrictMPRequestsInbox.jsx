import React, { useState } from 'react';
import { Inbox, Send } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useWorkflowStore, EVENT_TYPES } from '../../store/workflowStore';
import { PrototypeDataBadge } from '../ui';

// Small, purely additive District-side surface for the MP "Request
// Information" workflow (Session B, Part 3 Rule 15/27) -- NOT a redesign of
// the District workspace. Reads/writes only the shared workflowStore event
// bus (A4.5) so a District Authority can see and respond to MP requests,
// and the MP sees that response reflected back in their own work dossier.
//
// districtWorkIds (Session C fix): the original Session B version matched
// only on fromRole/toRole, which pulled in every REQUEST_INFORMATION event
// nationwide (every district's inbox showed every other district's MP
// requests) and also mis-matched MARK_FOLLOW_UP events, which share the
// same mp->district route but are a different action entirely. Scoping to
// this district's own work IDs and the REQUEST_INFORMATION type keeps the
// inbox to what a District Authority should actually see.
export default function DistrictMPRequestsInbox({ onSelectWork, districtWorkIds }) {
  const { t } = useTranslation();
  const workflow = useWorkflowStore();
  const [respondingId, setRespondingId] = useState(null);
  const [responseText, setResponseText] = useState('');

  const events = workflow.events.filter((e) => (
    e.fromRole === 'mp'
    && e.toRole === 'district'
    && e.type === EVENT_TYPES.REQUEST_INFORMATION
    && (!districtWorkIds || districtWorkIds.has(e.workId))
  ));
  if (events.length === 0) return null;

  const openCount = events.filter((e) => e.status === 'Open').length;

  const handleRespond = (evt) => {
    if (!responseText.trim()) return;
    workflow.updateEventStatus(evt.id, 'Resolved', 'district', responseText.trim());
    setRespondingId(null);
    setResponseText('');
  };

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Inbox size={18} className="text-indigo-800" /> {t('district.actionCenter.mpRequests')}
        </h3>
        <span className="text-sm font-mono font-bold text-slate-500">{openCount} / {events.length}</span>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {events.map((evt) => (
          <div key={evt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <span className="font-mono font-bold text-slate-700 text-xs">{evt.id}</span>
              <div className="flex items-center gap-1.5">
                {evt.source === 'prototype_workflow' && <PrototypeDataBadge />}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${evt.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {evt.status === 'Open' ? t('status.open') : evt.status}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectWork && onSelectWork(evt.workId)}
              className="font-mono text-indigo-800 hover:underline cursor-pointer block text-xs"
            >
              {evt.workId}
            </button>
            <p className="text-slate-700">{evt.reason}</p>

            {evt.status === 'Open' ? (
              respondingId === evt.id ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder={t('workflow.reason')}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleRespond(evt)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-950 text-amber-400 text-sm font-bold cursor-pointer shrink-0"
                  >
                    <Send size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRespondingId(evt.id)}
                  className="text-indigo-700 font-bold hover:underline cursor-pointer"
                >
                  {t('district.actionCenter.respond')}
                </button>
              )
            ) : (
              <p className="text-emerald-800 font-semibold">
                {t('district.actionCenter.responseLabel')}: {evt.history[evt.history.length - 1]?.note || evt.history[evt.history.length - 1]?.action}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
