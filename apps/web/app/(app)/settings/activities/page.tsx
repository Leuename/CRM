"use client";

import { useCallback, useEffect, useState } from "react";
import { listActivities, type Activity, type Page } from "@/lib/api";
import { ACTIVITY_TYPES } from "@/lib/activities";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { Card, Input, Pagination } from "@/lib/ds";
import { Select } from "@/components/Select";
import { FilterButton, FilterDialog } from "@/components/FilterDialog";

const LIMIT = 25;

// Scope for the optional entity filter. The contract filters by a parent id
// (contact/company/opportunity); this maps the chosen scope to that param.
type Scope = "" | "contact_id" | "company_id" | "opportunity_id";

export default function ActivitiesPage() {
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [scope, setScope] = useState<Scope>("");
  const [entityId, setEntityId] = useState("");

  // Dialog-staged copies of the applied filters above. Open copies applied →
  // staged, Apply copies staged → applied, closing discards.
  const [dlgOpen, setDlgOpen] = useState(false);
  const [staged, setStaged] = useState<{
    type: string;
    from: string;
    to: string;
    scope: Scope;
    entityId: string;
  }>({ type: "", from: "", to: "", scope: "", entityId: "" });

  const [offset, setOffset] = useState(0);
  const [reloads, setReloads] = useState(0);
  const [data, setData] = useState<Page<Activity> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // An entity filter only applies when both a scope and an id are supplied.
  const entityActive = scope !== "" && entityId.trim() !== "";
  const hasFilters = type !== "" || from !== "" || to !== "" || entityActive;

  useEffect(() => {
    setOffset(0);
  }, [type, from, to, scope, entityId]);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    listActivities(
      {
        limit: LIMIT,
        offset,
        activity_type: type || undefined,
        occurred_from: from ? new Date(from).toISOString() : undefined,
        // `to` is a date; include the whole day by pushing to its end.
        occurred_to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
        ...(entityActive ? { [scope]: entityId.trim() } : {}),
      },
      controller.signal,
    )
      .then(setData)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      });
    return () => controller.abort();
  }, [type, from, to, scope, entityId, entityActive, offset, reloads]);

  const retry = useCallback(() => setReloads((n) => n + 1), []);

  // Count of non-default filters. The entity scope + id pair counts once, and
  // only when both halves are set (that is when the API sees it).
  const activeCount = [type !== "", from !== "", to !== "", entityActive].filter(Boolean).length;

  function clearFilters() {
    setType("");
    setFrom("");
    setTo("");
    setScope("");
    setEntityId("");
  }

  return (
    <Card
      title={data ? `Activity timeline · ${data.total}` : "Activity timeline"}
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
            setStaged({ type, from, to, scope, entityId });
            setDlgOpen(true);
          }}
          onClearAll={clearFilters}
        />
      </div>

      <FilterDialog
        open={dlgOpen}
        onApply={() => {
          setType(staged.type);
          setFrom(staged.from);
          setTo(staged.to);
          setScope(staged.scope);
          setEntityId(staged.entityId);
          setDlgOpen(false);
        }}
        onReset={() => setStaged({ type: "", from: "", to: "", scope: "", entityId: "" })}
        onClose={() => setDlgOpen(false)}
      >
        <Select
          label="Type"
          value={staged.type}
          onChange={(v) => setStaged((s) => ({ ...s, type: v }))}
        >
          <option value="">All types</option>
          {ACTIVITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
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

        <Select
          label="Entity"
          value={staged.scope}
          onChange={(v) => setStaged((s) => ({ ...s, scope: v as Scope }))}
        >
          <option value="">Any entity</option>
          <option value="contact_id">Contact</option>
          <option value="company_id">Company</option>
          <option value="opportunity_id">Opportunity</option>
        </Select>
        {staged.scope !== "" && (
          <Input
            label="Entity ID"
            aria-label="Entity ID"
            placeholder="Paste an id"
            value={staged.entityId}
            onChange={(e) => setStaged((s) => ({ ...s, entityId: e.target.value }))}
          />
        )}
      </FilterDialog>

      <ActivityTimeline
        activities={data?.items ?? []}
        loading={data === null && error === null}
        error={error}
        onRetry={retry}
        emptyTitle={hasFilters ? "No activity matches these filters" : "No activity yet"}
        emptyBody={
          hasFilters
            ? "Try a different type or date range — or clear the filters to see everything."
            : "Calls, emails, meetings and notes logged across the CRM will appear here."
        }
      />

      {data && data.items.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <Pagination
            page={Math.floor(offset / LIMIT) + 1}
            pages={Math.max(1, Math.ceil(data.total / LIMIT))}
            onChange={(page: number) => setOffset((page - 1) * LIMIT)}
          />
        </div>
      )}
    </Card>
  );
}
