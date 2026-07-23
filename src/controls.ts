// Controls — map UI buttons.
//
// Two separate UI elements:
// 1. A small top-left control group (theme toggle, recenter).
// 2. A prominent, centered "load detailed tiles" prompt shown over the
//    fallback basemap until the user opts in. Explains that loading
//    detailed tiles fetches data from a third-party server (VersaTiles),
//    with an optional "remember this choice" checkbox.
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
  container.className = "controls-root";

  // --- Small top-left control group (theme toggle, recenter) ---
  const smallGroup = document.createElement("div");
  smallGroup.className = "topleft-controls";
  smallGroup.setAttribute("role", "group");
  smallGroup.setAttribute("aria-label", t("appTitle"));
  container.appendChild(smallGroup);

  // Theme toggle.
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

  // Recenter.
  const recenterBtn = document.createElement("button");
  recenterBtn.type = "button";
  recenterBtn.className = "control-btn";
  recenterBtn.textContent = "⤾";
  recenterBtn.setAttribute("aria-label", t("recenter"));
  recenterBtn.title = t("recenter");
  recenterBtn.addEventListener("click", () => mapController.recenter());

  if (config.showThemeToggle) {
    smallGroup.appendChild(themeBtn);
  }
  smallGroup.appendChild(recenterBtn);

  // Propose-a-case link (external URL → opens in a new tab).
  if (config.proposeUrl) {
    const proposeLink = document.createElement("a");
    proposeLink.href = config.proposeUrl;
    proposeLink.target = "_blank";
    proposeLink.rel = "noopener";
    proposeLink.className = "control-btn control-btn--propose";
    proposeLink.textContent = "+";
    proposeLink.setAttribute("aria-label", t("proposeCase"));
    proposeLink.title = t("proposeCase");
    smallGroup.appendChild(proposeLink);
  }

  // --- Prominent "load detailed tiles" prompt (centered overlay) ---
  const tilesPrompt = document.createElement("div");
  tilesPrompt.className = "tiles-prompt";
  tilesPrompt.setAttribute("role", "dialog");
  tilesPrompt.setAttribute("aria-labelledby", "tiles-prompt-title");

  const promptTitle = document.createElement("h2");
  promptTitle.id = "tiles-prompt-title";
  promptTitle.className = "tiles-prompt__title";
  promptTitle.textContent = t("loadTiles");
  tilesPrompt.appendChild(promptTitle);

  const promptHint = document.createElement("p");
  promptHint.className = "tiles-prompt__hint";
  promptHint.textContent = t("loadTilesHint");
  tilesPrompt.appendChild(promptHint);

  const promptActions = document.createElement("div");
  promptActions.className = "tiles-prompt__actions";

  const tilesBtn = document.createElement("button");
  tilesBtn.type = "button";
  tilesBtn.className = "tiles-prompt__button";
  tilesBtn.textContent = t("loadTiles");

  const rememberLabel = document.createElement("label");
  rememberLabel.className = "tiles-remember";
  const rememberCheckbox = document.createElement("input");
  rememberCheckbox.type = "checkbox";
  const rememberText = document.createElement("span");
  rememberText.textContent = t("rememberChoice");
  rememberLabel.append(rememberCheckbox, rememberText);

  promptActions.append(tilesBtn, rememberLabel);
  tilesPrompt.appendChild(promptActions);

  tilesBtn.addEventListener("click", () => {
    mapController.loadTiles();
    if (rememberCheckbox.checked) {
      localStorage.setItem(TILES_STORAGE_KEY, "granted");
    } else {
      // Explicitly clear any stale consent so next visit asks again.
      localStorage.removeItem(TILES_STORAGE_KEY);
    }
    setTilesLoaded(true);
    onTilesLoad();
  });

  // Only show the prompt when tiles config is "ask" and not yet loaded.
  if (config.tiles === "ask") {
    container.appendChild(tilesPrompt);
  }

  function setTilesLoaded(loaded: boolean): void {
    if (loaded) {
      tilesPrompt.hidden = true;
    }
  }

  return { setTilesLoaded };
}

/** Whether the visitor previously granted tile loading. */
export function tilesConsentRemembered(): boolean {
  return localStorage.getItem(TILES_STORAGE_KEY) === "granted";
}
