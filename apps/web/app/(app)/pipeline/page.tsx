"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getDashboardPipeline,
  listOpportunities,
  listPipelineStages,
  type OpportunitySummary,
  type PipelineStage,
} from "@/lib/api";
import { Button, Card, EmptyState, Tag } from "@/lib/ds";
import { TableSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/components/AuthProvider";
import { useModalFocus } from "@/components/useModalFocus";
import { formatMoney, semanticTone } from "@/lib/opportunities";
import { stageCssColor, stageIconClass, stageTintColor } from "@/lib/dashboard";

// BOARDLOAD: one page of up to 100 opportunities, grouped client-side by stage.
// No virtualization; a "first 100" note appears when more exist (see below).
const BOARD_LIMIT = 100;

// CONVENIENCE-HIDE ONLY — NOT a security boundary. This only hides the admin
// "Configure stages" shortcut for non-admins; the config route + POST/PATCH
// stay 403-guarded server-side regardless.
function canConfigurePipeline(role: string): boolean {
  return role === "ADMIN";
}

// Stage totals are NEVER summed here — money arithmetic on the client is banned.
// The  dashboard endpoint returns the server-computed value per stage, and
// null when the caller lacks view_revenue. A 403 (or any failure) simply means
// no totals are shown; the board itself still renders.
//

// the count of the first BOARD_LIMIT deals, not of the stage — so past 100
// opportunities a cell showed a whole-stage total above a partial count. The
// server figure is unmasked (counts are visible to every role that can see the
// board), and the client grouping stays as the fallback for when the call fails.
type StageTotals = {
  byStage: Map<string, { count: number; value: string | null }>;
  currency: string;
} | null;

export default function PipelinePage() {
  const router = useRouter();
  const { user } = useAuth();
  const canConfigure = canConfigurePipeline(user.role);

  const [stages, setStages] = useState<PipelineStage[] | null>(null);
  const [page, setPage] = useState<{
    items: OpportunitySummary[];
    total: number;
  } | null>(null);
  const [totals, setTotals] = useState<StageTotals>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);
  // MODAL: null until a stage card is clicked. No default-open stage — the
  // board itself is the landing view, deals only show once a card is picked.
  const [openStageId, setOpenStageId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setStages(null);
    setPage(null);
    setError(null);
    getDashboardPipeline({}, controller.signal)
      .then((p) =>
        setTotals({
          byStage: new Map(p.items.map((i) => [i.stage_id, { count: i.count, value: i.value }])),
          currency: p.currency,
        }),
      )
      .catch(() => setTotals(null));
    Promise.all([
      listPipelineStages(controller.signal),
      listOpportunities({ limit: BOARD_LIMIT, offset: 0, archived: false }, controller.signal),
    ])
      .then(([allStages, oppPage]) => {
        setStages(allStages);
        setPage({ items: oppPage.items, total: oppPage.total });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      });
    return () => controller.abort();
  }, [reloads]);

  const refetch = useCallback(() => setReloads((n) => n + 1), []);

  const byStage = useMemo(() => {
    const map = new Map<string, OpportunitySummary[]>();
    for (const opp of page?.items ?? []) {
      const list = map.get(opp.stage_id) ?? [];
      list.push(opp);
      map.set(opp.stage_id, list);
    }
    return map;
  }, [page]);

  // Board sections: active stages, PLUS any deactivated stage that still holds
  // opportunities — those deals stay visible instead of being silently dropped
  // while the header count still counts them. An EMPTY
  // deactivated stage is excluded from the board (edit it in /settings/pipeline).
  // Sorted by sort_order, with terminal (Won/Lost) stages pushed to the end so
  // the board reads start → finish.
  const sections = useMemo(
    () =>
      (stages ?? [])
        .filter((s) => s.active || (byStage.get(s.id)?.length ?? 0) > 0)
        .sort(
          (a, b) =>
            Number(a.semantic_type !== "ACTIVE") - Number(b.semantic_type !== "ACTIVE") ||
            a.sort_order - b.sort_order,
        ),
    [stages, byStage],
  );

  const openStage = sections.find((s) => s.id === openStageId) ?? null;
  const closeStage = useCallback(() => setOpenStageId(null), []);

  const configureAction = canConfigure ? (
    <Button
      variant="outline"
      size="sm"
      icon="las la-cog"
      onClick={() => router.push("/settings/pipeline")}
    >
      Configure stages
    </Button>
  ) : undefined;

  return (
    <Card
      title={page ? `Pipeline · ${page.total}` : "Pipeline"}
      action={configureAction}
      // Fills the app shell's scroll area exactly, so the 4×2 board below fits
      // in one screen instead of pushing the page into a scrollbar.
      style={{
        borderRadius: "var(--radius-card)",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      {error !== null ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Pipeline could not be loaded"
          body={`${error}. Check that the API is running, then try again.`}
          action={<Button onClick={refetch}>Try again</Button>}
        />
      ) : stages === null || page === null ? (
        <TableSkeleton label="Loading pipeline" rows={6} />
      ) : sections.length === 0 ? (
        <EmptyState
          icon="las la-stream"
          title="No pipeline stages yet"
          body={
            canConfigure
              ? "Add a stage so opportunities have somewhere to live."
              : "No active pipeline stages have been configured yet. Ask an administrator to add them."
          }
          action={
            canConfigure ? (
              <Button onClick={() => router.push("/settings/pipeline")}>Configure stages</Button>
            ) : undefined
          }
        />
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {page.total > BOARD_LIMIT && (
            <div
              role="status"
              style={{
                marginBottom: 16,
                flexShrink: 0,
                font: "400 12px/18px var(--font-ui)",
                color: "var(--text-secondary)",
              }}
            >
              Showing the first {BOARD_LIMIT} of {page.total} opportunities. Use the{" "}
              <Link href="/sales/opportunities" style={{ color: "var(--primary)" }}>
                opportunities list
              </Link>{" "}
              to filter the rest.
            </div>
          )}
          {/* The eight stages are a fixed 4×2 matrix, already ordered active →
              deactivated-with-deals → Won/Lost, sized to fill the space left in
              the card (see .pipeline-stage-grid) rather than grow past it.
              Clicking a card opens its deals in a modal instead of pushing
              content below the grid, so the board's own layout never shifts. */}
          <div className="pipeline-stage-grid">
            {sections.map((stage) => (
              <StageCard
                key={stage.id}
                stage={stage}
                count={totals?.byStage.get(stage.id)?.count ?? byStage.get(stage.id)?.length ?? 0}
                total={totals?.byStage.get(stage.id)?.value ?? null}
                currency={totals?.currency}
                onOpen={setOpenStageId}
              />
            ))}
          </div>
          <StageDealsModal
            stage={openStage}
            opportunities={openStage ? (byStage.get(openStage.id) ?? []) : []}
            onClose={closeStage}
          />
        </div>
      )}
    </Card>
  );
}

