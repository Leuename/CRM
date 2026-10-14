import React from "react";

export function LinkButton({ children = "Link button", href = "#", icon, style, className, ...rest }) {
  return (
    <a href={href} className={className} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      font: "700 14px/21px var(--font-ui)", color: "var(--primary)", textDecoration: "none", ...style,
    }} {...rest}>
      {icon && <i className={icon} style={{ fontSize: 16, lineHeight: 1 }} aria-hidden="true" />}
      {children}
    </a>
  );
}
export default LinkButton;
