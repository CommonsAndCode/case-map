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
  region?: any;
  updated?: string;
};
