import React from "react";

export function Logo({ size = 36, wordmark = false, src = "/icon.svg", style, className }) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 14, ...style }}>
      <span style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <img src={src} alt="" style={{ display: "block", width: size, height: size }} />
      </span>
      {wordmark && <span style={{ font: "700 26px/38px var(--font-ui)", color: "var(--text-primary)", letterSpacing: 0.4 }}>Aster</span>}
    </span>
  );
}
export default Logo;
