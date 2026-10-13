"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  archiveContact,
  restoreContact,
  getContactOpportunities,
  listLeadSources,
  type ContactDetail,
  type OpportunityRef,
} from "@/lib/api";
import { clientStatus } from "@/lib/contacts";
import { useContact } from "@/components/useContact";
import { ConfirmDialog, type ConfirmState } from "@/components/ConfirmDialog";
import { ActivityPanel } from "@/components/ActivityTimeline";
import { Avatar, Button, Card, EmptyState, Tabs, Tag } from "@/lib/ds";
import { DetailSkeleton } from "@/components/Skeleton";

function fullName(c: { first_name: string; last_name: string | null }): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ");
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, reload } = useContact(id);

  if (state.status === "loading") {
    return <DetailSkeleton label="Loading individual" />;
  }
  if (state.status === "notfound") {
    return (
      <div style={{ paddingTop: 28 }}>
        <EmptyState
          icon="las la-user-slash"
          title="Individual not found"
          body="This individual may have been removed."
          action={
            <Link href="/customers/individuals">
              <Button>Back to individuals</Button>
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
          title="Individual could not be loaded"
          body={`${state.message}. Check that the API is running, then try again.`}
          action={<Button onClick={reload}>Try again</Button>}
        />
      </div>
    );
  }

  return <ContactDetailView contact={state.contact} onChanged={reload} />;
}

function ContactDetailView({
  contact,
  onChanged,
}: {
  contact: ContactDetail;
  onChanged: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);

  const isArchived = contact.archived_at !== null;
  const status = clientStatus(contact.client_status);

  useEffect(() => {
    if (!contact.source_id) return;
    const controller = new AbortController();
    listLeadSources(controller.signal)
      .then((sources) =>
        setSourceName(sources.find((s) => s.id === contact.source_id)?.name ?? null),
      )
      .catch(() => setSourceName(null));
    return () => controller.abort();
  }, [contact.source_id]);

  function toggleArchive() {
    const verb = isArchived ? "Restore" : "Archive";
    setActionError(null);
    setConfirm({
      message: `${verb} ${fullName(contact) || "this individual"}?`,
      confirmLabel: verb,
      run: async () => {
        setBusy(true);
        try {
          if (isArchived) await restoreContact(contact.id);
          else await archiveContact(contact.id);
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
          href="/customers/individuals"
          style={{
            font: "400 14px/21px var(--font-ui)",
            color: "var(--text-secondary)",
          }}
        >
          ← Back to individuals
        </Link>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          {/* Hidden while archived: the API refuses to create an opportunity for
              an archived contact (opportunities.py, reject_archived_contact), so
              offering the button here would be offering a 422. */}
          {!isArchived && (
            <Button
              size="sm"
              variant="outline"
              icon="las la-briefcase"
              onClick={() => router.push(`/sales/opportunities/new?contact=${contact.id}`)}
            >
              Add opportunity
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            icon="las la-pen"
            onClick={() => router.push(`/customers/individuals/${contact.id}/edit`)}
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
          <Avatar name={fullName(contact)} size={120} radius={16} />
          <div style={{ font: "700 20px/32px var(--font-ui)", marginTop: 14 }}>
            {fullName(contact)}
          </div>
          {contact.position && (
            <div
              style={{
                font: "400 14px/21px var(--font-ui)",
                color: "var(--text-secondary)",
              }}
            >
              {contact.position}
            </div>
          )}
          {contact.company_name && (
            <div
              style={{
                font: "400 14px/21px var(--font-ui)",
                color: "var(--text-secondary)",
              }}
            >
              {contact.company_name}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            <Tag tone={status.tone} dot>
              {status.label}
            </Tag>
            {isArchived && <Tag tone="grey">Archived</Tag>}
          </div>
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
              icon="lar la-envelope"
              disabled={!contact.email}
              onClick={() => contact.email && (window.location.href = `mailto:${contact.email}`)}
            >
              Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon="las la-phone"
              disabled={!contact.phone}
              onClick={() => contact.phone && (window.location.href = `tel:${contact.phone}`)}
            >
              Call
            </Button>
          </div>
          {contact.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: 18,
              }}
            >
              {contact.tags.map((t) => (
                <Tag key={t} tone="grey">
                  {t}
                </Tag>
              ))}
            </div>
          )}
        </Card>

        {/* Main panel */}
        <Card
          action={
            <Tabs
              className="crm-tabs"
              items={["Overview", "Opportunities", "Activity"]}
              value={tab}
              onChange={setTab}
            />
          }
        >
          {tab === "Overview" && (
            <OverviewTab contact={contact} status={status.label} sourceName={sourceName} />
          )}
          {tab === "Opportunities" && (
            <OpportunitiesTab contactId={contact.id} canAdd={!isArchived} />
          )}
          {tab === "Activity" && <ActivityPanel parent={{ contact_id: contact.id }} />}
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

function OverviewTab({
  contact,
  status,
  sourceName,
}: {
  contact: ContactDetail;
  status: string;
  sourceName: string | null;
}) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Detail label="Email" value={contact.email ?? "—"} />
        <Detail label="Phone" value={contact.phone ?? "—"} />
        <Detail label="Position" value={contact.position ?? "—"} />
        <Detail label="Company" value={contact.company_name ?? "—"} />
        <Detail label="Status" value={status} />
        <Detail label="Lead source" value={sourceName ?? (contact.source_id ? "—" : "—")} />
        <Detail label="Created" value={new Date(contact.created_at).toLocaleString()} />
        <Detail label="Updated" value={new Date(contact.updated_at).toLocaleString()} />
      </div>
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
          {contact.notes?.trim() ? contact.notes : "No notes yet."}
        </div>
      </div>
    </div>
  );
}

function OpportunitiesTab({ contactId, canAdd }: { contactId: string; canAdd: boolean }) {
  const [state, setState] = useState<{ items: OpportunityRef[] } | { error: string } | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState(null);
    getContactOpportunities(contactId, controller.signal)
      .then((items) => setState({ items }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });
    return () => controller.abort();
  }, [contactId, reloads]);

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
        body={
          canAdd
            ? "Use “Add opportunity” above to start one for this individual."
            : "This individual is archived. Restore them to add an opportunity."
        }
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
