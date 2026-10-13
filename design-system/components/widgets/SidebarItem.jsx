import React from "react";
import { Avatar } from "../display/Avatar.jsx";

export function SidebarItem({ variant = "event", time = "05:48AM", tone = "var(--primary)", title = "Meeting with a client", meta, avatar, name = "Nicholas Gordon", status = "online", onClick, style, className }) {
  const shell = {
    display: "flex", gap: 14, alignItems: variant === "message" ? "center" : "flex-start",
    background: "rgba(245,245,250,0.4)", borderRadius: "var(--radius-card)",
    padding: variant === "message" ? "20px 21px" : "14px 22px", boxSizing: "border-box",
    cursor: onClick ? "pointer" : "default", ...style,
  };
  if (variant === "message") {
    return (
      <div className={className} style={shell} onClick={onClick}>
        <Avatar src={avatar} name={name} size={38} status={status} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ font: "700 14px/21px var(--font-ui)", color: "var(--text-primary)" }}>{name}</span>
            <span style={{ font: "400 12px/18px var(--font-ui)", color: "var(--text-secondary)" }}>{time}</span>
          </div>
          <div style={{ font: "400 12px/18px var(--font-ui)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={className} style={{ ...shell, flexDirection: "column", gap: 8 }} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: tone }} />
        <span style={{ font: "700 12px/18px var(--font-ui)", color: tone }}>{time}</span>
      </div>
      <div style={{ font: "700 14px/21px var(--font-ui)", color: "var(--text-primary)" }}>{title}</div>
      {meta && <div style={{ font: "400 12px/18px var(--font-ui)", color: "var(--text-secondary)" }}>{meta}</div>}
    </div>
  );
}
export default SidebarItem;
