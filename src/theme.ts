// Light/dark theme handling.

import type { Theme } from "./types.ts";

const STORAGE_KEY = "cc-map-theme";

/** Determine the initial theme, honouring an optional config override. */
export function getInitialTheme(override?: Theme | null): Theme {
  if (override) return override;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Apply the theme to the document.
 * @param skipPersist If true, don't write to localStorage (used when
 *                    theme is forced via config and shouldn't persist).
 */
export function applyTheme(theme: Theme, skipPersist = false): void {
  document.documentElement.setAttribute("data-theme", theme);
  if (!skipPersist) {
    localStorage.setItem(STORAGE_KEY, theme);
  }
}

/** Toggle between light and dark. */
export function toggleTheme(current: Theme): Theme {
  return current === "dark" ? "light" : "dark";
}
