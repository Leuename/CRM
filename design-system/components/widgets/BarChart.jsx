import React from "react";

export function BarChart({ data = [40, 65, 30, 80, 55, 95, 45], labels = [], tone = "var(--secondary-violet)", height = 160, gap = 12, radius = 6, showValues = false, style, className }) {
  const max = Math.max(...data, 1);
  return (
    <div className={className} style={{ ...style }}>
      {/* paddingTop only when showValues so tip labels have room without clipping */}
      <div style={{ display: "flex", alignItems: "flex-end", gap, height, paddingTop: showValues ? 18 : 0 }}>
        {data.map((v, i) => (
          <div key={i} style={{ position: "relative", flex: 1, height: `${(v / max) * 100}%`, background: tone, borderRadius: radius, minWidth: 6 }}>
            {showValues && (
              <span style={{ position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 2, textAlign: "center", font: "400 12px/18px var(--font-ui)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{v}</span>
            )}
          </div>
        ))}
      </div>
      {labels.length > 0 && (
        <div style={{ display: "flex", gap, marginTop: 10 }}>
          {labels.map((l, i) => <div key={i} style={{ flex: 1, textAlign: "center", font: "400 12px/18px var(--font-ui)", color: "var(--text-secondary)" }}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
export default BarChart;
