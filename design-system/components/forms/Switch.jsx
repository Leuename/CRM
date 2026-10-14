import React from "react";

const TONE = { default: "var(--primary)", error: "var(--secondary-red)", success: "var(--secondary-blue)" };

export function Switch({ checked = false, state = "default", disabled, label, onChange, style, className }) {
  const fill = TONE[state] || TONE.default;
  return (
    <label className={className} style={{ display: "inline-flex", alignItems: "center", gap: 12, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, ...style }}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={onChange} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{
        width: 40, height: 22, borderRadius: 11, background: checked ? fill : "var(--surface-sunken)",
        boxShadow: checked ? "none" : "inset 0 0 0 1px var(--outline-resting)",
        position: "relative", transition: "background 120ms linear", flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 3, left: checked ? 20 : 4, width: 16, height: 16, borderRadius: "50%",
          background: checked ? "#fff" : "var(--neutral-300)", transition: "left 120ms ease-out",
        }} />
      </span>
      {label && <span style={{ font: "400 14px/21px var(--font-ui)", color: "var(--text-primary)" }}>{label}</span>}
    </label>
  );
}
export default Switch;
