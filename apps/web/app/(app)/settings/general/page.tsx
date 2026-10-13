"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  createSalesRepresentative,
  listLossReasons,
  listSalesRepresentatives,
  setLossReasonRequired,
  updateSalesRepresentative,
  type LossReason,
  type SalesRepresentative,
} from "@/lib/api";
import { Button, Card, EmptyState, Input, Switch, Tag } from "@/lib/ds";
import { useAuth } from "@/components/AuthProvider";
import { TableSkeleton } from "@/components/Skeleton";

// CONVENIENCE-HIDE ONLY — NOT a security boundary.  configure_sales_reps is
// ADMIN-only under default-deny; the server returns 403 on POST/PATCH whatever
// the browser renders. Hiding the controls just declutters the page for viewers.
function canConfigureReps(role: string): boolean {
  return role === "ADMIN";
}

// CONVENIENCE-HIDE ONLY — NOT a security boundary either.  configure_settings
// is ADMIN-only under default-deny; PATCH /settings/loss-reason-required returns
// 403 for every other role whatever this function says.
function canConfigureSettings(role: string): boolean {
  return role === "ADMIN";
}

export default function GeneralSettingsPage() {
  return (
    <>
      <LossReasonSetting />
      <SalesRepresentatives />
    </>
  );
}

/**
 * The one application-wide setting there is ( Q8): whether a loss reason must
 * be chosen when a deal moves to Lost.
 *
 * It lives on this EXISTING page rather than a new route, and it is one switch —
 * not a settings framework. The list of loss reasons itself has no editor here
 * on purpose: rows are edited directly until the owner asks for a screen. The
 * count is shown so an administrator turning the switch ON can see there is
 * something to choose from.
 */
function LossReasonSetting() {
  const { user } = useAuth();
  const canConfigure = canConfigureSettings(user.role);

  const [required, setRequired] = useState<boolean | null>(null);
  const [reasons, setReasons] = useState<LossReason[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listLossReasons(true, controller.signal)
      .then((res) => {
        setRequired(res.required);
        setReasons(res.items);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(err instanceof Error ? err.message : "Unknown error");
      });
    return () => controller.abort();
  }, []);

  async function toggle(next: boolean) {
    setError(null);
    setBusy(true);
    try {
      // PATCH-and-reflect: the server's answer is what renders, never the
      // optimistic value — a 403 or a rejected write must not leave the switch
      // showing a state the database does not hold.
      setRequired(await setLossReasonRequired(next));
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        setError("You are not permitted to change this setting.");
      } else if (err instanceof ApiError && err.status === 422) {
        setError(err.fields?.required ?? err.message);
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Losing a deal" style={{ borderRadius: "var(--radius-card)", marginBottom: 16 }}>
      <p
        style={{
          font: "400 14px/21px var(--font-ui)",
          color: "var(--text-secondary)",
          marginTop: 0,
        }}
      >
        Require a loss reason when a deal is marked Lost. With this off, a deal can still be lost
        without one and reports show a &ldquo;reason not recorded&rdquo; share rather than
        pretending completeness.
      </p>

      {error !== null && (
        <div role="alert" style={bannerStyle}>
          {error}
        </div>
      )}

      {loadError !== null ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="This setting could not be loaded"
          body={`${loadError}. Check that the API is running, then reload the page.`}
        />
      ) : required === null ? (
        <TableSkeleton label="Loading loss reason setting" />
      ) : (
        <>
          <Switch
            label="A loss reason is required"
            checked={required}
            disabled={busy || !canConfigure}
            onChange={(e) => void toggle(e.target.checked)}
          />
          <div
            style={{
              marginTop: 6,
              font: "400 12px/18px var(--font-ui)",
              color: "var(--text-secondary)",
            }}
          >
            {reasons?.length ?? 0} reason{(reasons?.length ?? 0) === 1 ? "" : "s"} available to
            choose from.
          </div>
        </>
      )}
    </Card>
  );
}

