import React from "react";
import { ProgressBar } from "../display/ProgressBar.jsx";

function spark(points, w, h) {
  const max = Math.max(...points), min = Math.min(...points);
  const span = max - min || 1;
  return points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / span) * h}`).join(" ");
}

export function StatCounter({ variant = "graph", label = "New tasks", value = "345", data = [4, 9, 6, 12, 8, 15, 11], tone = "var(--primary)", desc, delta, progress = 60, style, className }) {
  if (variant === "bar") {
    return (
      <div className={className} style={{ background: "rgba(245,245,250,0.4)", borderRadius: 12, padding: "14px 26px", boxSizing: "border-box", ...style }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ font: "700 18px/27px var(--font-ui)", color: "var(--text-primary)" }}>{label}</div>
            {desc && <div style={{ font: "400 14px/21px var(--font-ui)", color: "var(--text-secondary)" }}>{desc}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ font: "700 20px/32px var(--font-ui)", color: "var(--text-primary)" }}>{value}</span>
            {delta && <i className={delta === "up" ? "las la-arrow-up" : "las la-arrow-down"} style={{ fontSize: 16, color: delta === "up" ? "var(--secondary-blue)" : "var(--secondary-red)" }} />}
          </div>
        </div>
        <ProgressBar value={progress} height={4} tone="primary" style={{ marginTop: 14 }} />
      </div>
    );
  }
  return (
    <div className={className} style={{
      position: "relative", background: "var(--surface-card)", borderRadius: "var(--radius-counter)",
      height: 98, padding: "22px 28px", boxSizing: "border-box", overflow: "hidden", ...style,
    }}>
      <div style={{ font: "700 20px/32px var(--font-ui)", color: "var(--text-primary)" }}>{value}</div>
      <div style={{ font: "400 14px/21px var(--font-ui)", color: "var(--text-secondary)" }}>{label}</div>
      <svg viewBox="0 0 178 48" preserveAspectRatio="none" style={{ position: "absolute", right: 20, top: 18, width: 178, height: 48 }}>
        <polyline points={spark(data, 178, 44)} fill="none" stroke={tone} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
export default StatCounter;
