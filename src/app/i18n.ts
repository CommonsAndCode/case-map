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
          selectMarker: "Klicke auf einen Marker, um Details zu sehen.",
          rating: "Bewertung",
          categories: "Kategorien",
          updated: "Zuletzt aktualisiert",
          readFullCase: "Vollständigen Fall lesen",
          close: "Schließen",

          // Ratings
          "rating.best-practice": "Erfolgsbeispiel",
          "rating.promising": "Vielversprechend",
          "rating.flawed-execution": "Guter Ansatz, schwache Umsetzung",
          "rating.cautionary": "Negativbeispiel",
          "rating.unrated": "Noch nicht bewertet",

          // Filter sidebar
          filter: "Filter",
          filterNone: "Keine",
          filterActive: "{{count}} aktiv",
          filterOptions: "Filteroptionen",
          allCategories: "Alle Kategorien",
          noCategories: "Keine Kategorien gefunden.",
          reset: "Zurücksetzen",

          // Footer
          privacy: "Datenschutz",
          imprint: "Impressum",
          noCookies: "Keine Cookies. Statische Seite.",

          // Controls
          recenter: "Karte zentrieren",
          lightMode: "Hellmodus aktivieren",
          darkMode: "Dunkelmodus aktivieren",
          switchToEn: "Sprache auf Englisch umstellen",
          switchToDe: "Sprache auf Deutsch umstellen",
          langLabelDe: "Deutsch",
          langLabelEn: "English",

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
          selectMarker: "Select a marker to see details.",
          rating: "Rating",
          categories: "Categories",
          updated: "Updated",
          readFullCase: "Read full case",
          close: "Close",

          // Ratings
          "rating.best-practice": "Best practice",
          "rating.promising": "Promising",
          "rating.flawed-execution": "Good idea, weak execution",
          "rating.cautionary": "Cautionary example",
          "rating.unrated": "Not yet rated",

          // Filter sidebar
          filter: "Filter",
          filterNone: "None",
          filterActive: "{{count}} active",
          filterOptions: "Filter options",
          allCategories: "All categories",
          noCategories: "No categories found.",
          reset: "Reset",

          // Footer
          privacy: "Privacy",
          imprint: "Imprint",
          noCookies: "No cookies. Static site.",

          // Controls
          recenter: "Recentre map",
          lightMode: "Switch to light mode",
          darkMode: "Switch to dark mode",
          switchToEn: "Switch language to English",
          switchToDe: "Switch language to German",
          langLabelDe: "Deutsch",
          langLabelEn: "English",

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
