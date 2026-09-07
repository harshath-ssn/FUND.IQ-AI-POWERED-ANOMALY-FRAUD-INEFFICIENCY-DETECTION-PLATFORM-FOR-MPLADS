import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useWorkflowStore, EVENT_TYPES } from '../../../store/workflowStore';
import { Modal, PrototypeDataBadge } from '../../ui';

const CATEGORY_FALLBACK = ['Normal/Others', 'Repair and Renovation', 'Trust and Society'];
const DUPLICATE_RADIUS_KM = 2;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Recommend New Work (Phase 6.2). Recommending works is literally the MP's
// role under MPLADS, so this is a genuine feature, not a demo flourish --
// but the resulting record is 100% synthetic (no real eSAKSHI ID or
// sanction), so it is created as an explicit Layer 2 prototype workflow
// record, always labeled as a draft, never presented as a submitted work.
export default function RecommendNewWorkModal({ open, onClose, location, mpWorks, currentMp, currentUser, district }) {
  const { t } = useTranslation();
  const workflow = useWorkflowStore();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [locality, setLocality] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const categories = useMemo(() => {
    const real = [...new Set((mpWorks || []).map((w) => w.category).filter(Boolean))];
    return real.length > 0 ? real : CATEGORY_FALLBACK;
  }, [mpWorks]);

  const nearbyWorks = useMemo(() => {
    if (!location) return [];
    const [lat, lng] = location;
    return (mpWorks || []).filter((w) => (
      w.latitude != null && w.longitude != null
      && haversineKm(lat, lng, w.latitude, w.longitude) <= DUPLICATE_RADIUS_KM
    ));
  }, [location, mpWorks]);

  const canSubmit = category && description.trim() && estimatedCost && location;

  const handleClose = () => {
    setCategory(''); setDescription(''); setEstimatedCost(''); setLocality(''); setSubmitted(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const [lat, lng] = location;
    workflow.createEvent(EVENT_TYPES.RECOMMEND_NEW_WORK, {
      fromRole: 'mp',
      toRole: 'district',
      workId: `PROTO-${Date.now().toString(36).toUpperCase()}`,
      reason: description.trim(),
      priority: 'normal',
      source: 'prototype_workflow',
      payload: {
        category,
        description: description.trim(),
        estimatedCost: Number(estimatedCost) || 0,
        locality: locality.trim(),
        latitude: lat,
        longitude: lng,
        mpId: currentMp?.id || currentUser?.mpId,
        mpName: currentUser?.name || currentMp?.name,
        constituency: currentMp?.constituency || currentMp?.district,
        district: district || currentMp?.district,
        nearbyWorkCount: nearbyWorks.length,
      },
    });
    setSubmitted(true);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose} title={t('mp.recommend.title')} maxWidth="max-w-lg">
      {submitted ? (
        <div className="text-center space-y-3 py-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-900">{t('mp.recommend.submittedTitle')}</p>
          <p className="text-sm text-slate-500">{t('mp.recommend.submittedNote')}</p>
          <PrototypeDataBadge className="mx-auto" />
          <button type="button" onClick={handleClose} className="mt-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold cursor-pointer">
            {t('buttons.close')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            <MapPin size={14} className="text-amber-600 shrink-0" />
            {location ? `${location[0].toFixed(4)}°, ${location[1].toFixed(4)}°` : t('mp.recommend.noLocation')}
          </p>

          {nearbyWorks.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <span>{t('mp.recommend.duplicateWarning', { count: nearbyWorks.length })}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">{t('mp.recommend.category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
            >
              <option value="">{t('filters.all')}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">{t('mp.recommend.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t('mp.recommend.descriptionPlaceholder')}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">{t('mp.recommend.estimatedCost')}</label>
              <input
                type="number"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="₹"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">{t('mp.recommend.locality')}</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder={t('mp.recommend.localityPlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-950/20"
              />
            </div>
          </div>

          <p className="text-xs text-slate-400">{t('mp.recommend.draftNote')}</p>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-4 py-2.5 rounded-xl bg-indigo-950 text-amber-400 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {t('mp.recommend.submit')}
            </button>
            <button type="button" onClick={handleClose} className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-700 cursor-pointer">
              {t('buttons.cancel')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
