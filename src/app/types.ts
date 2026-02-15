export type Location = {
  lat: number;
  lon: number;
  label?: string;
};

export type CaseEntry = {
  id: string;
  lang: string;
  title: string;
  short: string;
  categories: string[];
  score?: number;
  url?: string;
  locations: Location[];
  region?: any;
  updated?: string;
};
