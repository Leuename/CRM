import * as React from "react";
/** List widget table — grey 12px headers, 1px #F0F0F3 row rules, no zebra striping, no outer border. */
export interface DataColumn<T = any> { key: string; header?: React.ReactNode; align?: "left" | "center" | "right"; render?: (row: T) => React.ReactNode }
export interface DataTableProps<T = any> {
  columns?: DataColumn<T>[];
  rows?: T[];
  onRowClick?: (row: T) => void;
  style?: React.CSSProperties;
  className?: string;
}
export declare function DataTable(props: DataTableProps): JSX.Element;
export default DataTable;
