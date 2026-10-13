"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  NO_SOURCE,
  getDashboardPipeline,
  getDashboardRevenue,
  getDashboardSources,
  getDashboardSummary,
  listLeadSources,
  listPipelineStages,
  listProducts,
  listUsers,
  type DrilldownMetric,
  type DashboardFilters,
  type DashboardPipeline,
  type DashboardRevenue,
  type DashboardSources,
  type DashboardSummary,
  type LeadSource,
  type PipelineStage,
  type Product,
  type UserRef,
} from "@/lib/api";
import {
  chartNumber,
  formatDelta,
  formatPercent,
  formatCurrencyAmount,
  monthLabel,
  periodLabel,
  rampTone,
  revenueTicks,
  type Delta,
} from "@/lib/dashboard";
import { Button, DonutChart, EmptyState, WaveChart } from "@/lib/ds";
import { Select } from "@/components/Select";
import { InfoTip } from "@/components/InfoTip";
import { FilterButton, FilterDialog } from "@/components/FilterDialog";
import { ChartSkeleton, KpiSkeleton } from "@/components/Skeleton";
import { DrillDownPanel, type DrillDown } from "@/components/DrillDownPanel";
import { useAuth } from "@/components/AuthProvider";

// The dialog edits this shape; the page holds the applied copy as the six
// useState vars the four endpoints read.
interface DashFilters {
  ownerId: string;
  sourceId: string;
  stageId: string;
  productId: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: DashFilters = {
  ownerId: "",
  sourceId: "",
  stageId: "",
  productId: "",
  dateFrom: "",
  dateTo: "",
};

// Every figure here is server-computed (). The page filters and renders; it
// never sums, weights or derives a metric, and it never decides what a user may
// see — masked money arrives as null and renders "—".

// CONVENIENCE-HIDE ONLY — NOT a security boundary. GET /dashboard/drilldown is
// require(view_dashboard_drilldown) and 403s every non-admin server-side; this
// only decides whether the figures get a clickable affordance, so a non-admin
// sees the dashboard exactly as before — no button, no request, no pixel moved.
// (Same pattern as canConfigurePipeline in app/(app)/pipeline/page.tsx.)
function canDrillDown(role: string): boolean {
  return role === "ADMIN";
}

type Resource<T> = { data: T | null; error: ApiError | null };

type Fetcher<T> = (filters: DashboardFilters, signal?: AbortSignal) => Promise<T>;

// One request per widget so each keeps its own  states: a failing revenue
// chart must not blank the KPI row. `enabled` false = a client-side validation
// stop (bad date range) — no request is sent.
function useDashboardResource<T>(
  fetcher: Fetcher<T>,
  filters: DashboardFilters,
  reloads: number,
  enabled: boolean,
): Resource<T> {
  const [state, setState] = useState<Resource<T>>({ data: null, error: null });

  useEffect(() => {
    setState({ data: null, error: null });
    if (!enabled) return;
    const controller = new AbortController();
    fetcher(filters, controller.signal)
      .then((data) => setState({ data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          data: null,
          error:
            err instanceof ApiError
              ? err
              : new ApiError(0, err instanceof Error ? err.message : "Unknown error"),
        });
      });
    return () => controller.abort();
  }, [fetcher, filters, reloads, enabled]);

  return state;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const canDrill = canDrillDown(user.role);
  const [drill, setDrill] = useState<DrillDown | null>(null);

  // accepts `month` as sugar, but from/to covers it — no second control.
  const [ownerId, setOwnerId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [stageId, setStageId] = useState("");
  const [productId, setProductId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reloads, setReloads] = useState(0);

  // Dialog-staged copies of the applied filters above. Open copies applied →
  // staged, Apply copies staged → applied, closing discards.
  const [dlgOpen, setDlgOpen] = useState(false);
  const [staged, setStaged] = useState<DashFilters>(EMPTY_FILTERS);

  // Filter option sources (fetched once). Selects degrade to no options on error.
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserRef[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    listPipelineStages(controller.signal)
      .then(setStages)
      .catch(() => setStages([]));
    listLeadSources(controller.signal)
      .then(setSources)
      .catch(() => setSources([]));
    listProducts({ limit: 100, offset: 0, active: true }, controller.signal)
      .then((page) => setProducts(page.items))
      .catch(() => setProducts([]));
    listUsers(controller.signal)
      .then(setUsers)
      .catch(() => setUsers([]));
    return () => controller.abort();
  }, []);

