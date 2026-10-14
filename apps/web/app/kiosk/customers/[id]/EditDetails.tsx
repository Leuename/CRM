"use client";

/* -----------------------------------------------------------------------------
   Edit details.

   NOT DRAWN IN front-desk-design/. The design shows a button flagged "Needs
   grant" but no screen behind it. This demo adds the flow using the wizard's step-3
   furniture exactly (.k-field, .k-input, .k-form-grid) inside the kiosk's own
   overlay, so it reads as the same product.

   It writes through the browser-local demo simulator, which models a narrow
   permission for the five fields a front desk corrects. Archiving a customer,
   editing a company, changing a lead source or client status are outside this
   flow. The simulated role check is not production authorization.

   WHY IT OPENS WITH A REVEAL. The `contact` prop reaches this component masked
   — the demo simulator returns masked values for an OPERATIONS demo user, so the record
   screen behind this dialog is holding "+63 916 ••• 0129", and pre-filling a
   form with that would put bullets in an email field and seven digits in a
   ten-digit mobile field. The form needs the real values, and the local demo
   reveal operation returns them for both this dialog and "Reveal privately".
   Opening this dialog adds a synthetic REVEAL row to this tab's demo audit log.
   -------------------------------------------------------------------------- */

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  type ContactDetail,
  type DuplicateMatch,
  type RevealedContact,
  revealKioskContact,
  updateKioskContact,
} from "@/lib/api";
import { useOverlay } from "../../KioskShell";
import { KioskError } from "../../KioskState";
import { WarningGlyph } from "../../KioskIcons";
import { digitsOnly, emailLooksValid, formatMobile } from "../../new-inquiry/wizard";

interface Draft {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  company_name: string;
}

/** `contact` for the fields the kiosk may read plainly, `real` for the two it
 *  may not — see the reveal note at the top of the file. */
function draftOf(contact: ContactDetail, real: RevealedContact): Draft {
  return {
    first_name: contact.first_name,
    last_name: contact.last_name ?? "",
    email: real.email ?? "",
    // The stored form is "+63 9XX XXX XXXX"; the field holds the ten national
    // digits, exactly as step 1 does.
    mobile: digitsOnly(real.phone ?? ""),
    company_name: contact.company_name ?? "",
  };
}

/** What is still wrong, in the same voice the wizard uses. */
function problems(draft: Draft): string[] {
  const found: string[] = [];
  if (!draft.first_name.trim()) found.push("a first name");
  if (draft.email.trim() && !emailLooksValid(draft.email)) found.push("a valid email");
  if (draft.mobile && draft.mobile.length !== 10) found.push("a 10-digit mobile");
  return found;
}

