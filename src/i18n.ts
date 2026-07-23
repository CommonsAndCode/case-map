// Runtime i18n helper. Strings are baked in at build time via __LOCALE__
// (see vite.config.ts); there is no runtime language switching.

import type { CaseRating } from "./types.ts";

/** Look up a UI string. Falls back to the key itself. */
export function t(key: string, vars?: Record<string, string | number>): string {
  let s: string = __LOCALE__.strings[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
    }
  }
  return s;
}

/** Localise a category slug → label for the current build language. */
export function tCategory(slug: string): string {
  const map = __LOCALE__.categories;
  return map[slug]?.[__LANG__] ?? slug;
}

/** Localise a rating key → label for the current build language. */
export function tRating(rating: CaseRating): string {
  return t(`rating.${rating}`);
}

export const LANG = __LANG__;
