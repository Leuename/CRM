"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  createCompany,
  updateCompany,
  type CompanyDetail,
  type CompanyInput,
} from "@/lib/api";
import { INVALID_EXTERNAL_URL_MESSAGE, normalizeExternalUrl } from "@/lib/external-url";
import { Button, Card, Input } from "@/lib/ds";

// No duplicate-warning flow (COMP3): company names are not globally unique.
// billing_address is omitted here (COMP2) — the detail page displays it if present.
export function CompanyForm({ initial }: { initial?: CompanyDetail }) {
  const router = useRouter();
  const isEdit = initial !== undefined;

  const [name, setName] = useState(initial?.name ?? "");
  const [legal_name, setLegalName] = useState(initial?.legal_name ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");

  const [employeeCount, setEmployeeCount] = useState(
    initial?.employee_count != null ? String(initial.employee_count) : "",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    // Client-side required check — server still re-validates (authority).
    if (!name.trim()) {
      setFieldErrors({ name: "Name is required." });
      setFormError(null);
      return;
    }

    const normalizedWebsite = normalizeExternalUrl(website);
    if (website.trim() && !normalizedWebsite) {
      setFieldErrors({ website: INVALID_EXTERNAL_URL_MESSAGE });
      setFormError(null);
      return;
    }

    const payload: CompanyInput = {
      name: name.trim(),
      legal_name: legal_name.trim() || null,
      industry: industry.trim() || null,
      website: normalizedWebsite,
      phone: phone.trim() || null,
      // A count, not money: it goes to the API as a number.
      employee_count: employeeCount.trim() ? Number(employeeCount) : null,
      notes: notes.trim() || null,
    };

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateCompany(initial.id, payload)
        : await createCompany(payload);
      router.push(`/customers/companies/${saved.id}`);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 422) {
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
          void submit();
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

        <div className="opp-form-grid-2">
          <Input
            label="Name"
            aria-label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            state={fieldErrors.name ? "error" : "default"}
            hint={fieldErrors.name}
            style={inputWide}
          />
          <Input
            label="Legal name"
            aria-label="Legal name"
            value={legal_name}
            onChange={(e) => setLegalName(e.target.value)}
            state={fieldErrors.legal_name ? "error" : "default"}
            hint={fieldErrors.legal_name}
            style={inputWide}
          />
          <Input
            label="Industry"
            aria-label="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            state={fieldErrors.industry ? "error" : "default"}
            hint={fieldErrors.industry}
            style={inputWide}
          />
          <Input
            label="Website"
            aria-label="Website"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            state={fieldErrors.website ? "error" : "default"}
            hint={fieldErrors.website}
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
            label="Employees"
            aria-label="Employees"
            inputMode="numeric"
            placeholder="optional"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            state={fieldErrors.employee_count ? "error" : "default"}
            hint={fieldErrors.employee_count}
            style={inputWide}
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
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Add company"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() =>
              router.push(isEdit ? `/customers/companies/${initial.id}` : "/customers/companies")
            }
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
