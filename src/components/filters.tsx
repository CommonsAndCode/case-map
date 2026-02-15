import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { CaseEntry } from "../app/types";

export type CaseFilterState = {
  q: string;
  categories: string[];
  lang: string;
  minScore: number;
};

export const DEFAULT_FILTER: CaseFilterState = {
  q: "",
  categories: [],
  lang: "",
  minScore: 0,
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

function countActiveFilters(f: CaseFilterState) {
  let n = 0;
  if (f.q.trim()) n++;
  if (f.lang) n++;
  if ((f.minScore ?? 0) > 0) n++;
  if (f.categories.length > 0) n++;
  return n;
}

export function FilterBar({ cases, value, onChange, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const allCategories = useMemo(() => {
    const cats: string[] = [];
    for (const c of cases) for (const cat of c.categories ?? []) cats.push(cat);
    return uniqSorted(cats);
  }, [cases]);

  const allLangs = useMemo(() => {
    const langs = cases.map((c) => c.lang).filter(Boolean) as string[];
    return uniqSorted(langs);
  }, [cases]);

  const activeCount = useMemo(() => countActiveFilters(value), [value]);

  useEffect(() => {
    if (!open) return;

    const onDown = (e: Event) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`filterbar2 ${open ? "is-open" : "is-closed"}`}
      onMouseDown={stop}
      onTouchStart={stop}
      onTouchMove={stop}
      onWheel={stop}
    >
      <button
        type="button"
        className="filterbar2__toggle"
        aria-expanded={open}
        aria-controls="filterbar2-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="filterbar2__title">Filter</span>

        <span className="filterbar2__summary">
          {activeCount === 0 ? "Keine" : `${activeCount} aktiv`}
        </span>

        <span className="filterbar2__chev" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          id="filterbar2-panel"
          className="filterbar2__panel"
          role="region"
          aria-label="Filteroptionen"
        >
          <div className="filterbar2__grid">
            <label className="filterbar2__field">
              <span className="filterbar2__label">Suche</span>
              <input
                type="search"
                className="filterbar2__input"
                placeholder="Titel / Kurztext …"
                value={value.q}
                onChange={(e) => onChange({ ...value, q: e.target.value })}
              />
            </label>

            <label className="filterbar2__field">
              <span className="filterbar2__label">Sprache</span>
              <select
                className="filterbar2__select"
                value={value.lang}
                onChange={(e) => onChange({ ...value, lang: e.target.value })}
              >
                <option value="">Alle</option>
                {allLangs.map((l) => (
                  <option key={l} value={l}>
                    {l.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="filterbar2__field">
              <span className="filterbar2__label">Min. Score</span>
              <input
                className="filterbar2__input"
                type="number"
                min={0}
                max={100}
                step={1}
                inputMode="numeric"
                value={value.minScore}
                onChange={(e) =>
                  onChange({ ...value, minScore: Number(e.target.value) || 0 })
                }
              />
            </label>

            <div className="filterbar2__actions">
              <button
                type="button"
                className="filterbar2__clear"
                onClick={() => (onClear ? onClear() : onChange(DEFAULT_FILTER))}
              >
                Zurücksetzen
              </button>
            </div>
          </div>

          <div className="filterbar2__cats" aria-label="Kategorien">
            {allCategories.length === 0 ? (
              <span className="filterbar2__hint">Keine Kategorien gefunden.</span>
            ) : (
              allCategories.map((cat) => {
                const checked = value.categories.includes(cat);
                return (
                  <label key={cat} className="filterbar2__chip">
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
      )}
    </div>
  );
}

export function applyCaseFilter(cases: CaseEntry[], f: CaseFilterState): CaseEntry[] {
  const q = f.q.trim().toLowerCase();

  return cases.filter((c) => {
    if (f.lang && c.lang !== f.lang) return false;
    if ((c.score ?? 0) < (f.minScore ?? 0)) return false;

    if (f.categories.length > 0) {
      const cats = c.categories ?? [];
      for (const sel of f.categories) if (!cats.includes(sel)) return false;
    }

    if (q) {
      const hay = `${c.title ?? ""} ${c.short ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    return true;
  });
}
