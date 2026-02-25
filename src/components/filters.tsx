import { useMemo, useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { CaseEntry, CaseRating } from "../app/types";
import { ALL_RATINGS, getRatingColorVar } from "../map/ratingColors";

const MAX_CATEGORIES = 12;

export type CaseFilterState = {
  categories: string[];
  ratings: CaseRating[];
};

export const DEFAULT_FILTER: CaseFilterState = {
  categories: [],
  ratings: [],
};

type Props = {
  cases: CaseEntry[];
  value: CaseFilterState;
  onChange: (next: CaseFilterState) => void;
  onClear?: () => void;
};

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

export function FilterBar({ cases, value, onChange, onClear }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const allCategories = useMemo(() => {
    const cats: string[] = [];
    for (const c of cases) for (const cat of c.categories ?? []) cats.push(cat);
    return uniqSorted(cats).slice(0, MAX_CATEGORIES);
  }, [cases]);

  const presentRatings = useMemo(() => {
    const set = new Set<CaseRating>();
    for (const c of cases) set.add(c.rating ?? "unrated");
    return ALL_RATINGS.filter((r) => set.has(r));
  }, [cases]);

  const activeCount = value.categories.length + value.ratings.length;

  return (
    <div
      ref={ref}
      className={`filter-dropdown ${open ? "is-open" : ""}`}
      role="region"
      aria-label={t("filterOptions")}
    >
      <button
        type="button"
        className="filter-dropdown__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{t("filter")}</span>
        {activeCount > 0 && (
          <span className="filter-dropdown__badge">{activeCount}</span>
        )}
        <span className="filter-dropdown__chevron" aria-hidden>▾</span>
      </button>

      <div className="filter-dropdown__panel">
        {activeCount > 0 && (
          <div style={{ textAlign: "right", marginBottom: 4 }}>
            <button
              type="button"
              className="filter-dropdown__reset"
              onClick={() => (onClear ? onClear() : onChange(DEFAULT_FILTER))}
            >
              {t("reset")}
            </button>
          </div>
        )}

        {/* Rating filter */}
        <div className="filter-dropdown__section-label">{t("rating")}</div>
        <div className="filter-dropdown__list">
          {presentRatings.map((rating) => {
            const checked = value.ratings.includes(rating);
            return (
              <label key={rating} className={`filter-dropdown__chip ${checked ? "is-active" : ""}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? value.ratings.filter((r) => r !== rating)
                      : [...value.ratings, rating];
                    onChange({ ...value, ratings: next });
                  }}
                />
                <span
                  className="rating-chip__dot"
                  style={{ background: getRatingColorVar(rating) }}
                />
                <span>{t(`rating.${rating}`)}</span>
              </label>
            );
          })}
        </div>

        {/* Category filter */}
        <div className="filter-dropdown__section-label">{t("categories")}</div>
        <div className="filter-dropdown__list">
          {allCategories.length === 0 ? (
            <span className="filter-dropdown__hint">{t("noCategories")}</span>
          ) : (
            allCategories.map((cat) => {
              const checked = value.categories.includes(cat);
              return (
                <label key={cat} className={`filter-dropdown__chip ${checked ? "is-active" : ""}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? value.categories.filter((x) => x !== cat)
                        : [...value.categories, cat];
                      onChange({ ...value, categories: next });
                    }}
                  />
                  <span>{cat}</span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function applyCaseFilter(cases: CaseEntry[], f: CaseFilterState): CaseEntry[] {
  return cases.filter((c) => {
    if (f.ratings.length > 0) {
      const r = c.rating ?? "unrated";
      if (!f.ratings.includes(r)) return false;
    }

    if (f.categories.length > 0) {
      const cats = c.categories ?? [];
      for (const sel of f.categories) if (!cats.includes(sel)) return false;
    }

    return true;
  });
}
