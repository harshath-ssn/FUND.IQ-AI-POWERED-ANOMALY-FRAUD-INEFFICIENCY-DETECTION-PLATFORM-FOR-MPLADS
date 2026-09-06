// Fetches the real, full per-work JSON files sync_data.py writes to
// public/data/works/. Written under TWO independent real groupings of the
// same records (see sync_data.py's A0.1 write-out block):
//   by-constituency/<slug>.json -- one per parliamentary constituency, for
//     the MP dashboard (an MP maps 1:1 to a constituency).
//   by-district/<slug>.json     -- one per true district (parsed from IDA),
//     for the District/State/Ministry dashboards. A true district is a
//     different, independently-real grouping from a constituency -- it can
//     pool works from several constituencies/MPs, so this is NOT just a
//     renamed copy of the constituency files.
// No sampling in either export; every real work appears in exactly one file
// of each kind.

const cache = new Map();
let topRiskNationalPromise = null;

// Must stay byte-for-byte in sync with slugify() in sync_data.py -- it's how
// filenames are derived on both sides.
export function slugifyDistrict(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

async function fetchJson(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`[worksLoader] ${path} -> HTTP ${response.status}`);
      return [];
    }
    return await response.json();
  } catch (err) {
    console.warn(`[worksLoader] failed to fetch ${path}:`, err);
    return [];
  }
}

async function fetchByKind(kind, name) {
  const slug = slugifyDistrict(name);
  if (!slug) return [];
  const cacheKey = `${kind}:${slug}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const promise = fetchJson(`/data/works/by-${kind}/${slug}.json`);
  cache.set(cacheKey, promise);
  const works = await promise;
  cache.set(cacheKey, works);
  return works;
}

// MP dashboard: scoped by real parliamentary constituency.
export function fetchWorksByConstituency(constituencyName) {
  return fetchByKind('constituency', constituencyName);
}

// District/State/Ministry dashboards: scoped by real true district.
export function fetchWorksByDistrict(districtName) {
  return fetchByKind('district', districtName);
}

export async function fetchWorksByDistricts(districtNames) {
  const unique = [...new Set((districtNames || []).filter(Boolean))];
  const results = await Promise.all(unique.map(fetchWorksByDistrict));
  return results.flat();
}

export function fetchTopRiskNationalSample() {
  if (!topRiskNationalPromise) {
    topRiskNationalPromise = fetchJson('/data/works/_topRiskNational.json');
  }
  return topRiskNationalPromise;
}
