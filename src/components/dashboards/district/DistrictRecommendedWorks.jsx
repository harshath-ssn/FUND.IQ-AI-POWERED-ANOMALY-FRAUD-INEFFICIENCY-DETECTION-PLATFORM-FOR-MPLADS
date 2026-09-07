import React, { useMemo, useState } from 'react';
import { MapPinPlus, Send } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useWorkflowStore, EVENT_TYPES } from '../../../store/workflowStore';
import { formatINR } from '../../../utils/format';
import { PrototypeDataBadge } from '../../ui';

// District-side view of MP-recommended new works (Phase 6.2). Reads the
// same shared workflowStore RECOMMEND_NEW_WORK events -- there is no
// separate "recommendations" store. Scoped to this district via the
// event's own payload.district (set by the MP side from their real
// MP_PROFILES district, not their constituency).
export default function DistrictRecommendedWorks({ targetDistrict }) {
  const { t } = useTranslation();
  const workflow = useWorkflowStore();
  const [respondingId, setRespondingId] = useState(null);
  const [note, setNote] = useState('');

  const events = useMemo(() => workflow.events.filter((e) => (
    e.type === EVENT_TYPES.RECOMMEND_NEW_WORK
    && e.toRole === 'district'
    && (e.payload?.district || '').toLowerCase() === (targetDistrict || '').toLowerCase()
  )), [workflow.events, targetDistrict]);

  if (events.length === 0) return null;

  const handleRespond = (evt) => {
    workflow.updateEventStatus(evt.id, 'Reviewed', 'district', note.trim() || null);
    setRespondingId(null);
    setNote('');
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <MapPinPlus size={18} className="text-emerald-700" />
          {t('mp.recommend.title')} ({events.length})
        </h3>
        <PrototypeDataBadge />
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {events.map((evt) => {
          const p = evt.payload || {};
          return (
            <div key={evt.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span className="text-sm font-bold text-slate-900">{p.category}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${evt.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {evt.status}
                </span>
              </div>
              <p className="text-sm text-slate-700">{p.description}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>{p.mpName}{p.constituency ? ` — ${p.constituency}` : ''}</span>
                {p.estimatedCost > 0 && <span className="font-semibold text-slate-700">{formatINR(p.estimatedCost)}</span>}
                {p.locality && <span>{p.locality}</span>}
                {p.nearbyWorkCount > 0 && <span className="text-amber-700 font-semibold">{p.nearbyWorkCount} nearby works on file</span>}
              </div>

              {evt.status === 'Open' ? (
                respondingId === evt.id ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t('workflow.reason')}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
                    />
                    <button type="button" onClick={() => handleRespond(evt)} className="px-3 py-1.5 rounded-lg bg-indigo-950 text-amber-400 text-sm font-bold cursor-pointer shrink-0">
                      <Send size={12} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setRespondingId(evt.id)} className="text-indigo-700 font-bold text-sm hover:underline cursor-pointer">
                    {t('district.actionCenter.respond')}
                  </button>
                )
              ) : (
                <p className="text-emerald-800 font-semibold text-sm">
                  {evt.history[evt.history.length - 1]?.note || evt.history[evt.history.length - 1]?.action}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
