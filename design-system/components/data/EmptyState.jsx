import React from "react";

export function EmptyState({ icon = "las la-inbox", title = "Nothing here yet", body, action, style, className }) {
  return (
    <div className={className} style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      textAlign: "center", gap: 14, padding: 56, ...style,
    }}>
      <span style={{
        width: 72, height: 72, borderRadius: "var(--radius-card)", background: "var(--surface-sunken)",
        display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)",
      }}><i className={icon} style={{ fontSize: 32 }} aria-hidden="true" /></span>
      <div style={{ font: "700 18px/27px var(--font-ui)", color: "var(--text-primary)" }}>{title}</div>
      {body && <div style={{ font: "400 14px/21px var(--font-ui)", color: "var(--text-secondary)", maxWidth: 320 }}>{body}</div>}
      {action}
    </div>
  );
}
export default EmptyState;
