import React from "react";

const TONES = { primary: "var(--primary)", high: "var(--secondary-blue)", medium: "var(--secondary-yellow)", low: "var(--secondary-red)", full: "var(--primary)" };

export function ProgressBar({ value = 60, tone = "primary", height = 6, width = "100%", style, className }) {
  return (
    <div className={className} style={{ width, height, borderRadius: height / 2, background: "var(--surface-sunken)", overflow: "hidden", ...style }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", borderRadius: height / 2, background: TONES[tone] || TONES.primary, transition: "width 200ms ease-out" }} />
    </div>
  );
}
export default ProgressBar;
