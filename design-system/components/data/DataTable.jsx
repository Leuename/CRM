import React from "react";

// Cell padding is driven by CSS custom properties so consumers can retune it
// without !important overrides on the inline styles: set --dt-header-padding /
// --dt-cell-padding on the table (via className or the style prop) and it wins.
// Defaults preserve the original hardcoded values (backward-compatible).
export function DataTable({ columns = [], rows = [], onRowClick, style, className }) {
  return (
    <table className={className} style={{ width: "100%", borderCollapse: "collapse", ...style }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} style={{
              textAlign: c.align || "left", padding: "var(--dt-header-padding, 0 0 14px)", font: "400 12px/18px var(--font-ui)",
              color: "var(--text-secondary)", fontWeight: 400, whiteSpace: "nowrap",
            }}>{c.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? i} onClick={() => onRowClick && onRowClick(r)} style={{ cursor: onRowClick ? "pointer" : "default" }}>
            {columns.map((c) => (
              <td key={c.key} style={{
                textAlign: c.align || "left", padding: "var(--dt-cell-padding, 14px 0)", borderTop: "1px solid var(--outline)",
                font: "400 14px/21px var(--font-ui)", color: "var(--text-primary)", verticalAlign: "middle",
              }}>{c.render ? c.render(r) : r[c.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export default DataTable;
