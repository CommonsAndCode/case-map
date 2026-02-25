export type Theme = "light" | "dark";

/**
 * Determine the initial theme.
 * @param override - If provided, use this theme directly (config-driven).
 *                   Otherwise fall back to localStorage, then system preference.
 */
export function getInitialTheme(override?: Theme): Theme {
  if (override) return override;

  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Apply the theme to the document.
 * @param theme - The theme to apply.
 * @param skipPersist - If true, don't write to localStorage (used when
 *                      theme is forced via config and shouldn't be persisted).
 */
export function applyTheme(theme: Theme, skipPersist = false) {
  document.documentElement.setAttribute("data-theme", theme);
  if (!skipPersist) {
    localStorage.setItem("theme", theme);
  }
}
