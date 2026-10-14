"use client";

/* -----------------------------------------------------------------------------
   Today's visits — read only.

   The desk's question is "who is expected". The CRM's answer is the activities
   due in the visible range (GET /api/v1/activities?occurred_from&occurred_to),
   which is what the design specifies. Nothing is written from here: arrivals are
   logged by Sales, so this read-only demo has no check-in button. The simulator
   does not expose a check-in action for the kiosk role.

   Activities carry contact_id but not the contact's name, so the names are
   resolved separately and cached across view changes — a row that says only
   "call" would not answer the question the screen exists for.
   -------------------------------------------------------------------------- */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { type Activity, type Contact, getContact, listActivities } from "@/lib/api";
import { fullName } from "../kiosk-format";
import { useKioskChrome } from "../KioskShell";
import { ChevronLeft, ChevronRight } from "../KioskIcons";
import { KioskEmpty, KioskError, KioskLoadingRows } from "../KioskState";
import VisitsDrill, { type Drill, hourLabel } from "./VisitsDrill";
import {
  type CalendarView,
  DOW_SHORT,
  HOUR_HEIGHT,
  addDays,
  addMonths,
  clockLabel,
  dayKey,
  dayWindow,
  hoursOfDay,
  minutesInto,
  monthGrid,
  rangeFor,
  sameDay,
  stackTops,
  startOfDay,
  title,
  topFor,
  visitsLabel,
  weekDays,
} from "./calendar";

const PAGE = 100;
// Names are resolved one request per contact, so the fan-out is capped. Beyond
// this the rows fall back to their description — never to a wrong name.
const MAX_NAME_LOOKUPS = 40;

const VIEWS: CalendarView[] = ["day", "week", "month"];

