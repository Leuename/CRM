import React from "react";

export function IconButton({ variant = "primary", icon = "las la-arrow-right", label, state, disabled, square, onClick, style, className, ...rest }) {
  const outline = variant === "outline";
  const solid = variant === "primary" && !!label;
  const bg = outline ? "var(--bg-surface)" : label ? "var(--primary-tint-10)" : "var(--primary)";
  const fg = variant === "outline" || label ? "var(--primary)" : "var(--text-inverse)";
  const overlay = state === "hover" ? "var(--overlay-hover)" : state === "active" ? "var(--overlay-press)" : null;
  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick} style={{
      position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
      height: 46, width: square ? 46 : label ? undefined : 46, padding: label ? "0 18px" : 0,
      borderRadius: "var(--radius-md)", border: "none", background: bg, color: fg,
      boxShadow: outline ? "inset 0 0 0 1px var(--primary)" : "none",
      font: "var(--text-button-weight) 14px/17px var(--font-ui)",
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.35 : 1, ...style,
    }} {...rest}>
      {overlay && <span style={{ position: "absolute", inset: 0, borderRadius: "var(--radius-md)", background: overlay }} />}
      <i className={icon} style={{ fontSize: 18, lineHeight: 1, position: "relative" }} aria-hidden="true" />
      {label && <span style={{ position: "relative" }}>{label}</span>}
    </button>
  );
}
export default IconButton;
