import * as React from "react";
/** Vertical bar chart — rounded columns, no axes, no gridlines. */
export interface BarChartProps {
  data?: number[];
  labels?: string[];
  /** @default "var(--secondary-violet)" */
  tone?: string;
  /** @default 160 */
  height?: number;
  gap?: number;
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
}
export declare function BarChart(props: BarChartProps): JSX.Element;
export default BarChart;