function SalesRepresentatives() {
  const { user } = useAuth();
  const canConfigure = canConfigureReps(user.role);

  const [reps, setReps] = useState<SalesRepresentative[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);

  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setReps(null);
    setLoadError(null);
    // No `active` filter: Settings is the config view and must show retired
    // representatives too, or an admin cannot bring one back.
    listSalesRepresentatives(undefined, controller.signal)
      .then(setReps)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(err instanceof Error ? err.message : "Unknown error");
      });
    return () => controller.abort();
  }, [reloads]);

  const retry = useCallback(() => setReloads((n) => n + 1), []);

  function reportError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 422 && err.fields?.name) {
        setNameError(err.fields.name);
        return;
      }
      if (err.status === 403) {
        setFormError("You are not permitted to change sales representatives.");
        return;
      }
      setFormError(err.message);
      return;
    }
    setFormError(err instanceof Error ? err.message : "Unknown error");
  }

  async function addRep() {
    const name = newName.trim();
    setNameError(null);
    setFormError(null);
    if (!name) {
      setNameError("Enter a name.");
      return;
    }
    setBusy(true);
    try {
      // sort_order puts the newcomer last rather than fighting the existing order.
      const created = await createSalesRepresentative({
        name,
        sort_order: (reps ?? []).reduce((max, r) => Math.max(max, r.sort_order), 0) + 1,
      });
      setReps((rows) => [...(rows ?? []), created]);
      setNewName("");
    } catch (err: unknown) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(rep: SalesRepresentative) {
    setFormError(null);
    setBusy(true);
    try {
      const saved = await updateSalesRepresentative(rep.id, {
        active: !rep.active,
      });
      setReps((rows) => (rows ?? []).map((r) => (r.id === saved.id ? saved : r)));
    } catch (err: unknown) {
      reportError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title={reps ? `Sales representatives · ${reps.length}` : "Sales representatives"}
      style={{ borderRadius: "var(--radius-card)" }}
    >
      <p
        style={{
          font: "400 14px/21px var(--font-ui)",
          color: "var(--text-secondary)",
          marginTop: 0,
        }}
      >
        Who is credited with a deal. This is attribution only — it grants no permissions and is
        separate from the deal&apos;s owner. Deactivating someone removes them from new deals and
        keeps their name on past ones.
      </p>

      {formError !== null && (
        <div role="alert" style={bannerStyle}>
          {formError}
        </div>
      )}

      {canConfigure && (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <Input
            label="Add a representative"
            aria-label="New representative name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addRep();
              }
            }}
            state={nameError ? "error" : "default"}
            hint={nameError ?? undefined}
            style={{ minWidth: 260 }}
          />
          <Button icon="las la-plus" onClick={() => void addRep()} disabled={busy}>
            {busy ? "Working…" : "Add"}
          </Button>
        </div>
      )}

      {loadError !== null ? (
        <EmptyState
          icon="las la-exclamation-circle"
          title="Sales representatives could not be loaded"
          body={`${loadError}. Check that the API is running, then try again.`}
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : reps === null ? (
        <TableSkeleton label="Loading sales representatives" />
      ) : reps.length === 0 ? (
        <EmptyState
          icon="las la-user-tie"
          title="No sales representatives yet"
          body={
            canConfigure
              ? "Add someone so deals can be credited."
              : "None have been configured yet. Ask an administrator to add them."
          }
        />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {reps.map((rep) => (
            <li key={rep.id} style={rowStyle}>
              <span
                style={{
                  font: "400 14px/21px var(--font-ui)",
                  color: "var(--text-primary)",
                }}
              >
                {rep.name}
              </span>
              <Tag tone={rep.active ? "blue" : "grey"}>{rep.active ? "Active" : "Inactive"}</Tag>
              {canConfigure && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void toggleActive(rep)}
                >
                  {rep.active ? "Deactivate" : "Reactivate"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 0",
  borderBottom: "1px solid var(--outline-resting)",
};

const bannerStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: "12px 16px",
  borderRadius: "var(--radius-md)",
  background: "rgba(196,86,78,0.10)",
  color: "var(--secondary-red)",
  font: "400 14px/21px var(--font-ui)",
};
