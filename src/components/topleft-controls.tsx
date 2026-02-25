import { useTranslation } from "react-i18next";
import type { Theme } from "../app/theme";
import { useConfig } from "../app/ConfigContext";

export function TopLeftControls({
  theme,
  onToggleTheme,
  onRecenter,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  onRecenter: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { showThemeToggle, showLanguageToggle } = useConfig();
  const isDe = i18n.language?.startsWith("de");

  return (
    <div className="leaflet-control leaflet-bar topleft-controls" role="group" aria-label="Map controls">
      {showLanguageToggle && (
        <button
          type="button"
          onClick={() => i18n.changeLanguage(isDe ? "en" : "de")}
          aria-label={isDe ? t("switchToEn") : t("switchToDe")}
          title={isDe ? t("langLabelDe") : t("langLabelEn")}
        >
          {isDe ? "DE" : "EN"}
        </button>
      )}

      <button
        type="button"
        onClick={onRecenter}
        aria-label={t("recenter")}
        title={t("recenter")}
      >
        ⤾
      </button>

      {showThemeToggle && (
        <button
          type="button"
          onClick={onToggleTheme}
          aria-pressed={theme === "dark"}
          aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
          title={theme === "dark" ? "Dark" : "Light"}
        >
          {theme === "dark" ? "☾" : "☀"}
        </button>
      )}
    </div>
  );
}