export function EditDetails({
  contact,
  onClose,
  onSaved,
}: {
  contact: ContactDetail;
  onClose: () => void;
  onSaved: (updated: ContactDetail) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(panelRef, panelRef, onClose);

  const [real, setReal] = useState<RevealedContact | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);

  useEffect(() => {
    let live = true;
    revealKioskContact(contact.id)
      .then((r) => {
        if (!live) return;
        setReal(r);
        setDraft(draftOf(contact, r));
      })
      .catch((err: unknown) => live && setError(err));
    return () => {
      live = false;
    };
  }, [contact]);

  // Nothing to edit until the reveal lands. Same panel, so the dialog does not
  // resize under the operator's hand when it does.
  if (draft === null || real === null) {
    return (
      <div className="k-overlay" role="presentation">
        <div
          className="k-overlay-panel k-editpanel"
          role="dialog"
          aria-modal="true"
          aria-label="Edit customer details"
          tabIndex={-1}
          ref={panelRef}
        >
          <h3 className="k-dialog-h">Edit details</h3>
          {error != null ? (
            <KioskError error={error} />
          ) : (
            <p className="k-p">Fetching this customer&rsquo;s details…</p>
          )}
          <div className="k-dialog-actions">
            <button type="button" className="k-ghost-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const original = draftOf(contact, real);
  const hint = problems(draft);
  // Only changed fields are sent; the simulator rejects explicit null, and
  // an untouched field has nothing to say.
  const changes = () => {
    const patch: Record<string, string> = {};
    if (draft.first_name.trim() !== original.first_name) patch.first_name = draft.first_name.trim();
    if (draft.last_name.trim() !== original.last_name) patch.last_name = draft.last_name.trim();
    if (draft.email.trim() !== original.email) patch.email = draft.email.trim();
    if (draft.mobile !== original.mobile && draft.mobile) patch.phone = `+63${draft.mobile}`;
    if (draft.company_name.trim() !== original.company_name && draft.company_name.trim()) {
      patch.company_name = draft.company_name.trim();
    }
    return patch;
  };
  const patch = changes();
  const nothingToSave = Object.keys(patch).length === 0;

  async function save(confirmDuplicate = false) {
    setBusy(true);
    setError(null);
    try {
      const updated = await updateKioskContact(contact.id, {
        ...patch,
        ...(confirmDuplicate ? { confirm_duplicate: true } : {}),
      });
      onSaved(updated);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && err.duplicates?.length) {
        setDuplicates(err.duplicates);
        return;
      }
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const set = (patchDraft: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patchDraft } : d));

  if (duplicates) {
    const first = duplicates[0];
    const who = [first?.first_name, first?.last_name].filter(Boolean).join(" ") || "someone";
    return (
      <div className="k-overlay" role="presentation">
        <div
          className="k-overlay-panel k-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-label="That email is already on file"
          tabIndex={-1}
          ref={panelRef}
        >
          <h3 className="k-dialog-h">That email is already on file</h3>
          <p className="k-p">
            {who} already uses {first?.email ?? "this address"}. Check with the customer before
            putting it on this record too.
          </p>
          <div className="k-dialog-actions">
            <button type="button" className="k-ghost-btn" onClick={() => setDuplicates(null)}>
              Go back
            </button>
            <button
              type="button"
              className="k-btn-primary"
              disabled={busy}
              onClick={() => save(true)}
            >
              {busy ? "Saving…" : "Save it anyway"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="k-overlay" role="presentation">
      <div
        className="k-overlay-panel k-editpanel"
        role="dialog"
        aria-modal="true"
        aria-label="Edit customer details"
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="k-demo-notice k-edit-demo-notice" role="note">
          <WarningGlyph />
          Demo only. Do not enter real customer details. Changes stay in this tab and are not sent
          to a live CRM.
        </div>
        <h3 className="k-dialog-h">Edit details</h3>
        <p className="k-p">
          Correct what the customer tells you. Nothing else on the record changes.
        </p>

        <div className="k-form-grid">
          <label className="k-field">
            <span className="k-field-label">First name</span>
            <input
              className="k-input"
              value={draft.first_name}
              autoFocus
              onChange={(e) => set({ first_name: e.target.value })}
            />
          </label>
          <label className="k-field">
            <span className="k-field-label">
              Last name<span className="k-field-optional"> · optional</span>
            </span>
            <input
              className="k-input"
              value={draft.last_name}
              onChange={(e) => set({ last_name: e.target.value })}
            />
          </label>
          {/* Full width. An address is the longest thing on this form and the
              one the operator is most likely to be reading back to the customer
              — "carlo.cruz@northstar-digit…" in a half-width box is the field
              you can least afford to truncate. */}
          <label className="k-field k-field-wide">
            <span className="k-field-label">
              Email<span className="k-field-optional"> · optional</span>
            </span>
            <input
              className="k-input"
              type="email"
              inputMode="email"
              maxLength={254}
              value={draft.email}
              onChange={(e) => set({ email: e.target.value })}
            />
          </label>
          <label className="k-field">
            <span className="k-field-label">
              Mobile<span className="k-field-optional"> · optional</span>
            </span>
            <div className="k-mobile-row k-mobile-row-tight">
              <span className="k-mobile-cc k-mobile-cc-sm" aria-hidden="true">
                +63
              </span>
              <input
                className="k-input"
                inputMode="numeric"
                autoComplete="tel-national"
                aria-label="Mobile number, starting with 9 — without the +63 country code"
                value={formatMobile(draft.mobile)}
                onChange={(e) => set({ mobile: digitsOnly(e.target.value) })}
              />
            </div>
          </label>

          <label className="k-field">
            <span className="k-field-label">
              Company<span className="k-field-optional"> · optional</span>
            </span>
            <input
              className="k-input"
              value={draft.company_name}
              onChange={(e) => set({ company_name: e.target.value })}
            />
          </label>
        </div>

        {error != null && (
          <div className="k-pad-top">
            <KioskError error={error} />
          </div>
        )}

        <div className="k-dialog-actions">
          {hint.length > 0 && <span className="k-foot-hint">Still needed: {hint.join(", ")}.</span>}
          <button type="button" className="k-ghost-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="k-btn-primary"
            disabled={busy || hint.length > 0 || nothingToSave}
            onClick={() => save()}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
