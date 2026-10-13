import React from "react";

const TONE = { default: "var(--primary)", error: "var(--secondary-red)", success: "var(--secondary-blue)" };

export function Checkbox({ label = "Title", checked = false, state = "default", disabled, onChange, style, className }) {
  const fill = TONE[state] || TONE.default;
  return (
    <label className={className} style={{ display: "inline-flex", alignItems: "center", gap: 12, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, ...style }}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{
        width: 20, height: 20, borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: checked ? fill : "var(--bg-surface)", boxShadow: checked ? "none" : `inset 0 0 0 1px ${state === "default" ? "var(--outline-strong)" : fill}`,
        color: "#fff", flexShrink: 0,
      }}>
        {checked && <i className="las la-check" style={{ fontSize: 14, lineHeight: 1 }} aria-hidden="true" />}
      </span>
      {label && <span style={{ font: "700 14px/21px var(--font-ui)", color: "var(--text-primary)" }}>{label}</span>}
    </label>
  );
}
export default Checkbox;
