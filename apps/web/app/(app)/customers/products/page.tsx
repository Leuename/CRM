"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { listProducts, type Product, type Page } from "@/lib/api";
import { Button, Card, DataTable, EmptyState, Input, Tag, Pagination } from "@/lib/ds";
import { Select } from "@/components/Select";
import { FilterButton, FilterDialog } from "@/components/FilterDialog";
import { useAuth } from "@/components/AuthProvider";
import { TableSkeleton } from "@/components/Skeleton";

const LIMIT = 25;

// CONVENIENCE-HIDE ONLY — NOT a security boundary.  `configure_products` is

// controls just declutters the UI for viewers; the server still enforces 403 on
// POST/PATCH regardless of what the browser shows.
function canConfigureProducts(role: string): boolean {
  return role === "ADMIN";
}

// active filter tri-state ↔ Select value.
type ActiveFilter = "all" | "active" | "inactive";
const ACTIVE_PARAM: Record<ActiveFilter, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
};

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canConfigure = canConfigureProducts(user.role);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  // Dialog-staged copies of the applied filters above. Open copies applied →
  // staged, Apply copies staged → applied, closing discards.
  const [dlgOpen, setDlgOpen] = useState(false);
  const [staged, setStaged] = useState<{
    category: string;
    active: ActiveFilter;
  }>({
    category: "",
    active: "all",
  });

  const [offset, setOffset] = useState(0);
  const [reloads, setReloads] = useState(0);
  const [data, setData] = useState<Page<Product> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasFilters = debouncedQ !== "" || category !== "" || activeFilter !== "all";

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Any filter change returns to the first page.
  useEffect(() => {
    setOffset(0);
  }, [debouncedQ, category, activeFilter]);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    listProducts(
      {
        limit: LIMIT,
        offset,
        q: debouncedQ || undefined,
        category: category || undefined,
        active: ACTIVE_PARAM[activeFilter],
      },
      controller.signal,
    )
      .then(setData)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      });
    return () => controller.abort();
  }, [debouncedQ, category, activeFilter, offset, reloads]);

  const retry = useCallback(() => setReloads((n) => n + 1), []);

  // Count of non-default filters, search excluded (it has its own inline box).
  const activeCount = [category !== "", activeFilter !== "all"].filter(Boolean).length;

  function clearDialogFilters() {
    setCategory("");
    setActiveFilter("all");
  }

  function clearFilters() {
    setQ("");
    setDebouncedQ("");
    clearDialogFilters();
  }

  // Select is populated from the loaded page's categories (plus the current
  // selection, so it survives a page where nothing matches). Swap for a
  // /products/categories endpoint if the list grows past one page of variety.
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of data?.items ?? []) if (p.category) set.add(p.category);
    if (category) set.add(category);
    return Array.from(set).sort();
  }, [data, category]);

  return (
    <Card
      title={data ? `All products · ${data.total}` : "All products"}
      action={
        canConfigure ? (
          <Button
            icon="las la-plus"
            size="sm"
            onClick={() => router.push("/customers/products/new")}
          >
            Add product
          </Button>
        ) : undefined
      }
      style={{ borderRadius: "var(--radius-card)" }}
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
        <Input
          label="Search"
          aria-label="Search products"
          icon="las la-search"
          placeholder="Name, category"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: 320, maxWidth: "100%" }}
        />
        <FilterButton
          activeCount={activeCount}
          onOpen={() => {
            setStaged({ category, active: activeFilter });
            setDlgOpen(true);
          }}
          onClearAll={clearDialogFilters}
        />
      </div>

      <FilterDialog
        open={dlgOpen}
        onApply={() => {
          setCategory(staged.category);
          setActiveFilter(staged.active);
          setDlgOpen(false);
        }}
        onReset={() => setStaged({ category: "", active: "all" })}
        onClose={() => setDlgOpen(false)}
      >
        <Select
          label="Category"
          value={staged.category}
          onChange={(v) => setStaged((s) => ({ ...s, category: v }))}
        >
          <option value="">All categories</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          value={staged.active}
          onChange={(v) => setStaged((s) => ({ ...s, active: v as ActiveFilter }))}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FilterDialog>

      {error !== null ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Products could not be loaded"
          body={`${error}. Check that the API is running, then try again.`}
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : data === null ? (
        <TableSkeleton label="Loading products" />
      ) : data.items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="las la-filter"
            title="No products match these filters"
            body="Try a different search — or clear the filters to see every product."
            action={<Button onClick={clearFilters}>Clear filters</Button>}
          />
        ) : offset > 0 ? (
          <EmptyState
            icon="las la-box"
            title="No products on this page"
            body="Go back to the first page to see the products that exist."
            action={<Button onClick={() => setOffset(0)}>First page</Button>}
          />
        ) : (
          <EmptyState
            icon="las la-box"
            title="No products yet"
            body={
              canConfigure
                ? "Add a product so it can be attached to opportunities and quotes."
                : "No products have been configured yet. Ask an administrator to add them."
            }
            action={
              canConfigure ? (
                <Button onClick={() => router.push("/customers/products/new")}>Add product</Button>
              ) : undefined
            }
          />
        )
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <DataTable
              className="crm-table"
              rows={data.items}
              onRowClick={
                canConfigure
                  ? (r: Product) => router.push(`/customers/products/${r.id}/edit`)
                  : undefined
              }
              columns={[
                {
                  key: "name",
                  header: "Name",
                  render: (r: Product) => <b>{r.name}</b>,
                },
                {
                  key: "category",
                  header: "Category",
                  render: (r: Product) => r.category ?? "—",
                },
                {
                  key: "default_price",
                  header: "Price",
                  align: "right",
                  // MONEY RULE: string shown as-is with its currency — no Number(),
                  // no formatting arithmetic.
                  render: (r: Product) =>
                    r.default_price === null ? "—" : `${r.currency} ${r.default_price}`,
                },
                {
                  key: "active",
                  header: "Status",
                  render: (r: Product) => (
                    <Tag tone={r.active ? "blue" : "grey"} dot>
                      {r.active ? "Active" : "Inactive"}
                    </Tag>
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
