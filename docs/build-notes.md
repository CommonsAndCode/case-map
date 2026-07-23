# Build notes

Historical record of build and architecture changes. For current setup
see `README.md`; for the product spec see `SPECS.md`.

## February 2026 — configurable standalone/embed mode

The map works both as a standalone app (`map.commons-and-code.eu`) and as
an embedded iframe. All configuration is via URL parameters — no server
state, purely static files.

- Standalone mode (default): full UI with logo, footer, theme toggle.
- Embed mode (`?mode=embed`): UI chrome hidden.
- `dataUrl` parameter points the map at a `cases.json` from the Hugo site.
- `lang` / `theme` / `color` / `logo` / `logoLink` / `imprintUrl` /
  `privacyUrl` parameters override defaults.

## February 2026 — containerisation & deployment

- `Dockerfile` + `nginx.conf`: the map is served as a container behind
  nginx at `map.commons-and-code.eu`. iframe embedding is restricted to
  `commons-and-code.eu` and `*.preview.commons-and-code.eu` via CSP
  `frame-ancestors`.
- `.github/workflows/docker-build.yml` builds and pushes the image to
  `ghcr.io/commonsandcode/case-map`.
- `vite.config.ts`: `base` is configurable via `VITE_BASE_PATH` (standard
  `./`, GitHub Pages would use `/case-map/`). Previously hardcoded to
  `/case-map/`, which produced a blank page on local `npm run build`.
- Font paths in CSS changed from `/case-map/fonts/...` to `/fonts/...`
  (Vite prepends the base path at build time).

## February 2026 — Phase 2 UI simplifications

- Rating categories replaced the numerical 0–100 score. `CaseRating` has
  five values: `best-practice`, `promising`, `flawed-execution`,
  `cautionary`, `unrated`.
- The collapsible "N cases · Ø score" panel was removed; the InfoPanel
  shows only the logo and, on selection, case details with rating badge,
  categories, and a link to the full article.
- The complex filter bar (text search, language select, min-score) was
  replaced by a simple category + rating filter.
- The legend and colourblind mode were removed (standard colours are
  sufficiently contrast-rich).
- Language toggle is hidden when `lang` is set in the URL (typical for
  embed mode).
- Marker popups show the case URL as an external link.

## Planned — vanilla TS + MapLibre + VersaTiles rework

See the rework plan in the repository history / project tracking. Key
changes from the February 2026 state:

- React + react-leaflet + supercluster + i18next → vanilla TypeScript +
  MapLibre GL + VersaTiles. Single runtime dependency (`maplibre-gl`).
- Runtime i18n → build-time i18n (`VITE_LANG=de|en` → `dist/de`,
  `dist/en`).
- German-category tags in content → canonical language-neutral slugs
  with a `slug → {de, en}` label map in the app.
- External tiles load on page load → fallback-first: a bundled
  TopoJSON basemap is used by default; VersaTiles loads only on explicit
  opt-in (`&tiles=on` or the "Load detailed map tiles" control).
- `jekyll-gh-pages.yml` removed (dead legacy).
