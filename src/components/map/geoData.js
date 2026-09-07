// Local, bundled boundary data (A4.4) -- fetched from public/geo/, never
// from a runtime CDN/API. District boundaries come from a real Census-2011
// derived source; our own 751 "true districts" are parsed from the eSAKSHI
// IDA column and about 17% of their names don't exactly match 2011 census
// district names (splits, renames -- e.g. "Ahilyanagar" vs. "Ahmednagar").
// Rather than silently mis-drawing a boundary for a mismatched name, any
// district without a confident name match falls back to a centroid point
// (see FundMap.jsx) -- consistent with the rest of the app's rule of never
// presenting an approximation as if it were survey-grade.

const cache = {};

async function loadJson(path) {
  if (cache[path]) return cache[path];
  const promise = fetch(path)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  cache[path] = promise;
  return promise;
}

export function loadStatesGeoJson() {
  return loadJson('/geo/india-states.geojson');
}

export function loadDistrictsGeoJson() {
  return loadJson('/geo/india-districts.geojson');
}

export function normalizeName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^(state of|district of)\s+/, '')
    .replace(/\band\b/g, '&');
}

/** Build a name -> feature lookup keyed by normalized name. */
export function indexFeaturesByName(featureCollection, propKey) {
  const index = new Map();
  if (!featureCollection?.features) return index;
  for (const feature of featureCollection.features) {
    const raw = feature.properties?.[propKey];
    if (!raw) continue;
    index.set(normalizeName(raw), feature);
  }
  return index;
}
