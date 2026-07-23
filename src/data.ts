// Data loading and transformation.
//
// Fetches cases.json, transforms the case array into a GeoJSON
// FeatureCollection (one Feature per location) for MapLibre's GeoJSON
// source. Co-located points are jittered apart so they don't stack
// exactly on top of each other. The jittered coordinates are stored
// in the feature properties so the map can fly to the actual marker
// position rather than the original location.

import type { CaseEntry, FilterState } from "./types.ts";

export type CaseFeatureProps = {
  caseId: string;
  title: string;
  short: string;
  rating: string;
  url: string;
  categories: string[];
  /** Actual (jittered) coordinates of this marker. */
  lon: number;
  lat: number;
};

export type CaseFeature = GeoJSON.Feature<
  GeoJSON.Point,
  CaseFeatureProps
>;

/** Fetch cases.json from the given URL. Throws on HTTP/error. */
export async function fetchCases(dataUrl: string): Promise<CaseEntry[]> {
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as CaseEntry[];
}

/**
 * Filter cases by the given filter state (same logic as state.ts
 * recomputeFiltered, but kept here so the map module can filter the
 * GeoJSON source data directly — necessary for clustering to work
 * correctly with filters).
 */
export function filterCasesForMap(
  cases: CaseEntry[],
  filter: FilterState,
): CaseEntry[] {
  return cases.filter((c) => {
    if (filter.ratings.length > 0) {
      const r = c.rating ?? "unrated";
      if (!filter.ratings.includes(r)) return false;
    }
    if (filter.categories.length > 0) {
      const cats = c.categories ?? [];
      for (const sel of filter.categories) {
        if (!cats.includes(sel)) return false;
      }
    }
    return true;
  });
}

/**
 * Simple deterministic hash → float in [0, 1).
 */
function hashToFloat(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Offset pins that share the exact same coordinates by a few hundred
 * metres in a deterministic direction based on case ID + location index.
 */
function jitterColocated(
  points: { coords: [number, number]; caseId: string; locIndex: number }[],
): [number, number][] {
  const OFFSET = 0.003;

  const groups = new Map<string, number[]>();
  for (let i = 0; i < points.length; i++) {
    const [lon, lat] = points[i].coords;
    const key = `${lat},${lon}`;
    let g = groups.get(key);
    if (!g) {
      g = [];
      groups.set(key, g);
    }
    g.push(i);
  }

  const result = points.map((p) => [...p.coords] as [number, number]);
  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    for (const idx of indices) {
      const seed = `${points[idx].caseId}:${points[idx].locIndex}`;
      const angle = hashToFloat(seed) * 2 * Math.PI;
      const dist = 0.5 + hashToFloat(seed + ":r") * 0.5;
      result[idx][0] += Math.cos(angle) * OFFSET * dist;
      result[idx][1] += Math.sin(angle) * OFFSET * dist;
    }
  }
  return result;
}

/**
 * Transform cases into a GeoJSON FeatureCollection, one Feature per
 * location. Co-located pins are jittered apart deterministically. The
 * jittered coordinates are also stored in properties (lon/lat) so the
 * map can fly to the actual marker position.
 */
export function casesToGeoJSON(cases: CaseEntry[]): GeoJSON.FeatureCollection<
  GeoJSON.Point,
  CaseFeatureProps
> {
  const flat: {
    coords: [number, number];
    caseId: string;
    locIndex: number;
    entry: CaseEntry;
  }[] = [];

  for (const c of cases) {
    for (let i = 0; i < c.locations.length; i++) {
      const loc = c.locations[i];
      flat.push({
        coords: [loc.lon, loc.lat],
        caseId: c.id,
        locIndex: i,
        entry: c,
      });
    }
  }

  const jittered = jitterColocated(flat);

  const features: CaseFeature[] = flat.map((p, i) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: jittered[i] },
    properties: {
      caseId: p.entry.id,
      title: p.entry.title,
      short: p.entry.short,
      rating: p.entry.rating ?? "unrated",
      url: p.entry.url ?? "",
      categories: p.entry.categories ?? [],
      lon: jittered[i][0],
      lat: jittered[i][1],
    },
  }));

  return { type: "FeatureCollection", features };
}
