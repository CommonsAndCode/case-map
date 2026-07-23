// Controls — map UI buttons.
//
// - "Load detailed map tiles": privacy opt-in. Loads VersaTiles vector
//   tiles (an external server). Optional "remember" checkbox persists
//   the choice to localStorage for auto-load on next visit.
// - Theme toggle: light/dark.
// - Recenter: return to the default bounds.
// - Fullscreen: toggle fullscreen.
//
// MapLibre's built-in NavigationControl provides +/- zoom buttons.

import type { AppConfig, Theme } from "./types.ts";
import { t } from "./i18n.ts";
import type { MapController } from "./map.ts";

const TILES_STORAGE_KEY = "cc-map-tiles-consent";

export interface ControlsController {
  /** Update the tile button state after loading. */
  setTilesLoaded: (loaded: boolean) => void;
}

export function initControls(
  container: HTMLElement,
  config: AppConfig,
  mapController: MapController,
  theme: Theme,
  onThemeChange: (next: Theme) => void,
  onTilesLoad: () => void,
): ControlsController {
  container.className = "topleft-controls";
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", t("appTitle"));

  // --- Load detailed tiles button + remember checkbox ---
  const tilesBtn = document.createElement("button");
  tilesBtn.type = "button";
  tilesBtn.className = "control-btn control-btn--tiles";
  tilesBtn.textContent = t("loadTiles");
  tilesBtn.title = t("loadTilesHint");

  const rememberLabel = document.createElement("label");
  rememberLabel.className = "tiles-remember";
  const rememberCheckbox = document.createElement("input");
  rememberCheckbox.type = "checkbox";
  const rememberText = document.createElement("span");
  rememberText.textContent = t("rememberChoice");
  rememberLabel.append(rememberCheckbox, rememberText);

  tilesBtn.addEventListener("click", () => {
    mapController.loadTiles();
    if (rememberCheckbox.checked) {
      localStorage.setItem(TILES_STORAGE_KEY, "granted");
    }
    setTilesLoaded(true);
    onTilesLoad();
  });

  // --- Theme toggle ---
  let currentTheme = theme;
  const themeBtn = document.createElement("button");
  themeBtn.type = "button";
  themeBtn.className = "control-btn";
  function updateThemeBtn(): void {
    const isDark = currentTheme === "dark";
    themeBtn.textContent = isDark ? "☾" : "☀";
    themeBtn.setAttribute("aria-pressed", isDark ? "true" : "false");
    themeBtn.setAttribute(
      "aria-label",
      isDark ? t("lightMode") : t("darkMode"),
    );
    themeBtn.title = isDark ? "Dark" : "Light";
  }
  themeBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    updateThemeBtn();
    onThemeChange(currentTheme);
  });
  updateThemeBtn();

  // --- Recenter ---
  const recenterBtn = document.createElement("button");
  recenterBtn.type = "button";
  recenterBtn.className = "control-btn";
  recenterBtn.textContent = "⤾";
  recenterBtn.setAttribute("aria-label", t("recenter"));
  recenterBtn.title = t("recenter");
  recenterBtn.addEventListener("click", () => mapController.recenter());

  // Only show theme toggle if configured.
  if (config.showThemeToggle) {
    container.appendChild(themeBtn);
  }
  container.appendChild(recenterBtn);

  // Tiles button is shown when tiles config is "ask" and tiles not yet loaded.
  const tilesContainer = document.createElement("div");
  tilesContainer.className = "tiles-control";
  tilesContainer.append(tilesBtn);
  if (config.tiles === "ask") {
    tilesContainer.appendChild(rememberLabel);
  }
  container.appendChild(tilesContainer);

  function setTilesLoaded(loaded: boolean): void {
    if (loaded) {
      tilesBtn.textContent = t("tilesLoaded");
      tilesBtn.disabled = true;
      rememberLabel.hidden = true;
    }
  }

  return { setTilesLoaded };
}

/** Whether the visitor previously granted tile loading. */
export function tilesConsentRemembered(): boolean {
  return localStorage.getItem(TILES_STORAGE_KEY) === "granted";
}
