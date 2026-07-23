import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Build-time language. Injected by scripts/build.mjs (de | en).
const LANG = process.env.VITE_LANG || "en";

// Load the locale file for this build. Strings are baked in at build time;
// there is no runtime i18n.
const localePath = fileURLToPath(
  new URL(`src/locales/${LANG}.json`, import.meta.url),
);
const locale = JSON.parse(readFileSync(localePath, "utf8"));

// Resolve text for a data-i18n key, with the key as fallback.
function t(key) {
  return locale.strings[key] ?? key;
}

// Small plugin to bake i18n strings into index.html at build time.
function i18nHtmlPlugin() {
  return {
    name: "i18n-html",
    transformIndexHtml(html) {
      // Replace <html lang="__LANG__">
      html = html.replace(/lang="__LANG__"/, `lang="${LANG}"`);
      // Replace data-i18n="key" elements' text content.
      html = html.replace(
        /data-i18n="([^"]+)"[^>]*>([^<]*)</g,
        (_, key, _inner) => `data-i18n="${key}">${t(key)}<`,
      );
      return html;
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "./",

  define: {
    __LANG__: JSON.stringify(LANG),
    __LOCALE__: JSON.stringify(locale),
  },

  plugins: [i18nHtmlPlugin()],
});
