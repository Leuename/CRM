import * as React from "react";
/** 20×20 checkbox, 4px radius, primary fill with a white tick. */
export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  /** @default "default" */
  state?: "default" | "error" | "success";
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  style?: React.CSSProperties;
  className?: string;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
export default Checkbox;