/**
 * Compact, clickable stage summary. A real <button>, so Enter/Space and the
 * focus ring come from the platform; it opens the stage's deals in a modal.
 */
function StageCard({
  stage,
  count,
  total,
  currency,
  onOpen,
}: {
  stage: PipelineStage;
  count: number;
  total: string | null;
  currency: string | undefined;
  onOpen: (id: string) => void;
}) {
  const terminal = stage.semantic_type !== "ACTIVE";
  return (
    <button
      type="button"
      className="pipeline-card pipeline-stage-card"
      aria-haspopup="dialog"
      onClick={() => onOpen(stage.id)}
      style={
        {
          // The stage's own hue, handed to the stylesheet once: the tint is the
          // card ground (it replaces the old terminal "sunken" rule — Won/Lost
          // now read terminal through their blue/red fill and their tag), and
          // the full-strength hue paints the dot, the icon and the open ring.
          "--stage-fill": stageTintColor(stage.color),
          "--stage-ink": stageCssColor(stage.color),
        } as CSSProperties
      }
    >
      <span className="pipeline-stage-head">
        <span className="pipeline-stage-dot" aria-hidden="true" />
        <span className="pipeline-stage-name">{stage.name}</span>
        {terminal && (
          <Tag tone={semanticTone(stage.semantic_type)}>
            {stage.semantic_type === "WON" ? "Won" : "Lost"}
          </Tag>
        )}
        {/* Retired stage that still holds deals: say so, so nobody reads it as
            part of the live pipeline. */}
        {!stage.active && <Tag tone="grey">Deactivated</Tag>}
      </span>
      {/* Server-computed stage total (): masked or unavailable → "—". It covers
          the whole stage, not just the first 100 cards in the panel. */}
      <span className="pipeline-stage-amount">
        {total === null ? "—" : formatMoney(total, currency)}
      </span>
      <span className="pipeline-stage-foot">
        <span className="pipeline-stage-icon" aria-hidden="true">
          <i className={stageIconClass(stage.semantic_type, stage.sort_order)} />
        </span>
        <span className="pipeline-stage-count">
          {count} {count === 1 ? "opportunity" : "opportunities"}
        </span>
      </span>
    </button>
  );
}

