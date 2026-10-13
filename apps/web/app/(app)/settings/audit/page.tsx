"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  listAudit,
  listUsers,
  type AuditEvent,
  type AuditPage,
  type Tone,
  type UserRef,
} from "@/lib/api";
import { Button, Card, DataTable, EmptyState, Input, Pagination, Tag } from "@/lib/ds";
import { Select } from "@/components/Select";
import { FilterButton, FilterDialog } from "@/components/FilterDialog";
import { TableSkeleton } from "@/components/Skeleton";

const LIMIT = 25;

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "ARCHIVE",
  "RESTORE",
  "STAGE_CHANGE",
  "OWNER_CHANGE",
  "CONFIG_CHANGE",
  // The Action filter is a CLOSED select, so an action missing here cannot be
  // filtered for at all. REVEAL (kiosk) and REOPEN (a Won/Lost deal moved back
  // to active) are both emitted by the server and were both unreachable from
  // this screen. REOPEN especially: it REPLACES the STAGE_CHANGE row for that
  // move, so filtering STAGE_CHANGE does not find it either.
  "REVEAL",
  "REOPEN",
] as const;

const ACTION_TONE: Record<string, Tone> = {
  CREATE: "blue",
  UPDATE: "blue",
  ARCHIVE: "yellow",
  RESTORE: "lightblue",
  STAGE_CHANGE: "primary",
  OWNER_CHANGE: "primary",
  CONFIG_CHANGE: "grey",
  REVEAL: "red",
  REOPEN: "yellow",
};

// column, so the input stays free-text with a datalist of the ones we emit.
const ENTITY_TYPES = ["contact", "company", "opportunity", "product", "pipeline_stage"];

