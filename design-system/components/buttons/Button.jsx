import React from "react";

const SIZES = { md: { height: 46, padding: "0 24px", font: 14 }, sm: { height: 36, padding: "0 18px", font: 12 } };

export function Button({ variant = "primary", size = "md", state, disabled, icon, iconRight, children = "Lable", onClick, style, className, ...rest }) {
  const s = SIZES[size] || SIZES.md;
  const outline = variant === "outline";
  const base = {
    position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
    height: s.height, padding: s.padding, borderRadius: "var(--radius-md)", border: "none",
    font: `var(--text-button-weight) ${s.font}px/17px var(--font-ui)`, cursor: disabled ? "default" : "pointer",
    background: outline ? "var(--bg-surface)" : "var(--primary)",
    color: outline ? "var(--primary)" : "var(--text-inverse)",
    boxShadow: outline ? "inset 0 0 0 1px var(--primary)" : "none",
    opacity: disabled ? 0.35 : 1, transition: "background 120ms linear, opacity 120ms linear",
    whiteSpace: "nowrap", ...style,
  };
  const overlay = state === "hover" ? "var(--overlay-hover)" : state === "active" ? "var(--overlay-press)" : null;
  return (
    <button type="button" className={className} style={base} disabled={disabled} onClick={onClick} {...rest}>
      {overlay && <span style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-md)", background: overlay, pointerEvents: "none" }} />}
      {icon && <i className={icon} style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true" />}
      <span style={{ position: "relative" }}>{children}</span>
      {iconRight && <i className={iconRight} style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true" />}
    </button>
  );
}
export default Button;
