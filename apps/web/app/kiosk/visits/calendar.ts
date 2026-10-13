// Today's appointments: the date arithmetic and layout maths, with no React and no
// network in sight. Every function here takes a local Date or an ISO day string
// and gives back something the view can render directly.
//
// Local time on purpose: the front desk asks "who is coming today", meaning the
// day the iPad is standing in. The API stores and returns UTC instants, so the
// range sent to the server is built by converting the LOCAL day boundaries —
// never by slicing the ISO string, which silently shifts the day either side of
// midnight for anyone not on UTC.

export type CalendarView = "day" | "week" | "month";

export const HOUR_HEIGHT = 52;
/** The desk's usual hours. The grid opens here and grows if the day needs it. */
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 21;
/** Row height of one event block, and the gap kept between two stacked blocks. */
export const EVENT_HEIGHT = 46;
const EVENT_GAP = 4;

export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const next = startOfDay(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function addMonths(d: Date, n: number): Date {
  // Anchored to the 1st first: adding a month to the 31st would otherwise skip
  // a month entirely (Jan 31 + 1 → Mar 3).
  const next = new Date(d.getFullYear(), d.getMonth(), 1);
  next.setMonth(next.getMonth() + n);
  return next;
}

export function startOfWeek(d: Date): Date {
  return addDays(d, -startOfDay(d).getDay());
}

export function sameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

/** The half-open [from, to) instants covering the whole visible range, as the
 *  API wants them: UTC ISO strings derived from LOCAL day boundaries. */
export function rangeFor(view: CalendarView, anchor: Date): { from: Date; to: Date } {
  if (view === "day") return { from: startOfDay(anchor), to: addDays(anchor, 1) };
  if (view === "week") {
    const from = startOfWeek(anchor);
    return { from, to: addDays(from, 7) };
  }
  // The month grid always shows six whole weeks, including the days either side
  // that belong to the neighbouring months — so the range has to cover them too.
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const from = startOfWeek(first);
  return { from, to: addDays(from, 42) };
}

export function title(view: CalendarView, anchor: Date): string {
  if (view === "day") {
    return `${DOW_LONG[anchor.getDay()]}, ${MONTHS[anchor.getMonth()]} ${anchor.getDate()}`;
  }
  if (view === "week") {
    const from = startOfWeek(anchor);
    const to = addDays(from, 6);
    const left = `${MONTHS[from.getMonth()].slice(0, 3)} ${from.getDate()}`;
    const right =
      from.getMonth() === to.getMonth()
        ? `${to.getDate()}`
        : `${MONTHS[to.getMonth()].slice(0, 3)} ${to.getDate()}`;
    return `${left} – ${right}, ${to.getFullYear()}`;
  }
  return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
}

/** Minutes since midnight, local. */
export function minutesInto(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Where a time sits in the day grid, in px from the top of the first row. */
export function topFor(minutes: number, startHour = DAY_START_HOUR): number {
  return ((minutes - startHour * 60) / 60) * HOUR_HEIGHT;
}

/**
 * The hours the grid must draw. It opens at the desk's usual hours and widens
 * to whatever the day actually holds — an 06:15 arrival or a 22:40 handover
 * belongs on the grid at its own time, not clamped onto the first row where it
 * would sit on top of everything else that got clamped there too.
 */
export function dayWindow(minutes: number[]): { startHour: number; endHour: number } {
  let startHour = DAY_START_HOUR;
  let endHour = DAY_END_HOUR;
  for (const m of minutes) {
    startHour = Math.min(startHour, Math.floor(m / 60));
    endHour = Math.max(endHour, Math.ceil(m / 60));
  }
  return { startHour, endHour: Math.min(endHour, 23) };
}

export function hoursOfDay(
  startHour = DAY_START_HOUR,
  endHour = DAY_END_HOUR,
): { hour: number; label: string }[] {
  const rows = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    rows.push({ hour, label: clockLabel(hour * 60, true) });
  }
  return rows;
}

/**
 * Vertical positions for a day's events, in chronological order.
 *
 * Two visits booked minutes apart would otherwise be drawn on top of each other
 * and neither would be readable. Each block keeps its true time unless the one
 * before it is still in the way, in which case it is pushed just clear — so the
 * order and the rough time both survive, and nothing is ever hidden.
 */
export function stackTops(minutes: number[], startHour = DAY_START_HOUR): number[] {
  const tops: number[] = [];
  let floor = -Infinity;
  for (const m of minutes) {
    const top = Math.max(topFor(m, startHour), floor);
    tops.push(top);
    floor = top + EVENT_HEIGHT + EVENT_GAP;
  }
  return tops;
}

/** "9:30 AM"; `short` drops ":00" so the hour gutter reads 9 AM, 10 AM. */
export function clockLabel(minutes: number, short = false): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  if (short && m === 0) return `${hour12} ${suffix}`;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** The six-week grid the month view draws, starting on a Sunday. */
export function monthGrid(anchor: Date): Date[] {
  const { from } = rangeFor("month", anchor);
  return Array.from({ length: 42 }, (_, i) => addDays(from, i));
}

export function weekDays(anchor: Date): Date[] {
  const from = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(from, i));
}

export function visitsLabel(count: number): string {
  return `${count} ${count === 1 ? "appointment" : "appointments"}`;
}