function OpportunityCard({ opportunity }: { opportunity: OpportunitySummary }) {
  return (
    // A real link: keyboard, middle-click and "open in new tab" all work. Stage
    // moves happen on the opportunity's own detail page, not from this card.
    <Link
      href={`/sales/opportunities/${opportunity.id}`}
      className="pipeline-card"
      style={{
        display: "block",
        padding: 14,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          font: "700 14px/21px var(--font-ui)",
          color: "var(--text-primary)",
        }}
      >
        {opportunity.title}
        {/*  Q9: a reopened deal must not read identically on this board to one
            that was never closed. Same Tag idiom the stage cards above already
            use for Won/Lost/Deactivated — no new badge component. */}
        {opportunity.reopened && <Tag tone="yellow">Reopened</Tag>}
      </div>
      <div
        style={{
          font: "400 12px/18px var(--font-ui)",
          color: "var(--text-secondary)",
        }}
      >
        {opportunity.contact_name ?? "—"}
      </div>
      {/* MONEY RULE: server string, thousands-separated for reading only;
          masked/absent → "—". */}
      <div
        style={{
          font: "700 16px/24px var(--font-ui)",
          color: "var(--primary)",
          marginTop: 10,
        }}
      >
        {formatMoney(opportunity.total_revenue_inc_vat, opportunity.currency)}
      </div>
    </Link>
  );
}

/**
 * A stage card's deals, in a modal with a backdrop — same overlay/panel/Esc
 * idiom as DrillDownPanel and FilterDialog (see useModalFocus), so this is the
 * third use of that pattern rather than a new one.
 */
function StageDealsModal({
  stage,
  opportunities,
  onClose,
}: {
  stage: PipelineStage | null;
  opportunities: OpportunitySummary[];
  onClose: () => void;
}) {
  const open = stage !== null;
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useModalFocus(open, panelRef);

  if (!stage) return null;

  return (
    <div role="presentation" onClick={onClose} style={modalOverlay}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${stage.name} · ${opportunities.length}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={modalPanel}
        className="pipeline-modal-panel"
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
            {stage.name} · {opportunities.length}
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div style={{ marginTop: 20 }}>
          {opportunities.length === 0 ? (
            <p
              style={{
                margin: 0,
                font: "400 12px/18px var(--font-ui)",
                color: "var(--text-secondary)",
              }}
            >
              No opportunities
            </p>
          ) : (
            <div className="pipeline-grid">
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opportunity={opp} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const modalOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.32)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  zIndex: 100,
};

const modalPanel: CSSProperties = {
  width: 900,
  maxWidth: "100%",
  maxHeight: "80vh",
  overflowY: "auto",
  background: "var(--bg-surface)",
  borderRadius: "var(--radius-card)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.24)",
  padding: 28,
  outline: "none",
};
