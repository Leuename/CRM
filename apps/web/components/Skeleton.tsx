// Loading placeholders. Replaces the "Loading …" text states so a fetch reads as
// the shape of the content that is coming rather than a centred sentence.
// Every variant keeps role="status" + a visually hidden label: the pulse is
// decorative, the announcement is the accessible part.
// Animation lives in globals.css (.skeleton), and is opacity-only so
// prefers-reduced-motion needs no separate variant.

export function Skeleton({
  width = "100%",
  height = 12,
  radius = 6,
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return <span className="skeleton" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SrOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// A block of skeleton bars announced as one loading region.
function Region({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div role="status" aria-live="polite" style={style}>
      <SrOnly>{label}</SrOnly>
      {children}
    </div>
  );
}

// List pages: five table-row-shaped bars under a header-shaped one.
export function TableSkeleton({ label, rows = 5 }: { label: string; rows?: number }) {
  return (
    <Region
      label={label}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        padding: "8px 0",
      }}
    >
      <Skeleton width="22%" height={10} />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Skeleton width={38} height={38} radius={19} />
          <Skeleton width={`${34 - (i % 3) * 6}%`} height={12} />
          <Skeleton width="18%" height={12} />
          <Skeleton width="12%" height={12} style={{ marginLeft: "auto" }} />
        </div>
      ))}
    </Region>
  );
}

// Detail pages: a title bar plus three text lines.
export function DetailSkeleton({ label }: { label: string }) {
  return (
    <Region
      label={label}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "28px 0",
      }}
    >
      <Skeleton width="34%" height={22} radius={8} />
      <Skeleton width="72%" />
      <Skeleton width="58%" />
      <Skeleton width="64%" />
    </Region>
  );
}

// Inline-block, not the default block: a block child would collapse the line box
// of .kpi-label / .kpi-value and shrink each tile. As an inline box the bar sits
// inside the class's own line-height, so the tile keeps the loaded height
// without this file repeating any of those numbers.
const BAR_IN_LINE: React.CSSProperties = {
  display: "inline-block",
  verticalAlign: "middle",
};

// Dashboard KPI band: the loaded band's own classes (.kpi-band / .kpi-tile /
// .kpi-label / .kpi-value) carry the surface, hairlines, padding and line
// boxes, so the silhouette cannot drift from the real thing — only the text is
// swapped for pulsing bars. Widths vary per tile so it reads as label+value
// rather than a stack of identical rectangles.
export function KpiSkeleton({ label, count = 8 }: { label: string; count?: number }) {
  return (
    <Region label={label}>
      <div className="kpi-band">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="kpi-tile">
            <span className="kpi-label">
              <Skeleton width={`${58 + (i % 3) * 12}%`} height={8} radius={4} style={BAR_IN_LINE} />
            </span>
            <span className="kpi-value">
              <Skeleton
                width={`${42 + (i % 4) * 11}%`}
                height={20}
                radius={6}
                style={BAR_IN_LINE}
              />
            </span>
          </div>
        ))}
      </div>
    </Region>
  );
}

// Dashboard chart widgets: one chart-shaped block plus legend lines.
export function ChartSkeleton({ label, height = 180 }: { label: string; height?: number }) {
  return (
    <Region label={label} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Skeleton height={height} radius={10} />
      <Skeleton width="70%" />
      <Skeleton width="45%" />
    </Region>
  );
}
