import React from "react";

export function Badge({ shape = "round", tone = "red", children = "5", style, className }) {
  const bg = { red: "var(--secondary-red)", blue: "var(--secondary-blue)", primary: "var(--primary)", yellow: "var(--secondary-yellow)" }[tone] || "var(--secondary-red)";
  const oval = shape === "oval";
  return (
    <span className={className} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: oval ? 28 : 20, height: 20, padding: oval ? "0 8px" : 0,
      borderRadius: oval ? 10 : "50%", background: bg, color: "#fff",
      font: "700 12px/18px var(--font-ui)", boxShadow: "0 0 0 2px #fff", ...style,
    }}>{children}</span>
  );
}
export default Badge;
