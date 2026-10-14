import React from "react";

export function DonutChart({ segments = [{ value: 45, tone: "var(--primary)" }, { value: 30, tone: "var(--secondary-violet)" }, { value: 25, tone: "var(--secondary-cyan)" }], size = 180, thickness = 22, label, caption, style, className }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className={className} style={{ position: "relative", width: size, height: size, ...style }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.tone} strokeWidth={thickness} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
      </svg>
      {(label || caption) && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {label && <span style={{ font: "700 20px/32px var(--font-ui)", color: "var(--text-primary)" }}>{label}</span>}
          {caption && <span style={{ font: "400 12px/18px var(--font-ui)", color: "var(--text-secondary)" }}>{caption}</span>}
        </div>
      )}
    </div>
  );
}
export default DonutChart;
