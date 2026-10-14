import * as React from "react";
/** Prev / numbers / Next pager. Number cells are 32×32 with a 6px radius; the arrow wells are 40×40 on #F5F5FA. */
export interface PaginationProps {
  /** @default 1 */
  page?: number;
  /** @default 5 */
  pages?: number;
  /** @default "primary" — solid blue current page; "boxed" uses a tinted well with a blue ring; "fullsize" spreads to the container width. */
  variant?: "primary" | "boxed" | "fullsize";
  onChange?: (page: number) => void;
  style?: React.CSSProperties;
  className?: string;
}
export declare function Pagination(props: PaginationProps): JSX.Element;
export default Pagination;
