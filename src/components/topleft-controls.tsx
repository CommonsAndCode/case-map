import { useTranslation } from "react-i18next";
import type { Theme } from "../app/theme";

export function TopLeftControls({
  theme,
  onToggleTheme,
  colorblind,
  onToggleColorblind,
  onRecenter,
  showThemeToggle = true,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  colorblind: boolean;
  onToggleColorblind: () => void;
  onRecenter: () => void;
  showThemeToggle?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const isDe = i18n.language?.startsWith("de");

  return (
    <div className="leaflet-control leaflet-bar topleft-controls" role="group" aria-label="Map controls">
      <button
        type="button"
        onClick={() => i18n.changeLanguage(isDe ? "en" : "de")}
        aria-label={isDe ? t("switchToEn") : t("switchToDe")}
        title={isDe ? t("langLabelDe") : t("langLabelEn")}
      >
        {isDe ? "DE" : "EN"}
      </button>

      <button
        type="button"
        onClick={onToggleColorblind}
        aria-pressed={colorblind}
        aria-label={colorblind ? t("colorblindOn") : t("colorblindOff")}
        title="Colorblind"
      >
        CB
      </button>

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
