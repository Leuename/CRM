import * as React from "react";
/** Text-only link styled as an action — primary blue, Lato Bold 14. */
export interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode;
  icon?: string;
}
export declare function LinkButton(props: LinkButtonProps): JSX.Element;
export default LinkButton;
