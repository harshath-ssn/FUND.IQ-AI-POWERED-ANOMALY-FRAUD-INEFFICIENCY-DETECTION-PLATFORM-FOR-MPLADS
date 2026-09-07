import React, { useMemo, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import FundMap from '../../map/FundMap';
import MPSectionHeader from './MPSectionHeader';
import RecommendNewWorkModal from './RecommendNewWorkModal';

// Thin wrapper around the shared map layer (A4.4) scoped to this MP's
// constituency. No geofence / GPS-verification / satellite logic added here
// -- that would violate ground truth 1.2 (district-centroid + deterministic
// jitter is an approximation, not forensic evidence).
export default function MPConstituencyMap({ currentMp, mpWorks, onSelectWork, currentUser }) {
  const { t } = useTranslation();
  const constituencyName = currentMp?.constituency || currentMp?.district;

  // A constituency is not a district -- there is no bundled constituency
  // boundary file. A constituency also routinely spans many real districts
  // (one Arunachal Pradesh seat spans 13); drawing only the first entry of
  // MP_PROFILES.districts left the boundary shown and the actual work
  // markers looking unrelated, since most works sat in other districts
  // entirely. The real, authoritative set is whatever `district` values
  // actually appear on this MP's own loaded works.
  const realDistrictNames = useMemo(
    () => [...new Set((mpWorks || []).map((w) => w.district).filter(Boolean))],
    [mpWorks]
  );

  // Single most-representative district (most works), used where a single
  // value is needed (Recommend New Work's routing field, initial centroid).
  const primaryDistrictName = useMemo(() => {
    if (realDistrictNames.length === 0) return currentMp?.districts?.[0] || currentMp?.district;
    const counts = new Map();
    (mpWorks || []).forEach((w) => {
      if (!w.district) return;
      counts.set(w.district, (counts.get(w.district) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || realDistrictNames[0];
  }, [realDistrictNames, mpWorks, currentMp]);

  const [picking, setPicking] = useState(false);
  const [pickedLocation, setPickedLocation] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleMapClick = (lat, lng) => {
    if (!picking) return;
    setPickedLocation([lat, lng]);
    setPicking(false);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <MPSectionHeader title={t('mp.map.title')} subtitle={t('mp.map.subtitle')} />
        {picking ? (
          <button
            type="button"
            onClick={() => setPicking(false)}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <X size={14} /> {t('mp.recommend.cancelPicking')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-950 text-amber-400 text-sm font-bold flex items-center gap-1.5 cursor-pointer hover:bg-indigo-900 transition shrink-0"
          >
            <MapPin size={14} /> {t('mp.recommend.button')}
          </button>
        )}
      </div>

      {picking && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
          {t('mp.recommend.pickLocationPrompt')}
        </p>
      )}

      <FundMap
        level="district"
        districtName={constituencyName}
        boundaryDistrictNames={realDistrictNames}
        works={mpWorks}
        onSelectWork={picking ? undefined : onSelectWork}
        onMapClick={picking ? handleMapClick : undefined}
        pickedLocation={pickedLocation}
        height={560}
      />

      <RecommendNewWorkModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setPickedLocation(null); }}
        location={pickedLocation}
        mpWorks={mpWorks}
        currentMp={currentMp}
        currentUser={currentUser}
        district={primaryDistrictName}
      />
    </div>
  );
}
