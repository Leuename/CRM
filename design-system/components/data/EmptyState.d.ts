import * as React from "react";

export interface EmptyStateProps {
  /** Line Awesome class. @default "las la-inbox" */
  icon?: string;
  title?: string;
  body?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
export default EmptyState;
