import * as React from "react";
/**
 * Primary text button — the kit's main call to action.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Fill treatment. @default "primary" */
  variant?: "primary" | "outline";
  /** @default "md" — 46px tall; "sm" is 36px. */
  size?: "md" | "sm";
  /** Forces a visual state for specimens; leave undefined for real interactive use. */
  state?: "resting" | "hover" | "active";
  disabled?: boolean;
  /** Line Awesome class, e.g. "las la-plus". */
  icon?: string;
  iconRight?: string;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
export default Button;
