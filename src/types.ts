// Shared types for the case-map app.

export type Location = {
  lat: number;
  lon: number;
  label?: string;
};

/**
 * Rating categories for case studies.
 * - "best-practice"    — Exemplary implementation, clear positive impact
 * - "promising"        — Strong concept, evaluation pending or ongoing
 * - "flawed-execution" — Good idea, but implementation has significant issues
 * - "cautionary"       — Serves as a warning; harmful or counterproductive outcome
 * - "unrated"          — Not yet assessed
 */
export type CaseRating =
  | "best-practice"
  | "promising"
  | "flawed-execution"
  | "cautionary"
  | "unrated";

export type CaseEntry = {
  id: string;
  lang: string;
  title: string;
  short: string;
  categories: string[];
  rating?: CaseRating;
  url?: string;
  locations: Location[];
  updated?: string;
};

export type AppConfig = {
  /** Operating mode. "standalone" shows full chrome; "embed" hides it. */
  mode: "standalone" | "embed";
  /** URL to fetch cases.json from. */
  dataUrl: string;
  /** Override theme. null = system preference / localStorage. */
  theme: "light" | "dark" | null;
  /** Whether to show the dark/light toggle button. */
  showThemeToggle: boolean;
  /** Whether to show the logo in the detail panel. */
  showLogo: boolean;
  /** Logo image URL. null = no logo. */
  logoUrl: string | null;
  /** Logo click target URL. null = no link. */
  logoLink: string | null;
  /** Imprint page URL. null = no link. */
  imprintUrl: string | null;
  /** Privacy page URL. null = no link. */
  privacyUrl: string | null;
  /** Whether to show the footer. */
  showFooter: boolean;
  /** CSS colour override for the primary/accent colour. */
  primaryColor: string | null;
  /**
   * External tile loading behaviour.
   * - "on"  — load VersaTiles immediately (embedder declares consent)
   * - "off" — never load; use the bundled basemap only
   * - "ask" — show a "load tiles" button (default for standalone)
   */
  tiles: "on" | "off" | "ask";
  /** "Propose a case" link URL. null = no button. */
  proposeUrl: string | null;
};

export type Theme = "light" | "dark";

export type FilterState = {
  categories: string[];
  ratings: CaseRating[];
};