  // Client-side sanity only — the server validates the range too and is the
  // authority (422). This just avoids four pointless failing requests.
  const rangeInvalid = dateFrom !== "" && dateTo !== "" && dateFrom > dateTo;

  const filters = useMemo<DashboardFilters>(
    () => ({
      owner_id: ownerId || undefined,
      source_id: sourceId || undefined,
      stage_id: stageId || undefined,
      product_id: productId || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    }),
    [ownerId, sourceId, stageId, productId, dateFrom, dateTo],
  );

  const enabled = !rangeInvalid;
  const summary = useDashboardResource(getDashboardSummary, filters, reloads, enabled);
  const pipeline = useDashboardResource(getDashboardPipeline, filters, reloads, enabled);
  const sourceStats = useDashboardResource(getDashboardSources, filters, reloads, enabled);
  const revenue = useDashboardResource(getDashboardRevenue, filters, reloads, enabled);

  const retry = useCallback(() => setReloads((n) => n + 1), []);

  // Opens the drill-down for one figure, carrying THE DASHBOARD'S APPLIED
  // FILTERS: the panel must show the records behind the figure as displayed,
  // not behind the unfiltered population. `overrides` narrows to the clicked
  // slice (a stage bar, a source row, a month).
  //
  // Returns undefined for a non-admin, so the affordance is simply not
  // rendered — see canDrillDown above; the server is the authority regardless.
  const drillTo = useCallback(
    (label: string, metric: DrilldownMetric, overrides?: DashboardFilters) =>
      canDrill
        ? () => setDrill({ label, metric, filters: { ...filters, ...overrides } })
        : undefined,
    [canDrill, filters],
  );

  // Count of non-default filters. The dashboard has no search box, so every
  // filter counts.
  const activeCount = [ownerId, sourceId, stageId, productId, dateFrom, dateTo].filter(
    (v) => v !== "",
  ).length;

  function applyFilters(f: DashFilters) {
    setOwnerId(f.ownerId);
    setSourceId(f.sourceId);
    setStageId(f.stageId);
    setProductId(f.productId);
    setDateFrom(f.dateFrom);
    setDateTo(f.dateTo);
  }

  function clearFilters() {
    applyFilters(EMPTY_FILTERS);
  }

  function openFilterDialog() {
    setStaged({ ownerId, sourceId, stageId, productId, dateFrom, dateTo });
    setDlgOpen(true);
  }

