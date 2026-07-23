// Case list — the accessibility-primary path.
//
// Renders all (filtered) cases as a semantic <ul> of <li>, each
// containing a <button> that selects the case. The selected case
// expands inline within the list to show full details (rating,
// description, categories, link) instead of a separate popover.
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

  function renderInlineDetail(entry: CaseEntry): HTMLDivElement {
    const detailEl = document.createElement("div");
    detailEl.className = "case-detail-inline";

    if (entry.rating) {
      const rating = document.createElement("span");
      rating.className = "detail-panel__rating";
      rating.setAttribute("data-rating", entry.rating);
      rating.textContent = tRating(entry.rating);
      detailEl.appendChild(rating);
    }

    if (entry.short) {
      const short = document.createElement("p");
      short.className = "case-detail-inline__short";
      short.textContent = entry.short;
      detailEl.appendChild(short);
    }

    if (entry.categories.length > 0) {
      const cats = document.createElement("p");
      cats.className = "case-detail-inline__categories";
      const label = document.createElement("strong");
      label.textContent = `${t("categories")}: `;
      cats.appendChild(label);
      cats.append(entry.categories.map(tCategory).join(" · "));
      detailEl.appendChild(cats);
    }

    if (entry.updated) {
      const updated = document.createElement("p");
      updated.className = "case-detail-inline__meta";
      updated.textContent = `${t("updated")}: ${entry.updated}`;
      detailEl.appendChild(updated);
    }

    const safeUrl = entry.url ? sanitiseUrl(entry.url) : null;
    if (safeUrl) {
      const link = document.createElement("a");
      link.className = "case-detail-inline__link";
      link.href = safeUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = `${t("readFullCase")} ↗`;
      detailEl.appendChild(link);
    }

    return detailEl;
  }

  function renderItem(entry: CaseEntry): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "case-list__item";
    li.dataset.caseId = entry.id;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "case-list__button";
    btn.dataset.caseId = entry.id;

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

    btn.addEventListener("click", () => {
      const isExpanded = li.classList.contains("is-expanded");
      if (isExpanded) {
        detail.close();
      } else {
        onSelect(entry.id);
      }
    });

    li.appendChild(btn);

    // Inline detail container (filled on expand).
    const inlineContainer = document.createElement("div");
    inlineContainer.className = "case-list__inline-detail";
    inlineContainer.hidden = true;
    li.appendChild(inlineContainer);

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

  // Expand the inline detail for the selected case, collapse all others.
  function expandDetail(id: string): void {
    const state = getState();
    const entry = state.cases.find((c) => c.id === id) ?? null;
    if (!entry) return;

    for (const li of body.querySelectorAll<HTMLLIElement>(".case-list__item")) {
      const isActive = li.dataset.caseId === id;
      const btn = li.querySelector<HTMLButtonElement>(".case-list__button");
      const inline = li.querySelector<HTMLDivElement>(".case-list__inline-detail");

      li.classList.toggle("is-expanded", isActive);
      if (btn) {
        btn.setAttribute("aria-current", isActive ? "true" : "false");
        btn.setAttribute("aria-expanded", isActive ? "true" : "false");
      }
      if (inline) {
        if (isActive) {
          inline.innerHTML = "";
          inline.appendChild(renderInlineDetail(entry));
          inline.hidden = false;
        } else {
          inline.hidden = true;
          inline.innerHTML = "";
        }
      }
    }
  }

  function collapseAll(): void {
    for (const li of body.querySelectorAll<HTMLLIElement>(".case-list__item")) {
      li.classList.remove("is-expanded");
      const btn = li.querySelector<HTMLButtonElement>(".case-list__button");
      const inline = li.querySelector<HTMLDivElement>(".case-list__inline-detail");
      if (btn) btn.setAttribute("aria-expanded", "false");
      if (inline) {
        inline.hidden = true;
        inline.innerHTML = "";
      }
    }
  }

  function setActive(id: string | null): void {
    if (id) {
      expandDetail(id);
    } else {
      collapseAll();
    }
  }

  // Subscribe to detail controller so inline expansion stays in sync.
  detail.onOpen((id) => expandDetail(id));
  detail.onClose(() => collapseAll());

  return { render, setActive, headerEl: filterMount };
}

// Minimal getState import to avoid circular dependency.
import { getState } from "./state.ts";
