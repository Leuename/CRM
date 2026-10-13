import * as React from "react";
/** The kit's surface: white, 12px radius, no border, no shadow. Optional 18px bold header row with a right-aligned action slot. */
export interface CardProps {
  title?: React.ReactNode;
  /** Right-aligned node in the header row — usually Tabs or an IconButton. */
  action?: React.ReactNode;
  /** @default 28 */
  padding?: number | string;
  /** @default 12 */
  radius?: number;
  /** Uses the 40%-opacity #F5F5FA fill the kit gives nested cards. */
  tinted?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}
export declare function Card(props: CardProps): JSX.Element;
export default Card;
