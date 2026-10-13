import * as React from "react";
/** 20px radio with a 10px primary dot. */
export interface RadioProps {
  label?: string;
  checked?: boolean;
  state?: "default" | "error" | "success";
  disabled?: boolean;
  name?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  style?: React.CSSProperties;
  className?: string;
}
export declare function Radio(props: RadioProps): JSX.Element;
export default Radio;
