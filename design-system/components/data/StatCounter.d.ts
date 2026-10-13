import * as React from "react";
/**
 * KPI counter. "graph" is the 98px white card with a sparkline; "bar" is the tinted card with a progress rail.
 */
export interface StatCounterProps {
  /** @default "graph" */
  variant?: "graph" | "bar";
  label?: string;
  value?: string | number;
  /** Sparkline series (graph variant). */
  data?: number[];
  /** Stroke colour for the sparkline. @default "var(--primary)" */
  tone?: string;
  /** Sub-label under the title (bar variant). */
  desc?: string;
  /** Trend arrow (bar variant). */
  delta?: "up" | "down";
  /** 0–100 rail fill (bar variant). @default 60 */
  progress?: number;
  style?: React.CSSProperties;
  className?: string;
}
export declare function StatCounter(props: StatCounterProps): JSX.Element;
export default StatCounter;
