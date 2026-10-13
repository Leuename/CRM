import React from "react";

export function Tabs({ items = ["Day", "Week", "Month"], value, onChange, variant = "text", style, className }) {
  const active = value ?? (typeof items[0] === "string" ? items[0] : items[0]?.value);
  return (
    <div className={className} style={{ display: "flex", gap: 8, alignItems: "center", ...style }}>
      {items.map((it) => {
        const label = typeof it === "string" ? it : it.label;
        const key = typeof it === "string" ? it : it.value;
        const icon = typeof it === "string" ? null : it.icon;
        const on = key === active;
        return (
          <button key={key} type="button" onClick={() => onChange && onChange(key)} style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            height: 40, padding: variant === "icon" && !label ? 0 : "0 18px", width: variant === "icon" && !label ? 40 : undefined,
            borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
            background: on ? "var(--bg-surface)" : "transparent",
            boxShadow: on ? "inset 0 0 0 1px var(--outline-resting)" : "none",
            font: "700 14px/21px var(--font-ui)", color: on ? "var(--text-primary)" : "var(--text-secondary)",
            whiteSpace: "nowrap",
          }}>
            {icon && <i className={icon} style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
export default Tabs;