interface AuditFilters {
  entityType: string;
  entityId: string;
  actorId: string;
  action: string;
  correlationId: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: AuditFilters = {
  entityType: "",
  entityId: "",
  actorId: "",
  action: "",
  correlationId: "",
  from: "",
  to: "",
};

export default function AuditPageView() {
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");
  const [correlationId, setCorrelationId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Dialog-staged copies of the applied filters above. Open copies applied →
  // staged, Apply copies staged → applied, closing discards.
  const [dlgOpen, setDlgOpen] = useState(false);
  const [staged, setStaged] = useState<AuditFilters>(EMPTY_FILTERS);

  const [offset, setOffset] = useState(0);
  const [reloads, setReloads] = useState(0);
  const [data, setData] = useState<AuditPage | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [users, setUsers] = useState<UserRef[]>([]);

  const hasFilters =
    entityType !== "" ||
    entityId !== "" ||
    actorId !== "" ||
    action !== "" ||
    correlationId !== "" ||
    from !== "" ||
    to !== "";

  useEffect(() => {
    setOffset(0);
  }, [entityType, entityId, actorId, action, correlationId, from, to]);

  // Actor picker options. Degrades to "All actors" only if the call fails.
  useEffect(() => {
    const controller = new AbortController();
    listUsers(controller.signal)
      .then(setUsers)
      .catch(() => setUsers([]));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    listAudit(
      {
        limit: LIMIT,
        offset,
        entity_type: entityType.trim() || undefined,
        entity_id: entityId.trim() || undefined,
        actor_id: actorId || undefined,
        action: action || undefined,
        correlation_id: correlationId.trim() || undefined,
        date_from: from ? new Date(from).toISOString() : undefined,
        // `to` is a date; include the whole day by pushing to its end.
        date_to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
      },
      controller.signal,
    )
      .then(setData)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error("Unknown error"));
      });
    return () => controller.abort();
  }, [entityType, entityId, actorId, action, correlationId, from, to, offset, reloads]);

  const retry = useCallback(() => setReloads((n) => n + 1), []);

  // Count of non-default filters. This page has no search box, so every filter
  // counts.
  const activeCount = [entityType, entityId, actorId, action, correlationId, from, to].filter(
    (v) => v !== "",
  ).length;

  function applyFilters(f: AuditFilters) {
    setEntityType(f.entityType);
    setEntityId(f.entityId);
    setActorId(f.actorId);
    setAction(f.action);
    setCorrelationId(f.correlationId);
    setFrom(f.from);
    setTo(f.to);
  }

  function clearFilters() {
    applyFilters(EMPTY_FILTERS);
  }

  const status = error instanceof ApiError ? error.status : null;

  return (
    <Card
      title={data ? `Audit log · ${data.total}` : "Audit log"}
      style={{ borderRadius: "var(--radius-card)", marginTop: 28 }}
    >
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
        <FilterButton
          activeCount={activeCount}
          onOpen={() => {
            setStaged({
              entityType,
              entityId,
              actorId,
              action,
              correlationId,
              from,
              to,
            });
            setDlgOpen(true);
          }}
          onClearAll={clearFilters}
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
        <Input
          label="Entity type"
          aria-label="Entity type"
          list="audit-entity-types"
          placeholder="Any entity type"
          value={staged.entityType}
          onChange={(e) => setStaged((s) => ({ ...s, entityType: e.target.value }))}
        />
        <datalist id="audit-entity-types">
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>

        <Input
          label="Entity ID"
          aria-label="Entity ID"
          placeholder="Paste an id"
          value={staged.entityId}
          onChange={(e) => setStaged((s) => ({ ...s, entityId: e.target.value }))}
        />
        <Select
          label="Actor"
          value={staged.actorId}
          onChange={(v) => setStaged((s) => ({ ...s, actorId: v }))}
        >
          <option value="">All actors</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name}
            </option>
          ))}
        </Select>
        <Select
          label="Action"
          value={staged.action}
          onChange={(v) => setStaged((s) => ({ ...s, action: v }))}
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replace("_", " ").toLowerCase()}
            </option>
          ))}
        </Select>

        <Input
          label="Correlation ID"
          aria-label="Correlation ID"
          placeholder="Paste a correlation id"
          value={staged.correlationId}
          onChange={(e) => setStaged((s) => ({ ...s, correlationId: e.target.value }))}
        />
        <label className="crm-field">
          <span className="crm-field-label">From date</span>
          <input
            type="date"
            aria-label="Occurred from"
            value={staged.from}
            onChange={(e) => setStaged((s) => ({ ...s, from: e.target.value }))}
            className="crm-field-box"
          />
        </label>
        <label className="crm-field">
          <span className="crm-field-label">To date</span>
          <input
            type="date"
            aria-label="Occurred to"
            value={staged.to}
            onChange={(e) => setStaged((s) => ({ ...s, to: e.target.value }))}
            className="crm-field-box"
          />
        </label>
      </FilterDialog>

      {status === 403 ? (
        // Deep-linking bypasses the nav gate; the server is the real gate.
        <EmptyState
          icon="las la-lock"
          title="You do not have access to the audit log"
          body="Viewing audit history requires an administrator account. Ask an admin if you need this."
        />
      ) : status === 422 ? (
        <EmptyState
          icon="las la-exclamation-triangle"
          title="Those filters are not valid"
          body={`${error?.message ?? "Check the values."}${fieldHints(error)} Entity ID and actor must be full ids.`}
          action={<Button onClick={clearFilters}>Clear filters</Button>}
        />
      ) : error !== null ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Audit log could not be loaded"
          body={`${error.message}. Check that the API is running, then try again.`}
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : data === null ? (
        <TableSkeleton label="Loading audit events" />
      ) : data.items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="las la-filter"
            title="No audit events match these filters"
            body="Try a different action, actor or date range — or clear the filters to see everything."
            action={<Button onClick={clearFilters}>Clear filters</Button>}
          />
        ) : offset > 0 ? (
          <EmptyState
            icon="las la-clipboard-list"
            title="No audit events on this page"
            body="Go back to the first page to see the events that exist."
            action={<Button onClick={() => setOffset(0)}>First page</Button>}
          />
        ) : (
          <EmptyState
            icon="las la-clipboard-list"
            title="No audit events yet"
            body="Record changes made across the CRM will appear here as they happen."
          />
        )
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <DataTable
              className="crm-table"
              rows={data.items}
              columns={[
                {
                  key: "occurred_at",
                  header: "When",
                  render: (r: AuditEvent) => new Date(r.occurred_at).toLocaleString(),
                },
                {
                  key: "actor",
                  header: "Actor",
                  render: (r: AuditEvent) => r.actor_name ?? r.actor_id,
                },
                {
                  key: "action",
                  header: "Action",
                  render: (r: AuditEvent) => (
                    <Tag tone={ACTION_TONE[r.action] ?? "grey"} dot>
                      {r.action.replace("_", " ").toLowerCase()}
                    </Tag>
                  ),
                },
                {
                  key: "entity",
                  header: "Entity",
                  render: (r: AuditEvent) => (
                    <span>
                      <b style={{ display: "block" }}>{r.entity_type}</b>
                      <span
                        style={{
                          font: "400 12px/18px var(--font-ui)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {r.entity_id}
                      </span>
                    </span>
                  ),
                },
                {
                  key: "changes",
                  header: "Changes",
                  render: (r: AuditEvent) => <Diff before={r.before} after={r.after} />,
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

// Snapshots are allowlisted column maps, so a key→(old → new) list is the whole
// story. Both sides present → only the keys that actually changed; one side
// present (CREATE/ARCHIVE) → every key of that side.
function diffRows(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): { key: string; from: unknown; to: unknown }[] {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].sort();
  const rows = keys.map((key) => ({
    key,
    from: before?.[key],
    to: after?.[key],
  }));
  if (before === null || after === null) return rows;
  return rows.filter((r) => JSON.stringify(r.from) !== JSON.stringify(r.to));
}

function Diff({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const rows = diffRows(before, after);
  if (rows.length === 0) {
    return <span style={{ color: "var(--text-secondary)" }}>—</span>;
  }
  return (
    <dl style={{ margin: 0, font: "400 12px/18px var(--font-ui)" }}>
      {rows.map((r) => (
        <div key={r.key} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <dt style={{ color: "var(--text-secondary)" }}>{r.key}:</dt>
          <dd style={{ margin: 0, color: "var(--text-primary)" }}>
            {before !== null && <span>{show(r.from)} → </span>}
            {show(r.to)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// Values arrive already server-serialized (money/dates are strings). Objects are
// rare and shown as compact JSON rather than being walked recursively.
function show(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function fieldHints(error: Error | null): string {
  const fields = error instanceof ApiError ? error.fields : undefined;
  if (!fields) return "";
  return ` (${Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ")})`;
}
