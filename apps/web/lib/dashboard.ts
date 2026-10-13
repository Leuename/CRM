// Presentation helpers for the dashboard. No metric is computed here — every
// number displayed comes from the server ( definitions live in the API).
// This file only reshapes server payloads into the DS chart props.

// CHART NUMBER BOUNDARY (and the only place money leaves string form).
// DS charts draw pixels, and pixels need numbers — so a decimal STRING is
// converted here, for geometry only. Labels, tooltips and any figure a user
// reads keep the exact server string (see formatMoney). A masked/absent value
// (null) contributes no bar rather than a fake zero-height one.

export function chartNumber(value: string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// pipeline_stages.color is a server-owned palette token. DS Tag tones cover the
// badge case (stageTone); charts need a CSS colour, so this maps the same token
// set to DS colour variables. Unknown token → neutral grey.
//

// re-deriving the mapping here. The old table sent `orange` and `yellow` to the
// SAME variable, so Discovery/Scoping and Proposal Sent painted an identical
// dot — two of the six colours the release specifies were not actually distinct.
const STAGE_CSS: Record<string, string> = {
  slate: "var(--stage-slate)",
  cyan: "var(--stage-cyan)",
  orange: "var(--stage-orange)",
  yellow: "var(--stage-yellow)",
  purple: "var(--stage-purple)",
  blue: "var(--stage-blue)",
  // Existing local demo tabs can still hold the old seed token in sessionStorage.
  green: "var(--stage-blue)",
  indigo: "var(--stage-indigo)",
  red: "var(--stage-red)",
};

export function stageCssColor(color: string | null | undefined): string {
  return (color && STAGE_CSS[color]) || "var(--secondary-grey)";
}

// Same keyword set, the pastel card fill instead of the full-strength hue. The
// mixes live in the DS token file — this is only the keyword → token lookup.
export function stageTintColor(color: string | null | undefined): string {
  return color && STAGE_CSS[color] ? `var(--stage-tint-${color})` : "var(--surface-sunken)";
}

// Board card icons (visual reference). The seed's six active stages are
// identified by sort_order; Won/Lost by semantic_type, since those two keep
// their meaning whatever an administrator renames or reorders. Anything else —
// a stage added in Settings › Pipeline — gets the neutral folder.
const STAGE_ICONS = [
  "las la-file-alt", // New Inquiry
  "las la-users", // Qualified
  "las la-search", // Discovery / Scoping
  "las la-paper-plane", // Proposal Sent
  "las la-handshake", // Negotiation
  "las la-envelope", // Verbal / Email Confirmation
];

export function stageIconClass(semanticType: string, sortOrder: number): string {
  if (semanticType === "WON") return "las la-trophy";
  if (semanticType === "LOST") return "las la-times";
  return STAGE_ICONS[sortOrder - 1] ?? "las la-folder-open";
}

// Sequential chart ramp, one hue light → dark, interpolated rather than stepped:
// both dashboard series are ordered magnitudes (funnel position, rank) whose
// cardinality is data-driven, so a fixed 6-step ramp collapsed distinct stages
// and sources onto the same shade. `index` 0 → lightest, `count - 1` → darkest;
// a single item gets the darkest end.
const RAMP_FROM = [0xa9, 0xb8, 0xed]; // #A9B8ED
const RAMP_TO = [0x29, 0x3d, 0x9e]; // #293D9E

export function rampTone(index: number, count: number): string {
  const t = count <= 1 ? 1 : Math.min(1, Math.max(0, index / (count - 1)));
  const [r, g, b] = RAMP_FROM.map((from, i) => Math.round(from + (RAMP_TO[i] - from) * t));
  return `rgb(${r}, ${g}, ${b})`;
}

// "2026-08" → "Aug '26" for the month axis under the revenue wave (the mock's
// literal; the apostrophe is what marks the two digits as a year).
export function monthLabel(month: string): string {
  const [year, mm] = month.split("-");
  const index = Number(mm) - 1;
  return index >= 0 && index < 12 ? `${MONTHS[index]} ’${year.slice(2)}` : month;
}

// Percent strings ("66.67") come from the server; null = undefined ratio (no
// won and no lost in the period) and must not be shown as 0%.
export function formatPercent(value: string | null | undefined): string {
  return value === null || value === undefined ? "—" : `${value}%`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Currency strings are only grouped for display; arithmetic stays in the simulator.
export function formatCurrencyAmount(value: string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const negative = value.startsWith("-");
  const [whole, fraction] = value.replace("-", "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}$${grouped}${fraction ? `.${fraction}` : ""}`;
}

export type Delta = { text: string; dir: "up" | "down" | "flat" } | null;

// NOT A METRIC ( intact): both figures arrive computed from the server — the
// current period and the API's own previous-period block — and this only
// FORMATS their difference for display. No new number about the business is
// derived here; drop the previous block and the line simply reads "—".
//
// mode "ratio": relative change, ((cur - prev) / prev) × 100.
// mode "points": percentage-POINT difference (cur - prev), for a rate that is
// already a percentage — a conversion rate moving 41.7 → 44.8 is "+3.1 points",
// never "+7.4%".
export function formatDelta(
  cur: string | number | null | undefined,
  prev: string | number | null | undefined,
  mode: "ratio" | "points" = "ratio",
): Delta {
  if (cur === null || cur === undefined) return null;
  if (prev === null || prev === undefined) return null;
  const a = chartNumber(String(cur));
  const b = chartNumber(String(prev));
  if (mode === "ratio" && b === 0) return null; // no baseline to compare against
  const change = mode === "points" ? a - b : ((a - b) / b) * 100;
  const text = `${Math.abs(change).toFixed(1)}%`;
  if (Number(text.slice(0, -1)) === 0) return { text, dir: "flat" };
  return change > 0 ? { text: `▲ ${text}`, dir: "up" } : { text: `▼ ${text}`, dir: "down" };
}

// "2025-08-01" + "2025-08-31" → "Aug 1 – Aug 31, 2025" (en dash). Either date
// missing means the period is open-ended, which the API reports as no previous
// period either. Parsed by hand rather than through Date: `new Date("2025-08-01")`
// is UTC midnight and would print the previous day west of Greenwich.
export function periodLabel(
  from: string | null | undefined,
  to: string | null | undefined,
): string {
  if (!from || !to) return "All time";
  const a = from.split("-");
  const b = to.split("-");
  const day = (p: string[]) => `${MONTHS[Number(p[1]) - 1] ?? p[1]} ${Number(p[2])}`;
  return a[0] === b[0]
    ? `${day(a)} – ${day(b)}, ${b[0]}`
    : `${day(a)}, ${a[0]} – ${day(b)}, ${b[0]}`;
}

// Y-axis ticks for the revenue chart: four gridlines from 0 to a rounded ceiling
// at or above the series max, so the labels read as round money. The 1.5/2.5/3/6
// steps are what keep ₱160,160 under a ₱180,000 ceiling instead of ₱300,000.
const NICE = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

export function revenueTicks(max: number): number[] {
  if (!(max > 0)) return [0, 1, 2, 3];
  const raw = max / 3;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = (NICE.find((n) => n * magnitude >= raw) ?? 10) * magnitude;
  return [0, step, step * 2, step * 3];
}
