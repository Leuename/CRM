"use client";

// DS gap: the design system ships no Select. This is the native <select>
// dressed as the boxed field of visual reference (the `.crm-field`
// block in app/globals.css), keyboard-accessible for free. Wrapping <label>
// gives implicit association; the chevron is an aria-hidden overlay because the
// native arrow cannot be recoloured from a token.
import { useId } from "react";

export function Select({
  label,
  value,
  onChange,
  disabled,
  hint,
  state = "default",
  children,
  style,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Helper text under the box, same slot as the DS Input's hint. */
  hint?: string;
  /** Mirrors the DS Input's `state`: "error" reddens the hint (Input.jsx tone). */
  state?: "default" | "error";
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  // The hint sits inside the wrapping <label>, so without an explicit
  // description it is read as part of the control's NAME ("Lead source How did
  // you hear about us?"). Same fix the DS Input makes (Input.jsx:33).
  const hintId = `${useId()}-hint`;
  const isError = state === "error";
  return (
    <label className="crm-field" style={style}>
      <span className="crm-field-label">{label}</span>
      <span className="crm-field-control">
        <select
          className="crm-field-box"
          value={value}
          disabled={disabled}
          aria-invalid={isError || undefined}
          aria-describedby={hint ? hintId : undefined}
          onChange={(e) => onChange(e.target.value)}
        >
          {children}
        </select>
        <i className="las la-angle-down crm-field-chevron" aria-hidden="true" />
      </span>
      {hint && (
        <span
          id={hintId}
          className="crm-field-hint"
          style={isError ? { color: "var(--secondary-red)" } : undefined}
        >
          {hint}
        </span>
      )}
    </label>
  );
}
