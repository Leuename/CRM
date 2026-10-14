// Display helpers shared by the kiosk screens. Pure formatting — nothing here
// reads or decides anything.

export function fullName(c: { first_name: string; last_name: string | null }): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ");
}

/** "Today" / "1 day ago" / "12 days ago" — how long an inquiry has been waiting. */
export function ageLabel(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function monthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** "1.00" -> "1". Anything that is not a plain whole decimal is left alone. */
export function trimQuantity(q: string | null | undefined): string {
  if (!q) return "";
  const m = /^(\d+)(?:\.0+)?$/.exec(q.trim());
  return m ? m[1] : q.trim();
}
