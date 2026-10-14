import React from "react";

export function Pagination({
  page = 1,
  pages = 5,
  variant = "primary",
  onChange,
  style,
  className,
}) {
  const arrow = (dir) => {
    const disabled = dir === "prev" ? page <= 1 : page >= pages;
    return (
      <button
        type="button"
        disabled={disabled}
        aria-label={dir === "prev" ? "Previous page" : "Next page"}
        className="crm-pagination-arrow"
        onClick={() =>
          onChange &&
          onChange(
            Math.min(pages, Math.max(1, page + (dir === "next" ? 1 : -1))),
          )
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          height: 40,
          border: "none",
          background: "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
          padding: 0,
          font: "400 14px/21px var(--font-ui)",
          color: disabled
            ? "var(--text-disabled, #A8A9B5)"
            : "var(--text-secondary)",
          opacity: disabled ? 0.55 : 1,
        }}
      >
        {dir === "prev" && (
          <span
            className="crm-pagination-arrow-icon"
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-pagination)",
              background: "var(--surface-sunken)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="las la-angle-left" style={{ fontSize: 18 }} />
          </span>
        )}
        <span className="crm-pagination-arrow-label">
          {dir === "prev" ? "Prev" : "Next"}
        </span>
        {dir === "next" && (
          <span
            className="crm-pagination-arrow-icon"
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--radius-pagination)",
              background: "var(--surface-sunken)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="las la-angle-right" style={{ fontSize: 18 }} />
          </span>
        )}
      </button>
    );
  };
  return (
    <div
      className={`crm-pagination ${className ?? ""}`.trim()}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        ...style,
      }}
    >
      {arrow("prev")}
      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
          const on = n === page;
          const boxed = variant === "boxed";
          return (
            <button
              key={n}
              type="button"
              aria-label={`Page ${n}`}
              aria-current={on ? "page" : undefined}
              onClick={() => onChange && onChange(n)}
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-pagination)",
                border: "none",
                cursor: "pointer",
                background:
                  on && variant === "primary"
                    ? "var(--primary)"
                    : boxed
                      ? "var(--surface-sunken)"
                      : "transparent",
                boxShadow:
                  on && boxed ? "inset 0 0 0 1px var(--primary)" : "none",
                font: "700 14px/21px var(--font-ui)",
                color:
                  on && variant === "primary"
                    ? "#fff"
                    : on
                      ? "var(--primary)"
                      : "var(--text-secondary)",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      {arrow("next")}
    </div>
  );
}
export default Pagination;
