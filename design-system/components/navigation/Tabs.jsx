import React from "react";

export function Tabs({
  items = ["Day", "Week", "Month"],
  value,
  onChange,
  variant = "text",
  style,
  className,
  ariaLabel = "Sections",
  idBase = "tabs",
}) {
  const active =
    value ?? (typeof items[0] === "string" ? items[0] : items[0]?.value);
  const tabKeys = items.map((it) => (typeof it === "string" ? it : it.value));
  const slug = (key) => key.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");

  return (
    <div
      className={className}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      style={{ display: "flex", gap: 8, alignItems: "center", ...style }}
    >
      {items.map((it, index) => {
        const label = typeof it === "string" ? it : it.label;
        const key = typeof it === "string" ? it : it.value;
        const icon = typeof it === "string" ? null : it.icon;
        const on = key === active;
        return (
          <button
            key={key}
            id={`${idBase}-tab-${slug(key)}`}
            type="button"
            role="tab"
            aria-label={label || key}
            aria-selected={on}
            aria-controls={`${idBase}-panel`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange && onChange(key)}
            onKeyDown={(event) => {
              let nextIndex = index;
              if (event.key === "ArrowRight")
                nextIndex = (index + 1) % tabKeys.length;
              else if (event.key === "ArrowLeft")
                nextIndex = (index - 1 + tabKeys.length) % tabKeys.length;
              else if (event.key === "Home") nextIndex = 0;
              else if (event.key === "End") nextIndex = tabKeys.length - 1;
              else return;

              event.preventDefault();
              onChange?.(tabKeys[nextIndex]);
              event.currentTarget.parentElement
                ?.querySelectorAll('button[role="tab"]')
                .item(nextIndex)
                ?.focus();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 40,
              padding: variant === "icon" && !label ? 0 : "0 18px",
              width: variant === "icon" && !label ? 40 : undefined,
              borderRadius: "var(--radius-md)",
              border: "none",
              cursor: "pointer",
              background: on ? "var(--bg-surface)" : "transparent",
              boxShadow: on ? "inset 0 0 0 1px var(--outline-resting)" : "none",
              font: "700 14px/21px var(--font-ui)",
              color: on ? "var(--text-primary)" : "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {icon && (
              <i
                className={icon}
                style={{ fontSize: 18, lineHeight: 1 }}
                aria-hidden="true"
              />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
}
export default Tabs;
