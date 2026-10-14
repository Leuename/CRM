import * as React from "react";
/** User picture — square with a 5px radius, optional 8px status dot with a 2px white ring. */
export interface AvatarProps {
  src?: string;
  /** Falls back to initials when no src is given. */
  name?: string;
  /** @default 40 */
  size?: number;
  status?: "online" | "busy" | "offline";
  /** @default 5 */
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
}
export declare function Avatar(props: AvatarProps): JSX.Element;
export default Avatar;
