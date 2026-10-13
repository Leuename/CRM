"use client";

/* -----------------------------------------------------------------------------
   Today's appointments — drill-down overlay.

   Two modes, one component: a whole day, or one hour of it. Both are a filter
   of what the page already fetched — no request is made from here, and nothing
   is written. The day's activities arrive as a prop; the hour view is that same
   list narrowed by `minutesInto`.

   The honest limit travels with the data: when the range fetch was capped, the
   page's footer note is repeated inside the panel rather than letting a partial
   hour read as a complete one.
   -------------------------------------------------------------------------- */

import { useEffect, useRef } from "react";
import type { Activity } from "@/lib/api";
import { useOverlay } from "../KioskShell";
import { KioskEmpty } from "../KioskState";
import { clockLabel, minutesInto, title, visitsLabel } from "./calendar";

export type Drill = { date: Date; hour: number | null };

export function hourLabel(hour: number): string {
  return clockLabel(hour * 60, true);
}

export default function VisitsDrill({
  drill,
  activities,
  label,
  note,
  onDrill,
  onClose,
}: {
  drill: Drill;
  /** Every activity on `drill.date`, already sorted by time. */
  activities: Activity[];
  label: (a: Activity) => string;
  /** The page's "showing the first N of M" sentence, when there is one. */
  note: string;
  onDrill: (next: Drill) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Focus trap, Escape, outside-click and focus restoration come from the
  // shell's shared hook. No autoFocus anywhere below: it lands in the commit
  // phase BEFORE useModalFocus's effect and clobbers the captured trigger, so
  // focus never returns to the hour/day button that opened this. Documented at
  // components/FilterDialog.tsx:142 and kiosk/new-inquiry/Outcome.tsx.
  useOverlay(panelRef, panelRef, onClose);

  const dayTitle = title("day", drill.date);
  const inHour =
    drill.hour === null
      ? activities
      : activities.filter((a) => new Date(a.occurred_at).getHours() === drill.hour);

  // Switching between the two modes keeps this panel mounted on purpose — a
  // remount would re-capture the trigger as an in-dialog button and lose focus
  // restoration. The button that was clicked is gone either way, so put focus
  // back on the panel, which is where a reader should land.
  useEffect(() => {
    panelRef.current?.focus();
  }, [drill.hour]);

  return (
    <div className="k-overlay" role="presentation">
      <div
        className="k-overlay-panel k-drill"
        role="dialog"
        aria-modal="true"
        aria-label={
          drill.hour === null
            ? `Visits on ${dayTitle}`
            : `Visits at ${hourLabel(drill.hour)} on ${dayTitle}`
        }
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="k-drill-head">
          <div>
            <h3 className="k-dialog-h">
              {drill.hour === null ? dayTitle : `${hourLabel(drill.hour)} — ${dayTitle}`}
            </h3>
            <p className="k-drill-sub">{visitsLabel(inHour.length)} · read only</p>
          </div>
          <button type="button" className="k-ghost-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="k-drill-body">
          {drill.hour !== null && (
            <button
              type="button"
              className="k-drill-back"
              onClick={() => onDrill({ date: drill.date, hour: null })}
            >
              Back to the whole day
            </button>
          )}

          {inHour.length === 0 ? (
            <KioskEmpty
              title={
                drill.hour === null
                  ? "Nothing scheduled for this day."
                  : "Nothing scheduled for this hour."
              }
            >
              Start a new inquiry from the home screen to record an upcoming consultation.
            </KioskEmpty>
          ) : drill.hour === null ? (
            groupByHour(inHour).map(([hour, list]) => (
              <section key={hour}>
                <button
                  type="button"
                  className="k-drill-hour"
                  onClick={() => onDrill({ date: drill.date, hour })}
                >
                  <span>{hourLabel(hour)}</span>
                  <span className="k-drill-hour-count">{visitsLabel(list.length)}</span>
                </button>
                {list.map((a) => (
                  <Row key={a.id} activity={a} label={label} />
                ))}
              </section>
            ))
          ) : (
            inHour.map((a) => <Row key={a.id} activity={a} label={label} />)
          )}
        </div>

        {note && <p className="k-drill-note">{note}</p>}
      </div>
    </div>
  );
}

function Row({ activity, label }: { activity: Activity; label: (a: Activity) => string }) {
  return (
    <div className="k-drill-row">
      <span className="k-drill-time">
        {clockLabel(minutesInto(new Date(activity.occurred_at)))}
      </span>
      <span className="k-drill-name">{label(activity)}</span>
      <span className="k-drill-what">{activity.description}</span>
      <span className="k-drill-host">{activity.created_by_name ?? ""}</span>
    </div>
  );
}

/** The day's activities bucketed by their local hour, in chronological order. */
function groupByHour(activities: Activity[]): [number, Activity[]][] {
  const map = new Map<number, Activity[]>();
  for (const a of activities) {
    const hour = new Date(a.occurred_at).getHours();
    const list = map.get(hour);
    if (list) list.push(a);
    else map.set(hour, [a]);
  }
  return [...map.entries()].sort((x, y) => x[0] - y[0]);
}
