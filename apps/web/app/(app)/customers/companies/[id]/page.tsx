"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  archiveCompany,
  restoreCompany,
  getCompanyContacts,
  getCompanyOpportunities,
  type CompanyDetail,
  type Contact,
  type OpportunityRef,
} from "@/lib/api";
import { normalizeExternalUrl } from "@/lib/external-url";
import { useCompany } from "@/components/useCompany";
import { ConfirmDialog, type ConfirmState } from "@/components/ConfirmDialog";
import { Avatar, Button, Card, EmptyState, Tabs, Tag } from "@/lib/ds";
import { DetailSkeleton } from "@/components/Skeleton";

function contactName(c: Contact): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "(no name)";
}

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, reload } = useCompany(id);

  if (state.status === "loading") {
    return <DetailSkeleton label="Loading company" />;
  }
  if (state.status === "notfound") {
    return (
      <div style={{ paddingTop: 28 }}>
        <EmptyState
          icon="las la-building"
          title="Company not found"
          body="This company may have been removed."
          action={
            <Link href="/customers/companies">
              <Button>Back to companies</Button>
            </Link>
          }
        />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div style={{ paddingTop: 28 }}>
        <EmptyState
          icon="las la-exclamation-circle"
          title="Company could not be loaded"
          body={`${state.message}. Check that the API is running, then try again.`}
          action={<Button onClick={reload}>Try again</Button>}
        />
      </div>
    );
  }

  return <CompanyDetailView company={state.company} onChanged={reload} />;
}

