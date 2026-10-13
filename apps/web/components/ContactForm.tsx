"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ApiError,
  createContact,
  updateContact,
  listCompanies,
  listLeadSources,
  type Company,
  type ContactDetail,
  type ContactInput,
  type DuplicateMatch,
  type LeadSource,
} from "@/lib/api";
import { CLIENT_STATUS_OPTIONS } from "@/lib/contacts";
import { Button, Card, Input, Tag } from "@/lib/ds";
import { Select } from "@/components/Select";

// A trailing-anchored, minimal email shape check. The server is the authority;
// this only spares an obvious round-trip and gives inline feedback.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fullName(c: DuplicateMatch): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "(no name)";
}

export function ContactForm({ initial }: { initial?: ContactDetail }) {
  const router = useRouter();
  const isEdit = initial !== undefined;

  const [first_name, setFirstName] = useState(initial?.first_name ?? "");
  const [last_name, setLastName] = useState(initial?.last_name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [client_status, setClientStatus] = useState(
    initial?.client_status ?? CLIENT_STATUS_OPTIONS[0].value,
  );
  const [company_id, setCompanyId] = useState(initial?.company_id ?? "");
  const [source_id, setSourceId] = useState(initial?.source_id ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [sources, setSources] = useState<LeadSource[] | null>(null);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listLeadSources(controller.signal)
      .then(setSources)
      .catch(() => setSources([])); // source is optional — degrade to no options
    // The Company field was a permanently DISABLED input reading "Company

    listCompanies({ limit: 100, offset: 0 }, controller.signal)
      .then((page) => setCompanies(page.items))
      .catch(() => setCompanies([])); // optional too — degrade to no options
    return () => controller.abort();
  }, []);

  function addTag() {
    const t = tagDraft.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft("");
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function submit(confirmDuplicate: boolean) {
    // Client-side email shape check — server still re-validates.
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      setFieldErrors({ email: "Enter a valid email address." });
      setFormError(null);
      setDuplicates(null);
      return;
    }

    const payload: ContactInput = {
      first_name: first_name.trim(),
      last_name: last_name.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      position: position.trim() || null,
      company_id: company_id || null,
      source_id: source_id || null,
      client_status,
      notes: notes.trim() || null,
      tags,
      confirm_duplicate: confirmDuplicate,
    };

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    setDuplicates(null);
    try {
      const saved = isEdit
        ? await updateContact(initial.id, payload)
        : await createContact(payload);
      router.push(`/customers/individuals/${saved.id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409 && err.code === "DUPLICATE_WARNING") {
          setDuplicates(err.duplicates ?? []);
        } else if (err.status === 422) {
          setFieldErrors(err.fields ?? {});
          setFormError(err.fields ? null : err.message);
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError(err instanceof Error ? err.message : "Unknown error");
      }
      setSubmitting(false);
    }
  }

  const inputWide = { width: "100%" } as const;

  return (
    // Full width, matching the opportunity form's fix: .opp-form-grid-2
    // already caps each field at 260–420px and flex-wraps, so the reclaimed
    // width goes into more fields per row, not stretched inputs.
    <Card style={{ width: "100%" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(false);
        }}
      >
        {formError && (
          <div
            role="alert"
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: "var(--radius-md)",
              background: "rgba(196,86,78,0.10)",
              color: "var(--secondary-red)",
              font: "400 14px/21px var(--font-ui)",
            }}
          >
            {formError}
          </div>
        )}

        {duplicates && (
          <div
            role="alert"
            style={{
              marginBottom: 20,
              padding: 16,
              borderRadius: "var(--radius-md)",
              background: "rgba(200,146,47,0.12)",
              font: "400 14px/21px var(--font-ui)",
            }}
          >
            <div style={{ font: "700 14px/21px var(--font-ui)", marginBottom: 8 }}>
              {duplicates.length === 1
                ? "A contact with this email already exists."
                : "Contacts with this email already exist."}
            </div>
            {duplicates.length > 0 && (
              <ul style={{ margin: "0 0 12px", paddingLeft: 18 }}>
                {duplicates.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/customers/individuals/${d.id}`}
                      style={{ color: "var(--primary)" }}
                    >
                      {fullName(d)}
                      {d.email ? ` — ${d.email}` : ""}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => void submit(true)}
            >
              Create anyway
            </Button>
          </div>
        )}

        <div className="opp-form-grid-2">
          <Input
            label="First name"
            aria-label="First name"
            required
            value={first_name}
            onChange={(e) => setFirstName(e.target.value)}
            state={fieldErrors.first_name ? "error" : "default"}
            hint={fieldErrors.first_name}
            style={inputWide}
          />
          <Input
            label="Last name"
            aria-label="Last name"
            value={last_name}
            onChange={(e) => setLastName(e.target.value)}
            state={fieldErrors.last_name ? "error" : "default"}
            hint={fieldErrors.last_name}
            style={inputWide}
          />
          <Input
            label="Email"
            aria-label="Email"
            type="email"
            placeholder="name@company.example"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            state={fieldErrors.email ? "error" : "default"}
            hint={fieldErrors.email}
            style={inputWide}
          />
          <Input
            label="Phone"
            aria-label="Phone"
            placeholder="000-000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            state={fieldErrors.phone ? "error" : "default"}
            hint={fieldErrors.phone}
            style={inputWide}
          />
          <Input
            label="Position"
            aria-label="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            state={fieldErrors.position ? "error" : "default"}
            hint={fieldErrors.position}
            style={inputWide}
          />
          <Select label="Company" value={company_id} onChange={setCompanyId}>
            <option value="">— None —</option>
            {(companies ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Status" value={client_status} onChange={setClientStatus}>
            {CLIENT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            label="Lead source"
            value={source_id}
            onChange={setSourceId}
            disabled={sources === null}
          >
            <option value="">{sources === null ? "Loading…" : "— None —"}</option>
            {(sources ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Tags — removable chips + add field */}
        <div style={{ marginTop: 28 }}>
          <span className="crm-field-label">Tags</span>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              margin: "10px 0",
            }}
          >
            {tags.length === 0 && (
              <span
                style={{
                  font: "400 13px/20px var(--font-ui)",
                  color: "var(--text-secondary)",
                }}
              >
                No tags yet.
              </span>
            )}
            {tags.map((t) => (
              <Tag key={t} tone="grey">
                {t}
                <button
                  type="button"
                  aria-label={`Remove tag ${t}`}
                  onClick={() => removeTag(t)}
                  style={{
                    marginLeft: 6,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "inherit",
                    font: "inherit",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </Tag>
            ))}
          </div>
          <Input
            label=""
            aria-label="Add a tag"
            placeholder="Type a tag and press Enter"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            style={{ width: 360, maxWidth: "100%" }}
          />
        </div>

        {/* Notes — DS gap: no Textarea. Capped for a readable measure, same as
            the opportunity form's notes field. */}
        <div style={{ marginTop: 28, maxWidth: 760 }}>
          <label style={{ display: "block" }}>
            <span className="crm-field-label">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="crm-field-box"
            />
          </label>
          {fieldErrors.notes && (
            <div
              style={{
                marginTop: 6,
                font: "400 12px/18px var(--font-ui)",
                color: "var(--secondary-red)",
              }}
            >
              {fieldErrors.notes}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 9, marginTop: 28 }}>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Add individual"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() =>
              router.push(
                isEdit ? `/customers/individuals/${initial.id}` : "/customers/individuals",
              )
            }
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
