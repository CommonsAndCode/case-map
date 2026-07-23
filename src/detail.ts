// Detail panel — coordinates selection state for the inline detail.
//
// Originally a floating popover, the detail now expands inline within
// the case list. This controller tracks the open/close state and
// notifies subscribers (the list) so it can render the inline detail.
// The detailEl container is hidden and unused for rendering, but kept
// for focus management and Escape handling.

import type { AppConfig, CaseEntry } from "./types.ts";

export interface DetailController {
  open: (entry: CaseEntry, triggerEl?: HTMLElement) => void;
  close: () => void;
  isOpen: () => boolean;
  onOpen: (cb: (id: string) => void) => void;
  onClose: (cb: () => void) => void;
}

export function initDetail(
  container: HTMLElement,
  _config: AppConfig,
): DetailController {
  container.classList.add("detail-panel");
  container.hidden = true;
  let currentId: string | null = null;
  let lastTrigger: HTMLElement | null = null;
  const openCallbacks: ((id: string) => void)[] = [];
  const closeCallbacks: (() => void)[] = [];

  function open(entry: CaseEntry, triggerEl?: HTMLElement): void {
    lastTrigger = triggerEl ?? null;
    currentId = entry.id;
    for (const cb of openCallbacks) cb(entry.id);
  }

  function closePanel(): void {
    currentId = null;
    for (const cb of closeCallbacks) cb();
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
    isOpen: () => currentId !== null,
    onOpen: (cb) => openCallbacks.push(cb),
    onClose: (cb) => closeCallbacks.push(cb),
  };
}
