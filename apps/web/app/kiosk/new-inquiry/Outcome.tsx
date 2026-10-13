"use client";

// What the operator sees after Submit: the demo confirmation, the "we
// couldn't reach the server" screen that keeps the typed inquiry alive, and the
// two dialogs (discard, duplicate email).

import { useRef } from "react";
import type { DuplicateMatch, KioskInquiry } from "@/lib/api";
import { useOverlay } from "../KioskShell";
import { CheckGlyph, OfflineGlyph } from "../KioskIcons";
import { formatMobile, type Draft } from "./wizard";

/* --- confirmation --------------------------------------------------------- */

export function Confirmation({
  inquiry,
  operator,
  onAnother,
  onDone,
}: {
  inquiry: KioskInquiry;
  operator: string;
  onAnother: () => void;
  onDone: () => void;
}) {
  const rows = [
    {
      label: "Customer",
      value: inquiry.company_name
        ? `${inquiry.contact_name} · ${inquiry.company_name}`
        : inquiry.contact_name,
    },
    { label: "Interested in", value: inquiry.product_name },
    { label: "Taken by", value: `${operator} · Front desk` },
    { label: "Status", value: inquiry.stage_name },
  ];

  return (
    <div className="k-screen k-confirm">
      <div className="k-confirm-body">
        <span className="k-confirm-tick" aria-hidden="true">
          <CheckGlyph />
        </span>
        <h2 className="k-confirm-h k-step-focus" data-kiosk-screen-heading tabIndex={-1}>
          Demo inquiry simulated
        </h2>
        <p className="k-p">
          This fictional inquiry stayed in this browser tab. It was not sent and no follow-up will
          happen.
        </p>

        <div className="k-ref-plate">
          <div className="k-eyebrow">Demo reference</div>
          {/* The one thing the customer leaves with. Read it out, and it is what
              Find inquiry matches on. */}
          <div className="k-ref-code">{inquiry.reference}</div>
        </div>

        <dl className="k-confirm-rows">
          {rows.map((r) => (
            <div className="k-confirm-row" key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="k-foot-bar">
        {/* The demo does not send messages. Keep that clear in the disabled control. */}
        <button type="button" className="k-ghost-btn" disabled>
          Email and SMS are not sent in this demo
        </button>
        <div className="k-foot-right">
          <button type="button" className="k-ghost-btn" onClick={onAnother}>
            Add another inquiry
          </button>
          <button type="button" className="k-btn-primary" onClick={onDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- the request did not land --------------------------------------------- */

export function Unreachable({
  draft,
  onBack,
  onRetry,
  busy,
}: {
  draft: Draft;
  onBack: () => void;
  onRetry: () => void;
  busy: boolean;
}) {
  const who = draft.name.trim() || `+63 ${formatMobile(draft.mobile)}`;

  return (
    <div className="k-screen k-centre">
      <span className="k-fail-mark" aria-hidden="true">
        <OfflineGlyph />
      </span>
      <h2 className="k-confirm-h k-step-focus" data-kiosk-screen-heading tabIndex={-1} role="alert">
        We couldn&apos;t reach the server
      </h2>
      {/* The draft is still in memory — saying so is the difference between the
          operator retyping everything and simply pressing the button again. */}
      <p className="k-p k-centre-text">
        Nothing was lost. {who}&apos;s inquiry is still filled in on this screen — try again, or
        note the details and submit once the connection is back.
      </p>
      <div className="k-fail-actions">
        <button type="button" className="k-ghost-btn" onClick={onBack}>
          Back to review
        </button>
        <button type="button" className="k-btn-primary" disabled={busy} onClick={onRetry}>
          {busy ? "Submitting…" : "Try submitting again"}
        </button>
      </div>
    </div>
  );
}

/* --- dialogs -------------------------------------------------------------- */

function Dialog({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Focus trap, Escape and focus restoration come from the shell's shared hook,
  // which wraps components/useModalFocus — the same one the back office uses.
  useOverlay(panelRef, panelRef, onClose);

  return (
    <div className="k-overlay" role="presentation">
      <div
        className="k-overlay-panel k-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        ref={panelRef}
      >
        {children}
      </div>
    </div>
  );
}

export function DiscardDialog({
  onKeep,
  onDiscard,
}: {
  onKeep: () => void;
  onDiscard: () => void;
}) {
  return (
    <Dialog label="Discard this inquiry?" onClose={onKeep}>
      <h3 className="k-dialog-h">Discard this inquiry?</h3>
      <p className="k-p">Everything typed so far will be cleared from the screen.</p>
      <div className="k-dialog-actions">
        {/* No autoFocus. It lands in the commit phase, BEFORE useModalFocus's
            effect, so the "trigger" that hook captures becomes this in-dialog
            button — which then unmounts on close, leaving focus on <body>
            instead of back on Start over. The same trap is documented at
            components/FilterDialog.tsx:142. useModalFocus focuses the panel
            itself, which is what the reader should land on anyway. */}
        <button type="button" className="k-ghost-btn" onClick={onKeep}>
          Keep editing
        </button>
        <button type="button" className="k-btn-danger" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </Dialog>
  );
}

/**
 * The server's 409 DUPLICATE_WARNING, in front-desk words. The kiosk does not
 * decide anything here: it either sends the same request back with
 * confirm_duplicate set, or lets the operator go and fix the email.
 */
export function DuplicateDialog({
  duplicates,
  onEdit,
  onConfirm,
  busy,
}: {
  duplicates: DuplicateMatch[];
  onEdit: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  const first = duplicates[0];
  const who = first ? [first.first_name, first.last_name].filter(Boolean).join(" ") : "someone";

  return (
    <Dialog label="That email is already on file" onClose={onEdit}>
      <h3 className="k-dialog-h">That email is already on file</h3>
      <p className="k-p">
        {who} already uses {first?.email ?? "this address"}. Check with the customer — if this is a
        second person at the same company, a different email keeps their records apart.
      </p>
      <div className="k-dialog-actions">
        {/* No autoFocus — see the note in DiscardDialog above. */}
        <button type="button" className="k-ghost-btn" onClick={onEdit}>
          Fix the email
        </button>
        <button type="button" className="k-btn-primary" disabled={busy} onClick={onConfirm}>
          {busy ? "Submitting…" : "Record it anyway"}
        </button>
      </div>
    </Dialog>
  );
}
