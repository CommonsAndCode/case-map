import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CaseEntry } from "../app/types";

export type CaseFilterState = {
  categories: string[];
};

export const DEFAULT_FILTER: CaseFilterState = {
  categories: [],
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

  const allCategories = useMemo(() => {
    const cats: string[] = [];
    for (const c of cases) for (const cat of c.categories ?? []) cats.push(cat);
    return uniqSorted(cats);
  }, [cases]);

  const hasActive = value.categories.length > 0;

  return (
    <div className="category-filter" role="region" aria-label={t("filterOptions")}>
      <div className="category-filter__header">
        <strong>{t("filter")}</strong>
        {hasActive && (
          <button
            type="button"
            className="category-filter__reset"
            onClick={() => (onClear ? onClear() : onChange(DEFAULT_FILTER))}
          >
            {t("reset")}
          </button>
        )}
      </div>

      <div className="category-filter__list">
        {allCategories.length === 0 ? (
          <span className="category-filter__hint">{t("noCategories")}</span>
        ) : (
          allCategories.map((cat) => {
            const checked = value.categories.includes(cat);
            return (
              <label key={cat} className={`category-filter__chip ${checked ? "is-active" : ""}`}>
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
  );
}

export function applyCaseFilter(cases: CaseEntry[], f: CaseFilterState): CaseEntry[] {
  return cases.filter((c) => {
    if (f.categories.length > 0) {
      const cats = c.categories ?? [];
      for (const sel of f.categories) if (!cats.includes(sel)) return false;
    }

    return true;
  });
}
