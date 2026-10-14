"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Tag } from "@/lib/ds";
import {
  getContact,
  getContactOpportunities,
  revealKioskContact,
  type RevealedContact,
  getOpportunity,
  listPipelineStages,
  type ContactDetail,
  type OpportunityDetail,
  type OpportunityRef,
  type PipelineStage,
} from "@/lib/api";
import { stageTone } from "@/lib/opportunities";
import { initials, maskEmail, maskPhone } from "@/lib/kiosk-mask";
import { Skeleton, SrOnly } from "@/components/Skeleton";
import { ageLabel, fullName, monthYear, trimQuantity } from "../../kiosk-format";
import { useKioskChrome, useOverlay } from "../../KioskShell";
import { KioskError } from "../../KioskState";
import { EditDetails } from "./EditDetails";

interface CustomerRecordData {
  contact: ContactDetail;
  opportunities: OpportunityRef[];
  stages: Map<string, PipelineStage>;
  /** The detail of the won deal, when there is one — its product line is the
   *  only place the customer's current space is written down. */
  won: OpportunityDetail | null;
}

async function load(id: string, signal: AbortSignal): Promise<CustomerRecordData> {
  const [contact, opportunities, stageList] = await Promise.all([
    getContact(id, signal),
    getContactOpportunities(id, signal),
    listPipelineStages(signal),
  ]);
  const stages = new Map(stageList.map((s) => [s.id, s]));
  // OpportunityRef carries only stage_id, so the semantic type comes from the
  // stage list rather than being guessed from the stage's name.
  const wonRef = opportunities.find((o) => stages.get(o.stage_id)?.semantic_type === "WON");
  const won = wonRef ? await getOpportunity(wonRef.id, signal) : null;
  return { contact, opportunities, stages, won };
}

