"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  archiveContact,
  restoreContact,
  listContacts,
  listLeadSources,
  type Contact,
  type LeadSource,
  type Page,
} from "@/lib/api";
import { CLIENT_STATUS_OPTIONS, clientStatus } from "@/lib/contacts";
import { Avatar, Button, Card, DataTable, EmptyState, Input, Pagination, Tag } from "@/lib/ds";
import { Select } from "@/components/Select";
import { ConfirmDialog, type ConfirmState } from "@/components/ConfirmDialog";
import { FilterButton, FilterDialog } from "@/components/FilterDialog";
import { TableSkeleton } from "@/components/Skeleton";

const LIMIT = 25;

function fullName(c: Contact): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ");
}

// Same inline error treatment the detail pages use for a failed archive/restore.
const actionErrorBanner: React.CSSProperties = {
  marginBottom: 16,
  padding: "12px 16px",
  borderRadius: "var(--radius-md)",
  background: "rgba(196,86,78,0.10)",
  color: "var(--secondary-red)",
  font: "400 14px/21px var(--font-ui)",
};

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

export default function ContactsPage() {
  const router = useRouter();

  // Filters
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [tagsFilter, setTagsFilter] = useState("");
  const [archived, setArchived] = useState(false);

  // Dialog-staged copies of the applied filters above. Open copies applied →
  // staged, Apply copies staged → applied, closing discards.
  const [dlgOpen, setDlgOpen] = useState(false);
  const [staged, setStaged] = useState({
    status: "",
    source: "",
    tags: "",
    archived: false,
  });

  const [offset, setOffset] = useState(0);
  const [reloads, setReloads] = useState(0);
  const [data, setData] = useState<Page<Contact> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const tagList = tagsFilter
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const hasFilters =
    debouncedQ !== "" ||
    statusFilter !== "" ||
    sourceFilter !== "" ||
    tagList.length > 0 ||
    archived;

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Any filter change returns to the first page.
  useEffect(() => {
    setOffset(0);
  }, [debouncedQ, statusFilter, sourceFilter, tagsFilter, archived]);

  // Lead sources for the source filter (fetched once).
  useEffect(() => {
    const controller = new AbortController();
    listLeadSources(controller.signal)
      .then(setSources)
      .catch(() => setSources([]));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    listContacts(
      {
        limit: LIMIT,
        offset,
        q: debouncedQ || undefined,
        client_status: statusFilter || undefined,
        source_id: sourceFilter || undefined,
        tags: tagList.length ? tagList : undefined,
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
    // tagList is derived from tagsFilter; depend on the string to keep deps stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, statusFilter, sourceFilter, tagsFilter, archived, offset, reloads]);

  const retry = useCallback(() => setReloads((n) => n + 1), []);

  // Count of non-default filters, search excluded (it has its own inline box).
  const activeCount = [
    statusFilter !== "",
    sourceFilter !== "",
    tagsFilter !== "",
    archived,
  ].filter(Boolean).length;

  function clearDialogFilters() {
    setStatusFilter("");
    setSourceFilter("");
    setTagsFilter("");
    setArchived(false);
  }

  function clearFilters() {
    setQ("");
    setDebouncedQ("");
    clearDialogFilters();
  }

  function openDialog() {
    setStaged({
      status: statusFilter,
      source: sourceFilter,
      tags: tagsFilter,
      archived,
    });
    setDlgOpen(true);
  }

  function applyDialog() {
    setStatusFilter(staged.status);
    setSourceFilter(staged.source);
    setTagsFilter(staged.tags);
    setArchived(staged.archived);
    setDlgOpen(false);
  }

  function toggleArchive(c: Contact) {
    const verb = archived ? "Restore" : "Archive";
    setActionError(null);
    setConfirm({
      message: `${verb} ${fullName(c) || "this individual"}?`,
      confirmLabel: verb,
      run: async () => {
        setBusyId(c.id);
        try {
          if (archived) await restoreContact(c.id);
          else await archiveContact(c.id);
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
      title={data ? `All individuals · ${data.total}` : "All individuals"}
      action={
        <Button
          icon="las la-plus"
          size="sm"
          onClick={() => router.push("/customers/individuals/new")}
        >
          Add individual
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
          aria-label="Search individuals"
          icon="las la-search"
          placeholder="Name, email, phone, company"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 280, maxWidth: "100%" }}
        />
        <FilterButton
          activeCount={activeCount}
          onOpen={openDialog}
          onClearAll={clearDialogFilters}
        />
      </div>

      <FilterDialog
        open={dlgOpen}
        onApply={applyDialog}
        onReset={() => setStaged({ status: "", source: "", tags: "", archived: false })}
        onClose={() => setDlgOpen(false)}
      >
        <Select
          label="Status"
          value={staged.status}
          onChange={(v) => setStaged((s) => ({ ...s, status: v }))}
        >
          <option value="">All statuses</option>
          {CLIENT_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          label="Lead source"
          value={staged.source}
          onChange={(v) => setStaged((s) => ({ ...s, source: v }))}
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Input
          label="Tags"
          aria-label="Filter by tags"
          placeholder="comma,separated"
          value={staged.tags}
          onChange={(e) => setStaged((s) => ({ ...s, tags: e.target.value }))}
        />
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
          title="Individuals could not be loaded"
          body={`${error}. Check that the API is running, then try again.`}
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : data === null ? (
        <TableSkeleton label="Loading individuals" />
      ) : data.items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="las la-filter"
            title="No individuals match these filters"
            body="Try a different search, status or source — or clear the filters to see everyone."
            action={<Button onClick={clearFilters}>Clear filters</Button>}
          />
        ) : offset > 0 ? (
          <EmptyState
            icon="las la-user-friends"
            title="No individuals on this page"
            body="Go back to the first page to see the individuals that exist."
            action={<Button onClick={() => setOffset(0)}>First page</Button>}
          />
        ) : (
          <EmptyState
            icon="las la-user-friends"
            title="No individuals yet"
            body="Add an individual to start tracking inquiries and opportunities."
            action={
              <Button onClick={() => router.push("/customers/individuals/new")}>
                Add individual
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
              onRowClick={(r: Contact) => router.push(`/customers/individuals/${r.id}`)}
              columns={[
                {
                  key: "name",
                  header: "Name",
                  render: (r: Contact) => (
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Avatar name={fullName(r)} size={38} />
                      <span>
                        {/* The row's <tr> onClick is mouse-only; this real link
                            is what makes the row keyboard-reachable and
                            middle-clickable. */}
                        <Link href={`/customers/individuals/${r.id}`} className="row-link">
                          <b style={{ display: "block" }}>{fullName(r)}</b>
                        </Link>
                        {r.position && (
                          <span
                            style={{
                              font: "400 12px/18px var(--font-ui)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {r.position}
                          </span>
                        )}
                      </span>
                    </span>
                  ),
                },
                {
                  key: "email",
                  header: "Email",
                  render: (r: Contact) => r.email ?? "—",
                },
                {
                  key: "phone",
                  header: "Phone",
                  render: (r: Contact) => r.phone ?? "—",
                },
                {
                  key: "client_status",
                  header: "Status",
                  render: (r: Contact) => {
                    const s = clientStatus(r.client_status);
                    return (
                      <Tag tone={s.tone} dot>
                        {s.label}
                      </Tag>
                    );
                  },
                },
                {
                  key: "tags",
                  header: "Tags",
                  render: (r: Contact) =>
                    r.tags.length === 0 ? (
                      "—"
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {r.tags.map((t) => (
                          <Tag key={t} tone="grey">
                            {t}
                          </Tag>
                        ))}
                      </span>
                    ),
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  render: (r: Contact) => (
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`${busyId === r.id ? (archived ? "Restoring" : "Archiving") : archived ? "Restore" : "Archive"} contact ${fullName(r) || "without a name"}`}
                      disabled={busyId === r.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleArchive(r);
                      }}
                    >
                      {busyId === r.id ? "…" : archived ? "Restore" : "Archive"}
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
