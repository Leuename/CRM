import React from "react";

function path(points, w, h, smooth, domainMin, domainMax) {
  // Guard degenerate inputs so no NaN reaches the SVG path geometry.
  if (points.length === 0) return "";                     // nothing to draw
  const midY = h - (h - 8) / 2 - 4;
  if (points.length === 1) return `M 0 ${midY} L ${w} ${midY}`; // flat baseline
  // The domain defaults to the data's own range (the historical behaviour); a
  // caller that draws its own axis passes the axis range instead, so the line
  // and the gridlines agree.
  const max = domainMax ?? Math.max(...points), min = domainMin ?? Math.min(...points), span = max - min || 1;
  const pts = points.map((p, i) => [(i / (points.length - 1)) * w, h - ((p - min) / span) * (h - 8) - 4]);
  if (!smooth) return "M " + pts.map(p => p.join(" ")).join(" L ");
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

export function WaveChart({ data = [12, 30, 18, 42, 26, 50, 34], tone = "var(--primary)", fill = true, height = 180, smooth = true, min, max, style, className }) {
  const w = 600, h = height;
  const line = path(data, w, h, smooth, min, max);
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block", ...style }}>
      {fill && line && <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill={tone} opacity="0.1" />}
      {line && <path d={line} fill="none" stroke={tone} strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}
export default WaveChart;
