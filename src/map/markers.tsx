import { Marker, Tooltip } from "react-leaflet";
import type { LeafletMouseEventHandlerFn } from "leaflet";
import { getPointIcon } from "../map/pointIcons.ts";
import { getClusterIcon } from "../map/clusterIcons.ts";
import type { CaseRating } from "../app/types.ts";
import { getRatingColor } from "../map/ratingColors.ts";

type CaseMarkerProps = {
  lat: number;
  lon: number;
  title?: string;
  short?: string;
  rating?: CaseRating;
  size?: number;
  onClick?: LeafletMouseEventHandlerFn;
};

export function CaseMarker({
  lat,
  lon,
  title,
  short,
  rating,
  size = 12,
  onClick,
}: CaseMarkerProps) {
  const color = getRatingColor(rating);

  return (
    <Marker
      position={[lat, lon]}
      icon={getPointIcon({ color, size })}
      eventHandlers={onClick ? { click: onClick } : undefined}
    >
      {title && (
        <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
          <strong>{title}</strong>
          {short && <div className="tooltip-short" style={{ marginTop: 2, fontSize: 13 }}>{short}</div>}
        </Tooltip>
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
