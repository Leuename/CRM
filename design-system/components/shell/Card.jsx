import React from "react";

export function Card({ title, action, padding = 28, radius = 12, tinted, children, style, className }) {
  return (
    <section className={className} style={{
      background: tinted ? "rgba(245,245,250,0.4)" : "var(--surface-card)",
      borderRadius: radius, padding, boxSizing: "border-box", ...style,
    }}>
      {(title || action) && (
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          {title && <h2 style={{ margin: 0, font: "700 18px/27px var(--font-ui)", color: "var(--text-primary)" }}>{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
export default Card;
