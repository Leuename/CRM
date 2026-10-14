"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import type { Contact, DuplicateMatch } from "@/lib/api";
import { Button, Input } from "@/lib/ds";
import { Section } from "./ui";
import {
  fieldErrStyle,
  fullName,
  inputWide,
  type ContactMode,
  type LeadType,
  type NewCompanyDraft,
  type NewContactDraft,
} from "./shared";

// The sentinel the dropdown uses for "New". Not a UUID, and never submitted —
// picking it switches the section into the inline-create branch instead.
export const NEW_CONTACT_VALUE = "__new__";

export function SectionContact({
  isEdit,
  leadType,
  contacts,
  contactMode,
  contactId,
  onPickContact,
  newContact,
  patchNewContact,
  newCompany,
  patchNewCompany,
  duplicates,
  onConfirmDuplicate,
  submitting,
  fieldErrors,
}: {
  isEdit: boolean;
  leadType: LeadType;
  contacts: Contact[] | null;
  contactMode: ContactMode;
  contactId: string;
  onPickContact: (v: string) => void;
  newContact: NewContactDraft;
  patchNewContact: (patch: Partial<NewContactDraft>) => void;
  newCompany: NewCompanyDraft;
  patchNewCompany: (patch: Partial<NewCompanyDraft>) => void;
  duplicates: DuplicateMatch[] | null;
  onConfirmDuplicate: () => void;
  submitting: boolean;
  fieldErrors: Record<string, string>;
}) {
  const selectValue = contactMode === "new" ? NEW_CONTACT_VALUE : contactId;
  const contactErrorId = useId();
  const contactSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (fieldErrors.primary_contact_id) contactSelectRef.current?.focus();
  }, [fieldErrors]);

  return (
    <Section index={2} title="Contact" subtitle="Who is your main point of contact?">
      <div className="opp-contact-row">
        {/* The tall box of the mock: the accessible label stays "Contact" (the
            e2e hooks and screen readers read it), while the box itself carries
            the visible title and its "Search and select contact" sub-line. */}
        <label className="crm-field opp-contact-box">
          <span className="sr-only">Contact</span>
          <span className="crm-field-control">
            <select
              ref={contactSelectRef}
              className="crm-field-box opp-contact-select"
              value={selectValue}
              aria-invalid={fieldErrors.primary_contact_id ? true : undefined}
              aria-describedby={fieldErrors.primary_contact_id ? contactErrorId : undefined}
              disabled={contacts === null}
              onChange={(e) => onPickContact(e.target.value)}
            >
              <option value="">{contacts === null ? "Loading…" : "Select a contact"}</option>
              {/* Create-only: OpportunityUpdate carries no new_contact, so
                  offering "New" on an edit would be offering a 422. An existing
                  deal can be re-pointed at another existing contact, nothing
                  more. */}
              {!isEdit && <option value={NEW_CONTACT_VALUE}>New contact</option>}
              {(contacts ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {fullName(c)}
                  {c.company_name ? ` · ${c.company_name}` : ""}
                </option>
              ))}
            </select>
            <span className="opp-contact-sub" aria-hidden="true">
              Search and select contact
            </span>
            <i className="las la-angle-down crm-field-chevron" aria-hidden="true" />
          </span>
        </label>
        {/* Create-only, like the sentinel option it mirrors. */}
        {!isEdit && (
          <Button
            type="button"
            variant="outline"
            icon="las la-plus"
            onClick={() => onPickContact(NEW_CONTACT_VALUE)}
          >
            New contact
          </Button>
        )}
      </div>
      {contacts !== null && contacts.length === 0 && (
        <p className="opp-form-note">
          {isEdit
            ? "No contacts available."
            : "No contacts yet — choose “New contact” to create one with this deal."}
        </p>
      )}
      {fieldErrors.primary_contact_id && (
        <div id={contactErrorId} style={fieldErrStyle}>
          {fieldErrors.primary_contact_id}
        </div>
      )}

      {contactMode === "new" && (
        <div className="opp-inline-customer">
          {duplicates && (
            <div role="alert" className="opp-dup-warning">
              <div
                style={{
                  font: "700 14px/21px var(--font-ui)",
                  marginBottom: 8,
                }}
              >
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
              {/* Warn, never reject: the rep decides. Domain guardrail  — a
                  duplicate warns rather than destructively merges or refuses. */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={onConfirmDuplicate}
              >
                Create anyway
              </Button>
            </div>
          )}

          <h3 className="opp-form-subhead">Contact information</h3>
          <div className="opp-form-grid-2">
            <Input
              label="First name"
              aria-label="First name"
              value={newContact.first_name}
              onChange={(e) => patchNewContact({ first_name: e.target.value })}
              state={fieldErrors["new_contact.first_name"] ? "error" : "default"}
              hint={fieldErrors["new_contact.first_name"]}
              style={inputWide}
            />
            <Input
              label="Last name"
              aria-label="Last name"
              value={newContact.last_name}
              onChange={(e) => patchNewContact({ last_name: e.target.value })}
              style={inputWide}
            />
            <Input
              label="Email"
              aria-label="Email"
              type="email"
              value={newContact.email}
              onChange={(e) => patchNewContact({ email: e.target.value })}
              state={fieldErrors["new_contact.email"] ? "error" : "default"}
              hint={fieldErrors["new_contact.email"]}
              style={inputWide}
            />
            <Input
              label="Number"
              aria-label="Number"
              inputMode="tel"
              value={newContact.phone}
              onChange={(e) => patchNewContact({ phone: e.target.value })}
              state={fieldErrors["new_contact.phone"] ? "error" : "default"}
              hint={fieldErrors["new_contact.phone"]}
              style={inputWide}
            />
            <Input
              label="Job title"
              aria-label="Job title"
              value={newContact.position}
              onChange={(e) => patchNewContact({ position: e.target.value })}
              state={fieldErrors["new_contact.position"] ? "error" : "default"}
              hint={fieldErrors["new_contact.position"]}
              style={inputWide}
            />
          </div>

          {/* Lead type drives this and only this: an Individual is not asked for
              company details. What the server stores is unchanged either way —
              a deal with no company simply has none (). */}
          {leadType === "COMPANY" && (
            <>
              <h3 className="opp-form-subhead">Company information</h3>
              <div className="opp-form-grid-2">
                <Input
                  label="Company name"
                  aria-label="Company name"
                  value={newCompany.name}
                  onChange={(e) => patchNewCompany({ name: e.target.value })}
                  state={fieldErrors["new_company.name"] ? "error" : "default"}
                  hint={fieldErrors["new_company.name"]}
                  style={inputWide}
                />
                <Input
                  label="Industry"
                  aria-label="Industry"
                  value={newCompany.industry}
                  onChange={(e) => patchNewCompany({ industry: e.target.value })}
                  state={fieldErrors["new_company.industry"] ? "error" : "default"}
                  hint={fieldErrors["new_company.industry"]}
                  style={inputWide}
                />
                <Input
                  label="Website"
                  aria-label="Website"
                  placeholder="optional"
                  value={newCompany.website}
                  onChange={(e) => patchNewCompany({ website: e.target.value })}
                  state={fieldErrors["new_company.website"] ? "error" : "default"}
                  hint={fieldErrors["new_company.website"]}
                  style={inputWide}
                />
                <Input
                  label="Employees"
                  aria-label="Employees"
                  inputMode="numeric"
                  placeholder="optional"
                  value={newCompany.employee_count}
                  onChange={(e) => patchNewCompany({ employee_count: e.target.value })}
                  state={fieldErrors["new_company.employee_count"] ? "error" : "default"}
                  hint={fieldErrors["new_company.employee_count"]}
                  style={inputWide}
                />
              </div>

              <h3 className="opp-form-subhead">Company address</h3>
              <div className="opp-form-grid-2">
                <Input
                  label="Street"
                  aria-label="Street"
                  placeholder="optional"
                  value={newCompany.street}
                  onChange={(e) => patchNewCompany({ street: e.target.value })}
                  style={inputWide}
                />
                <Input
                  label="City"
                  aria-label="City"
                  placeholder="optional"
                  value={newCompany.city}
                  onChange={(e) => patchNewCompany({ city: e.target.value })}
                  style={inputWide}
                />
                <Input
                  label="Province"
                  aria-label="Province"
                  placeholder="optional"
                  value={newCompany.province}
                  onChange={(e) => patchNewCompany({ province: e.target.value })}
                  style={inputWide}
                />
                <Input
                  label="Postal code"
                  aria-label="Postal code"
                  placeholder="optional"
                  value={newCompany.postal_code}
                  onChange={(e) => patchNewCompany({ postal_code: e.target.value })}
                  style={inputWide}
                />
              </div>
            </>
          )}
        </div>
      )}

      {contactMode === "existing" && contactId && (
        <p className="opp-form-note">
          {contacts?.find((c) => c.id === contactId)?.company_name
            ? `Company: ${contacts.find((c) => c.id === contactId)?.company_name}`
            : "This contact has no company on file."}
        </p>
      )}
    </Section>
  );
}
