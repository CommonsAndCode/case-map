// Detail panel — shows the selected case's full metadata.
//
// Opened by clicking a map point or a list button. Renders the rating
// badge, short description, categories, last-updated date, and a link
// to the full article on the Commons & Code website. The panel is an
// accessible dialog: focus moves to the close button on open, Escape
// closes it, and focus returns to the trigger on close.

import type { AppConfig, CaseEntry } from "./types.ts";
import { t, tCategory, tRating } from "./i18n.ts";
import { sanitiseUrl } from "./config.ts";

export interface DetailController {
  /** Show the panel for the given case. triggerEl receives focus on close. */
  open: (entry: CaseEntry, triggerEl?: HTMLElement) => void;
  /** Close the panel and return focus to the last trigger. */
  close: () => void;
  /** Whether the panel is currently open. */
  isOpen: () => boolean;
}

export function initDetail(
  container: HTMLElement,
  config: AppConfig,
): DetailController {
  container.setAttribute("role", "dialog");
  container.setAttribute("aria-modal", "false");
  container.setAttribute("aria-label", t("caseList"));
  container.classList.add("detail-panel");
  container.hidden = true;

  let lastTrigger: HTMLElement | null = null;

  function open(entry: CaseEntry, triggerEl?: HTMLElement): void {
    lastTrigger = triggerEl ?? null;
    container.innerHTML = "";

    // Logo (standalone mode only).
    if (config.showLogo && config.logoUrl) {
      const logoLink = document.createElement("a");
      logoLink.href = config.logoLink ?? "#";
      logoLink.target = "_blank";
      logoLink.rel = "noopener";
      logoLink.className = "detail-panel__logo-link";
      const img = document.createElement("img");
      img.src = config.logoUrl;
      img.alt = "";
      img.className = "detail-panel__logo";
      logoLink.appendChild(img);
      container.appendChild(logoLink);
    }

    const content = document.createElement("div");
    content.className = "detail-panel__content";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "detail-panel__close";
    close.setAttribute("aria-label", t("close"));
    close.textContent = "✕";
    close.addEventListener("click", () => closePanel());
    content.appendChild(close);

    const h2 = document.createElement("h2");
    h2.textContent = entry.title;
    content.appendChild(h2);

    if (entry.rating) {
      const rating = document.createElement("p");
      rating.className = "detail-panel__rating";
      rating.setAttribute("data-rating", entry.rating);
      rating.textContent = tRating(entry.rating);
      content.appendChild(rating);
    }

    const short = document.createElement("p");
    short.textContent = entry.short;
    content.appendChild(short);

    if (entry.categories.length > 0) {
      const cats = document.createElement("p");
      const label = document.createElement("strong");
      label.textContent = `${t("categories")}: `;
      cats.appendChild(label);
      cats.append(entry.categories.map(tCategory).join(" · "));
      content.appendChild(cats);
    }

    if (entry.updated) {
      const updated = document.createElement("p");
      updated.className = "detail-panel__meta";
      updated.textContent = `${t("updated")}: ${entry.updated}`;
      content.appendChild(updated);
    }

    const safeUrl = entry.url ? sanitiseUrl(entry.url) : null;
    if (safeUrl) {
      const link = document.createElement("a");
      link.className = "detail-panel__link";
      link.href = safeUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = `${t("readFullCase")} ↗`;
      content.appendChild(link);
    }

    container.appendChild(content);
    container.hidden = false;
    close.focus();
  }

  function closePanel(): void {
    container.hidden = true;
    container.innerHTML = "";
    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  }

  container.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closePanel();
    }
  });

  return {
    open,
    close: closePanel,
    isOpen: () => !container.hidden,
  };
}
