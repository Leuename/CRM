import React from "react";
import { Logo } from "../navigation/Logo.jsx";
import { Avatar } from "../display/Avatar.jsx";

export function NavRail({ items = [], value, onChange, avatar, style, className }) {
  return (
    <nav className={className} style={{
      width: "var(--nav-rail-width)", minHeight: "100%", background: "var(--bg-surface)",
      borderRight: "1px solid var(--outline)", display: "flex", flexDirection: "column",
      alignItems: "center", paddingTop: 26, boxSizing: "border-box", flexShrink: 0, ...style,
    }}>
      <Logo size={30} />
      <div style={{ display: "flex", flexDirection: "column", width: "100%", marginTop: 20 }}>
        {items.map((it) => {
          const on = it.value === value;
          return (
            <button key={it.value} type="button" title={it.label} onClick={() => onChange && onChange(it.value)} style={{
              position: "relative", height: "var(--nav-item-height)", width: "100%", border: "none",
              background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                width: 48, height: 48, borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: on ? "var(--primary-tint-10)" : "transparent",
                color: on ? "var(--primary)" : "var(--text-secondary)",
              }}>
                <i className={it.icon} style={{ fontSize: 22, lineHeight: 1 }} aria-hidden="true" />
              </span>
              {it.badge && <span style={{ position: "absolute", right: 22, top: 20, width: 10, height: 10, borderRadius: "50%", background: it.badge === "message" ? "var(--secondary-blue)" : "var(--secondary-red)", boxShadow: "0 0 0 1px #fff" }} />}
              {on && <span style={{ position: "absolute", right: 6, top: 8, width: 2, height: 48, borderRadius: 1, background: "var(--primary)" }} />}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: "auto", paddingBottom: 25 }}>
        <Avatar src={avatar} name="Aster" size={30} status="online" />
      </div>
    </nav>
  );
}
export default NavRail;
