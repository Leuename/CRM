"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  getDashboardDrilldown,
  type DashboardFilters,
  type DrilldownMetric,
  type OpportunitySummary,
} from "@/lib/api";
import { formatMoney, semanticTone } from "@/lib/opportunities";
import { Button, EmptyState, Pagination, Tag } from "@/lib/ds";
import { TableSkeleton } from "@/components/Skeleton";
import { useModalFocus } from "@/components/useModalFocus";

//
// Same overlay/panel/Esc idiom as ConfirmDialog and FilterDialog, and the same
// useModalFocus hook — no dialog library, no second focus implementation.
//
// The panel NEVER recomputes anything. `total` is the server's count for the
// same population the figure came from, and each money string is rendered
// verbatim through formatMoney (masked → "—"). The role gate lives on the
// dashboard as a convenience hide; THIS component still handles 403, because
// the server is the authority and a 403 must read as locked, not as an error.

export const DRILL_PAGE_SIZE = 25;

/** One figure to trace: what to call it, which metric, and the filters behind it. */
export interface DrillDown {
  label: string;
  metric: DrilldownMetric;
  filters: DashboardFilters;
}

type State = {
  page: { items: OpportunitySummary[]; total: number } | null;
  error: ApiError | null;
};

export function DrillDownPanel({
  drill,
  onClose,
}: {
  drill: DrillDown | null;
  onClose: () => void;
}) {
  const open = drill !== null;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  const [reloads, setReloads] = useState(0);
  const [state, setState] = useState<State>({ page: null, error: null });

  // A new figure is a new population: page 1, and no stale rows underneath.
  useEffect(() => {
    setOffset(0);
    setState({ page: null, error: null });
  }, [drill]);

  useEffect(() => {
    if (!drill) return;
    const controller = new AbortController();
    setState({ page: null, error: null });
    getDashboardDrilldown(
      {
        ...drill.filters,
        metric: drill.metric,
        limit: DRILL_PAGE_SIZE,
        offset,
      },
      controller.signal,
    )
      .then((page) => setState({ page, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          page: null,
          error:
            err instanceof ApiError
              ? err
              : new ApiError(0, err instanceof Error ? err.message : "Unknown error"),
        });
      });
    return () => controller.abort();
  }, [drill, offset, reloads]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus into the panel on open, trap Tab inside it, hand focus back to the
  // figure that opened it on every close path.
  useModalFocus(open, panelRef);

  if (!drill) return null;

  // The title carries the figure's own number, so a drill-down that disagreed
  // with the tile you clicked is visible on sight.
  const title = state.page === null ? drill.label : `${drill.label} · ${state.page.total}`;

  return (
    <div role="presentation" onClick={onClose} style={overlay}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={panel}
        className="drill-panel"
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <h2
            style={{
              margin: 0,
              flex: 1,
              minWidth: 0,
              font: "700 18px/27px var(--font-ui)",
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div style={{ marginTop: 20 }}>
          <Body state={state} onRetry={() => setReloads((n) => n + 1)} />
        </div>

        {state.page !== null && state.page.total > DRILL_PAGE_SIZE && (
          <div style={{ marginTop: 24 }}>
            <Pagination
              page={Math.floor(offset / DRILL_PAGE_SIZE) + 1}
              pages={Math.max(1, Math.ceil(state.page.total / DRILL_PAGE_SIZE))}
              onChange={(p: number) => setOffset((p - 1) * DRILL_PAGE_SIZE)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

//  states: forbidden → error → loading → empty → success.
function Body({ state, onRetry }: { state: State; onRetry: () => void }) {
  if (state.error !== null) {
    if (state.error.status === 403) {
      return (
        <EmptyState
          icon="las la-lock"
          title="Drill-down requires additional access"
          body="Your role can see the dashboard figures but not the records behind them. Ask an administrator if you need them."
        />
      );
    }
    return (
      <EmptyState
        icon="las la-exclamation-circle"
        title="These records could not be loaded"
        body={`${state.error.message}. Check that the API is running, then try again.`}
        action={<Button onClick={onRetry}>Try again</Button>}
      />
    );
  }
  if (state.page === null)
    return <TableSkeleton label="Loading the records behind this figure" rows={4} />;
  if (state.page.items.length === 0) {
    return (
      <EmptyState
        icon="las la-inbox"
        title="No opportunities behind this figure"
        body="Nothing matches this figure and the dashboard's current filters."
      />
    );
  }
  return (
    <ul className="drill-list">
      {state.page.items.map((o) => (
        <li key={o.id}>
          <Link href={`/sales/opportunities/${o.id}`} className="drill-row">
            <span className="drill-row-main">
              <span className="drill-row-title">{o.title}</span>
              <span className="drill-row-contact">{o.contact_name ?? "—"}</span>
            </span>
            <Tag tone={semanticTone(o.stage_semantic_type)}>{o.stage_name}</Tag>
            {/* MONEY RULE: the server's string and the record's own currency,
                regrouped for reading and nothing else. Masked (null) → "—",
                with no currency in front of a figure that does not exist. */}
            <span className="drill-row-money">
              {formatMoney(
                o.total_revenue_inc_vat,
                o.total_revenue_inc_vat === null ? null : o.currency,
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.32)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 100,
};

const panel: React.CSSProperties = {
  width: 640,
  maxWidth: "100%",
  maxHeight: "80vh",
  overflowY: "auto",
  background: "var(--bg-surface)",
  borderRadius: "var(--radius-card)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.24)",
  padding: 28,
  outline: "none",
};
