import React from "react";

const TONE = { default: "var(--primary)", error: "var(--secondary-red)", success: "var(--secondary-blue)" };

export function Radio({ label = "Title", checked = false, state = "default", disabled, name, onChange, style, className }) {
  const fill = TONE[state] || TONE.default;
  return (
    <label className={className} style={{ display: "inline-flex", alignItems: "center", gap: 12, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, ...style }}>
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onChange} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{
        width: 20, height: 20, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-surface)", boxShadow: `inset 0 0 0 1px ${checked || state !== "default" ? fill : "var(--outline-strong)"}`, flexShrink: 0,
      }}>
        {checked && <span style={{ width: 10, height: 10, borderRadius: "50%", background: fill }} />}
      </span>
      {label && <span style={{ font: "700 14px/21px var(--font-ui)", color: "var(--text-primary)" }}>{label}</span>}
    </label>
  );
}
export default Radio;
