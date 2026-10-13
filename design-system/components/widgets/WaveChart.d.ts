import * as React from "react";
/** Smoothed area/line chart — the "Orders Web Wave" and "Scheduled" graphs. */
export interface WaveChartProps {
  data?: number[];
  /** @default "var(--primary)" */
  tone?: string;
  /** 10%-opacity area under the line. @default true */
  fill?: boolean;
  /** @default 180 */
  height?: number;
  /** @default true */
  smooth?: boolean;
  /** Y-domain floor. Defaults to the data's own minimum. */
  min?: number;
  /** Y-domain ceiling — pass the axis maximum so a caller's gridlines line up. */
  max?: number;
  style?: React.CSSProperties;
  className?: string;
}
export declare function WaveChart(props: WaveChartProps): JSX.Element;
export default WaveChart;
