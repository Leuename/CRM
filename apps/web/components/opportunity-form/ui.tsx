"use client";

import { useId } from "react";

// the heading carries the same ordinal the specification does and a rep reading
// a bug report ("section 3 won't take a price") lands in the right place.
// visual reference: the number sits in a left rail, joined to the next
// one by a hairline connector, and the heading may carry a subtitle and a
// right-aligned action ("+ Add line", "+ New contact").
export function Section({
  index,
  title,
  subtitle,
  action,
  children,
}: {
  index: number;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="opp-form-section" aria-labelledby={`opp-section-${index}`}>
      <div className="opp-form-section-rail" aria-hidden="true">
        <span className="opp-form-section-num">{index}</span>
      </div>
      <div className="opp-form-section-body">
        <div className="opp-form-section-head">
          <div>
            <h2 id={`opp-section-${index}`} className="opp-form-section-title">
              {title}
            </h2>
            {subtitle && <p className="opp-form-section-sub">{subtitle}</p>}
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

export function DateField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Helper text under the box, same slot as the DS Input's hint. */
  hint?: string;
}) {
  // Described, not named: a hint inside the <label> would otherwise be read as
  // part of the field's name (Input.jsx:33 does the same).
  const hintId = `${useId()}-hint`;
  return (
    <label className="crm-field">
      <span className="crm-field-label">{label}</span>
      <input
        type="date"
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        className="crm-field-box"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && (
        <span id={hintId} className="crm-field-hint">
          {hint}
        </span>
      )}
    </label>
  );
}

// A visible label bound to its input by nesting, so the pair survives however
// the row wraps — an `htmlFor` would need an id per line per field, and the
// aria-label alone would leave a sighted user guessing which box is which.
export function LineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="crm-field" style={{ display: "flex", flexDirection: "column" }}>
      <span className="crm-field-label">{label}</span>
      {children}
    </label>
  );
}

// A value the form shows but does not own. Used where a field belongs to
// another record (the lead source of an existing contact) or to another
// endpoint (the stage, before the deal exists) — rendering it as a dead input
// would say "type here" about something typing cannot change.
export function ReadOnlyField({
  label,
  value,
  note,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="crm-field">
      <span className="crm-field-label">{label}</span>
      {/* A box like its editable neighbours (mock section 4), but sunken and
          without the interactive border weight — it takes no typing. */}
      <div className="crm-field-readonly">{value}</div>
      {note && <div className="crm-field-hint">{note}</div>}
    </div>
  );
}