export default function CustomerRecord() {
  const { id } = useParams<{ id: string }>();
  useKioskChrome("Find customer", "Customer record", "/kiosk/customers");

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ready"; record: CustomerRecordData }
    | { status: "error"; error: unknown }
  >({ status: "loading" });
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    load(id, controller.signal)
      .then((record) => {
        if (!controller.signal.aborted) setState({ status: "ready", record });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: "error", error });
      });
    return () => controller.abort();
  }, [id]);

  if (state.status === "loading") return <RecordSkeleton />;
  if (state.status === "error")
    return (
      <div className="k-screen k-pad">
        <KioskError error={state.error} />
      </div>
    );

  const { contact, opportunities, stages, won } = state.record;
  const name = fullName(contact);
  const open = opportunities.filter(
    (o) => (stages.get(o.stage_id)?.semantic_type ?? "ACTIVE") === "ACTIVE",
  );

  return (
    <div className="k-screen k-profile">
      <div className="k-profile-head">
        <div className="k-avatar-lg" aria-hidden="true">
          {initials(name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="k-name" style={{ margin: 0 }}>
            {name}
          </h2>
          <div className="k-company">{contact.company_name ?? "No company on record"}</div>
        </div>
        {/* The demo simulator models a narrow edit permission for these five
            fields; this does not establish a production authorization boundary. */}
        <button type="button" className="k-ghost-btn" onClick={() => setEditing(true)}>
          Edit details
        </button>
      </div>

      <div className="k-cards">
        <section className="k-card" aria-labelledby="k-contact-h">
          <div className="k-eyebrow" id="k-contact-h">
            Contact
          </div>
          <div className="k-card-body">
            <div className="k-contact-line">
              <span className="k-contact-value">{maskPhone(contact.phone)}</span>
              <button
                type="button"
                className="k-ghost-btn"
                onClick={() => setRevealed(true)}
                disabled={!contact.phone && !contact.email}
              >
                Reveal privately
              </button>
            </div>
            <div className="k-contact-value">{maskEmail(contact.email)}</div>
          </div>
        </section>

        <section className="k-card" aria-labelledby="k-space-h">
          <div className="k-eyebrow" id="k-space-h">
            Current space
          </div>
          <CurrentSpace won={won} />
        </section>
      </div>

      <div className="k-section-label">Open inquiries</div>
      {open.length === 0 ? (
        <div className="k-state" style={{ marginTop: 0 }}>
          <strong>Nothing open right now.</strong>
          If they need something today, start a new inquiry from the home screen.
        </div>
      ) : (
        <div>
          {open.map((o) => {
            const stage = stages.get(o.stage_id);
            return (
              <div className="k-inq-row" key={o.id}>
                <span className="k-inq-ref">{o.reference ?? "—"}</span>
                <span className="k-inq-what">{o.title}</span>
                <Tag tone={stageTone(stage?.color)} dot>
                  {stage?.name ?? "In progress"}
                </Tag>
                <span className="k-inq-age">{ageLabel(o.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}

      {revealed && <RevealOverlay contactId={contact.id} onClose={() => setRevealed(false)} />}

      {editing && (
        <EditDetails
          contact={contact}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            // Use the simulator response, which normalizes the phone and may
            // link a company that the kiosk only named.
            setState((cur) =>
              cur.status === "ready"
                ? { status: "ready", record: { ...cur.record, contact: updated } }
                : cur,
            );
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function CurrentSpace({ won }: { won: OpportunityDetail | null }) {
  const line = won?.products[0];
  if (!won || !line) {
    return (
      <>
        <div className="k-space-value">No space on record.</div>
        <div className="k-space-meta">
          Nothing has been won under this customer yet, so there is no space to show.
        </div>
      </>
    );
  }
  const seats = trimQuantity(line.quantity);
  return (
    <>
      <div className="k-space-value">
        {line.product_name}
        {seats ? ` · ${seats} ${seats === "1" ? "seat" : "seats"}` : ""}
      </div>
      <div className="k-space-meta">Since {monthYear(won.closed_at ?? won.created_at)}</div>
      {/* The design's note, degendered — it renders for every customer. */}
      <div className="k-space-note">Derived from their won opportunity&rsquo;s product line.</div>
    </>
  );
}

/**
 * The design's private reveal: the real phone and email, a ten-second bar, and a
 * Hide now button. Escape closes it and focus returns to "Reveal privately"
 * (useOverlay -> useModalFocus).
 *
 * The browser-local demo simulator returns the values and adds a synthetic
 * audit row naming who revealed whose details. The page does not unmask the
 * already-loaded record directly, which keeps this demo flow consistent.
 */
const REVEAL_SECONDS = 10;

function RevealOverlay({ contactId, onClose }: { contactId: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [left, setLeft] = useState(REVEAL_SECONDS);
  const [shown, setShown] = useState<RevealedContact | null>(null);
  const [error, setError] = useState<unknown>(null);
  useOverlay(panelRef, panelRef, onClose);

  useEffect(() => {
    let live = true;
    revealKioskContact(contactId)
      .then((real) => live && setShown(real))
      .catch((err: unknown) => live && setError(err));
    return () => {
      live = false;
    };
  }, [contactId]);

  // The countdown runs from the moment the panel opens, not from the response:
  // ten seconds of a screen turned away is ten seconds either way.
  useEffect(() => {
    const id = setInterval(() => setLeft((n) => n - 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (left <= 0) onClose();
  }, [left, onClose]);

  return (
    <div className="k-overlay" role="presentation">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Contact details, shown privately"
        tabIndex={-1}
        className="k-overlay-panel"
      >
        <div className="k-reveal-warn">Private — turn the screen away</div>
        {error != null ? (
          <KioskError error={error} />
        ) : (
          <>
            <div className="k-reveal-phone">
              {shown ? (shown.phone ?? "No mobile on record") : "…"}
            </div>
            <div className="k-reveal-email">
              {shown ? (shown.email ?? "No email on record") : "…"}
            </div>
          </>
        )}
        <div className="k-reveal-bar" aria-hidden="true">
          <div
            className="k-reveal-fill"
            style={{ width: `${Math.max(0, (left / REVEAL_SECONDS) * 100)}%` }}
          />
        </div>
        <div className="k-reveal-left">
          Hides in {Math.max(0, left)}s · this reveal is written to the audit log
        </div>
        <button type="button" className="k-btn-primary" onClick={onClose}>
          Hide now
        </button>
      </div>
    </div>
  );
}

function RecordSkeleton() {
  return (
    <div className="k-screen k-profile" role="status" aria-live="polite">
      <SrOnly>Loading customer record</SrOnly>
      <div className="k-profile-head">
        <Skeleton width={96} height={96} radius={24} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <Skeleton width="35%" height={30} />
          <Skeleton width="22%" height={18} />
        </div>
      </div>
      <div className="k-cards">
        <div className="k-card">
          <Skeleton width="30%" height={12} />
          <div style={{ marginTop: 18 }}>
            <Skeleton width="60%" height={24} />
          </div>
        </div>
        <div className="k-card">
          <Skeleton width="30%" height={12} />
          <div style={{ marginTop: 18 }}>
            <Skeleton width="60%" height={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
