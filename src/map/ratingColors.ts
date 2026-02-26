import type { CaseRating } from "../app/types";

/**
 * CSS custom property names for each rating.
 * Resolved at runtime so they respect dark mode overrides.
 */
const RATING_VARS: Record<CaseRating, string> = {
  "best-practice": "--rating-best-practice",
  "promising": "--rating-promising",
  "flawed-execution": "--rating-flawed-execution",
  "cautionary": "--rating-cautionary",
  "unrated": "--rating-unrated",
};

/** All rating values in display order. */
export const ALL_RATINGS: CaseRating[] = [
  "best-practice",
  "promising",
  "flawed-execution",
  "cautionary",
  "unrated",
];

/** Get the resolved CSS colour for a rating. */
export function getRatingColor(rating: CaseRating | undefined): string {
  const varName = RATING_VARS[rating ?? "unrated"];
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "#888";
}

/** Get the CSS var() reference for a rating (for inline styles). */
export function getRatingColorVar(rating: CaseRating | undefined): string {
  const varName = RATING_VARS[rating ?? "unrated"];
  return `var(${varName})`;
}
