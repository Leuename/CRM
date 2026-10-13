"use client";

import { useEffect, type RefObject } from "react";

// Focus behaviour shared by the app's two modals (ConfirmDialog, FilterDialog).
// Both declare aria-modal="true", which tells assistive tech the rest of the
// page is inert — so Tab must actually stay inside the panel, or the promise is
// false. This hook makes it true, and hands focus back to whatever opened the
// dialog on EVERY close path (Esc, overlay, Cancel, Apply, unmount): the effect
// cleanup runs for all of them.
//
// The panel element must be focusable (tabIndex={-1}) so focus has somewhere to
// land when the dialog has no focusable content of its own.

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useModalFocus(open: boolean, panelRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (!open) return;
    // Captured before we move focus: the element that had focus when the dialog
    // opened IS the trigger, so no trigger-ref prop is needed. `isConnected` on
    // the way out covers the case where the page unmounted it meanwhile (focus
    // then falls to <body>, as it would have anyway).
    const trigger = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0,
      );
      const active = document.activeElement;

      if (items.length === 0) {
        // Nothing to move to — keep focus on the panel rather than letting it
        // escape to the page behind.
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];

      if (!panel.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open, panelRef]);
}
