// Entry point. Wires together config, theme, data, map, list, detail,
// filter, controls, and footer. All UI is built imperatively into the
// #app container; there is no framework.

import "./styles/app.css";
import { parseConfig } from "./config.ts";
import { getInitialTheme, applyTheme } from "./theme.ts";
import { fetchCases } from "./data.ts";
import {
  getState,
  setState,
  subscribe,
  recomputeFiltered,
  DEFAULT_FILTER,
} from "./state.ts";
import { initMap, type MapController } from "./map.ts";
import { initList } from "./list.ts";
import { initDetail } from "./detail.ts";
import { initFilter } from "./filter.ts";
import { initControls, tilesConsentRemembered } from "./controls.ts";
import { initFooter } from "./footer.ts";
import { t } from "./i18n.ts";
import type { Theme } from "./types.ts";

async function main(): Promise<void> {
  const config = parseConfig(window.location.search);
  const initialTheme = getInitialTheme(config.theme);
  applyTheme(initialTheme, config.theme != null);

  // Apply primary colour override.
  if (config.primaryColor) {
    document.documentElement.style.setProperty("--cc-primary", config.primaryColor);
  }

  // --- Build DOM structure ---
  const app = document.getElementById("app")!;
  app.innerHTML = "";

  // Map container (visual path). ARIA set in map.ts via the container.
  const mapEl = document.createElement("div");
  mapEl.id = "map";
  mapEl.className = "map";
  mapEl.setAttribute("role", "application");
  mapEl.setAttribute("aria-roledescription", "map");
  mapEl.setAttribute("aria-label", t("appTitle"));
  app.appendChild(mapEl);

  // Visually-hidden instructions for screen readers / keyboard users.
  const instructions = document.createElement("p");
  instructions.className = "visually-hidden";
  instructions.textContent = t("mapInstructions");
  app.appendChild(instructions);

  // Top-left controls (theme, recenter, load tiles).
  const controlsEl = document.createElement("div");
  controlsEl.className = "controls-overlay controls-overlay--topleft";
  app.appendChild(controlsEl);

  // Detail panel (right side).
  const detailEl = document.createElement("div");
  detailEl.id = "detail";
  app.appendChild(detailEl);

  // Case list (a11y primary path, bottom or side).
  const listEl = document.createElement("div");
  listEl.id = "case-list";
  listEl.className = "case-list";
  app.appendChild(listEl);

  // Footer (standalone only).
  if (config.showFooter) {
    const footerEl = document.createElement("footer");
    footerEl.id = "footer";
    app.appendChild(footerEl);
    initFooter(footerEl, config);
  }

  // --- Initialise modules ---
  setState({ theme: initialTheme, loading: true });

  let mapController: MapController | null = null;

  // Selection handler: open detail + fly map + set active list item.
  const onSelect = (id: string): void => {
    const state = getState();
    const entry = state.cases.find((c) => c.id === id) ?? null;
    setState({ selectedId: id });
    if (entry) {
      const trigger = document.querySelector<HTMLButtonElement>(
        `.case-list__button[data-case-id="${CSS.escape(id)}"]`,
      );
      detail.open(entry, trigger ?? undefined);
      mapController?.flyToCase(entry);
    }
  };

  const detail = initDetail(detailEl, config);
  const list = initList(listEl, onSelect);

  // Filter change handler: update state + map + list.
  const onFilterChange = (filter: typeof DEFAULT_FILTER): void => {
    const state = getState();
    const filtered = recomputeFiltered(state.cases, filter);
    setState({ filter, filteredCases: filtered });
    mapController?.setFilter(filter);
    list.render(filtered);
  };

  // Mount the filter popover into the case list header.
  const filterCtl = initFilter(list.headerEl, onFilterChange);

  // Initialise the map. WebGL-unavailable → list-only fallback.
  try {
    mapController = initMap(
      mapEl,
      initialTheme,
      [],
      DEFAULT_FILTER,
      onSelect,
    );
  } catch {
    mapEl.hidden = true;
    controlsEl.hidden = true;
    const notice = document.createElement("p");
    notice.className = "webgl-notice";
    notice.textContent = t("webglUnavailable");
    app.insertBefore(notice, listEl);
  }

  // Controls (need mapController + theme callback).
  const onThemeChange = (next: Theme): void => {
    const state = getState();
    applyTheme(next, config.theme != null);
    setState({ theme: next });
    mapController?.setTheme(next, state.cases, state.filter);
  };
  if (mapController) {
    initControls(controlsEl, config, mapController, initialTheme, onThemeChange, () => {
      setState({ tilesLoaded: true });
    });

    // If config says tiles=on (embedder declared consent) or the visitor
    // previously remembered consent, load tiles immediately.
    if (config.tiles === "on" || tilesConsentRemembered()) {
      mapController.loadTiles();
      setState({ tilesLoaded: true });
    }
  }

  // --- Load data ---
  try {
    const cases = await fetchCases(config.dataUrl);
    const filtered = recomputeFiltered(cases, DEFAULT_FILTER);
    setState({ cases, filteredCases: filtered, loading: false });
    list.render(filtered);
    filterCtl.setCases(cases);
    mapController?.setCases(cases, DEFAULT_FILTER);
  } catch (err) {
    console.error(err);
    setState({ loading: false, error: t("errorLoadFailed") });
    const errorEl = document.createElement("div");
    errorEl.className = "error-overlay";
    errorEl.setAttribute("role", "alert");
    const strong = document.createElement("strong");
    strong.textContent = t("errorTitle");
    const msg = document.createElement("div");
    msg.textContent = t("errorLoadFailed");
    msg.style.marginTop = "8px";
    errorEl.append(strong, msg);
    app.appendChild(errorEl);
  }

  // Clear selection when it leaves the filtered set.
  subscribe((state) => {
    if (state.selectedId && !state.filteredCases.some((c) => c.id === state.selectedId)) {
      setState({ selectedId: null });
      detail.close();
    }
  });
}

void main();