  return (
    <div className="dash">
      <div>
        {/* The page title lives in the TopBar, so this row carries the subtitle
            and the two triggers. Both triggers open the SAME filter dialog — the
            date range is one of its fields, not a second surface. */}
        <div className="dash-head">
          <p className="dash-head-sub">Overview of your inquiries and opportunities</p>
          <div className="dash-head-actions">
            <Button
              variant="outline"
              size="sm"
              icon="las la-calendar"
              iconRight="las la-angle-down"
              onClick={openFilterDialog}
              aria-haspopup="dialog"
            >
              {periodLabel(dateFrom, dateTo)}
            </Button>
            <FilterButton
              activeCount={activeCount}
              onOpen={openFilterDialog}
              onClearAll={clearFilters}
            />
          </div>
        </div>
        {rangeInvalid && (
          <p role="alert" className="dash-alert">
            “Period from” must be on or before “Period to”.
          </p>
        )}
      </div>

      <FilterDialog
        open={dlgOpen}
        onApply={() => {
          applyFilters(staged);
          setDlgOpen(false);
        }}
        onReset={() => setStaged(EMPTY_FILTERS)}
        onClose={() => setDlgOpen(false)}
      >
        <Select
          label="Owner"
          value={staged.ownerId}
          onChange={(v) => setStaged((s) => ({ ...s, ownerId: v }))}
        >
          <option value="">All owners</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name}
            </option>
          ))}
        </Select>
        <Select
          label="Lead source"
          value={staged.sourceId}
          onChange={(v) => setStaged((s) => ({ ...s, sourceId: v }))}
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select
          label="Stage"
          value={staged.stageId}
          onChange={(v) => setStaged((s) => ({ ...s, stageId: v }))}
        >
          <option value="">All stages</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select
          label="Product"
          value={staged.productId}
          onChange={(v) => setStaged((s) => ({ ...s, productId: v }))}
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <label className="crm-field">
          <span className="crm-field-label">Period from</span>
          <input
            type="date"
            aria-label="Period from"
            value={staged.dateFrom}
            onChange={(e) => setStaged((s) => ({ ...s, dateFrom: e.target.value }))}
            className="crm-field-box"
          />
        </label>
        <label className="crm-field">
          <span className="crm-field-label">Period to</span>
          <input
            type="date"
            aria-label="Period to"
            value={staged.dateTo}
            onChange={(e) => setStaged((s) => ({ ...s, dateTo: e.target.value }))}
            className="crm-field-box"
          />
        </label>
      </FilterDialog>

      {/* KPI band: five separate cards, each with its own period comparison.
          .kpi-row carries the existing 40ms stagger. Pipeline totals live in the
          bars panel's footer, and won/lost counts in the summary panel — this
          band is the five headline figures only. */}
      <Widget
        resource={summary}
        rangeInvalid={rangeInvalid}
        retry={retry}
        label="Key metrics"
        isEmpty={() => false}
        skeleton={<KpiSkeleton label="Loading key metrics" count={5} />}
        render={(s: DashboardSummary) => {
          // One previous period for the whole band; absent (open-ended period)
          // every comparison reads "—" and no "vs" line is printed.
          const p = s.previous;
          const vs = p ? `vs ${periodLabel(p.period_from, p.period_to)}` : null;
          return (
            <section aria-label="Key metrics" className="kpi-band kpi-row">
              <KpiCard
                label="Total inquiries"
                info="Opportunities created in the period."
                value={s.total_inquiries}
                delta={formatDelta(s.total_inquiries, p?.total_inquiries)}
                vs={vs}
                drill={drillTo("Total inquiries", "total_inquiries")}
              />
              <KpiCard
                label="New inquiries"
                info="Opportunities still sitting in the first pipeline stage."
                value={s.new_inquiries}
                delta={formatDelta(s.new_inquiries, p?.new_inquiries)}
                vs={vs}
                drill={drillTo("New inquiries", "new_inquiries")}
              />
              {/* A snapshot of right now, not a figure the period selects, so
                  the API returns no previous value for it and the comparison
                  stays "—". */}
              <KpiCard
                label="Active opportunities"
                info="Open opportunities right now — a snapshot, so it has no period comparison."
                value={s.active_opportunities}
                delta={null}
                vs={vs}
                drill={drillTo("Active opportunities", "active_opportunities")}
              />
              <KpiCard
                label="Won revenue"
                info="Revenue of opportunities marked Won in the period."
                value={formatCurrencyAmount(s.won_revenue)}
                money
                masked={s.won_revenue === null}
                delta={formatDelta(s.won_revenue, p?.won_revenue)}
                vs={vs}
                drill={drillTo("Won revenue", "won_revenue")}
              />
              {/* NOT clickable: a conversion rate is won/(won+lost), two
                  populations divided — there is no single set of records
                  behind it to open. */}
              <KpiCard
                label="Conversion rate"
                info="Won divided by won plus lost. The comparison is the difference in percentage points."
                value={formatPercent(s.conversion_rate)}
                delta={formatDelta(s.conversion_rate, p?.conversion_rate, "points")}
                vs={vs}
              />
            </section>
          );
        }}
      />

      <div className="dash-row">
        {/* Pipeline by stage (FB5) */}
        <section className="dash-panel dash-panel--bars" aria-label="Pipeline by stage">
          <header className="dash-panel-head">
            <h2>Pipeline by stage</h2>
            <p className="dash-sub">Shade follows funnel position</p>
          </header>
          <Widget
            resource={pipeline}
            rangeInvalid={rangeInvalid}
            retry={retry}
            label="Pipeline by stage"
            isEmpty={(p: DashboardPipeline) => p.items.every((i) => i.count === 0)}
            emptyTitle="No opportunities in the pipeline"
            emptyBody="Once opportunities exist for these filters, their stage distribution appears here."
            skeleton={<ChartSkeleton label="Loading pipeline by stage" />}
            render={(p: DashboardPipeline) => {
              // Bars plot the COUNT: counts are visible to every role, while
              // value is masked (null) without view_revenue. No gridlines, no
              // legend — the count sits above each bar and the stage name and
              // amount sit under the single baseline hairline.
              const max = Math.max(...p.items.map((i) => i.count), 1);
              return (
                <>
                  <div className="dash-bars" aria-hidden="true">
                    {p.items.map((i, idx) => (
                      <div key={i.stage_id} className="dash-bar-col">
                        <span className="dash-bar-num">{i.count}</span>
                        <div
                          className="dash-bar"
                          style={{
                            height: (i.count / max) * BAR_MAX_PX,
                            background: rampTone(idx, p.items.length),
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="dash-bars-axis">
                    {p.items.map((i) => {
                      // The DRILL-DOWN affordance is the labelled cell under the
                      // bar, not the bar: the bar row is aria-hidden (the number
                      // is repeated in this label), and a focusable control
                      // inside aria-hidden markup is unreachable by assistive
                      // tech. The cell sits directly under its own bar, so the
                      // target reads as "click the bar" either way.
                      const open = drillTo(i.stage_name, "pipeline_stage", {
                        stage_id: i.stage_id,
                      });
                      const meta = (
                        <>
                          {/* Never truncated — it wraps (globals.css). The title
                              stays as the hover convenience for a name broken
                              mid-word in a narrow column. */}
                          <span className="dash-bar-name" title={i.stage_name}>
                            {i.stage_name}
                          </span>
                          <span className="sr-only">{i.count} opportunities, </span>
                          {/* MONEY RULE: exact server string, masked → "—".
                              The ₱ symbol fits an 11px stage column where the
                              "PHP" code would wrap it. */}
                          <span className="dash-bar-amt">{formatCurrencyAmount(i.value)}</span>
                        </>
                      );
                      return open ? (
                        <button
                          key={i.stage_id}
                          type="button"
                          className="dash-bar-meta drill-fig"
                          onClick={open}
                          aria-haspopup="dialog"
                        >
                          {meta}
                        </button>
                      ) : (
                        <div key={i.stage_id} className="dash-bar-meta">
                          {meta}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            }}
          />
          {/* The two pipeline totals sit under the stage they are made of
              rather than in the KPI band. They come from the SUMMARY payload,
              so they render once it has arrived — its own  states are
              carried by the KPI band above, which reads the same resource. */}
          {summary.data && (
            <div className="dash-panel-foot">
              <FootFigure
                label="Total pipeline value"
                value={summary.data.active_pipeline_value}
                drill={drillTo("Active pipeline value", "active_pipeline_value")}
              />
              {/* WEIGHTED: a forecast, never a guarantee. */}
              <FootFigure
                label="Weighted forecast"
                value={summary.data.weighted_pipeline_value}
                drill={drillTo("Weighted forecast", "weighted_pipeline_value")}
              />
            </div>
          )}
        </section>

        {/* Inquiries by source (FB5) */}
        <section className="dash-panel dash-panel--donut" aria-label="Inquiries by source">
          <header className="dash-panel-head">
            <h2>Inquiries by source</h2>
            <p className="dash-sub">Ranked by share of inquiries</p>
          </header>
          <Widget
            resource={sourceStats}
            rangeInvalid={rangeInvalid}
            retry={retry}
            label="Inquiries by source"
            isEmpty={(s: DashboardSources) => s.items.every((i) => i.inquiries === 0)}
            emptyTitle="No inquiries in this period"
            emptyBody="Inquiries are counted from when an opportunity was created."
            skeleton={<ChartSkeleton label="Loading inquiries by source" height={180} />}
            render={(s: DashboardSources) => {
              // Ranked so the ramp reads as an order (darkest = largest share),
              // not as five unrelated identities.
              const ranked = [...s.items].sort((a, b) => b.inquiries - a.inquiries);
              const total = ranked.reduce((sum, i) => sum + i.inquiries, 0);
              return (
                <div className="dash-donut-wrap">
                  {/* The ring is the picture; the list below is the data, so the
                      ring is hidden from assistive tech rather than duplicated. */}
                  <span aria-hidden="true">
                    <DonutChart
                      className="chart-donut dash-donut"
                      size={168}
                      thickness={16}
                      segments={ranked.map((i, idx) => ({
                        value: i.inquiries,
                        tone: rankTone(idx, ranked.length),
                        label: i.source_name ?? "No source",
                      }))}
                      label={String(total)}
                      caption="inquiries"
                    />
                  </span>
                  <ul className="dash-src-list">
                    {ranked.map((i, idx) => {
                      const name = i.source_name ?? "No source";
                      const share = Math.round((i.inquiries / total) * 100);
                      // "No source" is a real bucket the server can answer for,
                      // so it is clickable too — NO_SOURCE is the literal it
                      // reserves for the null-source slice.
                      const open = drillTo(name, "source_inquiries", {
                        source_id: i.source_id ?? NO_SOURCE,
                      });
                      const row = (
                        <>
                          <span
                            className="dash-src-dot"
                            aria-hidden="true"
                            style={{ background: rankTone(idx, ranked.length) }}
                          />
                          <span className="dash-src-name">{name}</span>
                          <span className="dash-src-val">
                            {i.inquiries}
                            <span className="sr-only"> inquiries, </span>
                            {/* Share of the donut, not a server metric — the arc
                                beside it encodes the same number. */}
                            <span className="dash-src-pct">{share}%</span>
                          </span>
                        </>
                      );
                      return (
                        <li key={i.source_id ?? "none"}>
                          {open ? (
                            <button
                              type="button"
                              className="drill-fig drill-src"
                              onClick={open}
                              aria-haspopup="dialog"
                              aria-label={`${name}: ${i.inquiries} inquiries, ${share}% of inquiries`}
                            >
                              {row}
                            </button>
                          ) : (
                            row
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            }}
          />
        </section>
      </div>

      <div className="dash-row dash-row--wave">
        {/* Won revenue by month (FB5) — whole endpoint is gated on view_revenue. */}
        <section className="dash-panel dash-panel--wave" aria-label="Won revenue by month">
          <header className="dash-panel-head">
            <h2>Won revenue by month</h2>
            <p className="dash-sub">Counted in the month an opportunity was marked Won</p>
          </header>
          <Widget
            resource={revenue}
            rangeInvalid={rangeInvalid}
            retry={retry}
            label="Won revenue by month"
            // Empty means "no months" or "every month is zero" — a single month
            // with real revenue is data, not an empty state.
            isEmpty={(r: DashboardRevenue) =>
              r.items.length === 0 || r.items.every((m) => chartNumber(m.won_revenue) === 0)
            }
            emptyTitle="No won revenue in this period"
            emptyBody="Revenue is counted in the month an opportunity was marked Won."
            forbidden={{
              title: "Revenue reporting requires additional access",
              body: "Your role can see opportunity counts but not revenue figures. Ask an administrator if you need them.",
            }}
            skeleton={<ChartSkeleton label="Loading won revenue by month" height={200} />}
            render={(r: DashboardRevenue) => {
              const points = wavePoints(r);
              const peak = peakIndex(points);
              const item = r.items[Math.min(peak, r.items.length - 1)];
              // The axis, not the data, owns the y-domain: the chart is told the
              // same ceiling the gridlines are drawn at, so a plotted point and
              // its label sit on the same line. `waveY` is the DS component's own
              // geometry (4px of headroom, top and bottom), repeated here because
              // the dots and labels are the page's, not the component's.
              const ticks = revenueTicks(Math.max(...points));
              const top = ticks[ticks.length - 1];
              const x = points.length > 1 ? (peak / (points.length - 1)) * 100 : 0;
              const shift = peak === 0 ? "0%" : peak === points.length - 1 ? "-100%" : "-50%";
              return (
                <>
                  <div className="dash-wave-wrap">
                    <div className="dash-wave-y" aria-hidden="true">
                      {ticks.map((t) => (
                        <span key={t} style={{ top: waveY(t, top) }}>
                          {formatCurrencyAmount(String(t))}
                        </span>
                      ))}
                    </div>
                    <div className="dash-wave-main">
                      <div className="dash-wave-figure">
                        <div className="dash-wave-plot">
                          {ticks.map((t) => (
                            <span
                              key={t}
                              className="dash-wave-grid"
                              aria-hidden="true"
                              style={{ top: waveY(t, top) }}
                            />
                          ))}
                          <div aria-hidden="true">
                            <WaveChart
                              className="chart-wave"
                              data={points}
                              height={WAVE_PX}
                              min={0}
                              max={top}
                            />
                          </div>
                          {points.map((v, i) => (
                            <span
                              key={i}
                              className="dash-wave-dot"
                              aria-hidden="true"
                              style={{
                                left: `${points.length > 1 ? (i / (points.length - 1)) * 100 : 0}%`,
                                top: waveY(v, top),
                              }}
                            />
                          ))}
                          {/* One direct label, on the peak only. */}
                          <span
                            className="dash-wave-peak"
                            aria-hidden="true"
                            style={{
                              left: `${x}%`,
                              top: waveY(points[peak], top) - 22,
                              transform: `translateX(${shift})`,
                            }}
                          >
                            {formatCurrencyAmount(item.won_revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="dash-wave-months">
                        {r.items.map((m) => {
                          // The applied period rides along with the month. The bar is
                          // clipped to that period — a 1st-to-8th range makes it read
                          // one week — so dropping the dates here would open the whole
                          // month against a bar that counted part of it. The server
                          // intersects the two for this metric.
                          const open = drillTo(
                            `Won revenue · ${monthLabel(m.month)}`,
                            "revenue_month",
                            {
                              month: m.month,
                            },
                          );
                          const cell = (
                            <>
                              {monthLabel(m.month)}
                              {/* MONEY RULE: the exact server string, not the charted
                            number. */}
                              <b>{formatCurrencyAmount(m.won_revenue)}</b>
                            </>
                          );
                          return (
                            <span key={m.month}>
                              {open ? (
                                <button
                                  type="button"
                                  className="drill-fig"
                                  onClick={open}
                                  aria-haspopup="dialog"
                                >
                                  {cell}
                                </button>
                              ) : (
                                cell
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              );
            }}
          />
        </section>

        {/* Opportunity summary: the outcome counts and the money behind them,
          side by side. Every figure is server-computed — the LOST and initial
          stage amounts are read straight off the pipeline payload's own rows,
          and shown only while no period narrows the counts beside them. */}
        <section className="dash-panel dash-panel--summary" aria-label="Opportunity summary">
          <header className="dash-panel-head">
            <h2>Opportunity summary</h2>
          </header>
          <Widget
            resource={summary}
            rangeInvalid={rangeInvalid}
            retry={retry}
            label="Opportunity summary"
            isEmpty={() => false}
            skeleton={<ChartSkeleton label="Loading opportunity summary" height={60} />}
            render={(s: DashboardSummary) => {
              // The stage rows carry the money for two of these counts. The
              // pipeline widget owns its own error/loading states, so an absent
              // payload here simply leaves the amount masked ("—") rather than
              // blanking the panel.
              const items = pipeline.data?.items ?? [];
              const lost = items.find((i) => i.semantic_type === "LOST");
              // "New inquiries" counts the FIRST stage of the pipeline. There is
              // no semantic_type for it (only ACTIVE/WON/LOST exist), so it is the
              // ACTIVE stage with the lowest sort_order — items[0] would pick a
              // terminal or deactivated row whenever one sorts first. Residual
              // divergence from the API's initial-stage rule: the pipeline
              // payload keeps a deactivated stage in items while it still holds
              // deals, so this pick may land on a deactivated non-empty first
              // stage that the API's _initial_stage() (active=TRUE only) skips.
              const initial = items
                .filter((i) => i.semantic_type === "ACTIVE")
                .sort((a, b) => a.sort_order - b.sort_order)[0];
              // The pipeline endpoint ignores the date bounds — its per-stage
              // value is an all-time SNAPSHOT. Pairing it with these two
              // period-scoped counts printed "Lost 1 · ₱524,683.60". With a period
              // applied the amount is withheld rather than mismatched; the element
              // stays so the row layout does not shift. Won and Weighted forecast
              // come from the summary payload itself and are consistent.
              const snapshot = s.period_from === null && s.period_to === null;
              const snapshotNote = "Stage value is a point-in-time snapshot";
              return (
                <div className="dash-sum">
                  <SumRow
                    icon="las la-trophy"
                    label="Won"
                    name="Won opportunities"
                    count={s.won_opportunities}
                    money={s.won_revenue}
                    drill={drillTo("Won opportunities", "won_opportunities")}
                  />
                  <SumRow
                    icon="las la-times"
                    label="Lost"
                    name="Lost opportunities"
                    count={s.lost_opportunities}
                    money={snapshot && pipeline.data ? (lost?.value ?? null) : null}
                    moneyTitle={snapshot ? undefined : snapshotNote}
                    drill={drillTo("Lost opportunities", "lost_opportunities")}
                  />
                  <SumRow
                    icon="las la-bolt"
                    label="New inquiries"
                    name="New inquiries"
                    count={s.new_inquiries}
                    money={snapshot && pipeline.data ? (initial?.value ?? null) : null}
                    moneyTitle={snapshot ? undefined : snapshotNote}
                    drill={drillTo("New inquiries", "new_inquiries")}
                  />
                  <SumRow
                    icon="las la-chart-line"
                    label="Weighted forecast"
                    name="Weighted forecast"
                    money={s.weighted_pipeline_value}
                    drill={drillTo("Weighted forecast", "weighted_pipeline_value")}
                  />
                </div>
              );
            }}
          />
        </section>
      </div>

      {/* Null for every non-admin: `drill` can only be set by an affordance
          that canDrillDown never renders for them. */}
      <DrillDownPanel drill={drill} onClose={() => setDrill(null)} />
    </div>
  );
}

// Bar column height at full scale, and the wave's plot height. Both are px so
// the bar ramp and the wave's peak-dot offset stay predictable in CSS.
const BAR_MAX_PX = 150;
const WAVE_PX = 200;

// Sequential ramp, one hue light → dark (rampTone in lib/dashboard). Both
// dashboard series are ordered magnitudes — funnel position and rank — so a
// sequential ramp is the correct encoding and a categorical palette would imply
// identities that do not exist. Interpolated, so every stage/source gets its own
// shade whatever the cardinality. Bars use rampTone directly (funnel position →
// light at the top of the funnel, dark at the bottom); ranks invert it.

/** Rank → shade, darkest first (rank 0 = largest share). */
function rankTone(index: number, count: number): string {
  return rampTone(count - 1 - index, count);
}

// A tile's contents become a <button> only when a drill-down is offered. The
// button sits INSIDE the tile rather than replacing it, so .kpi-tile keeps the
// band's hairline rules (nth-child) untouched and the plain tile is byte-for-
// byte what it was before this slice.
function Drillable({ drill, children }: { drill?: () => void; children: React.ReactNode }) {
  if (!drill) return <>{children}</>;
  return (
    <button type="button" className="drill-fig" onClick={drill} aria-haspopup="dialog">
      {children}
    </button>
  );
}

// One KPI card: eyebrow + figure + a comparison line against the API's previous
// period. MONEY RULE: a masked value arrives as "—" from formatCurrencyAmount and its
// delta is null, so nothing about a figure the role may not see is implied.
function KpiCard({
  label,
  info,
  value,
  money = false,
  masked = false,
  delta,
  vs,
  drill,
}: {
  label: string;
  info: string;
  value: React.ReactNode;
  /** Money runs longer than a count and gets the smaller size (globals.css). */
  money?: boolean;
  masked?: boolean;
  delta: Delta;
  vs: string | null;
  drill?: () => void;
}) {
  return (
    <div className="kpi-tile">
      <Drillable drill={drill}>
        {/* The label text node comes FIRST: e2e/helpers.ts:kpiValue matches the
            tile by normalize-space(text()) on this span. */}
        <span className="kpi-label">
          {label}
          <InfoTip text={info} />
        </span>
        <span
          className={`kpi-value${money ? " kpi-value--money" : ""}${masked ? " kpi-value--masked" : ""}`}
        >
          {value}
        </span>
      </Drillable>
      <p className="kpi-cmp">
        <span className={`kpi-delta kpi-delta--${delta ? delta.dir : "none"}`}>
          {delta ? delta.text : "—"}
        </span>
        {vs && <span className="kpi-vs">{vs}</span>}
      </p>
    </div>
  );
}

// A pipeline total in the bars panel footer.
function FootFigure({
  label,
  value,
  drill,
}: {
  label: string;
  value: string | null;
  drill?: () => void;
}) {
  return (
    <div className="dash-foot-cell">
      <Drillable drill={drill}>
        <span className="dash-foot-label">{label}</span>
        <span className={value === null ? "dash-foot-val dash-foot-val--masked" : "dash-foot-val"}>
          {formatCurrencyAmount(value)}
        </span>
      </Drillable>
    </div>
  );
}

// One Opportunity-summary row. The whole row is the drill-down affordance for an
// admin, and its accessible name repeats the figures the row shows so a screen
// reader hears what a pointer user sees.
function SumRow({
  icon,
  label,
  name: figure,
  count,
  money,
  moneyTitle,
  drill,
}: {
  icon: string;
  label: string;
  /** The figure's full name — the row's visible label is the short form. */
  name: string;
  count?: number;
  money: string | null;
  /** Why the amount reads "—" when it is withheld rather than merely masked. */
  moneyTitle?: string;
  drill?: () => void;
}) {
  const body = (
    <>
      <span className="dash-sum-icon" aria-hidden="true">
        <i className={icon} />
      </span>
      <span className="dash-sum-label">{label}</span>
      {count !== undefined && <span className="dash-sum-num">{count}</span>}
      <span
        className={count === undefined ? "dash-sum-money dash-sum-money--lead" : "dash-sum-money"}
        title={moneyTitle}
      >
        {formatCurrencyAmount(money)}
      </span>
    </>
  );
  const name = [figure, count, formatCurrencyAmount(money)]
    .filter((v) => v !== undefined)
    .join(", ");
  return drill ? (
    <button
      type="button"
      className="dash-sum-row drill-fig"
      onClick={drill}
      aria-haspopup="dialog"
      aria-label={name}
    >
      {body}
    </button>
  ) : (
    <div className="dash-sum-row">{body}</div>
  );
}

// The DS WaveChart's own geometry: it reserves 4px above and below the plot and
// maps [min, max] onto what is left. The dots, gridlines and axis labels are the
// PAGE's, so they repeat that mapping to land on the same pixels.
function waveY(value: number, max: number): number {
  const span = max || 1;
  return WAVE_PX - (value / span) * (WAVE_PX - 8) - 4;
}

function wavePoints(r: DashboardRevenue): number[] {
  const values = r.items.map((m) => chartNumber(m.won_revenue));
  return values.length === 1 ? [values[0], values[0]] : values;
}

function peakIndex(points: number[]): number {
  return points.reduce((best, v, i) => (v > points[best] ? i : best), 0);
}

//  state machine, once, for every widget: validation-stop → server-error →
// loading → empty → success. 403 gets its own copy when the caller supplies it.
function Widget<T>({
  resource,
  rangeInvalid,
  retry,
  label,
  isEmpty,
  emptyTitle,
  emptyBody,
  forbidden,
  skeleton,
  render,
}: {
  resource: Resource<T>;
  rangeInvalid: boolean;
  retry: () => void;
  label: string;
  isEmpty: (data: T) => boolean;
  emptyTitle?: string;
  emptyBody?: string;
  forbidden?: { title: string; body: string };
  skeleton?: React.ReactNode;
  render: (data: T) => React.ReactNode;
}) {
  if (rangeInvalid) {
    return (
      <EmptyState
        icon="las la-calendar"
        title="Adjust the date range"
        body="“Period from” must be on or before “Period to”."
      />
    );
  }
  if (resource.error !== null) {
    if (forbidden && resource.error.status === 403) {
      return <EmptyState icon="las la-lock" title={forbidden.title} body={forbidden.body} />;
    }
    return (
      <EmptyState
        icon="las la-exclamation-circle"
        title={`${label} could not be loaded`}
        body={`${resource.error.message}. Check that the API is running, then try again.`}
        action={<Button onClick={retry}>Try again</Button>}
      />
    );
  }
  if (resource.data === null) {
    return (
      <>
        {skeleton ?? (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            Loading {label.toLowerCase()}
          </div>
        )}
      </>
    );
  }
  if (isEmpty(resource.data)) {
    return (
      <EmptyState
        icon="las la-chart-bar"
        title={emptyTitle ?? `No ${label.toLowerCase()} yet`}
        body={emptyBody ?? "Nothing matches these filters yet."}
      />
    );
  }
  return <>{render(resource.data)}</>;
}
