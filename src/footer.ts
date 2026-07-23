// Floating legal links — bottom-left overlay on the map.
// Replaces the old bottom footer bar.

import type { AppConfig } from "./types.ts";
import { t } from "./i18n.ts";

export function initFooterLinks(container: HTMLElement, config: AppConfig): void {
  container.className = "floating-links";
  container.setAttribute("role", "contentinfo");

  if (config.privacyUrl) {
    const a = document.createElement("a");
    a.href = config.privacyUrl;
    a.textContent = t("privacy");
    a.target = "_blank";
    a.rel = "noopener";
    container.appendChild(a);
  }

  if (config.privacyUrl && config.imprintUrl) {
    const sep = document.createElement("span");
    sep.className = "floating-links__sep";
    sep.setAttribute("aria-hidden", "true");
    sep.textContent = "·";
    container.appendChild(sep);
  }

  if (config.imprintUrl) {
    const a = document.createElement("a");
    a.href = config.imprintUrl;
    a.textContent = t("imprint");
    a.target = "_blank";
    a.rel = "noopener";
    container.appendChild(a);
  }
}