export default function TodaysVisits() {
  useKioskChrome("Today's appointments", "Expected at reception", "/kiosk");

  const [view, setView] = useState<CalendarView>("day");
  const calendarId = useId();
  const tabRefs = useRef(new Map<CalendarView, HTMLButtonElement>());
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [items, setItems] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<unknown>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  // The open drill-down, if any: a whole day, or one hour of it. Purely a lens
  // over `items` — opening it fetches nothing.
  const [drill, setDrill] = useState<Drill | null>(null);
  // Kept in a ref as well so the resolver can read what is already known without
  // re-running every time a name lands.
  const known = useRef<Map<string, string>>(new Map());

  const range = useMemo(() => rangeFor(view, anchor), [view, anchor]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    // The panel is a lens over the range that is going away.
    setDrill(null);
    listActivities(
      {
        limit: PAGE,
        offset: 0,
        occurred_from: range.from.toISOString(),
        occurred_to: range.to.toISOString(),
      },
      controller.signal,
    )
      .then((page) => {
        if (controller.signal.aborted) return;
        setItems(page.items);
        setTotal(page.total);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err);
        setStatus("error");
      });
    return () => controller.abort();
  }, [range]);

  // Resolve the contact names this range needs, once each.
  useEffect(() => {
    const wanted = [
      ...new Set(
        items.map((a) => a.contact_id).filter((id): id is string => !!id && !known.current.has(id)),
      ),
    ].slice(0, MAX_NAME_LOOKUPS);
    if (wanted.length === 0) return;

    const controller = new AbortController();
    Promise.all(
      wanted.map((id) =>
        getContact(id, controller.signal)
          .then((c: Contact) => [id, fullName(c)] as const)
          // A contact that cannot be read (archived, or gone) must not blank the
          // whole screen — that row simply keeps its description.
          .catch(() => null),
      ),
    ).then((pairs) => {
      if (controller.signal.aborted) return;
      const next = new Map(known.current);
      for (const pair of pairs) if (pair) next.set(pair[0], pair[1]);
      known.current = next;
      setNames(next);
    });
    return () => controller.abort();
  }, [items]);

  const label = useCallback(
    (a: Activity) => (a.contact_id && names.get(a.contact_id)) || a.description,
    [names],
  );

  function step(direction: -1 | 1) {
    setAnchor((cur) =>
      view === "month"
        ? addMonths(cur, direction)
        : addDays(cur, view === "week" ? direction * 7 : direction),
    );
  }

  const byDay = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of items) {
      const key = dayKey(new Date(a.occurred_at));
      const list = map.get(key);
      if (list) list.push(a);
      else map.set(key, [a]);
    }
    for (const list of map.values()) {
      list.sort((x, y) => x.occurred_at.localeCompare(y.occurred_at));
    }
    return map;
  }, [items]);

  const shortfall = total > items.length ? `Showing the first ${items.length} of ${total}.` : "";
  const footer =
    status !== "ready"
      ? ""
      : `${visitsLabel(items.length)} · from activities due this ${view} · read only. Arrivals are logged by the sales team.` +
        (shortfall ? ` ${shortfall}` : "");

  function handleViewKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, current: CalendarView) {
    const currentIndex = VIEWS.indexOf(current);
    let nextIndex: number;

    switch (e.key) {
      case "ArrowLeft":
        nextIndex = (currentIndex + VIEWS.length - 1) % VIEWS.length;
        break;
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % VIEWS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = VIEWS.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    const next = VIEWS[nextIndex];
    setView(next);
    tabRefs.current.get(next)?.focus();
  }

  return (
    <div className="k-screen k-visits">
      <div className="k-cal-bar">
        <div className="k-cal-nav">
          <button
            type="button"
            className="k-cal-step"
            aria-label="Previous"
            onClick={() => step(-1)}
          >
            <ChevronLeft />
          </button>
          <button type="button" className="k-cal-step" aria-label="Next" onClick={() => step(1)}>
            <ChevronRight size={18} width={2.2} />
          </button>
          <button
            type="button"
            className="k-cal-today"
            onClick={() => setAnchor(startOfDay(new Date()))}
          >
            Today
          </button>
        </div>
        <h2 className="k-cal-title">{title(view, anchor)}</h2>
        <div className="k-cal-tabs" role="tablist" aria-label="Calendar view">
          {VIEWS.map((v) => (
            <button
              type="button"
              role="tab"
              key={v}
              id={`${calendarId}-${v}-tab`}
              aria-controls={`${calendarId}-panel`}
              aria-selected={v === view}
              tabIndex={v === view ? 0 : -1}
              className={`k-cal-tab${v === view ? " k-cal-tab-on" : ""}`}
              ref={(element) => {
                if (element) tabRefs.current.set(v, element);
                else tabRefs.current.delete(v);
              }}
              onClick={() => setView(v)}
              onKeyDown={(e) => handleViewKeyDown(e, v)}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div
        id={`${calendarId}-panel`}
        role="tabpanel"
        aria-labelledby={`${calendarId}-${view}-tab`}
        aria-busy={status === "loading"}
        tabIndex={0}
        style={{ display: "flex", flex: 1, flexDirection: "column", minHeight: 0 }}
      >
        {status === "loading" && (
          <div className="k-pad k-grow">
            <KioskLoadingRows count={3} />
          </div>
        )}
        {status === "error" && (
          <div className="k-pad k-grow">
            <KioskError error={error} />
          </div>
        )}

        {status === "ready" && view === "day" && (
          <DayGrid
            activities={byDay.get(dayKey(anchor)) ?? []}
            anchor={anchor}
            label={label}
            onDrill={setDrill}
          />
        )}
        {status === "ready" && view === "week" && (
          <WeekGrid anchor={anchor} byDay={byDay} label={label} onDrill={setDrill} />
        )}
        {status === "ready" && view === "month" && (
          <MonthGrid anchor={anchor} byDay={byDay} label={label} onDrill={setDrill} />
        )}
      </div>

      <div className="k-cal-foot">{footer}</div>

      {drill && (
        <VisitsDrill
          drill={drill}
          activities={byDay.get(dayKey(drill.date)) ?? []}
          label={label}
          note={shortfall}
          onDrill={setDrill}
          onClose={() => setDrill(null)}
        />
      )}
    </div>
  );
}

/* --- day ------------------------------------------------------------------ */

function DayGrid({
  activities,
  anchor,
  label,
  onDrill,
}: {
  activities: Activity[];
  anchor: Date;
  label: (a: Activity) => string;
  onDrill: (d: Drill) => void;
}) {
  const now = new Date();
  const isToday = sameDay(anchor, now);
  const nowMinutes = minutesInto(now);
  // The next thing due, so the operator can see at a glance who is walking in.
  const nextId = isToday
    ? (activities.find((a) => minutesInto(new Date(a.occurred_at)) >= nowMinutes)?.id ?? null)
    : null;

  if (activities.length === 0) {
    return (
      <div className="k-pad k-grow">
        <KioskEmpty title="Nothing scheduled for this day.">
          Start a new inquiry from the home screen to record an upcoming consultation.
        </KioskEmpty>
      </div>
    );
  }

  const times = activities.map((a) => minutesInto(new Date(a.occurred_at)));
  // The grid covers the desk's hours, widened to whatever this day actually
  // holds, so every visit lands at its own time instead of being clamped onto
  // the first row on top of the others.
  const { startHour, endHour } = dayWindow(times);
  const tops = stackTops(times, startHour);
  const nowOnGrid = isToday && nowMinutes >= startHour * 60 && nowMinutes <= (endHour + 1) * 60;

  return (
    <div className="k-cal-scroll">
      <div className="k-daygrid" style={{ height: (endHour - startHour + 1) * HOUR_HEIGHT }}>
        {/* The whole hour row is the target. `.k-events` sits on top of these
            but is pointer-events: none, so a click on a visit block still opens
            the hour it belongs to. */}
        {hoursOfDay(startHour, endHour).map((h) => {
          const count = activities.filter(
            (a) => new Date(a.occurred_at).getHours() === h.hour,
          ).length;
          return (
            <button
              type="button"
              className="k-hour"
              key={h.hour}
              style={{ height: HOUR_HEIGHT }}
              aria-label={`${hourLabel(h.hour)}, ${count === 0 ? "no appointments" : visitsLabel(count)}`}
              onClick={() => onDrill({ date: anchor, hour: h.hour })}
            >
              <span className="k-hour-label">{h.label}</span>
            </button>
          );
        })}

        <div className="k-events">
          {activities.map((a, i) => (
            <div
              className={`k-event${a.id === nextId ? " k-event-next" : ""}`}
              key={a.id}
              style={{ top: tops[i] }}
            >
              <span className="k-event-time">{clockLabel(times[i])}</span>
              <span className="k-event-name">{label(a)}</span>
              <span className="k-event-what">{a.description}</span>
              {a.id === nextId && <span className="k-next-badge">Next</span>}
              <span className="k-event-host">{a.created_by_name ?? ""}</span>
            </div>
          ))}

          {nowOnGrid && (
            <div
              className="k-nowline"
              style={{ top: topFor(nowMinutes, startHour) }}
              aria-hidden="true"
            >
              <span className="k-nowdot" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --- week ----------------------------------------------------------------- */

function WeekGrid({
  anchor,
  byDay,
  label,
  onDrill,
}: {
  anchor: Date;
  byDay: Map<string, Activity[]>;
  label: (a: Activity) => string;
  onDrill: (d: Drill) => void;
}) {
  const today = new Date();
  return (
    <div className="k-weekgrid">
      {weekDays(anchor).map((d) => {
        const list = byDay.get(dayKey(d)) ?? [];
        const isToday = sameDay(d, today);
        return (
          <div className={`k-weekday${isToday ? " k-weekday-today" : ""}`} key={dayKey(d)}>
            <button
              type="button"
              className="k-weekday-head"
              aria-label={`${title("day", d)}, ${list.length === 0 ? "no appointments" : visitsLabel(list.length)}`}
              onClick={() => onDrill({ date: d, hour: null })}
            >
              {/* Spans, not divs: <button> takes phrasing content only. The month
                  cell below does the same. */}
              <span className="k-weekday-dow">{DOW_SHORT[d.getDay()]}</span>
              <span className="k-weekday-num">{d.getDate()}</span>
            </button>
            <div className="k-weekday-items">
              {list.map((a) => (
                <div className="k-chip" key={a.id}>
                  <div className="k-chip-time">
                    {clockLabel(minutesInto(new Date(a.occurred_at)))}
                  </div>
                  <div className="k-chip-name">{label(a)}</div>
                  <div className="k-chip-what">{a.description}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* --- month ---------------------------------------------------------------- */

function MonthGrid({
  anchor,
  byDay,
  label,
  onDrill,
}: {
  anchor: Date;
  byDay: Map<string, Activity[]>;
  label: (a: Activity) => string;
  onDrill: (d: Drill) => void;
}) {
  const today = new Date();
  return (
    <div className="k-monthgrid">
      <div className="k-month-dows">
        {DOW_SHORT.map((d) => (
          <div className="k-month-dow" key={d}>
            {d}
          </div>
        ))}
      </div>
      <div className="k-month-cells">
        {monthGrid(anchor).map((d) => {
          const list = byDay.get(dayKey(d)) ?? [];
          const inMonth = d.getMonth() === anchor.getMonth();
          const isToday = sameDay(d, today);
          const shown = list.length > 2 ? list.slice(0, 1) : list;
          return (
            <button
              type="button"
              className={`k-month-cell${inMonth ? "" : " k-month-out"}`}
              key={dayKey(d)}
              aria-label={`${title("day", d)}, ${list.length === 0 ? "no appointments" : visitsLabel(list.length)}`}
              onClick={() => onDrill({ date: d, hour: null })}
            >
              <span className={`k-month-num${isToday ? " k-month-num-today" : ""}`}>
                {d.getDate()}
              </span>
              {shown.map((a) => (
                <span className="k-month-item" key={a.id}>
                  <span className="k-month-dot" aria-hidden="true" />
                  {clockLabel(minutesInto(new Date(a.occurred_at)))} {label(a)}
                </span>
              ))}
              {list.length > shown.length && (
                <span className="k-month-more">+{list.length - shown.length} more</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
