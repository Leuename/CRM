"use client";

// The four wizard steps plus the "this number is already ours" screen that sits
// inside step 1. Presentation only: every one of these takes a draft and hands
// edits back up to page.tsx, which owns the state machine and the one write.

import { Tag } from "@/lib/ds";
import type { Contact, OpportunityRef, PipelineStage, Product } from "@/lib/api";
import { maskEmail, maskPhone, initials } from "@/lib/kiosk-mask";
import { stageTone } from "@/lib/opportunities";
import { ageLabel, fullName } from "../kiosk-format";
import { CategoryGlyph, WarningGlyph } from "../KioskIcons";
import { KioskEmpty, KioskError, KioskLoadingRows } from "../KioskState";
import { presentationFor } from "./rooms";
import {
  type Draft,
  type StepId,
  STEPS,
  STEP_LABELS,
  canReview,
  categoriesOf,
  consentSummary,
  formatMobile,
  missingHint,
  rateLabel,
} from "./wizard";

/* --- the rail ------------------------------------------------------------- */

export function StepRail({
  current,
  draft,
  onGo,
}: {
  current: StepId;
  draft: Draft;
  onGo: (step: StepId) => void;
}) {
  const index = STEPS.indexOf(current);
  const reviewOpen = canReview(draft);

  return (
    <nav className="k-rail" aria-label="Inquiry steps">
      {STEPS.map((step, i) => {
        // Review stays shut until the form would actually go through: opening it
        // early shows the operator a summary of something they cannot send.
        const locked = step === "review" && !reviewOpen;
        const done = i <= index;
        return (
          <div className="k-rail-item" key={step}>
            <button
              type="button"
              className="k-rail-btn"
              disabled={locked}
              aria-current={step === current ? "step" : undefined}
              onClick={() => onGo(step)}
            >
              <span className={`k-rail-n${done && !locked ? " k-rail-n-on" : ""}`}>{i + 1}</span>
              <span className={`k-rail-label${done && !locked ? " k-rail-label-on" : ""}`}>
                {STEP_LABELS[step]}
              </span>
            </button>
            <span className="k-rail-line" />
          </div>
        );
      })}
    </nav>
  );
}

/* --- footer --------------------------------------------------------------- */

// Pinned above the on-screen keyboard: on an iPad the keyboard shrinks the
// visual viewport, and a footer that scrolls with the form puts Continue under
// the operator's thumb-rest. .k-foot-bar is `flex: none` at the bottom of the
// screen box, so it stays reachable with the keyboard open.
export function StepFooter({
  onDiscard,
  hint,
  children,
}: {
  onDiscard: () => void;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="k-foot-bar">
      <button type="button" className="k-ghost-btn k-ghost-danger" onClick={onDiscard}>
        Start over
      </button>
      <div className="k-foot-right">
        {hint && <span className="k-foot-hint">{hint}</span>}
        {children}
      </div>
    </div>
  );
}

/* --- step 1: who ---------------------------------------------------------- */

export function StepWho({
  draft,
  onMobile,
  onContinue,
  onDiscard,
  busy,
  error,
}: {
  draft: Draft;
  onMobile: (digits: string) => void;
  onContinue: () => void;
  onDiscard: () => void;
  busy: boolean;
  error: unknown;
}) {
  const ready = draft.mobile.length === 10;

  return (
    <>
      <div className="k-pad k-grow">
        <h2 className="k-h2 k-step-focus" data-kiosk-screen-heading tabIndex={-1}>
          <span className="sr-only">Step 1 of 4. </span>
          Input mobile number.
        </h2>
        <div className="k-mobile-row">
          <span className="k-mobile-cc" aria-hidden="true">
            +63
          </span>
          <input
            className="k-mobile-input"
            // inputMode numeric brings up the iPad number pad; the +63 is not
            // part of the field, so nothing can be typed over it.
            inputMode="numeric"
            autoComplete="tel-national"
            aria-label="Mobile number, starting with 9 — without the +63 country code"
            placeholder="9XX XXX XXXX"
            value={formatMobile(draft.mobile)}
            onChange={(e) => onMobile(e.target.value)}
          />
        </div>
        {error != null && (
          <div className="k-pad-top">
            <KioskError error={error} />
          </div>
        )}
      </div>
      <StepFooter onDiscard={onDiscard}>
        <button
          type="button"
          className="k-btn-primary"
          disabled={!ready || busy}
          onClick={onContinue}
        >
          {busy ? "Checking…" : "Continue"}
        </button>
      </StepFooter>
    </>
  );
}

/* --- step 1b: an existing record ------------------------------------------ */

