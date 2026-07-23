// Controls — map UI buttons and the "load detailed tiles" consent dialog.
//
// Floating overlays on the map:
// 1. Top-right: propose-a-case (+) primary CTA, theme toggle, recenter.
// 2. Centered: "load detailed tiles" consent dialog (until opted in).

import type { AppConfig, Theme } from "./types.ts";
import { t } from "./i18n.ts";
import { sanitiseUrl } from "./config.ts";
import type { MapController } from "./map.ts";

const TILES_STORAGE_KEY = "cc-map-tiles-consent";

export interface ControlsController {
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

  // --- Top-right control group ---
  const topRight = document.createElement("div");
  topRight.className = "floating-controls floating-controls--topright";
  topRight.setAttribute("role", "group");
  topRight.setAttribute("aria-label", t("appTitle"));
  container.appendChild(topRight);

  // Propose-a-case (+) — primary CTA, highlighted.
  const proposeUrl = config.proposeUrl
    ? sanitiseUrl(config.proposeUrl)
    : null;
  if (proposeUrl) {
    const proposeLink = document.createElement("a");
    proposeLink.href = proposeUrl;
    proposeLink.target = "_blank";
    proposeLink.rel = "noopener";
    proposeLink.className = "control-btn control-btn--propose";
    proposeLink.textContent = "+";
    proposeLink.setAttribute("aria-label", t("proposeCase"));
    proposeLink.title = t("proposeCase");
    topRight.appendChild(proposeLink);
  }

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
    themeBtn.title = isDark ? "Light" : "Dark";
  }
  themeBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "dark" ? "light" : "dark";
    updateThemeBtn();
    onThemeChange(currentTheme);
  });
  updateThemeBtn();
  if (config.showThemeToggle) topRight.appendChild(themeBtn);

  // Recenter.
  const recenterBtn = document.createElement("button");
  recenterBtn.type = "button";
  recenterBtn.className = "control-btn";
  recenterBtn.textContent = "⤾";
  recenterBtn.setAttribute("aria-label", t("recenter"));
  recenterBtn.title = t("recenter");
  recenterBtn.addEventListener("click", () => mapController.recenter());
  topRight.appendChild(recenterBtn);

  // --- Centered: "load detailed tiles" consent dialog ---
  let tilesPrompt: HTMLElement | null = null;

  if (config.tiles === "ask") {
    tilesPrompt = document.createElement("div");
    tilesPrompt.className = "tiles-prompt";
    tilesPrompt.setAttribute("role", "dialog");
    tilesPrompt.setAttribute("aria-modal", "false");
    tilesPrompt.setAttribute("aria-labelledby", "tiles-prompt-title");

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "tiles-prompt__close";
    closeBtn.setAttribute("aria-label", t("close"));
    closeBtn.textContent = "✕";
    tilesPrompt.appendChild(closeBtn);

    const promptTitle = document.createElement("h2");
    promptTitle.id = "tiles-prompt-title";
    promptTitle.className = "tiles-prompt__title";
    promptTitle.textContent = t("loadTiles");
    tilesPrompt.appendChild(promptTitle);

    const promptHint = document.createElement("p");
    promptHint.className = "tiles-prompt__hint";

    const safePrivacy = config.privacyUrl
      ? sanitiseUrl(config.privacyUrl)
      : null;
    if (safePrivacy) {
      const link = document.createElement("a");
      link.href = safePrivacy;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = t("privacy");
      const suffix = __LANG__ === "de" ? " für Details." : " for details.";
      promptHint.append(t("loadTilesHint"), " ");
      promptHint.appendChild(link);
      promptHint.appendChild(document.createTextNode(suffix));
    } else {
      promptHint.textContent = t("loadTilesHint");
    }
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
    container.appendChild(tilesPrompt);

    const dismiss = (): void => {
      if (tilesPrompt) tilesPrompt.hidden = true;
    };

    tilesBtn.addEventListener("click", () => {
      mapController.loadTiles();
      if (rememberCheckbox.checked) {
        localStorage.setItem(TILES_STORAGE_KEY, "granted");
      } else {
        localStorage.removeItem(TILES_STORAGE_KEY);
      }
      dismiss();
      onTilesLoad();
    });

    closeBtn.addEventListener("click", dismiss);
  }

  return {
    setTilesLoaded(_loaded: boolean) {
      if (tilesPrompt && _loaded) tilesPrompt.hidden = true;
    },
  };
}

/** Whether the visitor previously granted tile loading. */
export function tilesConsentRemembered(): boolean {
  return localStorage.getItem(TILES_STORAGE_KEY) === "granted";
}
