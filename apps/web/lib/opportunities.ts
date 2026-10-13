// Presentation helpers for opportunities. No business logic lives here: stage
// colour and semantic type are server-owned; this only maps them to DS Tag tones
// and human labels. The server is the sole authority on money, stages and
// permissions — nothing here decides anything.
import type { Tone } from "@/lib/api";

// pipeline_stages.color is a server-owned palette token (slate/cyan/orange/
// yellow/purple/blue/indigo/red). The DS Tag exposes a smaller tone set, so we
// best-fit each colour and fall back to grey for anything unknown — display only.
const STAGE_TONE: Record<string, Tone> = {
  slate: "grey",
  cyan: "lightblue",
  orange: "yellow",
  yellow: "yellow",
  purple: "primary",
  blue: "blue",
  green: "blue",
  indigo: "blue",
  red: "red",
};

export function stageTone(color: string | null | undefined): Tone {
  return (color && STAGE_TONE[color]) || "grey";
}

// semantic_type (ACTIVE | WON | LOST) → a status badge tone. Won/Lost are
// terminal semantic states (labels may change; semantics do not).
export function semanticTone(semanticType: string): Tone {
  switch (semanticType) {
    case "WON":
      return "blue";
    case "LOST":
      return "red";
    default:
      return "blue"; // ACTIVE / anything else
  }
}

// MONEY RULE: value is a server-serialized decimal STRING or null (null = absent
// OR masked for callers lacking view_revenue). No Number(), no parseFloat, no
// arithmetic — the digits are never converted, only regrouped for reading.
// Masked/absent → "—".
export function formatMoney(value: string | null | undefined, currency?: string | null): string {
  if (value === null || value === undefined) return "—";
  const grouped = groupThousands(value);
  return currency ? `${currency} ${grouped}` : grouped;
}

// Display-only thousands separators, applied to the string itself: split on the
// decimal point, comma-group the integer digits, reattach the rest verbatim.
// Anything that is not a plain decimal number (already grouped, an exponent, a
// server sentinel) is returned untouched rather than mangled.
function groupThousands(value: string): string {
  const m = /^(-?)(\d+)(\.\d+)?$/.exec(value.trim());
  if (m === null) return value;
  const [, sign, whole, fraction] = m;
  return `${sign}${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction ?? ""}`;
}

// self-check — the money path is the one place a display bug becomes a trust bug.
// Run with: npx tsx -e "require('./lib/opportunities').demo()"
export function demo(): void {
  const eq = (a: string, b: string) => {
    if (a !== b) throw new Error(`formatMoney: got ${a}, expected ${b}`);
  };
  eq(formatMoney("202000.00", "USD"), "USD 202,000.00");
  eq(formatMoney("1234567.89"), "1,234,567.89");
  eq(formatMoney("999"), "999");
  eq(formatMoney("1000"), "1,000");
  eq(formatMoney("-1234.50", "USD"), "USD -1,234.50");
  eq(formatMoney("0.00", "USD"), "USD 0.00");
  eq(formatMoney(null), "—");
  eq(formatMoney(undefined, "USD"), "—");
  eq(formatMoney("n/a", "USD"), "USD n/a");
}
