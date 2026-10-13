// Inline-SVG icon set. Replaces the DS's Line Awesome dependency for app chrome:
// that font ships from a CDN inside design-system/tokens/fonts.css and silently
// fails to load, which is what turned the nav rail into a blank strip. These are
// hand-drawn Lucide-style (MIT) 24x24 paths — no runtime dependency, no network.
//
// Only app-owned surfaces use this. DS components that render `<i className="las …">`
// internally (Button icon, EmptyState) are left alone; design-system/ is untouchable.

export type IconName =
  | "dashboard"
  | "contacts"
  | "companies"
  | "products"
  | "opportunities"
  | "pipeline"
  | "activities"
  | "audit"
  | "settings"
  | "search"
  | "plus"
  | "x"
  | "chevron-down"
  | "archive"
  | "restore"
  | "calendar"
  | "arrow-right";

// Path data only — every icon inherits stroke/size from the <svg> below.
const PATHS: Record<IconName, React.ReactNode> = {
  // layout-grid
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  // users
  contacts: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  // building-2
  companies: (
    <>
      <path d="M6 22V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v18" />
      <path d="M14 9h4a2 2 0 0 1 2 2v11" />
      <path d="M2 22h20" />
      <path d="M9 6h2M9 10h2M9 14h2M17 13h1M17 17h1" />
    </>
  ),
  // package
  products: (
    <>
      <path d="M21 8v8a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16V8a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 8z" />
      <path d="M3.3 7 12 12l8.7-5" />
      <path d="M12 22V12" />
    </>
  ),
  // target
  opportunities: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  // columns / kanban
  pipeline: (
    <>
      <rect x="3" y="3" width="5.5" height="18" rx="1.5" />
      <rect x="9.75" y="3" width="5.5" height="13" rx="1.5" />
      <rect x="16.5" y="3" width="5.5" height="9" rx="1.5" />
    </>
  ),
  // activity pulse
  activities: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  // shield-check
  audit: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  // sliders
  settings: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1.5 14h5M9.5 8h5M17.5 16h5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  // box-arrow-down
  archive: (
    <>
      <rect x="3" y="3" width="18" height="5" rx="1.5" />
      <path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M12 11v6m0 0-2.5-2.5M12 17l2.5-2.5" />
    </>
  ),
  // rotate-ccw
  restore: (
    <>
      <path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  "arrow-right": <path d="M5 12h14m0 0-6-6m6 6-6 6" />,
};

export function Icon({
  name,
  size = 18,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0, display: "block", ...style }}
    >
      {PATHS[name]}
    </svg>
  );
}
