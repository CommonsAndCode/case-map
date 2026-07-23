// Build both language variants (de, en) into dist/de and dist/en.
//
// Each build bakes in UI strings, the html lang attribute, the matching
// VersaTiles style files, and the default dataUrl via VITE_LANG.
//
// Run with: node scripts/build.mjs
import { execSync } from "node:child_process";

const LANGS = ["de", "en"];

for (const lang of LANGS) {
  console.log(`\n=== Building ${lang} ===`);
  execSync(`tsc --noEmit`, { stdio: "inherit" });
  execSync(`vite build --outDir dist/${lang}`, {
    stdio: "inherit",
    env: { ...process.env, VITE_LANG: lang },
  });
}

console.log(`\n=== Done. Built: ${LANGS.map((l) => `dist/${l}`).join(", ")} ===`);
