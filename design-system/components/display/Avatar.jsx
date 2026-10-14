import React from "react";

export function Avatar({ src, name = "", size = 40, status, radius = 5, style, className }) {
  const initials = name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <span className={className} style={{ position: "relative", display: "inline-block", width: size, height: size, flexShrink: 0, ...style }}>
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size,
        borderRadius: radius, overflow: "hidden", background: "var(--surface-sunken)",
        font: `700 ${Math.round(size * 0.34)}px/1 var(--font-ui)`, color: "var(--text-secondary)",
      }}>
        {src ? <img src={src} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
      </span>
      {status && <span style={{
        position: "absolute", right: -2, bottom: -2, width: 8, height: 8, borderRadius: "50%",
        background: status === "online" ? "var(--secondary-blue)" : status === "busy" ? "var(--secondary-red)" : "var(--neutral-300)",
        boxShadow: "var(--shadow-status-ring)",
      }} />}
    </span>
  );
}
export default Avatar;
