import * as React from "react";
/**
 * Rounded label chip — 36px tall, 8px radius.
 */
export interface TagProps {
  /** @default "primary" */
  tone?: "primary" | "blue" | "lightblue" | "yellow" | "red" | "grey";
  children?: React.ReactNode;
  /** Adds a trailing × (the kit's "GreyEditable" tag). */
  removable?: boolean;
  /** Adds a leading status dot (the kit's "Status Tag"). */
  dot?: boolean;
  onRemove?: () => void;
  style?: React.CSSProperties;
  className?: string;
}
export declare function Tag(props: TagProps): JSX.Element;
export default Tag;
