import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { WifiOff, MapPin } from 'lucide-react';
import { BASEMAPS, DEFAULT_BASEMAP } from './basemaps';
import { loadStatesGeoJson, loadDistrictsGeoJson, normalizeName, indexFeaturesByName } from './geoData';
import DISTRICT_CENTROIDS from '../../data/geo/district_centroids.json';
import { useTranslation } from '../../i18n';
import { riskLevelFromScore } from '../ui/RiskBadge';

const RISK_COLORS = {
  high: '#dc2626',
  medium: '#f59e0b',
  low: '#2563eb',
  nominal: '#64748b',
};

const INDIA_CENTER = [22.9734, 78.6569];

function FitBoundsOnData({ geojson }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    try {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [24, 24] });
    } catch {
      // keep default view if bounds can't be computed
    }
  }, [geojson, map]);
  return null;
}

function FitBoundsOnPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    try {
      const bounds = L.latLngBounds(points);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    } catch {
      // keep default view if bounds can't be computed
    }
  }, [points, map]);
  return null;
}

// Fits to the UNION of a district boundary polygon and its work markers,
// instead of just one or the other. The Census-derived boundary polygon
// and the district-centroid+jitter work coordinates come from two
// independent sources and don't always share a centroid, so fitting to
// the boundary alone could zoom the map away from where the actual work
// pins are -- this is what made work markers appear "missing" even though
// they were rendered, just off the visible viewport.
function FitBoundsOnBoundaryAndPoints({ geojson, points }) {
  const map = useMap();
  useEffect(() => {
    try {
      let bounds = null;
      if (geojson) {
        const b = L.geoJSON(geojson).getBounds();
        if (b.isValid()) bounds = b;
      }
      if (points && points.length > 0) {
        const pb = L.latLngBounds(points);
        if (pb.isValid()) bounds = bounds ? bounds.extend(pb) : pb;
      }
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [32, 32] });
      }
    } catch {
      // keep default view if bounds can't be computed
    }
  }, [geojson, points, map]);
  return null;
}

