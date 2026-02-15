import { Marker, Popup } from "react-leaflet";
import type { LeafletMouseEventHandlerFn } from "leaflet";
import { getPointIcon } from "../map/pointIcons.ts";
import { getClusterIcon } from "../map/clusterIcons.ts";

type CaseMarkerProps = {
  lat: number;
  lon: number;
  title?: string;
  short?: string;
  color?: string;
  size?: number;
  onClick?: LeafletMouseEventHandlerFn;
};

export function CaseMarker({
  lat,
  lon,
  title,
  short,
  color = "#2a6df4",
  size = 12,
  onClick,
}: CaseMarkerProps) {
  return (
    <Marker
      position={[lat, lon]}
      icon={getPointIcon({ color, size })}
      eventHandlers={onClick ? { click: onClick } : undefined}
    >
      {(title || short) && (
        <Popup>
          {title && <strong>{title}</strong>}
          {short && <div>{short}</div>}
        </Popup>
      )}
    </Marker>
  );
}

type ClusterMarkerProps = {
  lat: number;
  lon: number;
  count: number;
  onClick?: LeafletMouseEventHandlerFn;
};

export function ClusterMarker({ lat, lon, count, onClick }: ClusterMarkerProps) {
  return (
    <Marker
      position={[lat, lon]}
      icon={getClusterIcon(count)}
      eventHandlers={onClick ? { click: onClick } : undefined}
    />
  );
}
