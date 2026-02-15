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
          cases: "Fälle",
          updated: "Stand",
          offline: "Offline-Modus"
        }
      },
      en: {
        translation: {
          cases: "Cases",
          updated: "Updated",
          offline: "Offline mode"
        }
      }
    },
    interpolation: { escapeValue: false }
  });

export default i18n;