// Captures a raw map click for "pick a location" interactions (Phase 6.2,
// Recommend New Work) -- separate from the per-feature/marker click
// handlers above, which only fire on an existing GeoJSON shape or marker.
function MapClickCapture({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Shared map layer for all four workspaces (A4.4).
 *
 * level: 'national' | 'state' | 'district'
 *  - national: state-level choropleth, click -> onSelectState
 *  - state:    district polygons for that state where a name match exists,
 *              centroid points for districts that don't match a boundary,
 *              click -> onSelectDistrict
 *  - district: individual work markers (district-centroid + deterministic
 *              per-work jitter, computed server-side in sync_data.py),
 *              click -> onSelectWork
 *
 * No geofence / boundary-violation / distance-from-boundary logic anywhere
 * here -- ground truth 1.2 forbids treating these coordinates as forensic
 * evidence.
 */
export default function FundMap({
  level = 'national',
  stateName,
  districtName,
  // The real district name(s) to use for boundary/centroid matching, when
  // they differ from `districtName` (which stays the human-readable label
  // shown in the caption/disclaimer). Needed for the MP constituency map: a
  // constituency is not a district, so its name won't match the district
  // boundary/centroid data, but the real districts its works actually fall
  // in will. A constituency routinely spans many real districts (e.g. one
  // Arunachal Pradesh seat spans 13), so this accepts an array and draws
  // every one that has a match -- picking just one (as earlier code did)
  // drew a single arbitrary district while the actual work markers sat
  // scattered across a dozen others, which is what made the map look
  // broken rather than merely approximate.
  boundaryDistrictName,
  boundaryDistrictNames,
  works = [],
  stateRisk = {}, // { [stateName]: { riskScore, totalWorks } } optional choropleth input
  onSelectState,
  onSelectDistrict,
  onSelectWork,
  onMapClick,
  pickedLocation, // [lat, lng] optional marker for a location the user just picked
  height = 480,
}) {
  const { t } = useTranslation();
  const [statesGeo, setStatesGeo] = useState(null);
  const [districtsGeo, setDistrictsGeo] = useState(null);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [basemap] = useState(DEFAULT_BASEMAP);

  const geoMatchName = boundaryDistrictName || districtName;
  const geoMatchNames = useMemo(() => {
    if (boundaryDistrictNames && boundaryDistrictNames.length > 0) {
      return [...new Set(boundaryDistrictNames.filter(Boolean))];
    }
    return geoMatchName ? [geoMatchName] : [];
  }, [boundaryDistrictNames, geoMatchName]);

  useEffect(() => {
    let cancelled = false;
    if (level === 'national') {
      loadStatesGeoJson().then((data) => { if (!cancelled) setStatesGeo(data); });
    } else if (level === 'state' || level === 'district') {
      loadDistrictsGeoJson().then((data) => { if (!cancelled) setDistrictsGeo(data); });
    }
    return () => { cancelled = true; };
  }, [level]);

  const districtIndex = useMemo(
    () => (districtsGeo ? indexFeaturesByName(districtsGeo, 'district') : new Map()),
    [districtsGeo]
  );

  // The single district's own boundary at 'district' level, plus its
  // same-state siblings shown muted for context (Phase 6.1). Falls back to
  // nothing (just the existing work markers) when the name doesn't match
  // any bundled polygon -- never approximated by drawing a shape around
  // the work markers themselves.
  // Every one of geoMatchNames that actually has a bundled polygon -- for a
  // single-district view (District workspace) this is at most one feature;
  // for a multi-district constituency it can be several.
  const matchedDistrictFeatures = useMemo(() => {
    if (level !== 'district' || geoMatchNames.length === 0) return [];
    return geoMatchNames
      .map((name) => districtIndex.get(normalizeName(name)))
      .filter(Boolean);
  }, [level, geoMatchNames, districtIndex]);

  const isMultiDistrict = matchedDistrictFeatures.length > 1;

  // Same-state siblings shown muted for context (Phase 6.1) -- only when
  // there's a single district in play; with several real boundaries
  // already drawn (the multi-district case) adding every neighbour of
  // every one of them would just be visual noise.
  const neighborDistrictFeatures = useMemo(() => {
    if (level !== 'district' || matchedDistrictFeatures.length !== 1 || !districtsGeo) return [];
    const matchedDistrictFeature = matchedDistrictFeatures[0];
    const normState = normalizeName(matchedDistrictFeature.properties?.state);
    const ownName = normalizeName(matchedDistrictFeature.properties?.district);
    return districtsGeo.features.filter(
      (f) => normalizeName(f.properties?.state) === normState && normalizeName(f.properties?.district) !== ownName
    );
  }, [level, matchedDistrictFeatures, districtsGeo]);

  const stateDistrictFeatures = useMemo(() => {
    if (level !== 'state' || !districtsGeo || !stateName) return [];
    const normState = normalizeName(stateName);
    return districtsGeo.features.filter((f) => normalizeName(f.properties?.state) === normState);
  }, [level, districtsGeo, stateName]);

  // District names in this state that have no boundary match -> centroid dot
  const unmatchedDistrictCentroids = useMemo(() => {
    if (level !== 'state' || !stateName) return [];
    const matchedNames = new Set(stateDistrictFeatures.map((f) => normalizeName(f.properties?.district)));
    const normState = normalizeName(stateName);
    return Object.entries(DISTRICT_CENTROIDS)
      .filter(([, v]) => normalizeName(v.state) === normState)
      .filter(([name]) => !matchedNames.has(normalizeName(name)) && !districtIndex.has(normalizeName(name)))
      .map(([name, v]) => ({ name, ...v }));
  }, [level, stateName, stateDistrictFeatures, districtIndex]);

  const activeBasemap = BASEMAPS[basemap] || BASEMAPS[DEFAULT_BASEMAP];

  const workPoints = useMemo(() => {
    if (level !== 'district') return [];
    return works
      .filter((w) => w.latitude != null && w.longitude != null)
      .map((w) => [w.latitude, w.longitude]);
  }, [level, works]);

  // Fallback center when a district has no plottable works yet: its own
  // centroid if we can resolve one, otherwise the national centroid.
  const fallbackCenter = useMemo(() => {
    if (geoMatchName) {
      const match = Object.entries(DISTRICT_CENTROIDS).find(
        ([name]) => normalizeName(name) === normalizeName(geoMatchName)
      );
      if (match) return [match[1].lat, match[1].lng];
    }
    return INDIA_CENTER;
  }, [geoMatchName]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100" style={{ height }}>
      <MapContainer
        center={level === 'district' ? fallbackCenter : INDIA_CENTER}
        zoom={level === 'national' ? 4.5 : level === 'state' ? 6.5 : 11}
        scrollWheelZoom
        style={{ height: '100%', width: '100%', cursor: onMapClick ? 'crosshair' : undefined }}
      >
        <TileLayer
          url={activeBasemap.url}
          attribution={activeBasemap.attribution}
          subdomains={activeBasemap.subdomains}
          maxZoom={activeBasemap.maxZoom}
          eventHandlers={{
            tileerror: () => setTilesFailed(true),
            tileload: () => setTilesFailed(false),
          }}
        />

        {level === 'national' && statesGeo && (
          <>
            <GeoJSON
              data={statesGeo}
              style={(feature) => {
                const name = feature.properties?.state;
                const risk = stateRisk[name];
                const level_ = risk ? riskLevelFromScore(risk.riskScore) : 'nominal';
                return {
                  color: '#1e293b',
                  weight: 1,
                  fillColor: RISK_COLORS[level_],
                  fillOpacity: 0.35,
                };
              }}
              onEachFeature={(feature, layer) => {
                const name = feature.properties?.state;
                layer.bindTooltip(name, { sticky: true });
                layer.on('click', () => onSelectState?.(name));
              }}
            />
            <FitBoundsOnData geojson={statesGeo} />
          </>
        )}

        {level === 'state' && (
          <>
            {stateDistrictFeatures.length > 0 && (
              <GeoJSON
                data={{ type: 'FeatureCollection', features: stateDistrictFeatures }}
                style={{ color: '#1e293b', weight: 1.2, fillColor: '#3b82f6', fillOpacity: 0.25 }}
                onEachFeature={(feature, layer) => {
                  const name = feature.properties?.district;
                  layer.bindTooltip(name, { sticky: true });
                  layer.on('click', () => onSelectDistrict?.(name));
                }}
              />
            )}
            {unmatchedDistrictCentroids.map((d) => (
              <CircleMarker
                key={d.name}
                center={[d.lat, d.lng]}
                radius={7}
                pathOptions={{ color: '#ffffff', weight: 1.5, fillColor: '#64748b', fillOpacity: 0.9 }}
                eventHandlers={{ click: () => onSelectDistrict?.(d.name) }}
              >
                <Popup>
                  <div className="text-xs">
                    <b>{d.name}</b>
                    <div className="text-slate-500 mt-1">No boundary match — showing approximate centroid.</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            {stateDistrictFeatures.length > 0 && (
              <FitBoundsOnData geojson={{ type: 'FeatureCollection', features: stateDistrictFeatures }} />
            )}
          </>
        )}

        {level === 'district' && matchedDistrictFeatures.length > 0 && (
          <>
            {neighborDistrictFeatures.length > 0 && (
              <GeoJSON
                key={`neighbors-${geoMatchNames.join('|')}`}
                data={{ type: 'FeatureCollection', features: neighborDistrictFeatures }}
                style={{ color: '#94a3b8', weight: 0.75, fillColor: '#e2e8f0', fillOpacity: 0.15, dashArray: '3,3' }}
                interactive={false}
              />
            )}
            <GeoJSON
              key={`boundary-${geoMatchNames.join('|')}`}
              data={{ type: 'FeatureCollection', features: matchedDistrictFeatures }}
              style={{ color: '#4338ca', weight: isMultiDistrict ? 2 : 3.5, fillColor: '#4338ca', fillOpacity: isMultiDistrict ? 0.08 : 0.12 }}
              interactive={false}
              onEachFeature={(feature, layer) => {
                if (isMultiDistrict) layer.bindTooltip(feature.properties?.district, { sticky: true });
              }}
            />
          </>
        )}

        {level === 'district' && matchedDistrictFeatures.length > 0 && (
          <FitBoundsOnBoundaryAndPoints
            geojson={{ type: 'FeatureCollection', features: matchedDistrictFeatures }}
            points={workPoints}
          />
        )}

        {level === 'district' && matchedDistrictFeatures.length === 0 && workPoints.length > 0 && <FitBoundsOnPoints points={workPoints} />}

        {level === 'district' && works.map((work) => {
          if (work.latitude == null || work.longitude == null) return null;
          const level_ = riskLevelFromScore(work.riskScore);
          return (
            <CircleMarker
              key={work.id}
              center={[work.latitude, work.longitude]}
              radius={8}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: RISK_COLORS[level_], fillOpacity: 0.95 }}
              eventHandlers={{ click: () => onSelectWork?.(work.id) }}
            >
              <Popup>
                <div className="text-xs space-y-0.5">
                  <b>{work.id}</b>
                  <div className="font-semibold">{work.title}</div>
                  <div className="text-slate-500">{t(`risk.${level_}`)}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {onMapClick && <MapClickCapture onMapClick={onMapClick} />}
        {pickedLocation && (
          <CircleMarker
            center={pickedLocation}
            radius={10}
            pathOptions={{ color: '#ffffff', weight: 2.5, fillColor: '#059669', fillOpacity: 0.95, dashArray: '2,2' }}
          />
        )}
      </MapContainer>

      {tilesFailed && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-lg">
          <WifiOff size={13} />
          <span>{t('map.offlineBasemap')}</span>
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-[500] max-w-[85%] flex items-start gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 border border-slate-200 text-slate-700 text-xs font-semibold shadow-md">
        <MapPin size={12} className="shrink-0 mt-0.5 text-amber-600" />
        <span>{districtName ? `${districtName}: ` : ''}{t('map.approxDisclaimer')}</span>
      </div>

      {level === 'district' && (boundaryDistrictName || (boundaryDistrictNames && boundaryDistrictNames.length > 0)) && geoMatchNames.join('|') !== districtName && matchedDistrictFeatures.length > 0 && (
        <div className="absolute bottom-3 right-3 z-[500] max-w-[60%] flex items-start gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50/95 border border-amber-200 text-amber-900 text-xs font-semibold shadow-md">
          <MapPin size={12} className="shrink-0 mt-0.5 text-amber-600" />
          <span>
            {isMultiDistrict
              ? t('map.districtBoundariesNotConstituency', { count: matchedDistrictFeatures.length })
              : t('map.districtBoundaryNotConstituency')}
          </span>
        </div>
      )}
    </div>
  );
}
