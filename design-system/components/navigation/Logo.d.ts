import * as React from "react";
/** The Aster mark and optional wordmark. */
export interface LogoProps {
  /** @default 36 */
  size?: number;
  /** Renders the Aster wordmark beside the mark. @default false */
  wordmark?: boolean;
  /** Path to the Aster mark. @default "/icon.svg" */
  src?: string;
  style?: React.CSSProperties;
  className?: string;
}
export declare function Logo(props: LogoProps): JSX.Element;
export default Logo;
