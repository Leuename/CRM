"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/lib/ds";
import { useModalFocus } from "@/components/useModalFocus";

// The one filter surface for every list page: a "Filters" trigger (with an
// active-filter count and an inline "Clear all") plus a modal that holds the
// page's filter fields. Same overlay/panel/Esc idiom as ConfirmDialog — no
// dialog library.
//
// Staging contract lives in the PAGE, not here: the page keeps its applied
// filter state (what drives the query) and a staged copy the dialog edits.
// Open copies applied→staged, Apply copies staged→applied, closing discards.
// This component is stateless about fields.

export function FilterButton({
  activeCount,
  onOpen,
  onClearAll,
}: {
  activeCount: number;
  onOpen: () => void;
  onClearAll: () => void;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        height: 40,
      }}
    >
      <Button
        variant="outline"
        size="sm"
        icon="las la-filter"
        onClick={onOpen}
        aria-haspopup="dialog"
      >
        {activeCount > 0 ? `Filters · ${activeCount}` : "Filters"}
      </Button>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          style={{
            border: "none",
            background: "transparent",
            padding: 0,
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-secondary)",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Clear all
        </button>
      )}
    </span>
  );
}

export function FilterDialog({
  open,
  title = "Filters",
  onApply,
  onReset,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus into the panel on open, keep Tab inside it while open, and hand focus
  // back to the trigger on every close path. Shared with ConfirmDialog.
  useModalFocus(open, panelRef);

  if (!open) return null;

  return (
    <div role="presentation" onClick={onClose} style={overlay} className="filter-overlay">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={panel}
        className="filter-panel"
      >
        <h2
          style={{
            margin: 0,
            font: "700 18px/27px var(--font-ui)",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h2>
        <div
          style={{
            marginTop: 20,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {children}
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 28,
          }}
        >
          <Button variant="outline" size="sm" onClick={onReset}>
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {/* No autoFocus: it lands in the commit phase, BEFORE the open effect
              below, so it both clobbered the captured trigger and was then
              overridden by panelRef.focus() anyway. */}
          <Button size="sm" onClick={onApply}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.32)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 100,
};

const panel: React.CSSProperties = {
  width: 480,
  maxWidth: "100%",
  maxHeight: "80vh",
  overflowY: "auto",
  background: "var(--bg-surface)",
  borderRadius: "var(--radius-card)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.24)",
  padding: 28,
  outline: "none",
};
