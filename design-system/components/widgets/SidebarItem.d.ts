import * as React from "react";
/**
 * The 90px sidebar row used for upcoming events, calendar events and messages.
 */
export interface SidebarItemProps {
  /** @default "event" */
  variant?: "event" | "message";
  /** Timestamp — coloured to match `tone` on event rows. @default "05:48AM" */
  time?: string;
  /** Accent colour for the dot and time. @default "var(--primary)" */
  tone?: string;
  /** Event title, or the message preview line. */
  title?: string;
  /** Optional third line on event rows. */
  meta?: string;
  avatar?: string;
  /** Sender name (message variant). */
  name?: string;
  status?: "online" | "busy" | "offline";
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}
export declare function SidebarItem(props: SidebarItemProps): JSX.Element;
export default SidebarItem;
