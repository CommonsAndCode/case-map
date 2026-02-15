import L from "leaflet";

const cache = new Map<string, L.DivIcon>();

export function getPointIcon(opts: { color: string; size?: number }) {
  const size = opts.size ?? 12;
  const key = `p:${opts.color}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const icon = L.divIcon({
    className: "case-dot-icon",
    html: `<span class="case-dot" style="--dot:${size}px;--c:${opts.color}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  cache.set(key, icon);
  return icon;
}
