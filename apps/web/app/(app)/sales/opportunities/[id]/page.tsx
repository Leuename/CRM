"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  archiveOpportunity,
  restoreOpportunity,
  changeStage,
  updateOpportunity,
  getOpportunityHistory,
  listLossReasons,
  listPipelineStages,
  listUsers,
  ApiError,
  type OpportunityDetail,
  type StageHistoryEntry,
  type LossReason,
  type PipelineStage,
  type UserRef,
  SERVICE_TERM_LABELS,
} from "@/lib/api";
import { formatMoney, semanticTone, stageTone } from "@/lib/opportunities";
import { useOpportunity } from "@/components/useOpportunity";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmDialog, type ConfirmState } from "@/components/ConfirmDialog";
import { ActivityPanel } from "@/components/ActivityTimeline";
import { Button, Card, EmptyState, Tabs, Tag } from "@/lib/ds";
import { Select } from "@/components/Select";
import { DetailSkeleton } from "@/components/Skeleton";
import { OpportunityFormHeader } from "@/components/opportunity-form/PageHeader";

// CONVENIENCE-HIDE ONLY — NOT a security boundary. The reassign control is shown
// to elevated roles to declutter the UI; the server enforces
// reassign_opportunity_owner and returns 403 regardless of what the browser
// shows. A non-elevated user who reaches the endpoint still gets 403.
function canSeeReassign(role: string): boolean {
  return role === "ADMIN" || role === "MANAGER";
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { state, reload } = useOpportunity(id);

  if (state.status === "loading") {
    return <DetailSkeleton label="Loading opportunity" />;
  }
  if (state.status === "notfound") {
    return (
      <div style={{ paddingTop: 28 }}>
        <EmptyState
          icon="las la-briefcase"
          title="Opportunity not found"
          body="This opportunity may have been removed."
          action={
            <Link href="/sales/opportunities">
              <Button>Back to opportunities</Button>
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
          title="Opportunity could not be loaded"
          body={`${state.message}. Check that the API is running, then try again.`}
          action={<Button onClick={reload}>Try again</Button>}
        />
      </div>
    );
  }

  return <OpportunityDetailView opportunity={state.opportunity} onChanged={reload} />;
}

function OpportunityDetailView({
  opportunity,
  onChanged,
}: {
  opportunity: OpportunityDetail;
  onChanged: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [users, setUsers] = useState<UserRef[]>([]);

  const isArchived = opportunity.archived_at !== null;

  useEffect(() => {
    const controller = new AbortController();
    listPipelineStages(controller.signal)
      .then(setStages)
      .catch(() => setStages([]));
    if (canSeeReassign(user.role)) {
      listUsers(controller.signal)
        .then(setUsers)
        .catch(() => setUsers([]));
    }
    return () => controller.abort();
  }, [user.role]);

  function toggleArchive() {
    const verb = isArchived ? "Restore" : "Archive";
    setActionError(null);
    setConfirm({
      message: `${verb} "${opportunity.title}"?`,
      confirmLabel: verb,
      run: async () => {
        setBusy(true);
        try {
          if (isArchived) await restoreOpportunity(opportunity.id);
          else await archiveOpportunity(opportunity.id);
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

  async function reassign(ownerId: string) {
    if (!ownerId || ownerId === opportunity.owner_id) return;
    setBusy(true);
    setActionError(null);
    try {
      await updateOpportunity(opportunity.id, { owner_id: ownerId });
      onChanged();
    } catch (err: unknown) {
      // Server is the authority: a non-permitted caller gets a clean 403 message.
      if (err instanceof ApiError && err.status === 403) {
        setActionError("You are not permitted to reassign this opportunity's owner.");
      } else {
        setActionError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ paddingTop: 28 }}>
      {/* The shared opportunity header puts this record under the section H1. */}
      <OpportunityFormHeader
        crumb={opportunity.title}
        title={opportunity.title}
        titleLevel={2}
        subtitle={
          <>
            {"Contact: "}
            <Link
              href={`/customers/individuals/${opportunity.primary_contact_id}`}
              style={{ color: "var(--primary)" }}
            >
              {opportunity.contact_name ?? "View contact"}
            </Link>
            {opportunity.company_id && (
              <>
                {" · Company: "}
                <Link
                  href={`/customers/companies/${opportunity.company_id}`}
                  style={{ color: "var(--primary)" }}
                >
                  {opportunity.company_name ?? "View company"}
                </Link>
              </>
            )}
            {` · Owner: ${opportunity.owner_name ?? "—"}`}
          </>
        }
        back={
          <Link href="/sales/opportunities" className="opp-page-back">
            <i className="las la-arrow-left" aria-hidden="true" />
            Back to opportunities
          </Link>
        }
      />

      <ConfirmDialog state={confirm} busy={busy} onClose={() => setConfirm(null)} />

      {actionError && (
        <div role="alert" style={errorBanner}>
          {actionError}
        </div>
      )}

      {/* Summary */}
      <Card padding={0} style={{ marginBottom: 16 }}>
        <div className="opp-detail-summary">
          <div className="opp-detail-tags">
            <Tag tone={stageTone(opportunity.stage_color)} dot>
              {opportunity.stage_name}
            </Tag>
            <Tag tone={semanticTone(opportunity.stage_semantic_type)}>
              {opportunity.stage_semantic_type}
            </Tag>
            {isArchived && <Tag tone="grey">Archived</Tag>}
            {/*  Q9: a reopened deal must not read identically to one that was
                never closed. Derived server-side from this deal's own stage
                history, so it survives every later ordinary stage move. */}
            {opportunity.reopened && <Tag tone="yellow">Reopened</Tag>}
          </div>

          <div className="opp-detail-revenue">
            <div className="opp-detail-label">Revenue</div>
            <div className="opp-detail-amount">
              {formatMoney(opportunity.total_revenue_inc_vat, opportunity.currency)}
            </div>
            {opportunity.total_revenue_inc_vat != null &&
              opportunity.total_revenue_inc_vat !== opportunity.total_revenue_ex_vat && (
                <div className="opp-detail-label">
                  incl. VAT · {formatMoney(opportunity.total_revenue_ex_vat, opportunity.currency)}{" "}
                  before VAT
                </div>
              )}
            <div className="opp-detail-actions">
              <Button
                size="sm"
                variant="outline"
                icon="las la-pen"
                onClick={() => router.push(`/sales/opportunities/${opportunity.id}/edit`)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void toggleArchive()}
              >
                {busy ? "Working…" : isArchived ? "Restore" : "Archive"}
              </Button>
            </div>
          </div>
        </div>

        {/* Stage control + reassign */}
        <div className="opp-detail-controls">
          <StageControl
            opportunity={opportunity}
            stages={stages}
            onChanged={onChanged}
            setActionError={setActionError}
          />
          {canSeeReassign(user.role) && (
            <div style={{ minWidth: 220 }}>
              <Select
                label="Reassign owner"
                value=""
                onChange={(v) => void reassign(v)}
                disabled={busy || users.length === 0}
              >
                <option value="">
                  {users.length === 0 ? "Loading…" : "— Select a new owner —"}
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Card
        action={
          <Tabs
            className="crm-tabs"
            items={["Overview", "Products", "History", "Activity"]}
            value={tab}
            onChange={setTab}
            ariaLabel="Opportunity sections"
            idBase="opportunity-detail"
          />
        }
      >
        <div
          role="tabpanel"
          id="opportunity-detail-panel"
          aria-labelledby={`opportunity-detail-tab-${tab.toLowerCase()}`}
          tabIndex={0}
        >
          {tab === "Overview" && <OverviewTab opportunity={opportunity} />}
          {tab === "Products" && <ProductsTab opportunity={opportunity} />}
          {tab === "History" && <HistoryTab opportunityId={opportunity.id} />}
          {tab === "Activity" && <ActivityPanel parent={{ opportunity_id: opportunity.id }} />}
        </div>
      </Card>
    </div>
  );
}

function StageControl({
  opportunity,
  stages,
  onChanged,
  setActionError,
}: {
  opportunity: OpportunityDetail;
  stages: PipelineStage[];
  onChanged: () => void;
  setActionError: (m: string | null) => void;
}) {
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [lossReasonId, setLossReasonId] = useState("");
  const [lossNote, setLossNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  //  Q8: the picker offers ACTIVE reasons only — a retired one may still be
  // carried by a deal that already has it, but it cannot be newly assigned (the
  // server refuses that with a 422 regardless of what this list holds).
  // `required` is the ADMIN setting, read at runtime because it is a database
  // row and not a constant.
  const [lossReasons, setLossReasons] = useState<LossReason[]>([]);
  const [lossRequired, setLossRequired] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listLossReasons(true, controller.signal)
      .then((res) => {
        setLossReasons(res.items);
        setLossRequired(res.required);
      })
      // A failed lookup must not kill the stage control: the picker stays empty
      // and the server still enforces the rule, returning a 422 the caller sees.
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const targetStage = stages.find((s) => s.id === target);
  const isLost = targetStage?.semantic_type === "LOST";

  async function submit() {
    if (!target) return;
    // PRE-VALIDATION ONLY, for a better message. The server enforces this in the
    // stage-transition service and returns 422 naming loss_reason_id whatever
    // the browser decides here.
    if (isLost && lossRequired && !lossReasonId) {
      setLocalError("Choose a loss reason before marking this opportunity as Lost.");
      return;
    }
    setSaving(true);
    setLocalError(null);
    setActionError(null);
    try {
      await changeStage(opportunity.id, {
        to_stage_id: target,
        reason: reason.trim() || null,
        // Sent ONLY on a Lost transition: the server refuses either field on any
        // other target rather than silently dropping it.
        loss_reason_id: isLost ? lossReasonId || null : null,
        loss_note: isLost ? lossNote.trim() || null : null,
      });
      setTarget("");
      setReason("");
      setLossReasonId("");
      setLossNote("");
      onChanged();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        setActionError("You are not permitted to change this opportunity's stage.");
      } else if (err instanceof ApiError && err.status === 422 && err.fields?.loss_reason_id) {
        setLocalError(err.fields.loss_reason_id);
      } else {
        setActionError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 260 }}>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <Select label="Move to stage" value={target} onChange={setTarget} style={{ minWidth: 200 }}>
          <option value="">— Select a stage —</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id} disabled={s.id === opportunity.stage_id}>
              {s.name}
              {s.id === opportunity.stage_id ? " (current)" : ""}
            </option>
          ))}
        </Select>
        <Button type="button" size="sm" disabled={saving || !target} onClick={() => void submit()}>
          {saving ? "Saving…" : "Change stage"}
        </Button>
      </div>
      {isLost && (
        <div style={{ marginTop: 10, maxWidth: 420 }}>
          <Select
            label={`Loss reason${lossRequired ? " (required)" : " (optional)"}`}
            value={lossReasonId}
            onChange={setLossReasonId}
          >
            <option value="">— Select a reason —</option>
            {lossReasons.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <label style={{ display: "block", marginTop: 10 }}>
            <span className="crm-field-label">Loss note (optional)</span>
            <input
              aria-label="Loss note"
              value={lossNote}
              onChange={(e) => setLossNote(e.target.value)}
              className="crm-field-box crm-field-box--sm"
              style={{ marginTop: 4, width: "100%" }}
            />
          </label>
        </div>
      )}
      {target && (
        <label style={{ display: "block", marginTop: 10 }}>
          <span className="crm-field-label">Reason (optional)</span>
          <input
            aria-label="Stage change reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="crm-field-box crm-field-box--sm"
            style={{ maxWidth: 420, marginTop: 4 }}
          />
        </label>
      )}
      {localError && (
        <div
          style={{
            marginTop: 6,
            font: "400 12px/18px var(--font-ui)",
            color: "var(--secondary-red)",
          }}
        >
          {localError}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="opp-detail-label">{label}</div>
      <div className="opp-detail-value">{value}</div>
    </div>
  );
}

function OverviewTab({ opportunity }: { opportunity: OpportunityDetail }) {
  return (
    <div>
      <div className="opp-detail-grid">
        <Detail label="Stage" value={opportunity.stage_name} />
        <Detail label="Status" value={opportunity.stage_semantic_type} />
        <Detail label="Owner" value={opportunity.owner_name ?? "—"} />
        <Detail label="Expected close" value={opportunity.expected_close_date ?? "—"} />
        <Detail
          label="Closed at"
          value={opportunity.closed_at ? new Date(opportunity.closed_at).toLocaleString() : "—"}
        />
        {/*  Q8. Kept on the record after a reopen: "why this deal was lost"
            is history, and blanking it so the deal reads cleanly is the rewrite
            the database guardrail forbids. */}
        <Detail
          label="Loss reason"
          value={opportunity.loss_reason_name ?? (opportunity.loss_note ? "Not categorised" : "—")}
        />
        <Detail label="Loss note" value={opportunity.loss_note ?? "—"} />
        <Detail
          label="Team size"
          value={opportunity.team_size != null ? String(opportunity.team_size) : "—"}
        />

        {hasServiceSchedule(opportunity) && (
          <>
            <Detail
              label="Service start"
              value={joinDateTime(opportunity.service_start_date, opportunity.service_start_time)}
            />
            <Detail
              label="Service end"
              value={joinDateTime(opportunity.service_end_date, opportunity.service_end_time)}
            />
          </>
        )}

        {(opportunity.service_term || opportunity.service_term_text) && (
          <Detail label="Service term" value={serviceTermLabel(opportunity)} />
        )}
        {/* Attribution, not ownership — deliberately shown next to Owner so the
            two are legible as different things. */}
        <Detail label="Sales representative" value={opportunity.sales_representative_name ?? "—"} />
        <Detail
          label="Selling price"
          value={formatMoney(opportunity.selling_price_ex_vat, opportunity.currency)}
        />
        <Detail
          label="Discount"
          value={opportunity.discount_percent != null ? `${opportunity.discount_percent}%` : "—"}
        />

        <Detail
          label="Revenue before VAT"
          value={formatMoney(opportunity.total_revenue_ex_vat, opportunity.currency)}
        />
        <Detail
          label="Revenue incl. VAT"
          value={formatMoney(opportunity.total_revenue_inc_vat, opportunity.currency)}
        />
        <Detail label="Created" value={new Date(opportunity.created_at).toLocaleString()} />
        <Detail label="Updated" value={new Date(opportunity.updated_at).toLocaleString()} />
      </div>
      <div style={{ marginTop: 24 }}>
        <div className="opp-detail-label">Notes</div>
        <div className="opp-detail-value" style={{ whiteSpace: "pre-wrap" }}>
          {opportunity.notes?.trim() ? opportunity.notes : "No notes yet."}
        </div>
      </div>
    </div>
  );
}

function joinDateTime(date: string | null, time: string | null): string {
  if (!date && !time) return "—";
  return [date, time].filter(Boolean).join(" ");
}

function hasServiceSchedule(o: OpportunityDetail): boolean {
  return Boolean(
    o.service_start_date || o.service_end_date || o.service_start_time || o.service_end_time,
  );
}

// The enumeration when 008 could map it, otherwise the original string. Showing
// the raw text is the point: it is the only record of what the deal actually
// said, and nothing may overwrite it.
function serviceTermLabel(o: OpportunityDetail): string {
  if (o.service_term) return SERVICE_TERM_LABELS[o.service_term];
  return o.service_term_text ?? "—";
}

function lineServiceTerm(l: OpportunityDetail["products"][number]): string {
  return l.service_term ? SERVICE_TERM_LABELS[l.service_term] : "—";
}

// "" when the line states no window, so the caller can skip the row entirely
// rather than print a lone em-dash under every product name.
function lineServiceSchedule(l: OpportunityDetail["products"][number]): string {
  const from = joinDateTime(l.start_date, l.start_time);
  const to = joinDateTime(l.end_date, l.end_time);
  if (from === "—" && to === "—") return "";
  return `${from} → ${to}`;
}

function ProductsTab({ opportunity }: { opportunity: OpportunityDetail }) {
  if (opportunity.products.length === 0) {
    return (
      <EmptyState
        icon="las la-box"
        title="No product lines"
        body="This opportunity has no itemised products. Its revenue is derived from the header selling price."
      />
    );
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="opp-detail-table">
        <thead>
          <tr>
            {["Product", "Qty", "Unit price", "Disc %", "VAT", "Line total"].map((h, i) => (
              <th key={h} className={i >= 1 ? "opp-detail-num" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {opportunity.products.map((l) => (
            <tr key={l.id}>
              <td>
                {l.product_name}

                {lineServiceSchedule(l) && (
                  <div className="opp-detail-label">{lineServiceSchedule(l)}</div>
                )}
                {l.preferred_schedule && (
                  <div className="opp-detail-label">Preferred schedule: {l.preferred_schedule}</div>
                )}

                {l.service_term && (
                  <div className="opp-detail-label">Service term: {lineServiceTerm(l)}</div>
                )}
              </td>
              <td className="opp-detail-num">{l.quantity}</td>
              {/* MONEY RULE: strings as-is; masked → "—". */}
              <td className="opp-detail-num">{formatMoney(l.unit_price, opportunity.currency)}</td>
              <td className="opp-detail-num">
                {l.discount_percent != null ? `${l.discount_percent}%` : "—"}
              </td>

              <td className="opp-detail-num">{l.vat_exempt ? "Exempt" : "12%"}</td>
              <td className="opp-detail-num">
                {formatMoney(l.line_total_inc_vat, opportunity.currency)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className="opp-detail-num">
              Total revenue incl. VAT
            </td>
            <td className="opp-detail-num">
              {formatMoney(opportunity.total_revenue_inc_vat, opportunity.currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function HistoryTab({ opportunityId }: { opportunityId: string }) {
  const [state, setState] = useState<{ items: StageHistoryEntry[] } | { error: string } | null>(
    null,
  );
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState(null);
    getOpportunityHistory(opportunityId, controller.signal)
      .then((items) => setState({ items }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          error: err instanceof Error ? err.message : "Unknown error",
        });
      });
    return () => controller.abort();
  }, [opportunityId, reloads]);

  if (state === null) return <TabLoading label="Loading history" />;
  if ("error" in state) {
    return (
      <EmptyState
        icon="las la-exclamation-circle"
        title="Could not load history"
        body={`${state.error}. Check that the API is running, then try again.`}
        action={<Button onClick={() => setReloads((n) => n + 1)}>Try again</Button>}
      />
    );
  }
  if (state.items.length === 0) {
    return (
      <EmptyState
        icon="las la-history"
        title="No stage history yet"
        body="Stage transitions will appear here as the opportunity moves through the pipeline."
      />
    );
  }
  return (
    <ul className="opp-detail-hist">
      {state.items.map((h) => (
        <li key={h.id}>
          <div className="opp-detail-hist-title">
            {h.from_stage_name
              ? `${h.from_stage_name} → ${h.to_stage_name}`
              : `Created in ${h.to_stage_name}`}
          </div>
          <div className="opp-detail-label" style={{ marginTop: 2 }}>
            {h.changed_by_name ?? "Someone"} · {new Date(h.changed_at).toLocaleString()}
          </div>
          {h.reason && (
            <div className="opp-detail-value" style={{ marginTop: 4 }}>
              {h.reason}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function TabLoading({ label }: { label: string }) {
  return <DetailSkeleton label={label} />;
}

const errorBanner: React.CSSProperties = {
  marginBottom: 16,
  padding: "12px 16px",
  borderRadius: "var(--radius-md)",
  background: "rgba(196,86,78,0.10)",
  color: "var(--secondary-red)",
  font: "400 14px/21px var(--font-ui)",
};
