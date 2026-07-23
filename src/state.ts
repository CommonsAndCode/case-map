// Minimal module-scope state with a pub/sub. Replaces React's useState/useEffect
// for the handful of values the app tracks: cases, selection, filter, theme,
// and tile consent. Listeners are notified on every change.

import type { CaseEntry, FilterState, Theme } from "./types.ts";

export const DEFAULT_FILTER: FilterState = {
  categories: [],
  ratings: [],
};

type State = {
  cases: CaseEntry[];
  filteredCases: CaseEntry[];
  selectedId: string | null;
  filter: FilterState;
  theme: Theme;
  /** Whether external VersaTiles have been loaded. */
  tilesLoaded: boolean;
  loading: boolean;
  error: string | null;
};

type Listener = (state: State) => void;

let state: State = {
  cases: [],
  filteredCases: [],
  selectedId: null,
  filter: DEFAULT_FILTER,
  theme: "light",
  tilesLoaded: false,
  loading: true,
  error: null,
};

const listeners = new Set<Listener>();

export function getState(): State {
  return state;
}

export function setState(patch: Partial<State>): void {
  state = { ...state, ...patch };
  for (const l of listeners) l(state);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Recompute filteredCases from cases + filter. Call after either changes. */
export function recomputeFiltered(cases: CaseEntry[], filter: FilterState): CaseEntry[] {
  return cases.filter((c) => {
    if (filter.ratings.length > 0) {
      const r = c.rating ?? "unrated";
      if (!filter.ratings.includes(r)) return false;
    }
    if (filter.categories.length > 0) {
      const cats = c.categories ?? [];
      for (const sel of filter.categories) {
        if (!cats.includes(sel)) return false;
      }
    }
    return true;
  });
}
