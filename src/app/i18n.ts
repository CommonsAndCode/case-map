import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    resources: {
      de: {
        translation: {
          // Info panel
          cases: "Fälle",
          avgScore: "Ø Score",
          selectMarker: "Klicke auf einen Marker, um Details zu sehen.",
          score: "Score",
          categories: "Kategorien",
          updated: "Zuletzt aktualisiert",
          readFullCase: "Vollständigen Fall lesen",
          close: "Schließen",

          // Filter bar
          filter: "Filter",
          filterNone: "Keine",
          filterActive: "{{count}} aktiv",
          filterOptions: "Filteroptionen",
          search: "Suche",
          searchPlaceholder: "Titel / Kurztext …",
          language: "Sprache",
          allLanguages: "Alle",
          minScore: "Min. Score",
          reset: "Zurücksetzen",
          noCategories: "Keine Kategorien gefunden.",

          // Legend
          legendTitle: "Digitale Kommune Fallkarte",
          legendScore: "Score (1–100)",
          legendWorst: "1 · Schlecht",
          legendMixed: "50 · Gemischt",
          legendBest: "100 · Gut",
          legendMarkers: "Marker",
          legendSingle: "● Einzelner Fall",
          legendCluster: "◯ Zahl = Cluster",
          legendHint: "Klicke auf einen Marker, um den Fall zu erkunden.",

          // Footer
          privacy: "Datenschutz",
          imprint: "Impressum",
          noCookies: "Keine Cookies. Statische Seite.",

          // Controls
          switchToEn: "Sprache auf Englisch umstellen",
          switchToDe: "Sprache auf Deutsch umstellen",
          langLabelDe: "Deutsch",
          langLabelEn: "English",
          colorblindOn: "Farbenblind-Modus deaktivieren",
          colorblindOff: "Farbenblind-Modus aktivieren",
          recenter: "Karte zentrieren",
          lightMode: "Hellmodus aktivieren",
          darkMode: "Dunkelmodus aktivieren",

          // Loading / error
          offline: "Offline-Modus",
          errorTitle: "Fehler",
          errorLoadFailed: "Falldaten konnten nicht geladen werden.",
        },
      },
      en: {
        translation: {
          // Info panel
          cases: "Cases",
          avgScore: "Ø Score",
          selectMarker: "Select a marker to see details.",
          score: "Score",
          categories: "Categories",
          updated: "Updated",
          readFullCase: "Read full case",
          close: "Close",

          // Filter bar
          filter: "Filter",
          filterNone: "None",
          filterActive: "{{count}} active",
          filterOptions: "Filter options",
          search: "Search",
          searchPlaceholder: "Title / summary …",
          language: "Language",
          allLanguages: "All",
          minScore: "Min. Score",
          reset: "Reset",
          noCategories: "No categories found.",

          // Legend
          legendTitle: "Digital Municipality Case Map",
          legendScore: "Score (1–100)",
          legendWorst: "1 · Worst",
          legendMixed: "50 · Mixed",
          legendBest: "100 · Best",
          legendMarkers: "Markers",
          legendSingle: "● Single case",
          legendCluster: "◯ Numbered circle = cluster",
          legendHint: "Click a marker to explore the case.",

          // Footer
          privacy: "Privacy",
          imprint: "Imprint",
          noCookies: "No cookies. Static site.",

          // Controls
          switchToEn: "Switch language to English",
          switchToDe: "Switch language to German",
          langLabelDe: "Deutsch",
          langLabelEn: "English",
          colorblindOn: "Disable colourblind mode",
          colorblindOff: "Enable colourblind mode",
          recenter: "Recenter map",
          lightMode: "Switch to light mode",
          darkMode: "Switch to dark mode",

          // Loading / error
          offline: "Offline mode",
          errorTitle: "Error",
          errorLoadFailed: "Failed to load case data.",
        },
      },
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
