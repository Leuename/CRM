"use client";

import { useRef } from "react";
import { Button } from "@/lib/ds";
import { useModalFocus } from "@/components/useModalFocus";

export function DemoWarningDialog({ open, onContinue }: { open: boolean; onContinue: () => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useModalFocus(open, panelRef);

  if (!open) return null;

  return (
    <div style={overlay}>
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="demo-warning-heading"
        aria-describedby="demo-warning-description"
        tabIndex={-1}
        style={panel}
      >
        <h2 id="demo-warning-heading" style={heading}>
          Demo data warning
        </h2>
        <p id="demo-warning-description" style={description}>
          Do not enter real customer, employee, personal, or confidential data. Entries stay in this
          browser tab, are not sent to a CRM service, and clear when you sign out or close the tab.
        </p>
        <div style={actions}>
          <Button size="sm" onClick={onContinue}>
            Continue to demo
          </Button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  background: "rgba(14, 23, 48, 0.52)",
};

const panel: React.CSSProperties = {
  width: 440,
  maxWidth: "100%",
  padding: 28,
  borderRadius: "var(--radius-card)",
  background: "var(--bg-surface)",
  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.24)",
  outline: "none",
};

const heading: React.CSSProperties = {
  margin: 0,
  color: "var(--text-primary)",
  font: "700 20px/28px var(--font-ui)",
};

const description: React.CSSProperties = {
  margin: "12px 0 0",
  color: "var(--text-secondary)",
  font: "400 14px/22px var(--font-ui)",
};

const actions: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: 24,
};
