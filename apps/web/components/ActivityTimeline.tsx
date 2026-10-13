"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, createActivity, listActivities, type Activity } from "@/lib/api";
import { MANUAL_ACTIVITY_TYPES, activityType } from "@/lib/activities";
import { Button, EmptyState, Tag } from "@/lib/ds";
import { Select } from "@/components/Select";
import { DetailSkeleton } from "@/components/Skeleton";

// The parent an activity attaches to. Exactly one is set by the caller (a detail
// tab). The server requires at least one of these on create.
export interface ActivityParent {
  contact_id?: string;
  company_id?: string;
  opportunity_id?: string;
}

// ── Presentational timeline (reusable) ──────────────────────────────────────
// Owns loading / error / empty / list states; the caller owns fetching so the
// same component serves both the detail tabs and the global /settings/activities page.
// System-type activities render read-only — there are no inline edit controls.
export function ActivityTimeline({
  activities,
  loading,
  error,
  onRetry,
  emptyTitle = "No activity yet",
  emptyBody = "Calls, emails, meetings and notes will appear here as they are logged.",
}: {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  if (loading) {
    return <DetailSkeleton label="Loading activity" />;
  }
  if (error !== null) {
    return (
      <EmptyState
        icon="las la-exclamation-circle"
        title="Could not load activity"
        body={`${error}. Check that the API is running, then try again.`}
        action={onRetry ? <Button onClick={onRetry}>Try again</Button> : undefined}
      />
    );
  }
  if (activities.length === 0) {
    return <EmptyState icon="las la-history" title={emptyTitle} body={emptyBody} />;
  }
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {activities.map((a) => (
        <TimelineRow key={a.id} activity={a} />
      ))}
    </ul>
  );
}

function TimelineRow({ activity }: { activity: Activity }) {
  const meta = activityType(activity.activity_type);
  return (
    <li
      style={{
        display: "flex",
        gap: 14,
        padding: "14px 0",
        borderBottom: "1px solid var(--outline-resting)",
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--surface-2, rgba(0,0,0,0.04))",
          color: "var(--text-secondary)",
        }}
      >
        <i className={meta.icon} style={{ fontSize: 18 }} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Tag tone={meta.tone} dot>
            {meta.label}
          </Tag>
          <span
            style={{
              font: "400 12px/18px var(--font-ui)",
              color: "var(--text-secondary)",
            }}
          >
            {new Date(activity.occurred_at).toLocaleString()}
          </span>
        </div>
        {activity.description && (
          <div
            style={{
              font: "400 14px/21px var(--font-ui)",
              color: "var(--text-primary)",
              marginTop: 4,
              whiteSpace: "pre-wrap",
            }}
          >
            {activity.description}
          </div>
        )}
        <div
          style={{
            font: "400 12px/18px var(--font-ui)",
            color: "var(--text-secondary)",
            marginTop: 4,
          }}
        >
          {activity.created_by_name ?? "Someone"}
        </div>
      </div>
    </li>
  );
}

// datetime-local wants "YYYY-MM-DDTHH:mm" in LOCAL time; toISOString gives UTC.
// Convert local-string → ISO by round-tripping through Date (which reads the
// string as local time).
function nowLocalInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Add-activity form ───────────────────────────────────────────────────────
// Manual types only (system types 403 on create). occurred_at defaults to now,
// backdatable. 422 → per-field messages. On success the caller re-fetches.
export function AddActivityForm({
  parent,
  onCreated,
}: {
  parent: ActivityParent;
  onCreated: (activity: Activity) => void;
}) {
  const [activity_type, setType] = useState(MANUAL_ACTIVITY_TYPES[0].value);
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(nowLocalInput);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!description.trim()) {
      setFieldErrors({ description: "A description is required." });
      setFormError(null);
      return;
    }
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const created = await createActivity({
        ...parent,
        activity_type,
        description: description.trim(),
        // datetime-local (local) → ISO UTC; omit if the user cleared it.
        occurred_at: occurredAt ? new Date(occurredAt).toISOString() : undefined,
      });
      setDescription("");
      setOccurredAt(nowLocalInput());
      onCreated(created);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 422) {
        setFieldErrors(err.fields ?? {});
        setFormError(err.fields ? null : err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      style={{ marginBottom: 24 }}
    >
      {formError && (
        <div role="alert" style={errorBanner}>
          {formError}
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <Select
          label="Type"
          value={activity_type}
          onChange={setType}
          style={{ width: 180, paddingTop: 0 }}
        >
          {MANUAL_ACTIVITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <label style={{ display: "block", width: 220, maxWidth: "100%" }}>
          <span className="crm-field-label">When</span>
          <input
            type="datetime-local"
            aria-label="Occurred at"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="crm-field-box"
          />
          {fieldErrors.occurred_at && <FieldError message={fieldErrors.occurred_at} />}
        </label>
      </div>
      <label style={{ display: "block", marginTop: 14 }}>
        <span className="crm-field-label">Description</span>
        <textarea
          aria-label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="crm-field-box"
          aria-invalid={fieldErrors.description ? true : undefined}
          style={{ marginTop: 8, minHeight: 76 }}
        />
        {fieldErrors.description && <FieldError message={fieldErrors.description} />}
      </label>
      {fieldErrors.activity_type && <FieldError message={fieldErrors.activity_type} />}
      <div style={{ marginTop: 14 }}>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Saving…" : "Log activity"}
        </Button>
      </div>
    </form>
  );
}

// ── Detail-tab panel ────────────────────────────────────────────────────────
// Fetch + add form + timeline for a single parent. Replaces the []-stub Activity
// tab on the contact and opportunity detail pages. New activities attach to the
// passed parent and prepend to the timeline (occurred_at DESC) on reload.
export function ActivityPanel({ parent }: { parent: ActivityParent }) {
  const [data, setData] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);

  const parentKey = parent.contact_id ?? parent.company_id ?? parent.opportunity_id ?? "";

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError(null);
    listActivities({ limit: 100, offset: 0, ...parent }, controller.signal)
      .then((page) => setData(page.items))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      });
    return () => controller.abort();
    // parentKey identifies the parent; reloads forces a refetch after an add.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentKey, reloads]);

  const retry = useCallback(() => setReloads((n) => n + 1), []);

  return (
    <div>
      <AddActivityForm parent={parent} onCreated={retry} />
      <ActivityTimeline
        activities={data ?? []}
        loading={data === null && error === null}
        error={error}
        onRetry={retry}
      />
    </div>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <div
      style={{
        marginTop: 6,
        font: "400 12px/18px var(--font-ui)",
        color: "var(--secondary-red)",
      }}
    >
      {message}
    </div>
  );
}

const errorBanner: React.CSSProperties = {
  marginBottom: 16,
  padding: "12px 16px",
  borderRadius: "var(--radius-md)",
  background: "rgba(196,86,78,0.10)",
  color: "var(--secondary-red)",
  font: "400 14px/21px var(--font-ui)",
};
