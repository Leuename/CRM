import * as React from "react";
/**
 * The 84px icon-only left rail: logo, stacked 64px icon slots, avatar pinned to the bottom.
 * @startingPoint section="Shell" subtitle="84px icon rail with active slot and status dots" viewport="700x400"
 */
export interface NavRailItem { value: string; label: string; /** Line Awesome class */ icon: string; badge?: "alert" | "message" }
export interface NavRailProps {
  items?: NavRailItem[];
  value?: string;
  onChange?: (value: string) => void;
  /** Avatar image URL for the footer slot. */
  avatar?: string;
  style?: React.CSSProperties;
  className?: string;
}
export declare function NavRail(props: NavRailProps): JSX.Element;
export default NavRail;
