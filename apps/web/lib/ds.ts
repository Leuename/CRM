// Single import surface for the design system in design-system/.
// The DS ships .jsx sources with sibling .d.ts contracts: TypeScript reads the
// .d.ts, Turbopack compiles the .jsx. Nothing is forked or copied.
export { NavRail } from "@ds/components/shell/NavRail";
export type { NavRailItem } from "@ds/components/shell/NavRail";
export { Card } from "@ds/components/shell/Card";
export { TopBar } from "@ds/components/shell/TopBar";
export { DataTable } from "@ds/components/data/DataTable";
export { EmptyState } from "@ds/components/data/EmptyState";
export { StatCounter } from "@ds/components/data/StatCounter";
export { BarChart } from "@ds/components/widgets/BarChart";
export { DonutChart } from "@ds/components/widgets/DonutChart";
export type { DonutSegment } from "@ds/components/widgets/DonutChart";
export { WaveChart } from "@ds/components/widgets/WaveChart";
export { Avatar } from "@ds/components/display/Avatar";
export { Tag } from "@ds/components/display/Tag";
export { Pagination } from "@ds/components/navigation/Pagination";
export { Tabs } from "@ds/components/navigation/Tabs";
export type { TabItem } from "@ds/components/navigation/Tabs";
export { Button } from "@ds/components/buttons/Button";
export { Input } from "@ds/components/forms/Input";
export type { InputProps } from "@ds/components/forms/Input";
export { Switch } from "@ds/components/forms/Switch";
export type { SwitchProps } from "@ds/components/forms/Switch";
