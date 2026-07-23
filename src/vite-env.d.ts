/// <reference types="vite/client" />

// Build-time constants injected by vite.config.ts.
declare const __LANG__: "de" | "en";
declare const __LOCALE__: Locale;

// Shape of the locale files in src/locales/{de,en}.json
interface Locale {
  strings: Record<string, string>;
  categories: Record<string, { de: string; en: string }>;
}