export function MatchFound({
  contact,
  inquiries,
  stages,
  inquiriesLoading,
  onUse,
  onCreateNew,
  onDiscard,
}: {
  contact: Contact;
  inquiries: OpportunityRef[];
  /** OpportunityRef carries only stage_id — the name and colour come from the
   *  server's stage list, never from parsing the title. */
  stages: Map<string, PipelineStage>;
  inquiriesLoading: boolean;
  onUse: () => void;
  onCreateNew: () => void;
  onDiscard: () => void;
}) {
  const name = fullName(contact);

  return (
    <>
      <div className="k-pad k-grow k-scroll">
        <h2 className="sr-only k-step-focus" data-kiosk-screen-heading tabIndex={-1}>
          Step 1 of 4. A matching customer was found.
        </h2>
        <div className="k-notice">
          <WarningGlyph />
          This number matches an existing record.
        </div>

        <div className="k-match-card">
          <span className="k-avatar-lg" aria-hidden="true">
            {initials(name)}
          </span>
          <div className="k-match-body">
            <div className="k-match-name">{name}</div>
            <div className="k-match-sub">{contact.company_name ?? "No company on file"}</div>
            {/* Masked in the lobby, exactly as on Find customer: the screen faces
                whoever is standing at the desk, not only the customer. */}
            <div className="k-match-contact">
              <span>{maskPhone(contact.phone)}</span>
              <span>{maskEmail(contact.email)}</span>
            </div>
          </div>
        </div>

        <div className="k-section-label">Open inquiries</div>
        {inquiriesLoading ? (
          <KioskLoadingRows count={2} />
        ) : inquiries.length === 0 ? (
          <KioskEmpty title="Nothing open right now.">
            Their last visit is closed, so this will be a fresh inquiry.
          </KioskEmpty>
        ) : (
          <div className="k-inq-list">
            {inquiries.map((o) => {
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
      </div>
      <StepFooter onDiscard={onDiscard}>
        <button type="button" className="k-ghost-btn" onClick={onCreateNew}>
          Create new
        </button>
        <button type="button" className="k-btn-primary" onClick={onUse}>
          Yes, continue as {contact.first_name}
        </button>
      </StepFooter>
    </>
  );
}

/* --- step 2: what they need ----------------------------------------------- */

export function StepWhat({
  draft,
  products,
  loading,
  error,
  openRoom,
  onCategory,
  onPick,
  onToggleRoom,
  onContinue,
  onDiscard,
}: {
  draft: Draft;
  products: Product[];
  loading: boolean;
  error: unknown;
  openRoom: string | null;
  onCategory: (category: string) => void;
  onPick: (product: Product) => void;
  onToggleRoom: (id: string) => void;
  onContinue: () => void;
  onDiscard: () => void;
}) {
  const categories = categoriesOf(products);
  const category = draft.category ?? categories[0] ?? null;
  const variants = products.filter((p) => p.category === category);

  return (
    <>
      <div className="k-what k-grow">
        <h2 className="sr-only k-step-focus" data-kiosk-screen-heading tabIndex={-1}>
          Step 2 of 4. Choose what they need.
        </h2>
        <div className="k-what-cats">
          {categories.map((c, index) => (
            <button
              type="button"
              key={c}
              className={`k-cat${c === category ? " k-cat-on" : ""}`}
              data-kiosk-screen-focus={index === 0 ? "" : undefined}
              aria-pressed={c === category}
              onClick={() => onCategory(c)}
            >
              <span className="k-cat-icon" aria-hidden="true">
                <CategoryGlyph category={c} />
              </span>
              <span className="k-cat-label">{c}</span>
            </button>
          ))}
        </div>

        <div className="k-what-list">
          <div className="k-section-label" data-kiosk-screen-focus tabIndex={-1}>
            {category ?? "Services"}
          </div>
          <div className="k-variants">
            {loading && <KioskLoadingRows count={4} />}
            {error != null && <KioskError error={error} />}
            {/* Two different nothings. "No groups at all" means the catalogue
                did not reach this iPad — telling the operator to pick another
                group would be advice they cannot follow. */}
            {!loading && error == null && categories.length === 0 && (
              <KioskEmpty title="The service list hasn't loaded.">
                Take their details anyway and note what they need — a representative can add the
                service afterwards. If this keeps happening, tell the service team.
              </KioskEmpty>
            )}
            {!loading && error == null && categories.length > 0 && variants.length === 0 && (
              <KioskEmpty title="Nothing to offer here yet.">
                The catalogue has no active items in this group. Pick another, or take the details
                and note what they asked for.
              </KioskEmpty>
            )}
            {variants.map((p) => {
              const picked = p.id === draft.productId;
              const open = openRoom === p.id;
              const productPresentation = presentationFor(p.id);
              return (
                <div key={p.id} className={`k-variant${picked ? " k-variant-on" : ""}`}>
                  <button
                    type="button"
                    className="k-variant-choice"
                    aria-pressed={picked}
                    onClick={() => onPick(p)}
                  >
                    <span className="k-variant-name">{p.name}</span>
                    {productPresentation && (
                      <span className="k-variant-meta">{productPresentation.meta}</span>
                    )}
                    <span className="k-variant-rate">{rateLabel(p)}</span>
                  </button>

                  {/* Always mounted, never conditionally rendered: the design
                      animates it open (max-height + opacity), and a panel that
                      only exists once opened cannot transition. */}
                  <div
                    id={`k-variant-panel-${p.id}`}
                    className={`k-variant-panel${open ? " k-variant-panel-open" : ""}`}
                    aria-hidden={!open}
                  >
                    <div className="k-variant-photo">
                      {productPresentation && (
                        /* eslint-disable-next-line @next/next/no-img-element --
                           a fixed 130px-tall local asset already sized for this
                           slot. next/image would add a loader and a layout pass
                           to a picture whose dimensions never change. */
                        <img src={productPresentation.image} alt={`Illustration for ${p.name}`} />
                      )}
                    </div>
                    {p.description && <div className="k-variant-caption">{p.description}</div>}
                  </div>

                  <button
                    type="button"
                    className="k-variant-toggle"
                    aria-expanded={open}
                    aria-controls={`k-variant-panel-${p.id}`}
                    aria-label={open ? `Hide ${p.name}` : `View ${p.name}`}
                    onClick={(e) => {
                      // Looking is not choosing: without this the chevron would
                      // select the service too, through the card's own handler.
                      e.stopPropagation();
                      onToggleRoom(p.id);
                    }}
                  >
                    <span className="k-variant-chev" aria-hidden="true">
                      &#8250;
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
          <p className="k-what-note">
            Illustrative service rates · VAT exclusive. Pipeline values are never shown here.
          </p>
        </div>
      </div>
      <StepFooter onDiscard={onDiscard}>
        <button
          type="button"
          className="k-btn-primary"
          disabled={!draft.productId}
          onClick={onContinue}
        >
          Continue
        </button>
      </StepFooter>
    </>
  );
}

/* --- step 3: details ------------------------------------------------------ */

export function StepDetails({
  draft,
  locked,
  onChange,
  onContinue,
  onDiscard,
}: {
  draft: Draft;
  /** True once step 1 matched an existing customer: their record is not the
   *  kiosk's to edit (OPERATIONS holds no edit_contacts), so the fields the
   *  server would ignore are shown read-only rather than pretending to save. */
  locked: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onContinue: () => void;
  onDiscard: () => void;
}) {
  const hint = missingHint(draft);

  return (
    <>
      <div className="k-pad k-grow k-scroll">
        <h2 className="k-h2 k-h2-tight k-step-focus" data-kiosk-screen-heading tabIndex={-1}>
          <span className="sr-only">Step 3 of 4. </span>
          User details
        </h2>

        <div className="k-form-grid">
          <Field label="Full name">
            {locked ? (
              <div className="k-field-locked">{draft.name}</div>
            ) : (
              <input
                className="k-input"
                value={draft.name}
                placeholder="Avery Sample"
                autoComplete="name"
                onChange={(e) => onChange({ name: e.target.value })}
              />
            )}
          </Field>

          <Field label="Company" optional>
            {locked ? (
              <div className="k-field-locked">{draft.company || "—"}</div>
            ) : (
              <input
                className="k-input"
                value={draft.company}
                placeholder="Aster Learning Group"
                autoComplete="organization"
                onChange={(e) => onChange({ company: e.target.value })}
              />
            )}
          </Field>

          {/* Email is asked for only on the new-person path. On the matched
              one it was a read-only echo of a record the kiosk cannot edit, and
              since the server started masking it ( view_contact_pii) the
              echo is of the MASK — a second, dimmer printing of an address the
              operator has just confirmed with the customer on the match card
              one screen back, which the design draws masked too. Nothing about
              the submission changes: a matched inquiry sends `contact_id` and
              no contact fields at all (page.tsx: submit). */}
          {!locked && (
            <Field label="Email">
              <input
                className="k-input"
                type="email"
                inputMode="email"
                // The column's own ceiling (contacts.email is CITEXT with a
                // btree index; ContactCreate and KioskContactInput both cap at
                // 254). Enforced here so a pasted address is trimmed at the
                // keyboard rather than refused at Submit.
                maxLength={254}
                value={draft.email}
                placeholder="avery.sample@aster.example"
                autoComplete="email"
                onChange={(e) => onChange({ email: e.target.value })}
              />
            </Field>
          )}

          <Field label="Mobile">
            <div className="k-field-locked">+63 {formatMobile(draft.mobile)}</div>
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            className="k-textarea"
            value={draft.notes}
            placeholder="Looking for help streamlining onboarding for a growing team this quarter."
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </Field>

        <div className="k-consent">
          <ConsentBox
            checked={draft.consent}
            required
            onToggle={() => onChange({ consent: !draft.consent })}
          >
            I agree to Aster Advisory processing my details to handle this inquiry.{" "}
            <span className="k-required">Required</span>
          </ConsentBox>
          <div className="k-consent-rule" />
          <ConsentBox
            checked={draft.marketing}
            onToggle={() => onChange({ marketing: !draft.marketing })}
          >
            Send me occasional updates about Aster Advisory.{" "}
            <span className="k-optional">Optional</span>
          </ConsentBox>
        </div>
      </div>
      <StepFooter onDiscard={onDiscard} hint={hint}>
        <button
          type="button"
          className="k-btn-primary"
          disabled={!canReview(draft)}
          onClick={onContinue}
        >
          Review
        </button>
      </StepFooter>
    </>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="k-field">
      <span className="k-field-label">
        {label}
        {optional && <span className="k-field-optional"> · optional</span>}
      </span>
      {children}
    </label>
  );
}

function ConsentBox({
  checked,
  required,
  onToggle,
  children,
}: {
  checked: boolean;
  required?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="k-consent-row"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
    >
      <span
        className={`k-check${checked ? " k-check-on" : ""}${required && !checked ? " k-check-req" : ""}`}
        aria-hidden="true"
      >
        {checked && (
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="3">
            <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="k-consent-text">{children}</span>
    </button>
  );
}

/* --- step 4: review ------------------------------------------------------- */

export function StepReview({
  draft,
  productName,
  productRate,
  operator,
  onEdit,
  onSubmit,
  onDiscard,
  busy,
  error,
}: {
  draft: Draft;
  productName: string;
  productRate: string;
  operator: string;
  onEdit: (step: StepId) => void;
  onSubmit: () => void;
  onDiscard: () => void;
  busy: boolean;
  error: unknown;
}) {
  const rows: { label: string; value: string; step: StepId }[] = [
    {
      label: "Customer",
      value: draft.name + (draft.company ? ` · ${draft.company}` : ""),
      step: "details",
    },
    { label: "Mobile", value: `+63 ${formatMobile(draft.mobile)}`, step: "who" },
    // Em dash, like Notes: a matched contact may have no address on file at
    // all, and an empty review row reads as a rendering fault rather than as
    // "there isn't one". Nothing is required here on that path — see
    // wizard.missingFields.
    { label: "Email", value: draft.email || "—", step: "details" },
    { label: "Interested in", value: `${productName} · ${productRate}`, step: "what" },
    { label: "Notes", value: draft.notes || "—", step: "details" },
    { label: "Consent", value: consentSummary(draft), step: "details" },
  ];

  return (
    <>
      <div className="k-pad k-grow k-scroll">
        <h2 className="k-h2 k-h2-tight k-step-focus" data-kiosk-screen-heading tabIndex={-1}>
          <span className="sr-only">Step 4 of 4. </span>
          Check this with the customer
        </h2>
        <p className="k-p">Tap any row to correct it.</p>

        <div className="k-review">
          {rows.map((r) => (
            <button
              type="button"
              className="k-review-row"
              key={r.label}
              onClick={() => onEdit(r.step)}
            >
              <span className="k-review-label">{r.label}</span>
              <span className="k-review-value">{r.value}</span>
              <span className="k-review-edit" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M4 20h4l10-10-4-4L4 16v4z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="sr-only">Edit {r.label.toLowerCase()}</span>
            </button>
          ))}
        </div>

        <div className="k-review-foot">
          <span>Taken by {operator} · Front desk</span>
          <span>Lands in New Inquiry</span>
        </div>

        {error != null && (
          <div className="k-pad-top">
            <KioskError error={error} />
          </div>
        )}
      </div>
      <StepFooter onDiscard={onDiscard}>
        <button type="button" className="k-btn-primary k-btn-lg" disabled={busy} onClick={onSubmit}>
          {busy ? "Submitting…" : "Submit inquiry"}
        </button>
      </StepFooter>
    </>
  );
}
