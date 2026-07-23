// Case list — the accessibility-primary path.
//
// Renders all (filtered) cases as a semantic <ul> of <li>. Each list
// item is a card (button) showing title, short description, and
// categories. Clicking a card selects the case and the card itself
// expands to reveal the rating badge, full description, updated
// date, and link — all within the same card (not a separate element
// below it).
//
// The list has a persistent header (title + count + filter mount point)
// and a scrollable body. Only the body re-renders on filter changes so
// the filter popover stays mounted.

import type { CaseEntry } from "./types.ts";
import type { DetailController } from "./detail.ts";
import { t, tCategory, tRating } from "./i18n.ts";
import { sanitiseUrl } from "./config.ts";

export interface ListController {
  render: (cases: CaseEntry[]) => void;
  setActive: (id: string | null) => void;
  headerEl: HTMLElement;
}

export function initList(
  container: HTMLElement,
  onSelect: (id: string) => void,
  detail: DetailController,
): ListController {
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", t("caseList"));

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

  const filterMount = document.createElement("div");
  filterMount.className = "case-list__filter";
  header.appendChild(filterMount);

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
    btn.setAttribute("aria-expanded", "false");

    // Rating dot.
    if (entry.rating) {
      const dot = document.createElement("span");
      dot.className = "case-list__rating-dot";
      dot.setAttribute("data-rating", entry.rating);
      dot.setAttribute("aria-hidden", "true");
      btn.appendChild(dot);
    }

    // Title.
    const title = document.createElement("span");
    title.className = "case-list__title";
    title.textContent = entry.title;
    btn.appendChild(title);

    // Short description (always visible).
    if (entry.short) {
      const short = document.createElement("span");
      short.className = "case-list__short";
      short.textContent = entry.short;
      btn.appendChild(short);
    }

    // Categories (always visible).
    if (entry.categories.length > 0) {
      const cats = document.createElement("span");
      cats.className = "case-list__categories";
      cats.textContent = entry.categories.map(tCategory).join(" · ");
      btn.appendChild(cats);
    }

    // Expanded detail section (inside the button, hidden by default).
    const expandEl = document.createElement("span");
    expandEl.className = "case-list__expand";
    expandEl.hidden = true;

    // Rating badge.
    if (entry.rating) {
      const rating = document.createElement("span");
      rating.className = "detail-panel__rating";
      rating.setAttribute("data-rating", entry.rating);
      rating.textContent = tRating(entry.rating);
      expandEl.appendChild(rating);
    }

    // Categories with label.
    if (entry.categories.length > 0) {
      const cats = document.createElement("span");
      cats.className = "case-list__expand-cats";
      const label = document.createElement("strong");
      label.textContent = `${t("categories")}: `;
      cats.appendChild(label);
      cats.append(entry.categories.map(tCategory).join(" · "));
      expandEl.appendChild(cats);
    }

    // Updated date.
    if (entry.updated) {
      const updated = document.createElement("span");
      updated.className = "case-list__expand-meta";
      updated.textContent = `${t("updated")}: ${entry.updated}`;
      expandEl.appendChild(updated);
    }

    // Link to full case.
    const safeUrl = entry.url ? sanitiseUrl(entry.url) : null;
    if (safeUrl) {
      const link = document.createElement("a");
      link.className = "case-list__expand-link";
      link.href = safeUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = `${t("readFullCase")} ↗`;
      link.addEventListener("click", (e) => e.stopPropagation());
      expandEl.appendChild(link);
    }

    btn.appendChild(expandEl);

    btn.addEventListener("click", () => {
      const isExpanded = li.classList.contains("is-expanded");
      if (isExpanded) {
        detail.close();
      } else {
        onSelect(entry.id);
      }
    });

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

  function expandDetail(id: string): void {
    for (const li of body.querySelectorAll<HTMLLIElement>(".case-list__item")) {
      const isActive = li.dataset.caseId === id;
      const btn = li.querySelector<HTMLButtonElement>(".case-list__button");
      const expand = btn?.querySelector<HTMLElement>(".case-list__expand");

      li.classList.toggle("is-expanded", isActive);
      if (btn) {
        btn.setAttribute("aria-expanded", isActive ? "true" : "false");
      }
      if (expand) {
        expand.hidden = !isActive;
      }
    }

    // Scroll expanded card into view.
    const activeLi = body.querySelector<HTMLLIElement>(".case-list__item.is-expanded");
    if (activeLi) {
      activeLi.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function collapseAll(): void {
    for (const li of body.querySelectorAll<HTMLLIElement>(".case-list__item")) {
      li.classList.remove("is-expanded");
      const btn = li.querySelector<HTMLButtonElement>(".case-list__button");
      const expand = btn?.querySelector<HTMLElement>(".case-list__expand");
      if (btn) btn.setAttribute("aria-expanded", "false");
      if (expand) expand.hidden = true;
    }
  }

  function setActive(id: string | null): void {
    if (id) {
      expandDetail(id);
    } else {
      collapseAll();
    }
  }

  detail.onOpen((id) => expandDetail(id));
  detail.onClose(() => collapseAll());

  return { render, setActive, headerEl: filterMount };
}
