import Supercluster from "supercluster";
import type { CaseEntry } from "../app/types";

export type ClusterPointProps = {
  caseId: string;
  title: string;
  short: string;
  score?: number;
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
  score?: number;
  categories: string[];
};

export type MapItem = ClusterItem | PointItem;

export type ClusterIndex = {
  getClusters: (bbox: BBox, zoom: number) => MapItem[];
  getClusterExpansionZoom: (clusterId: number) => number;
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


export function buildIndex(cases: CaseEntry[]): ClusterIndex {
    const points: GeoFeature<PointProps>[] = cases.flatMap((c) =>
      c.locations.map((loc) => ({
        type: "Feature",
        properties: {
          caseId: c.id,
          title: c.title,
          short: c.short,
          score: c.score,
          categories: c.categories ?? [],
          cluster: false,
        },
        geometry: { type: "Point", coordinates: [loc.lon, loc.lat] },
      }))
    );

  const sc = new Supercluster<ClusterPointProps>({
    radius: 60,
    maxZoom: 18,
  });

  sc.load(points as any);

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
          score: p.score,
          categories: p.categories ?? [],
        } satisfies PointItem;
      });
    },

    getClusterExpansionZoom: (clusterId) => sc.getClusterExpansionZoom(clusterId),
  };
}
