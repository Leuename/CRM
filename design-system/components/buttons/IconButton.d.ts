import * as React from "react";
/** Icon-led button — glyph alone, or glyph plus label on a 10% primary tint. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** @default "primary" */
  variant?: "primary" | "outline";
  /** Line Awesome class. @default "las la-arrow-right" */
  icon?: string;
  /** Optional text beside the glyph. Omit for a 46×46 glyph-only button. */
  label?: string;
  state?: "resting" | "hover" | "active";
  disabled?: boolean;
  square?: boolean;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
export default IconButton;
