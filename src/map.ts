// MapLibre GL map initialisation and management.
//
// Responsibilities:
// - Create the MapLibre Map with the bundled world-outline basemap as
//   the default (no external network calls until the user opts in).
// - Add the cases GeoJSON source with clustering enabled, plus the
//   cluster + unclustered-point layers (rating colours via CSS vars).
// - Handle cluster click → expansion, and cluster-at-maxzoom → select
//   the first leaf (co-located points that can't be zoomed into further).
// - Swap the VersaTiles style on theme change, re-adding the cases
//   source/layers afterwards (setStyle wipes custom layers).
// - Expose loadTileSource() to opt into loading external VersaTiles
//   vector tiles (privacy fallback-first design).

import "maplibre-gl/dist/maplibre-gl.css";
import {
  Map,
  setWorkerUrl,
  type Map as MapType,
  type GeoJSONSource,
  type FilterSpecification,
  type ExpressionSpecification,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import type { CaseEntry, FilterState, Theme } from "./types.ts";
import type { CaseFeatureProps } from "./data.ts";
import { casesToGeoJSON } from "./data.ts";

setWorkerUrl(workerUrl);

const BASE_URL = import.meta.env.BASE_URL;

// Europe-focused bounds [[west, south], [east, north]] for maxBounds.
// MapLibre uses [lng, lat] order (NOT Leaflet's [lat, lng]).
const EUROPE_BOUNDS: [[number, number], [number, number]] = [
  [-25, 28],
  [60, 72],
];

// Cluster + point layer IDs (kept stable across style swaps).
const CASES_SOURCE = "cc-cases";
const CLUSTERS_LAYER = "cc-clusters";
const CLUSTER_COUNT_LAYER = "cc-cluster-count";
const UNCLUSTERED_LAYER = "cc-unclustered-points";

// Rating → CSS custom property name. Resolved at runtime via
// getComputedStyle so dark-mode overrides apply. MapLibre expressions
// do NOT support CSS var(); we must pass literal color strings.
const RATING_VARS: Record<string, string> = {
  "best-practice": "--rating-best-practice",
  "promising": "--rating-promising",
  "flawed-execution": "--rating-flawed-execution",
  "cautionary": "--rating-cautionary",
  "unrated": "--rating-unrated",
};

const ALL_RATINGS = Object.keys(RATING_VARS);

/** Resolve a CSS custom property to a literal color string. */
function cssVar(name: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    "#888"
  );
}

function ratingColorMatch(): ExpressionSpecification {
  // MapLibre 'match' expression: ["match", ["get","rating"], <rating>, <color>, ..., fallback]
  const match: (string | ExpressionSpecification)[] = [];
  for (const r of ALL_RATINGS) {
    match.push(r, cssVar(RATING_VARS[r]));
  }
  match.push(cssVar(RATING_VARS["unrated"]));
  return ["match", ["get", "rating"], ...match] as unknown as ExpressionSpecification;
}

function resolveStyleUrl(theme: Theme): string {
  const style = theme === "dark" ? "eclipse" : "colorful";
  return `${BASE_URL}styles/${style}.${__LANG__}.json`;
}

/**
 * Add (or re-add) the cases source + cluster/point layers to the map.
 * Must be called after every setStyle(), which wipes custom layers.
 */
function addCasesLayers(
  map: MapType,
  cases: CaseEntry[],
  filter: FilterState,
): void {
  const geojson = casesToGeoJSON(cases);

  map.addSource(CASES_SOURCE, {
    type: "geojson",
    data: geojson as unknown as GeoJSON.GeoJSON,
    cluster: true,
    clusterMaxZoom: 16,
    clusterRadius: 50,
  });

  // Cluster bubbles.
  map.addLayer({
    id: CLUSTERS_LAYER,
    type: "circle",
    source: CASES_SOURCE,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": cssVar("--cc-primary"),
      "circle-radius": [
        "step",
        ["get", "point_count"],
        16,
        10,
        22,
        50,
        28,
        200,
        34,
      ],
      "circle-stroke-width": 2,
      "circle-stroke-color": cssVar("--app-content-bg"),
      "circle-opacity": 0.85,
    },
  });

  // Cluster count labels.
  map.addLayer({
    id: CLUSTER_COUNT_LAYER,
    type: "symbol",
    source: CASES_SOURCE,
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": cssVar("--text-inverse-color"),
    },
  });

  // Individual (unclustered) case points.
  map.addLayer({
    id: UNCLUSTERED_LAYER,
    type: "circle",
    source: CASES_SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ratingColorMatch(),
      "circle-radius": 7,
      "circle-stroke-width": 1.5,
      "circle-stroke-color": cssVar("--app-content-bg"),
      "circle-opacity": 0.95,
    },
  });

  applyFilter(map, filter);
}

/** Apply the category+rating filter to the unclustered-points layer. */
export function applyFilter(map: MapType, filter: FilterState): void {
  if (!map.getLayer(UNCLUSTERED_LAYER)) return;

  const conditions: FilterSpecification[] = [["all"]];

  if (filter.ratings.length > 0) {
    // ratings is an OR over the selected ratings.
    const ratingMatch = [
      "match",
      ["get", "rating"],
      ...filter.ratings,
      true,
      false,
    ] as unknown as FilterSpecification;
    conditions.push(ratingMatch);
  }

  if (filter.categories.length > 0) {
    // categories is an AND over selected categories (case must have all).
    for (const cat of filter.categories) {
      conditions.push(
        ["in", cat, ["get", "categories"]] as unknown as FilterSpecification,
      );
    }
  }

  // Clusters always pass the filter; only unclustered points are filtered.
  map.setFilter(
    UNCLUSTERED_LAYER,
    (conditions.length > 1 ? conditions : null) as FilterSpecification | null,
  );
}

