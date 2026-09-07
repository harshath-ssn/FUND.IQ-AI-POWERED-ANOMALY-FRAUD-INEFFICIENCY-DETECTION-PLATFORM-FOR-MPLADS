// Basemap tile sources (A4.4). OpenStreetMap standard is the default --
// requires no API key and stays muted enough for risk colours to read
// clearly. ArcGIS satellite is available as an OPT-IN overlay only, never
// the default analytical view, and we never claim "satellite verification"
// from it -- it's just imagery.
//
// Carto Positron is listed but NOT used as the default: as of this session,
// basemaps.cartocdn.com's free raster tiles return HTTP 200 with an "API KEY
// REQUIRED" watermark baked into the image instead of an actual basemap
// (verified by fetching a tile directly), so it no longer satisfies the
// "no API key" requirement. It's kept here, off by default, in case a
// project API key is configured later.

export const BASEMAPS = {
  osm: {
    id: 'osm',
    label: 'OpenStreetMap (default)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    maxZoom: 19,
  },
  positron: {
    id: 'positron',
    label: 'Positron (requires a Carto API key)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite imagery (optional)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 18,
  },
};

export const DEFAULT_BASEMAP = 'osm';
