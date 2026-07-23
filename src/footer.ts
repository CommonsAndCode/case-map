// Footer — legal links + "no cookies" note. Standalone mode only.

import type { AppConfig } from "./types.ts";
import { t } from "./i18n.ts";

export function initFooter(container: HTMLElement, config: AppConfig): void {
  container.className = "app-footer";
  container.setAttribute("role", "contentinfo");

  const inner = document.createElement("div");
  inner.className = "app-footer__inner";

  const hasLinks = config.privacyUrl || config.imprintUrl;
  if (hasLinks) {
    const nav = document.createElement("nav");
    nav.className = "app-footer__links";
    nav.setAttribute("aria-label", t("privacy"));
    if (config.privacyUrl) {
      const a = document.createElement("a");
      a.href = config.privacyUrl;
      a.textContent = t("privacy");
      nav.appendChild(a);
    }
    if (config.imprintUrl) {
      const a = document.createElement("a");
      a.href = config.imprintUrl;
      a.textContent = t("imprint");
      nav.appendChild(a);
    }
    inner.appendChild(nav);
  }

  const note = document.createElement("div");
  note.className = "app-footer__note";
  note.textContent = t("noCookies");
  inner.appendChild(note);

  container.appendChild(inner);
}
