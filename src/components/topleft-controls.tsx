import { useTranslation } from "react-i18next";
import type { Theme } from "../app/theme";

export function TopLeftControls({
  theme,
  onToggleTheme,
  colorblind,
  onToggleColorblind,
  onRecenter,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  colorblind: boolean;
  onToggleColorblind: () => void;
  onRecenter: () => void;
}) {
  const { i18n } = useTranslation();
  const isDe = i18n.language?.startsWith("de");

  return (
    <div className="leaflet-control leaflet-bar topleft-controls" role="group" aria-label="Map controls">
      <button
        type="button"
        onClick={() => i18n.changeLanguage(isDe ? "en" : "de")}
        aria-label={isDe ? "Sprache auf Englisch umstellen" : "Switch language to German"}
        title={isDe ? "Language: Deutsch" : "Language: English"}
      >
        {isDe ? "DE" : "EN"}
      </button>

      <button
        type="button"
        onClick={onToggleColorblind}
        aria-pressed={colorblind}
        aria-label={colorblind ? "Farbenblind-Modus deaktivieren" : "Farbenblind-Modus aktivieren"}
        title="Colorblind"
      >
        CB
      </button>

      <button
        type="button"
        onClick={onRecenter}
        aria-label={isDe ? "Karte zentrieren" : "Recenter map"}
        title={isDe ? "Zentrieren" : "Recenter"}
      >
        ⤾
      </button>

      <button
        type="button"
        onClick={onToggleTheme}
        aria-pressed={theme === "dark"}
        aria-label={theme === "dark" ? (isDe ? "Hellmodus aktivieren" : "Switch to light mode") : (isDe ? "Dunkelmodus aktivieren" : "Switch to dark mode")}
        title={theme === "dark" ? "Dark" : "Light"}
      >
        {theme === "dark" ? "☾" : "☀"}
      </button>
    </div>
  );
}