"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { archiveCompany, restoreCompany, listCompanies, type Company, type Page } from "@/lib/api";
import { Button, Card, DataTable, EmptyState, Input, Pagination } from "@/lib/ds";
import { ConfirmDialog, type ConfirmState } from "@/components/ConfirmDialog";
import { FilterButton, FilterDialog } from "@/components/FilterDialog";
import { TableSkeleton } from "@/components/Skeleton";

const LIMIT = 25;

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

export default function CompaniesPage() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [archived, setArchived] = useState(false);

  // Dialog-staged copy of the applied filters. Open copies applied → staged,
  // Apply copies staged → applied, closing discards.
  const [dlgOpen, setDlgOpen] = useState(false);
  const [stagedArchived, setStagedArchived] = useState(false);

  const [offset, setOffset] = useState(0);
  const [reloads, setReloads] = useState(0);
  const [data, setData] = useState<Page<Company> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasFilters = debouncedQ !== "" || archived;

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Any filter change returns to the first page.
  useEffect(() => {
    setOffset(0);
  }, [debouncedQ, archived]);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    listCompanies({ limit: LIMIT, offset, q: debouncedQ || undefined, archived }, controller.signal)
      .then(setData)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      });
    return () => controller.abort();
  }, [debouncedQ, archived, offset, reloads]);

  const retry = useCallback(() => setReloads((n) => n + 1), []);

  // Count of non-default filters, search excluded (it has its own inline box).
  const activeCount = archived ? 1 : 0;

  function clearFilters() {
    setQ("");
    setDebouncedQ("");
    setArchived(false);
  }

  function toggleArchive(c: Company) {
    const verb = archived ? "Restore" : "Archive";
    setActionError(null);
    setConfirm({
      message: `${verb} ${c.name || "this company"}?`,
      confirmLabel: verb,
      run: async () => {
        setBusyId(c.id);
        try {
          if (archived) await restoreCompany(c.id);
          else await archiveCompany(c.id);
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
      title={data ? `All companies · ${data.total}` : "All companies"}
      action={
        <Button
          icon="las la-plus"
          size="sm"
          onClick={() => router.push("/customers/companies/new")}
        >
          Add company
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
          aria-label="Search companies"
          icon="las la-search"
          placeholder="Name, legal name, industry"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 320, maxWidth: "100%" }}
        />
        <FilterButton
          activeCount={activeCount}
          onOpen={() => {
            setStagedArchived(archived);
            setDlgOpen(true);
          }}
          onClearAll={() => setArchived(false)}
        />
      </div>

      <FilterDialog
        open={dlgOpen}
        onApply={() => {
          setArchived(stagedArchived);
          setDlgOpen(false);
        }}
        onReset={() => setStagedArchived(false)}
        onClose={() => setDlgOpen(false)}
      >
        <label style={checkboxLabel}>
          <input
            type="checkbox"
            checked={stagedArchived}
            onChange={(e) => setStagedArchived(e.target.checked)}
          />
          Show archived
        </label>
      </FilterDialog>

      {error !== null ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Companies could not be loaded"
          body={`${error}. Check that the API is running, then try again.`}
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : data === null ? (
        <TableSkeleton label="Loading companies" />
      ) : data.items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="las la-filter"
            title="No companies match these filters"
            body="Try a different search — or clear the filters to see every company."
            action={<Button onClick={clearFilters}>Clear filters</Button>}
          />
        ) : offset > 0 ? (
          <EmptyState
            icon="las la-building"
            title="No companies on this page"
            body="Go back to the first page to see the companies that exist."
            action={<Button onClick={() => setOffset(0)}>First page</Button>}
          />
        ) : (
          <EmptyState
            icon="las la-building"
            title="No companies yet"
            body="Add a company to group contacts and opportunities under one account."
            action={
              <Button onClick={() => router.push("/customers/companies/new")}>Add company</Button>
            }
          />
        )
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <DataTable
              className="crm-table"
              rows={data.items}
              onRowClick={(r: Company) => router.push(`/customers/companies/${r.id}`)}
              columns={[
                {
                  key: "name",
                  header: "Name",
                  render: (r: Company) => (
                    <span>
                      {/* Real link: keyboard reachable and middle-clickable; the
                          <tr> onClick still covers the rest of the row. */}
                      <Link href={`/customers/companies/${r.id}`} className="row-link">
                        <b style={{ display: "block" }}>{r.name}</b>
                      </Link>
                      {r.legal_name && (
                        <span
                          style={{
                            font: "400 12px/18px var(--font-ui)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {r.legal_name}
                        </span>
                      )}
                    </span>
                  ),
                },
                {
                  key: "industry",
                  header: "Industry",
                  render: (r: Company) => r.industry ?? "—",
                },
                {
                  key: "website",
                  header: "Website",
                  render: (r: Company) => r.website ?? "—",
                },
                {
                  key: "contact_count",
                  header: "Contacts",
                  align: "right",
                  render: (r: Company) => r.contact_count,
                },
                {
                  key: "actions",
                  header: "",
                  align: "right",
                  render: (r: Company) => (
                    <Button
                      size="sm"
                      variant="outline"
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
