import * as React from "react";
/** Slim progress track — 6px tall on cards, 4px inside counters. */
export interface ProgressBarProps {
  /** 0–100. @default 60 */
  value?: number;
  /** @default "primary" — high/medium/low map to blue/yellow/red. */
  tone?: "primary" | "high" | "medium" | "low" | "full";
  /** @default 6 */
  height?: number;
  width?: number | string;
  style?: React.CSSProperties;
  className?: string;
}
export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
export default ProgressBar;
