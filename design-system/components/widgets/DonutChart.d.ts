import * as React from "react";
/** Pie / donut widget with an optional centred value. */
export interface DonutSegment { value: number; tone: string; label?: string }
export interface DonutChartProps {
  segments?: DonutSegment[];
  /** @default 180 */
  size?: number;
  /** Ring width. @default 22 */
  thickness?: number;
  label?: string;
  caption?: string;
  style?: React.CSSProperties;
  className?: string;
}
export declare function DonutChart(props: DonutChartProps): JSX.Element;
export default DonutChart;
