"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  archiveOpportunity,
  restoreOpportunity,
  listOpportunities,
  listPipelineStages,
  listLeadSources,
  listProducts,
  listUsers,
  type OpportunitySummary,
  type PipelineStage,
  type LeadSource,
  type Product,
  type UserRef,
  type Page,
} from "@/lib/api";
import { formatMoney, stageTone } from "@/lib/opportunities";
import { Button, Card, DataTable, EmptyState, Input, Pagination, Tag } from "@/lib/ds";
import { Select } from "@/components/Select";
import { ConfirmDialog, type ConfirmState } from "@/components/ConfirmDialog";
import { FilterButton, FilterDialog } from "@/components/FilterDialog";
import { TableSkeleton } from "@/components/Skeleton";

const LIMIT = 25;

type StatusFilter = "" | "active" | "won" | "lost";

interface StagedFilters {
  ownerId: string;
  stageId: string;
  sourceId: string;
  productId: string;
  status: StatusFilter;
  closeFrom: string;
  closeTo: string;
  archived: boolean;
}

const EMPTY_FILTERS: StagedFilters = {
  ownerId: "",
  stageId: "",
  sourceId: "",
  productId: "",
  status: "",
  closeFrom: "",
  closeTo: "",
  archived: false,
};

export default function OpportunitiesPage() {
  const router = useRouter();

  // Filters
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [stageId, setStageId] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [closeFrom, setCloseFrom] = useState("");
  const [closeTo, setCloseTo] = useState("");
  const [archived, setArchived] = useState(false);

  // Dialog-staged copies of the applied filters above. Open copies applied →
  // staged, Apply copies staged → applied, closing discards.
  const [dlgOpen, setDlgOpen] = useState(false);
  const [staged, setStaged] = useState<StagedFilters>(EMPTY_FILTERS);

  const [offset, setOffset] = useState(0);
  const [reloads, setReloads] = useState(0);
  const [data, setData] = useState<Page<OpportunitySummary> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter option sources (fetched once). Selects degrade to no options on error.
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserRef[]>([]);

  const hasFilters =
    debouncedQ !== "" ||
    ownerId !== "" ||
    stageId !== "" ||
    sourceId !== "" ||
    productId !== "" ||
    status !== "" ||
    closeFrom !== "" ||
    closeTo !== "" ||
    archived;

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Any filter change returns to the first page.
  useEffect(() => {
    setOffset(0);
  }, [debouncedQ, ownerId, stageId, sourceId, productId, status, closeFrom, closeTo, archived]);

  // Load filter option sources once.
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

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    listOpportunities(
      {
        limit: LIMIT,
        offset,
        q: debouncedQ || undefined,
        owner_id: ownerId || undefined,
        stage_id: stageId || undefined,
        source_id: sourceId || undefined,
        product_id: productId || undefined,
        status: status || undefined,
        close_from: closeFrom || undefined,
        close_to: closeTo || undefined,
        archived,
      },
      controller.signal,
    )
      .then(setData)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      });
    return () => controller.abort();
  }, [
    debouncedQ,
    ownerId,
    stageId,
    sourceId,
    productId,
    status,
    closeFrom,
    closeTo,
    archived,
    offset,
    reloads,
  ]);

  const retry = useCallback(() => setReloads((n) => n + 1), []);

  // Count of non-default filters, search excluded (it has its own inline box).
  const activeCount = [
    ownerId !== "",
    stageId !== "",
    sourceId !== "",
    productId !== "",
    status !== "",
    closeFrom !== "",
    closeTo !== "",
    archived,
  ].filter(Boolean).length;

  function applyFilters(f: StagedFilters) {
    setOwnerId(f.ownerId);
    setStageId(f.stageId);
    setSourceId(f.sourceId);
    setProductId(f.productId);
    setStatus(f.status);
    setCloseFrom(f.closeFrom);
    setCloseTo(f.closeTo);
    setArchived(f.archived);
  }

  function clearFilters() {
    setQ("");
    setDebouncedQ("");
    applyFilters(EMPTY_FILTERS);
  }

  function toggleArchive(o: OpportunitySummary) {
    // OF5: archived rows restore; live rows archive. Idempotent server-side; we
    // re-fetch the list rather than trusting the response body.
    const verb = o.archived_at !== null ? "Restore" : "Archive";
    setActionError(null);
    setConfirm({
      message: `${verb} "${o.title}"?`,
      confirmLabel: verb,
      run: async () => {
        setBusyId(o.id);
        try {
          if (o.archived_at !== null) await restoreOpportunity(o.id);
          else await archiveOpportunity(o.id);
          setConfirm(null);
          setReloads((n) => n + 1);
        } catch (err: unknown) {
          setConfirm(null);
          setActionError(err instanceof Error ? err.message : "Action failed");
        } finally {
          setBusyId(null);
        }
      },
    });
  }

  return (
    <Card
      className="opportunities-list-card"
      title={data ? `All opportunities · ${data.total}` : "All opportunities"}
      action={
        <Button
          icon="las la-plus"
          size="sm"
          onClick={() => router.push("/sales/opportunities/new")}
        >
          Add opportunity
        </Button>
      }
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <ConfirmDialog state={confirm} busy={busyId !== null} onClose={() => setConfirm(null)} />
      {actionError && (
        <div role="alert" style={actionErrorBanner}>
          {actionError}
        </div>
      )}
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 20,
          alignItems: "flex-end",
          marginBottom: 24,
        }}
      >
        <Input
          label="Search"
          aria-label="Search opportunities"
          icon="las la-search"
          placeholder="Title, contact, company"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 260, maxWidth: "100%" }}
        />
        <FilterButton
          activeCount={activeCount}
          onOpen={() => {
            setStaged({
              ownerId,
              stageId,
              sourceId,
              productId,
              status,
              closeFrom,
              closeTo,
              archived,
            });
            setDlgOpen(true);
          }}
          onClearAll={() => applyFilters(EMPTY_FILTERS)}
        />
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
          label="Status"
          value={staged.status}
          onChange={(v) => setStaged((s) => ({ ...s, status: v as StatusFilter }))}
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
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
          <span className="crm-field-label">Closes from</span>
          <input
            type="date"
            aria-label="Expected close from"
            value={staged.closeFrom}
            onChange={(e) => setStaged((s) => ({ ...s, closeFrom: e.target.value }))}
            className="crm-field-box"
          />
        </label>
        <label className="crm-field">
          <span className="crm-field-label">Closes to</span>
          <input
            type="date"
            aria-label="Expected close to"
            value={staged.closeTo}
            onChange={(e) => setStaged((s) => ({ ...s, closeTo: e.target.value }))}
            className="crm-field-box"
          />
        </label>
        <label style={checkboxLabel}>
          <input
            type="checkbox"
            checked={staged.archived}
            onChange={(e) => setStaged((s) => ({ ...s, archived: e.target.checked }))}
          />
          Show archived
        </label>
      </FilterDialog>

      {error !== null ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Opportunities could not be loaded"
          body={`${error}. Check that the API is running, then try again.`}
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : data === null ? (
        <TableSkeleton label="Loading opportunities" />
      ) : data.items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="las la-filter"
            title="No opportunities match these filters"
            body="Try a different search, owner, stage or date range — or clear the filters to see them all."
            action={<Button onClick={clearFilters}>Clear filters</Button>}
          />
        ) : offset > 0 ? (
          <EmptyState
            icon="las la-briefcase"
            title="No opportunities on this page"
            body="Go back to the first page to see the opportunities that exist."
            action={<Button onClick={() => setOffset(0)}>First page</Button>}
          />
        ) : (
          <EmptyState
            icon="las la-briefcase"
            title="No opportunities yet"
            body="Create an opportunity to start tracking deals through the pipeline."
            action={
              <Button onClick={() => router.push("/sales/opportunities/new")}>
                Add opportunity
              </Button>
            }
          />
        )
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <DataTable
              className="crm-table"
              rows={data.items}
              onRowClick={(r: OpportunitySummary) => router.push(`/sales/opportunities/${r.id}`)}
              columns={[
                {
                  key: "title",
                  header: "Title",
                  render: (r: OpportunitySummary) => (
                    <span>
                      {/* Real link: keyboard reachable and middle-clickable; the
                          <tr> onClick still covers the rest of the row. */}
                      <Link href={`/sales/opportunities/${r.id}`} className="row-link">
                        <b style={{ display: "block" }}>{r.title}</b>
                      </Link>
                      {r.archived_at !== null && (
                        <span
                          style={{
                            font: "400 12px/18px var(--font-ui)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Archived
                        </span>
                      )}
                    </span>
                  ),
                },
                {
                  key: "contact",
                  header: "Contact",
                  render: (r: OpportunitySummary) => <Nowrap>{r.contact_name ?? "—"}</Nowrap>,
                },
                {
                  key: "owner",
                  header: "Owner",
                  render: (r: OpportunitySummary) => <Nowrap>{r.owner_name ?? "—"}</Nowrap>,
                },
                {
                  key: "stage",
                  header: "Stage",
                  render: (r: OpportunitySummary) => (
                    <Tag tone={stageTone(r.stage_color)} dot>
                      {r.stage_name}
                    </Tag>
                  ),
                },
                {
                  key: "revenue",
                  header: "Revenue",
                  align: "right",
                  // MONEY RULE: server string, thousands-separated for reading
                  // only; masked/absent renders "—". Kept on one line so an
                  // amount never breaks across two rows.
                  render: (r: OpportunitySummary) => (
                    <Nowrap>{formatMoney(r.total_revenue_inc_vat, r.currency)}</Nowrap>
                  ),
                },
                {
                  key: "close",
                  header: "Close date",
                  render: (r: OpportunitySummary) => (
                    <Nowrap>{r.expected_close_date ?? "—"}</Nowrap>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  render: (r: OpportunitySummary) => (
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`${busyId === r.id ? (r.archived_at !== null ? "Restoring" : "Archiving") : r.archived_at !== null ? "Restore" : "Archive"} opportunity ${r.title}`}
                      disabled={busyId === r.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleArchive(r);
                      }}
                    >
                      {busyId === r.id ? "…" : r.archived_at !== null ? "Restore" : "Archive"}
                    </Button>
                  ),
                },
              ]}
            />
          </div>
          <div style={{ marginTop: 28 }}>
            <Pagination
              page={Math.floor(offset / LIMIT) + 1}
              pages={Math.max(1, Math.ceil(data.total / LIMIT))}
              onChange={(page: number) => setOffset((page - 1) * LIMIT)}
            />
          </div>
        </>
      )}
    </Card>
  );
}

// Short single-value cells (names, dates, money) must not wrap: a wrapped
// "PHP 120,000.00" reads as two numbers.
function Nowrap({ children }: { children: React.ReactNode }) {
  return <span style={{ whiteSpace: "nowrap" }}>{children}</span>;
}

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  height: 40,
  marginTop: 10,
  font: "400 14px/21px var(--font-ui)",
  color: "var(--text-secondary)",
  cursor: "pointer",
};

// Same inline error treatment the detail pages use for a failed archive/restore.
const actionErrorBanner: React.CSSProperties = {
  marginBottom: 16,
  padding: "12px 16px",
  borderRadius: "var(--radius-md)",
  background: "rgba(196,86,78,0.10)",
  color: "var(--secondary-red)",
  font: "400 14px/21px var(--font-ui)",
};
