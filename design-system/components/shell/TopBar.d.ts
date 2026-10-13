import * as React from "react";
/** 84px page header — page title left, 40×40 tinted icon wells right. */
export interface TopBarProps {
  /** @default "Page title" */
  title?: string;
  /** Line Awesome classes for the right-hand wells. */
  actions?: string[];
  onAction?: (icon: string) => void;
  style?: React.CSSProperties;
  className?: string;
}
export declare function TopBar(props: TopBarProps): JSX.Element;
export default TopBar;
