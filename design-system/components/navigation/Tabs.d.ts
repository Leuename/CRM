import * as React from "react";
/**
 * Segmented tab row. Active tab is a white 8px-radius chip with a 1px #ECECF2 ring; resting tabs are plain grey text.
 * @startingPoint section="Navigation" subtitle="Text and icon tab rows" viewport="700x120"
 */
export interface TabItem {
  label?: string;
  value: string;
  icon?: string;
}
export interface TabsProps {
  /** Strings, or objects for icon tabs. @default ["Day","Week","Month"] */
  items?: (string | TabItem)[];
  value?: string;
  onChange?: (value: string) => void;
  /** @default "text" */
  variant?: "text" | "icon";
  /** Accessible name for the tablist. */
  ariaLabel?: string;
  /** Stable prefix used to connect each tab to its panel. */
  idBase?: string;
  style?: React.CSSProperties;
  className?: string;
}
export declare function Tabs(props: TabsProps): JSX.Element;
export default Tabs;
