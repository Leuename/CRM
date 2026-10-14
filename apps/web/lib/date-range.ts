/** Convert a date input's local calendar day to an inclusive start instant. */
export function dateInputStartIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

/** Convert a date input's local calendar day to the following day's exclusive instant. */
export function dateInputEndExclusiveIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return undefined;
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}