/**
 * Wire cluster + point click handlers. Called once after layers are added.
 */
function wireClickHandlers(
  map: MapType,
  onSelectCase: (id: string) => void,
): void {
  // Cluster click → expand, or select first leaf if co-located at max zoom.
  map.on("click", CLUSTERS_LAYER, (e) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: [CLUSTERS_LAYER],
    });
    const cluster = features[0];
    if (!cluster?.properties?.cluster_id) return;
    const clusterId = cluster.properties.cluster_id as number;
    const source = map.getSource(CASES_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    const currentZoom = map.getZoom();
    source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
      const nextZoom = Math.min(zoom, 18);
      if (nextZoom <= currentZoom) {
        // Co-located points: can't zoom further → select first leaf.
        source.getClusterLeaves(clusterId, Infinity, 0).then((leaves) => {
          const first = leaves[0] as unknown as {
            properties: CaseFeatureProps;
          };
          if (first?.properties?.caseId) onSelectCase(first.properties.caseId);
        });
      } else {
        const coords = (cluster.geometry as GeoJSON.Point).coordinates;
        map.easeTo({ center: coords as [number, number], zoom: nextZoom });
      }
    });
  });

  // Point click → select case.
  map.on("click", UNCLUSTERED_LAYER, (e) => {
    const feature = e.features?.[0] as unknown as
      | { properties: CaseFeatureProps }
      | undefined;
    if (feature?.properties?.caseId) {
      onSelectCase(feature.properties.caseId);
    }
  });

  // Cursor feedback.
  map.on("mouseenter", CLUSTERS_LAYER, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", CLUSTERS_LAYER, () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("mouseenter", UNCLUSTERED_LAYER, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", UNCLUSTERED_LAYER, () => {
    map.getCanvas().style.cursor = "";
  });
}

export interface MapController {
  map: MapType;
  /** Update the cases data (re-run on data/filter change). */
  setCases: (cases: CaseEntry[], filter: FilterState) => void;
  /** Update only the filter (cheaper than setCases). */
  setFilter: (filter: FilterState) => void;
  /** Swap to a new theme (light/dark). Re-adds cases layers. */
  setTheme: (theme: Theme, cases: CaseEntry[], filter: FilterState) => void;
  /** Recenter to the default bounds. */
  recenter: () => void;
  /** Fly to a case's first location. */
  flyToCase: (entry: CaseEntry) => void;
  /** Load external VersaTiles vector tiles (opt-in). */
  loadTiles: () => void;
  /** Remove the map and clean up. */
  destroy: () => void;
}

/**
 * Initialise the map. Returns a controller for imperative updates.
 * The map starts with the bundled world-outline basemap only — no
 * external tile requests are made until loadTiles() is called.
 */
export function initMap(
  container: HTMLElement,
  theme: Theme,
  cases: CaseEntry[],
  filter: FilterState,
  onSelectCase: (id: string) => void,
): MapController {
  const map = new Map({
    container,
    style: {
      version: 8,
      sources: {
        "basemap-outline": {
          type: "geojson",
          data: `${BASE_URL}basemap/world-outline.geojson`,
        },
      },
      layers: [
        {
          id: "background",
          type: "background",
          paint: { "background-color": cssVar("--app-bg") },
        },
        {
          id: "country-outline",
          type: "line",
          source: "basemap-outline",
          paint: {
            "line-color": cssVar("--app-border-color"),
            "line-width": ["interpolate", ["linear"], ["zoom"], 0, 0.5, 6, 1],
            "line-opacity": 0.7,
          },
        },
      ],
    },
    center: [10, 50],
    zoom: 3,
    minZoom: 3,
    maxZoom: 18,
    maxBounds: EUROPE_BOUNDS,
    cooperativeGestures: true,
    attributionControl: { compact: true },
  });

  map.on("load", () => {
    addCasesLayers(map, cases, filter);
    wireClickHandlers(map, onSelectCase);
  });

  return {
    map,
    setCases(nextCases: CaseEntry[], nextFilter: FilterState) {
      const source = map.getSource(CASES_SOURCE) as
        | GeoJSONSource
        | undefined;
      if (source) {
        source.setData(casesToGeoJSON(nextCases) as unknown as GeoJSON.GeoJSON);
        applyFilter(map, nextFilter);
      }
    },
    setFilter(nextFilter: FilterState) {
      applyFilter(map, nextFilter);
    },
    setTheme(nextTheme: Theme, nextCases: CaseEntry[], nextFilter: FilterState) {
      map.once("style.load", () => {
        addCasesLayers(map, nextCases, nextFilter);
        wireClickHandlers(map, onSelectCase);
      });
      map.setStyle(resolveStyleUrl(nextTheme));
    },
    recenter() {
      const reduced = prefersReducedMotion();
      const fn = reduced ? "jumpTo" : "easeTo";
      map[fn]({
        center: [10, 50],
        zoom: 3,
      });
    },
    flyToCase(entry: CaseEntry) {
      if (entry.locations.length === 0) return;
      const loc = entry.locations[0];
      const reduced = prefersReducedMotion();
      if (reduced) {
        map.jumpTo({ center: [loc.lon, loc.lat], zoom: 12 });
      } else {
        map.flyTo({ center: [loc.lon, loc.lat], zoom: 12 });
      }
    },
    loadTiles() {
      // Swapping to the VersaTiles style wipes the basemap + cases layers;
      // re-add the cases layers on the new style's load.
      map.once("style.load", () => {
        addCasesLayers(map, cases, filter);
        wireClickHandlers(map, onSelectCase);
      });
      map.setStyle(resolveStyleUrl(theme));
    },
    destroy() {
      map.remove();
    },
  };
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
