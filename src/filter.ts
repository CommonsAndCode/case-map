// Filter — category + rating checkboxes in a dropdown.
//
// Builds the available categories/ratings from the loaded cases, tracks
// the active selection, and notifies on change. The filter applies to
// both the map (unclustered-points layer) and the list.

import type { CaseEntry, CaseRating, FilterState } from "./types.ts";
import { t, tCategory, tRating } from "./i18n.ts";

const MAX_CATEGORIES = 12;

const ALL_RATINGS: CaseRating[] = [
  "best-practice",
  "promising",
  "flawed-execution",
  "cautionary",
  "unrated",
];

export interface FilterController {
  /** Rebuild the available options from the loaded cases. */
  setCases: (cases: CaseEntry[]) => void;
  /** Update the active filter state (without firing onChange). */
  setFilter: (filter: FilterState) => void;
}

/**
 * Build the filter dropdown into the given container.
 * onChange is called with the new FilterState whenever the user toggles
 * a checkbox.
 */
export function initFilter(
  container: HTMLElement,
  onChange: (filter: FilterState) => void,
): FilterController {
  container.className = "filter-dropdown";
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", t("filterOptions"));

  let currentCases: CaseEntry[] = [];
  let currentFilter: FilterState = { categories: [], ratings: [] };
  let open = false;

  // --- Build static structure ---
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "filter-dropdown__toggle";
  toggle.setAttribute("aria-expanded", "false");
  const toggleLabel = document.createElement("span");
  toggleLabel.textContent = t("filter");
  const toggleBadge = document.createElement("span");
  toggleBadge.className = "filter-dropdown__badge";
  toggleBadge.hidden = true;
  const toggleChevron = document.createElement("span");
  toggleChevron.className = "filter-dropdown__chevron";
  toggleChevron.setAttribute("aria-hidden", "true");
  toggleChevron.textContent = "▾";
  toggle.append(toggleLabel, toggleBadge, toggleChevron);
  container.appendChild(toggle);

  const panel = document.createElement("div");
  panel.className = "filter-dropdown__panel";
  panel.hidden = true;
  container.appendChild(panel);

  toggle.addEventListener("click", () => setOpen(!open));

  // Close on outside click.
  document.addEventListener("mousedown", (e) => {
    if (open && !container.contains(e.target as Node)) setOpen(false);
  });

  function setOpen(next: boolean): void {
    open = next;
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function activeCount(): number {
    return currentFilter.categories.length + currentFilter.ratings.length;
  }

  function renderPanel(): void {
    panel.innerHTML = "";

    // Reset button (only when filters active).
    const count = activeCount();
    if (count > 0) {
      const resetWrap = document.createElement("div");
      resetWrap.className = "filter-dropdown__reset-wrap";
      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "filter-dropdown__reset";
      reset.textContent = t("reset");
      reset.addEventListener("click", () => {
        currentFilter = { categories: [], ratings: [] };
        renderPanel();
        onChange(currentFilter);
      });
      resetWrap.appendChild(reset);
      panel.appendChild(resetWrap);
    }

    // Rating filter section.
    const ratingLabel = document.createElement("div");
    ratingLabel.className = "filter-dropdown__section-label";
    ratingLabel.textContent = t("rating");
    panel.appendChild(ratingLabel);

    const ratingList = document.createElement("div");
    ratingList.className = "filter-dropdown__list";

    const presentRatings = new Set<CaseRating>();
    for (const c of currentCases) presentRatings.add(c.rating ?? "unrated");
    for (const r of ALL_RATINGS) {
      if (!presentRatings.has(r)) continue;
      ratingList.appendChild(makeChip({
        label: tRating(r),
        checked: currentFilter.ratings.includes(r),
        onToggle: (checked) => {
          currentFilter.ratings = checked
            ? [...currentFilter.ratings, r]
            : currentFilter.ratings.filter((x) => x !== r);
          renderPanel();
          onChange(currentFilter);
        },
        ratingDot: r,
      }));
    }
    panel.appendChild(ratingList);

    // Category filter section.
    const catLabel = document.createElement("div");
    catLabel.className = "filter-dropdown__section-label";
    catLabel.textContent = t("categories");
    panel.appendChild(catLabel);

    const catList = document.createElement("div");
    catList.className = "filter-dropdown__list";

    const allCats = new Set<string>();
    for (const c of currentCases) {
      for (const cat of c.categories ?? []) allCats.add(cat);
    }
    const sortedCats = Array.from(allCats).sort((a, b) =>
      tCategory(a).localeCompare(tCategory(b)),
    );

    if (sortedCats.length === 0) {
      const hint = document.createElement("span");
      hint.className = "filter-dropdown__hint";
      hint.textContent = t("noCategories");
      catList.appendChild(hint);
    } else {
      for (const cat of sortedCats.slice(0, MAX_CATEGORIES)) {
        catList.appendChild(makeChip({
          label: tCategory(cat),
          checked: currentFilter.categories.includes(cat),
          onToggle: (checked) => {
            currentFilter.categories = checked
              ? [...currentFilter.categories, cat]
              : currentFilter.categories.filter((x) => x !== cat);
            renderPanel();
            onChange(currentFilter);
          },
        }));
      }
    }
    panel.appendChild(catList);

    // Update badge.
    toggleBadge.textContent = String(count);
    toggleBadge.hidden = count === 0;
  }

  return {
    setCases(cases: CaseEntry[]) {
      currentCases = cases;
      renderPanel();
    },
    setFilter(filter: FilterState) {
      currentFilter = { ...filter };
      renderPanel();
    },
  };
}

function makeChip(opts: {
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  ratingDot?: CaseRating;
}): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = `filter-dropdown__chip${opts.checked ? " is-active" : ""}`;

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = opts.checked;
  input.addEventListener("change", () => opts.onToggle(input.checked));
  label.appendChild(input);

  if (opts.ratingDot) {
    const dot = document.createElement("span");
    dot.className = "rating-chip__dot";
    dot.setAttribute("data-rating", opts.ratingDot);
    dot.setAttribute("aria-hidden", "true");
    label.appendChild(dot);
  }

  const text = document.createElement("span");
  text.textContent = opts.label;
  label.appendChild(text);
  return label;
}
