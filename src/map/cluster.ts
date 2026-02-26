import Supercluster from "supercluster";
import type { CaseEntry, CaseRating } from "../app/types";

export type ClusterPointProps = {
  caseId: string;
  title: string;
  short: string;
  rating?: CaseRating;
  url?: string;
  categories: string[];
};

export type BBox = [west: number, south: number, east: number, north: number];

export type ClusterItem = {
  kind: "cluster";
  id: number | string;
  clusterId: number;
  lat: number;
  lon: number;
  count: number;
};

export type PointItem = {
  kind: "point";
  id: string;
  lat: number;
  lon: number;
  title: string;
  short: string;
  rating?: CaseRating;
  url?: string;
  categories: string[];
};

export type MapItem = ClusterItem | PointItem;

export type ClusterIndex = {
  getClusters: (bbox: BBox, zoom: number) => MapItem[];
  getClusterExpansionZoom: (clusterId: number) => number;
  getClusterLeaves: (clusterId: number) => PointItem[];
};

type ClusterProps = {
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated?: string | number;
};

type PointProps = ClusterPointProps & { cluster?: false };

type GeoFeature<P> = {
  type: "Feature";
  id?: number | string;
  properties: P;
  geometry: { type: "Point"; coordinates: [number, number] };
};


/**
 * Simple deterministic hash → float in [0, 1).
 * Used to jitter co-located pins repeatably.
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
 * Offsets pins that share the exact same coordinates by a few hundred metres
 * in a deterministic direction based on case ID + location index.
 */
function jitterColocated(
  points: GeoFeature<PointProps>[]
): GeoFeature<PointProps>[] {
  // ~300m offset in degrees at ~50° latitude
  const OFFSET = 0.003;

  // Group by coordinate key
  const groups = new Map<string, number[]>();
  for (let i = 0; i < points.length; i++) {
    const [lon, lat] = points[i].geometry.coordinates;
    const key = `${lat},${lon}`;
    let g = groups.get(key);
    if (!g) {
      g = [];
      groups.set(key, g);
    }
    g.push(i);
  }

  // Only jitter groups with >1 point
  const result = points.map((p) => ({ ...p, geometry: { ...p.geometry, coordinates: [...p.geometry.coordinates] as [number, number] } }));
  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    for (const idx of indices) {
      const id = result[idx].properties.caseId;
      const angle = hashToFloat(id) * 2 * Math.PI;
      const dist = 0.5 + hashToFloat(id + ":r") * 0.5; // 50-100% of OFFSET
      result[idx].geometry.coordinates[0] += Math.cos(angle) * OFFSET * dist;
      result[idx].geometry.coordinates[1] += Math.sin(angle) * OFFSET * dist;
    }
  }
  return result;
}

export function buildIndex(cases: CaseEntry[]): ClusterIndex {
    const points: GeoFeature<PointProps>[] = cases.flatMap((c) =>
      c.locations.map((loc) => ({
        type: "Feature",
        properties: {
          caseId: c.id,
          title: c.title,
          short: c.short,
          rating: c.rating,
          url: c.url,
          categories: c.categories ?? [],
          cluster: false,
        },
        geometry: { type: "Point", coordinates: [loc.lon, loc.lat] },
      }))
    );

  const jittered = jitterColocated(points);

  const sc = new Supercluster<ClusterPointProps>({
    radius: 100,
    maxZoom: 16,
  });

  sc.load(jittered as any);

  return {
    getClusters: (bbox, zoom) => {
      const raw = sc.getClusters(bbox as any, zoom) as Array<GeoFeature<ClusterProps | PointProps>>;

      return raw.map((f) => {
        const [lon, lat] = f.geometry.coordinates;

        if ((f.properties as ClusterProps).cluster) {
          const cp = f.properties as ClusterProps;
          return {
            kind: "cluster",
            id: f.id ?? cp.cluster_id,
            clusterId: cp.cluster_id,
            lat,
            lon,
            count: cp.point_count,
          } satisfies ClusterItem;
        }

        const p = f.properties as PointProps;
        return {
          kind: "point",
          id: p.caseId,
          lat,
          lon,
          title: p.title,
          short: p.short,
          rating: p.rating,
          url: p.url,
          categories: p.categories ?? [],
        } satisfies PointItem;
      });
    },

    getClusterExpansionZoom: (clusterId) => sc.getClusterExpansionZoom(clusterId),

    getClusterLeaves: (clusterId) => {
      const leaves = sc.getLeaves(clusterId, Infinity) as Array<GeoFeature<PointProps>>;
      return leaves.map((f) => {
        const [lon, lat] = f.geometry.coordinates;
        const p = f.properties;
        return {
          kind: "point",
          id: p.caseId,
          lat,
          lon,
          title: p.title,
          short: p.short,
          rating: p.rating,
          url: p.url,
          categories: p.categories ?? [],
        } satisfies PointItem;
      });
    },
  };
}
