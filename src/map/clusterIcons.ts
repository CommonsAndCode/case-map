import L from "leaflet";

const cache = new Map<string, L.DivIcon>();

function bucket(count: number) {
  if (count < 10) return 0;
  if (count < 50) return 1;
  if (count < 200) return 2;
  if (count < 1000) return 3;
  return 4;
}

export function getClusterIcon(count: number) {
  const b = bucket(count);
  const key = `c:${b}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const size = [28, 34, 42, 52, 62][b];
  const icon = L.divIcon({
    className: "cluster-icon",
    html: `<div class="cluster-bubble" style="--s:${size}px"><span>${count}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  cache.set(key, icon);
  return icon;
}
