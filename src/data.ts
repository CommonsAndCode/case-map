// Data loading and transformation.
//
// Fetches cases.json, transforms the case array into a GeoJSON
// FeatureCollection (one Feature per location) for MapLibre's GeoJSON
// source. MapLibre's GeoJSON source does its own clustering; we only
// feed it the points.

import type { CaseEntry, FilterState } from "./types.ts";

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
 * Transform cases into a GeoJSON FeatureCollection, one Feature per
 * location. Co-located points are left at their exact coordinates —
 * MapLibre's native clustering handles them (cluster click → expand
 * or select first leaf).
 */
export function casesToGeoJSON(cases: CaseEntry[]): GeoJSON.FeatureCollection<
  GeoJSON.Point,
  CaseFeatureProps
> {
  const features: CaseFeature[] = [];
  for (const c of cases) {
    for (const loc of c.locations) {
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [loc.lon, loc.lat] },
        properties: {
          caseId: c.id,
          title: c.title,
          short: c.short,
          rating: c.rating ?? "unrated",
          url: c.url ?? "",
          categories: c.categories ?? [],
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

