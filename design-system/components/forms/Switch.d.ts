import * as React from "react";
/** 40×22 pill switch with a 16px knob. */
export interface SwitchProps {
  checked?: boolean;
  state?: "default" | "error" | "success";
  disabled?: boolean;
  label?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  style?: React.CSSProperties;
  className?: string;
}
export declare function Switch(props: SwitchProps): JSX.Element;
export default Switch;
