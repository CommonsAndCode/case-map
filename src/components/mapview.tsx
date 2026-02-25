import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { createPortal } from "react-dom";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import type { LatLngBoundsExpression } from "leaflet";

import type { CaseEntry } from "../app/types";
import { lightTile, darkTile } from "../map/tiles";
import { buildIndex } from "../map/cluster";
import type { ClusterIndex, MapItem, BBox } from "../map/cluster";
import { CaseMarker, ClusterMarker } from "../map/markers";

const EUROPE_BOUNDS: LatLngBoundsExpression = [
  [28, -25],
  [72, 60],
];

function useRafThrottle<T extends (...args: any[]) => void>(fn: T) {
  const rafRef = useRef<number | null>(null);
  const lastArgsRef = useRef<any[]>([]);

  return useCallback(
    (...args: any[]) => {
      lastArgsRef.current = args;
      if (rafRef.current != null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        fn(...(lastArgsRef.current as Parameters<T>));
      });
    },
    [fn]
  );
}

function MapApiBridge({
  onMapReady,
  bounds,
}: {
  onMapReady?: (api: { recenter: () => void }) => void;
  bounds: LatLngBoundsExpression;
}) {
  const map = useMap();
  const didInitRef = useRef(false);

  const onMapReadyRef = useRef(onMapReady);
  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    map.setMaxBounds(bounds);

    if (didInitRef.current) return;
    didInitRef.current = true;

    map.fitBounds(bounds, { padding: [20, 20], animate: false });

    onMapReadyRef.current?.({
      recenter: () => {
        map.fitBounds(bounds, { padding: [20, 20], animate: true });
      },
    });
  }, [map, bounds]);

  return null;
}

function ClusterSync({
  index,
  onItems,
}: {
  index: ClusterIndex;
  onItems: (items: MapItem[]) => void;
}) {
  const map = useMap();

  const update = useCallback(() => {
    const b = map.getBounds();
    const bbox: BBox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    const zoom = map.getZoom();
    onItems(index.getClusters(bbox, zoom));
  }, [map, index, onItems]);

  const updateThrottled = useRafThrottle(update);

  useMapEvents({
    move: updateThrottled,
    zoom: updateThrottled,
  });

  useEffect(() => {
    update();
  }, [update]);

  return null;
}

function ItemsLayer({
  items,
  index,
  onSelectCase,
}: {
  items: MapItem[];
  index: ClusterIndex;
  onSelectCase: (id: string) => void;
}) {
  const map = useMap();

  return (
    <>
      {items.map((item) => {
        if (item.kind === "cluster") {
          return (
            <ClusterMarker
              key={`c_${item.id}`}
              lat={item.lat}
              lon={item.lon}
              count={item.count}
              onClick={() => {
                const currentZoom = map.getZoom();
                const nextZoom = Math.min(
                  index.getClusterExpansionZoom(item.clusterId),
                  18
                );
                // If we can't zoom further (co-located points), select the first case
                if (nextZoom <= currentZoom) {
                  const leaves = index.getClusterLeaves(item.clusterId);
                  if (leaves.length > 0) {
                    onSelectCase(leaves[0].id);
                  }
                } else {
                  map.setView([item.lat, item.lon], nextZoom, { animate: true });
                }
              }}
            />
          );
        }

        return (
          <CaseMarker
            key={`p_${item.id}`}
            lat={item.lat}
            lon={item.lon}
            title={item.title}
            short={item.short}
            rating={item.rating}
            onClick={() => onSelectCase(item.id)}
          />
        );
      })}
    </>
  );
}

function TopLeftPortal({
  children,
  className = "topleft-controls",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const map = useMap();
  const [cornerEl, setCornerEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = map.getContainer();
    const corner = root.querySelector<HTMLElement>(".leaflet-top.leaflet-left");
    setCornerEl(corner ?? null);
  }, [map]);

  if (!cornerEl) return null;

  return createPortal(
    <div className={className}>
      {children}
    </div>,
    cornerEl
  );
}

export function MapView({
  cases,
  theme,
  onSelectCase,
  onMapReady,
  topLeftControls,
}: {
  cases: CaseEntry[];
  theme: "light" | "dark";
  onSelectCase: (id: string) => void;
  onMapReady?: (api: { recenter: () => void }) => void;

  topLeftControls?: React.ReactNode;
}) {
  const index = useMemo(() => buildIndex(cases), [cases]);
  const [items, setItems] = useState<MapItem[]>([]);

  const tile = theme === "dark" ? darkTile : lightTile;

  return (
    <MapContainer
      bounds={EUROPE_BOUNDS}
      boundsOptions={{ padding: [20, 20] }}
      minZoom={4}
      maxZoom={18}
      maxBounds={EUROPE_BOUNDS}
      maxBoundsViscosity={0.5}
      worldCopyJump={true}
      preferCanvas={true}
      style={{ height: "100vh", width: "100%" }}
    >
      <MapApiBridge onMapReady={onMapReady} bounds={EUROPE_BOUNDS} />

      <TileLayer
        url={tile.url}
        attribution={tile.attribution}
      />

      {topLeftControls ? (
        <TopLeftPortal>
          {topLeftControls}
        </TopLeftPortal>
      ) : null}

      <ClusterSync index={index} onItems={setItems} />
      <ItemsLayer items={items} index={index} onSelectCase={onSelectCase} />
    </MapContainer>
  );
}
