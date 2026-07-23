// Case list — the accessibility-primary path.
//
// Renders all (filtered) cases as a semantic <ul> of <li>, each
// containing a <button> that selects the case (opening the shared
// detail panel) and flies the map to its first location. Screen-reader
// and keyboard users get the full content here without needing to
// operate the 2D map canvas.
//
// The list has a persistent header (title + count + filter mount point)
// and a scrollable body. Only the body re-renders on filter changes so
// the filter popover stays mounted.

import type { CaseEntry } from "./types.ts";
import { t, tCategory, tRating } from "./i18n.ts";

export interface ListController {
  /** Re-render the list body with the given (filtered) cases. */
  render: (cases: CaseEntry[]) => void;
  /** Highlight the currently-selected case, or clear if null. */
  setActive: (id: string | null) => void;
  /** Element in the header where the filter popover can mount. */
  headerEl: HTMLElement;
}

export function initList(
  container: HTMLElement,
  onSelect: (id: string) => void,
): ListController {
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", t("caseList"));

  // Persistent header (does not re-render).
  const header = document.createElement("div");
  header.className = "case-list__header";
  container.appendChild(header);

  const heading = document.createElement("h2");
  heading.className = "case-list__heading";
  heading.textContent = t("caseList");
  const count = document.createElement("span");
  count.className = "case-list__count";
  count.id = "case-list-count";
  heading.appendChild(count);
  header.appendChild(heading);

  // Filter mounts here (populated by main.ts via headerEl).
  const filterMount = document.createElement("div");
  filterMount.className = "case-list__filter";
  header.appendChild(filterMount);

  // Scrollable body (re-renders on filter/data change).
  const body = document.createElement("div");
  body.className = "case-list__body";
  container.appendChild(body);

  function renderItem(entry: CaseEntry): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "case-list__item";
    li.dataset.caseId = entry.id;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "case-list__button";
    btn.dataset.caseId = entry.id;
    btn.setAttribute(
      "aria-label",
      `${entry.title} — ${tRating(entry.rating ?? "unrated")}`,
    );

    if (entry.rating) {
      const dot = document.createElement("span");
      dot.className = "case-list__rating-dot";
      dot.setAttribute("data-rating", entry.rating);
      dot.setAttribute("aria-hidden", "true");
      btn.appendChild(dot);
    }

    const title = document.createElement("span");
    title.className = "case-list__title";
    title.textContent = entry.title;
    btn.appendChild(title);

    if (entry.short) {
      const short = document.createElement("span");
      short.className = "case-list__short";
      short.textContent = entry.short;
      btn.appendChild(short);
    }

    if (entry.categories.length > 0) {
      const cats = document.createElement("span");
      cats.className = "case-list__categories";
      cats.textContent = entry.categories.map(tCategory).join(" · ");
      btn.appendChild(cats);
    }

    btn.addEventListener("click", () => onSelect(entry.id));
    li.appendChild(btn);
    return li;
  }

  function render(cases: CaseEntry[]): void {
    count.textContent =
      cases.length === 1 ? t("oneCase") : t("casesCount", { count: cases.length });

    body.innerHTML = "";
    if (cases.length === 0) {
      const empty = document.createElement("p");
      empty.className = "case-list__empty";
      empty.textContent = t("selectMarker");
      body.appendChild(empty);
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "case-list__list";
    for (const entry of cases) {
      ul.appendChild(renderItem(entry));
    }
    body.appendChild(ul);
  }

  function setActive(id: string | null): void {
    for (const btn of body.querySelectorAll<HTMLButtonElement>(
      ".case-list__button",
    )) {
      const isActive = btn.dataset.caseId === id;
      btn.setAttribute("aria-current", isActive ? "true" : "false");
      btn.classList.toggle("is-active", isActive);
    }
  }

  return { render, setActive, headerEl: filterMount };
}
