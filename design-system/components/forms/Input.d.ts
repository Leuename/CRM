import * as React from "react";
/**
 * Boxed text field — label above, 1px bordered box, hint below.
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label sitting above the box. @default "Field title" */
  label?: string;
  /** @default "default" */
  state?: "default" | "active" | "error" | "success";
  /** Line Awesome class rendered at the right edge. */
  icon?: string;
  disabled?: boolean;
  /** Helper or error text under the box. */
  hint?: string;
}
export declare function Input(props: InputProps): JSX.Element;
export default Input;
