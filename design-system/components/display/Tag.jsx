import React from "react";

const TONES = {
  primary: { bg: "var(--primary)", fg: "#fff" },
  blue: { bg: "rgba(64,88,200,0.10)", fg: "var(--primary)" },
  lightblue: { bg: "rgba(45,128,210,0.15)", fg: "#2767A6" },
  yellow: { bg: "rgba(200,146,47,0.18)", fg: "#9A6E1E" },
  red: { bg: "rgba(196,86,78,0.16)", fg: "#A6423B" },
  grey: { bg: "var(--surface-sunken)", fg: "var(--text-secondary)" },
};

export function Tag({ tone = "primary", children = "Tag", removable, dot, onRemove, style, className }) {
  const t = TONES[tone] || TONES.primary;
  return (
    <span className={className} style={{
      display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 16px",
      borderRadius: "var(--radius-md)", background: t.bg, color: t.fg,
      font: "700 14px/21px var(--font-ui)", whiteSpace: "nowrap", ...style,
    }}>
      {dot && <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.fg }} />}
      {children}
      {removable && <i className="las la-times" onClick={onRemove} style={{ fontSize: 14, cursor: "pointer", opacity: 0.7 }} aria-hidden="true" />}
    </span>
  );
}
export default Tag;
