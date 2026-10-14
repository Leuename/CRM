"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/lib/ds";
import { useModalFocus } from "@/components/useModalFocus";

// Minimal in-app replacement for window.confirm: a modal with a message, Cancel,
// and a confirm button whose label IS the action verb ("Archive"/"Restore"), so
// it is reachable by role+name. Esc cancels. Reuses the DS Button — no dialog
// library.
//
// Focus opens on the panel, not on the confirm button: the dialog guards a
// destructive action, so a stray Enter must not commit it, and capturing the
// trigger before focus moves is what makes focus return work (useModalFocus).
export interface ConfirmState {
  message: string;
  confirmLabel: string;
  run: () => void;
}

export function ConfirmDialog({
  state,
  busy = false,
  onClose,
}: {
  state: ConfirmState | null;
  busy?: boolean;
  onClose: () => void;
}) {
  const open = state !== null;
  const panelRef = useRef<HTMLDivElement | null>(null);

  useModalFocus(open, panelRef);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!state) return null;

  return (
    <div role="presentation" onClick={() => !busy && onClose()} style={overlay}>
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={state.message}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={panel}
      >
        <p
          style={{
            margin: 0,
            font: "400 15px/23px var(--font-ui)",
            color: "var(--text-primary)",
          }}
        >
          {state.message}
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 24,
          }}
        >
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" onClick={state.run} disabled={busy}>
            {busy ? "…" : state.confirmLabel}
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
  width: 420,
  maxWidth: "100%",
  background: "var(--bg-surface)",
  borderRadius: "var(--radius-card)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.24)",
  padding: 28,
  outline: "none",
};
