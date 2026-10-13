import React from "react";

export function TopBar({ title = "Page title", actions = ["las la-search", "las la-bell", "las la-cog"], onAction, style, className }) {
  return (
    <header className={className} style={{
      height: "var(--nav-topbar-height)", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 28px", background: "transparent", flexShrink: 0, ...style,
    }}>
      <h1 style={{ margin: 0, font: "700 20px/32px var(--font-ui)", color: "var(--text-primary)" }}>{title}</h1>
      <div style={{ display: "flex", gap: 8 }}>
        {actions.map((icon) => (
          <button key={icon} type="button" onClick={() => onAction && onAction(icon)} style={{
            width: 40, height: 40, borderRadius: "var(--radius-pagination)", border: "none", cursor: "pointer",
            background: "rgba(129,129,165,0.1)", color: "var(--text-secondary)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <i className={icon} style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true" />
          </button>
        ))}
      </div>
    </header>
  );
}
export default TopBar;
