// Data loading and transformation.
//
// Fetches cases.json, transforms the case array into a GeoJSON
// FeatureCollection (one Feature per location) for MapLibre's GeoJSON
// source, and applies a deterministic jitter to co-located pins so they
// don't stack exactly on top of each other at high zoom.
//
// MapLibre's GeoJSON source does its own clustering; we only feed it the
// points. The jitter replaces the old supercluster-based jitter in
// cluster.ts and is kept identical (same hash function + offset math)
// so existing pin placement is preserved.

import type { CaseEntry } from "./types.ts";

export type CaseFeatureProps = {
  caseId: string;
  title: string;
  short: string;
  rating: string;
  url: string;
  categories: string[];
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
 * Simple deterministic hash → float in [0, 1).
 * Used to jitter co-located pins repeatably. (Kept from the original
 * cluster.ts so pin placement is unchanged.)
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
  points: { coords: [number, number]; caseId: string }[],
): [number, number][] {
  // ~300m offset in degrees at ~50° latitude.
  const OFFSET = 0.003;

  // Group by coordinate key.
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
      const id = points[idx].caseId;
      const angle = hashToFloat(id) * 2 * Math.PI;
      const dist = 0.5 + hashToFloat(id + ":r") * 0.5; // 50–100% of OFFSET
      result[idx][0] += Math.cos(angle) * OFFSET * dist;
      result[idx][1] += Math.sin(angle) * OFFSET * dist;
    }
  }
  return result;
}

/**
 * Transform cases into a GeoJSON FeatureCollection, one Feature per
 * location, with co-located pins jittered apart.
 */
export function casesToGeoJSON(cases: CaseEntry[]): GeoJSON.FeatureCollection<
  GeoJSON.Point,
  CaseFeatureProps
> {
  const flat: { coords: [number, number]; caseId: string; entry: CaseEntry }[] =
    [];
  for (const c of cases) {
    for (const loc of c.locations) {
      flat.push({
        coords: [loc.lon, loc.lat],
        caseId: c.id,
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
    },
  }));

  return { type: "FeatureCollection", features };
}