function CompanyDetailView({
  company,
  onChanged,
}: {
  company: CompanyDetail;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const isArchived = company.archived_at !== null;
  const websiteHref = normalizeExternalUrl(company.website);

  function toggleArchive() {
    const verb = isArchived ? "Restore" : "Archive";
    setActionError(null);
    setConfirm({
      message: `${verb} ${company.name || "this company"}?`,
      confirmLabel: verb,
      run: async () => {
        setBusy(true);
        try {
          if (isArchived) await restoreCompany(company.id);
          else await archiveCompany(company.id);
          setConfirm(null);
          onChanged();
        } catch (err: unknown) {
          setConfirm(null);
          setActionError(err instanceof Error ? err.message : "Unknown error");
        } finally {
          setBusy(false);
        }
      },
    });
  }

  return (
    <div style={{ paddingTop: 28 }}>
      {/* Back link and record actions share one header row so the identity rail
          and the main panel below start at the same top edge. */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/customers/companies"
          style={{
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-secondary)",
          }}
        >
          ← Back to companies
        </Link>
        <div style={{ display: "flex", gap: 9 }}>
          <Button
            size="sm"
            variant="outline"
            icon="las la-pen"
            onClick={() => router.push(`/customers/companies/${company.id}/edit`)}
          >
            Edit
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void toggleArchive()}>
            {busy ? "Working…" : isArchived ? "Restore" : "Archive"}
          </Button>
        </div>
      </div>

      <ConfirmDialog state={confirm} busy={busy} onClose={() => setConfirm(null)} />

      {actionError && (
        <div
          role="alert"
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            background: "rgba(196,86,78,0.10)",
            color: "var(--secondary-red)",
            font: "400 14px/21px var(--font-ui)",
          }}
        >
          {actionError}
        </div>
      )}

      <div className="detail-layout">
        {/* Identity rail */}
        <Card style={{ textAlign: "center" }}>
          <Avatar name={company.name} size={120} radius={16} />
          <div style={{ font: "700 20px/32px var(--font-ui)", marginTop: 14 }}>{company.name}</div>
          {company.industry && (
            <div
              style={{
                font: "400 14px/21px var(--font-ui)",
                color: "var(--text-secondary)",
              }}
            >
              {company.industry}
            </div>
          )}
          {isArchived && (
            <div style={{ marginTop: 14 }}>
              <Tag tone="grey">Archived</Tag>
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 9,
              justifyContent: "center",
              marginTop: 18,
              flexWrap: "wrap",
            }}
          >
            <Button
              size="sm"
              icon="las la-globe"
              disabled={!websiteHref}
              onClick={() =>
                websiteHref && window.open(websiteHref, "_blank", "noopener,noreferrer")
              }
            >
              Website
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon="las la-phone"
              disabled={!company.phone}
              onClick={() => company.phone && (window.location.href = `tel:${company.phone}`)}
            >
              Call
            </Button>
          </div>
          <div
            style={{
              font: "400 12px/18px var(--font-ui)",
              color: "var(--text-secondary)",
              marginTop: 18,
            }}
          >
            {company.contact_count} contact
            {company.contact_count === 1 ? "" : "s"}
          </div>
        </Card>

        {/* Main panel */}
        <Card
          action={
            <Tabs
              className="crm-tabs"
              items={["Overview", "Contacts", "Opportunities"]}
              value={tab}
              onChange={setTab}
              ariaLabel="Company sections"
              idBase="company-detail"
            />
          }
        >
          <div
            role="tabpanel"
            id="company-detail-panel"
            aria-labelledby={`company-detail-tab-${tab.toLowerCase()}`}
            tabIndex={0}
          >
            {tab === "Overview" && <OverviewTab company={company} />}
            {tab === "Contacts" && <ContactsTab companyId={company.id} />}
            {tab === "Opportunities" && <OpportunitiesTab companyId={company.id} />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          font: "400 12px/18px var(--font-ui)",
          color: "var(--text-secondary)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          font: "400 14px/21px var(--font-ui)",
          color: "var(--text-primary)",
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// billing_address is open JSONB (COMP2): render its own key/value entries when
// it's an object, else the raw value. No structured editor until billing (Phase 3).
function formatBillingAddress(addr: Record<string, unknown>): string {
  const parts = Object.entries(addr)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${String(v)}`);
  return parts.length ? parts.join("\n") : JSON.stringify(addr);
}

function OverviewTab({ company }: { company: CompanyDetail }) {
  const websiteHref = normalizeExternalUrl(company.website);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Detail label="Legal name" value={company.legal_name ?? "—"} />
        <Detail label="Industry" value={company.industry ?? "—"} />
        <Detail
          label="Website"
          value={
            websiteHref ? (
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--primary)" }}
              >
                {company.website}
              </a>
            ) : (
              company.website || "—"
            )
          }
        />
        <Detail label="Phone" value={company.phone ?? "—"} />
        <Detail label="Created" value={new Date(company.created_at).toLocaleString()} />
        <Detail label="Updated" value={new Date(company.updated_at).toLocaleString()} />
      </div>

      {company.billing_address && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              font: "400 12px/18px var(--font-ui)",
              color: "var(--text-secondary)",
            }}
          >
            Billing address
          </div>
          <div
            style={{
              font: "400 14px/21px var(--font-ui)",
              color: "var(--text-primary)",
              marginTop: 4,
              whiteSpace: "pre-wrap",
            }}
          >
            {formatBillingAddress(company.billing_address)}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <div
          style={{
            font: "400 12px/18px var(--font-ui)",
            color: "var(--text-secondary)",
          }}
        >
          Notes
        </div>
        <div
          style={{
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-primary)",
            marginTop: 4,
            whiteSpace: "pre-wrap",
          }}
        >
          {company.notes?.trim() ? company.notes : "No notes yet."}
        </div>
      </div>
    </div>
  );
}

function ContactsTab({ companyId }: { companyId: string }) {
  const [state, setState] = useState<{ items: Contact[] } | { error: string } | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState(null);
    getCompanyContacts(companyId, controller.signal)
      .then((items) => setState({ items }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });
    return () => controller.abort();
  }, [companyId, reloads]);

  if (state === null) {
    return <TabLoading label="Loading contacts" />;
  }
  if ("error" in state) {
    return (
      <EmptyState
        icon="las la-exclamation-circle"
        title="Could not load contacts"
        body={`${state.error}. Check that the API is running, then try again.`}
        action={<Button onClick={() => setReloads((n) => n + 1)}>Try again</Button>}
      />
    );
  }
  if (state.items.length === 0) {
    return (
      <EmptyState
        icon="las la-user-friends"
        title="No contacts yet"
        body="Contacts linked to this company will appear here."
      />
    );
  }
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {state.items.map((c) => (
        <li key={c.id} style={{ borderBottom: "1px solid var(--outline-resting)" }}>
          <Link
            href={`/customers/individuals/${c.id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 0",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <Avatar name={contactName(c)} size={38} />
            <span>
              <b
                style={{
                  display: "block",
                  font: "700 14px/21px var(--font-ui)",
                  color: "var(--text-primary)",
                }}
              >
                {contactName(c)}
              </b>
              <span
                style={{
                  font: "400 12px/18px var(--font-ui)",
                  color: "var(--text-secondary)",
                }}
              >
                {[c.position, c.email].filter(Boolean).join(" · ") || "—"}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function OpportunitiesTab({ companyId }: { companyId: string }) {
  const [state, setState] = useState<{ items: OpportunityRef[] } | { error: string } | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState(null);
    getCompanyOpportunities(companyId, controller.signal)
      .then((items) => setState({ items }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });
    return () => controller.abort();
  }, [companyId, reloads]);

  if (state === null) {
    return <TabLoading label="Loading opportunities" />;
  }
  if ("error" in state) {
    return (
      <EmptyState
        icon="las la-exclamation-circle"
        title="Could not load opportunities"
        body={`${state.error}. Check that the API is running, then try again.`}
        action={<Button onClick={() => setReloads((n) => n + 1)}>Try again</Button>}
      />
    );
  }
  if (state.items.length === 0) {
    return (
      <EmptyState
        icon="las la-briefcase"
        title="No opportunities yet"
        body="Opportunities linked to this company will appear here. Create one from Sales › Opportunities and choose a contact at this company."
      />
    );
  }
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {state.items.map((o) => (
        <li
          key={o.id}
          style={{
            padding: "12px 0",
            borderBottom: "1px solid var(--outline-resting)",
          }}
        >
          <div style={{ font: "700 14px/21px var(--font-ui)" }}>{o.title}</div>
          <div
            style={{
              font: "400 12px/18px var(--font-ui)",
              color: "var(--text-secondary)",
            }}
          >
            {o.total_revenue_inc_vat != null
              ? `${o.total_revenue_inc_vat} ${o.currency ?? ""}`.trim()
              : "—"}
            {o.expected_close_date ? ` · closes ${o.expected_close_date}` : ""}
          </div>
        </li>
      ))}
    </ul>
  );
}

function TabLoading({ label }: { label: string }) {
  return <DetailSkeleton label={label} />;
}
