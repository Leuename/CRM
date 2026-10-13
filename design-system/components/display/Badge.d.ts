import * as React from "react";
/** Count badge — round for 1–2 digits, oval for longer counts. Always carries a 2px white ring. */
export interface BadgeProps {
  /** @default "round" */
  shape?: "round" | "oval";
  /** @default "red" */
  tone?: "red" | "blue" | "primary" | "yellow";
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
export declare function Badge(props: BadgeProps): JSX.Element;
export default Badge;
