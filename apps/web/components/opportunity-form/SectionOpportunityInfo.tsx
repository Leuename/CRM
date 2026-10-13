"use client";

import { SERVICE_TERMS, SERVICE_TERM_LABELS } from "@/lib/api";
import type { LeadSource, SalesRepresentative } from "@/lib/api";
import { Input } from "@/lib/ds";
import { InfoTip } from "@/components/InfoTip";
import { Select } from "@/components/Select";
import { DateField, Section } from "./ui";
import { inputWide, type LeadType } from "./shared";

const LEAD_TYPES: {
  value: LeadType;
  label: string;
  hint: string;
  icon: string;
}[] = [
  {
    value: "INDIVIDUAL",
    label: "Individual",
    hint: "A person requesting services for themselves.",
    icon: "las la-user",
  },
  {
    value: "COMPANY",
    label: "Company",
    hint: "A person requesting services on behalf of a business.",
    icon: "las la-building",
  },
];

export function SectionOpportunityInfo({
  leadType,
  setLeadType,
  leadSources,
  sourceId,
  setSourceId,
  repOptions,
  salesReps,
  salesRepId,
  setSalesRepId,
  teamSize,
  setTeamSize,
  expectedCloseDate,
  setExpectedCloseDate,
  serviceTerm,
  setServiceTerm,
  fieldErrors,
}: {
  leadType: LeadType;
  setLeadType: (v: LeadType) => void;
  leadSources: LeadSource[] | null;
  sourceId: string;
  setSourceId: (v: string) => void;
  repOptions: SalesRepresentative[];
  salesReps: SalesRepresentative[] | null;
  salesRepId: string;
  setSalesRepId: (v: string) => void;
  teamSize: string;
  setTeamSize: (v: string) => void;
  expectedCloseDate: string;
  setExpectedCloseDate: (v: string) => void;
  serviceTerm: string;
  setServiceTerm: (v: string) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <Section
      index={1}
      title="Opportunity information"
      subtitle="Basic details about this opportunity"
    >
      <fieldset className="opp-lead-type">
        <legend className="crm-field-label">
          Lead type
          <InfoTip text="Decides what else this form asks for: a company lead is also asked for its company details." />
        </legend>
        <div className="opp-lead-type-cards">
          {LEAD_TYPES.map((t) => (
            // A real radio, wrapped by its label: the card is a presentation of
            // the control, never a substitute for it, so keyboard and screen
            // reader behaviour is the native one.
            <label
              key={t.value}
              className={`opp-lead-card${leadType === t.value ? " is-selected" : ""}`}
            >
              <input
                type="radio"
                name="lead_type"
                value={t.value}
                checked={leadType === t.value}
                onChange={() => setLeadType(t.value)}
              />
              <span className="opp-lead-card-icon" aria-hidden="true">
                <i className={t.icon} />
              </span>
              <span>
                <b>{t.label}</b>
                <em>{t.hint}</em>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* One shared flex row (see .opp-form-grid-2) rather than three, so on a
          wide form these five fields pack 3-4 to a row instead of leaving the
          third slot of every pair empty. */}
      <div className="opp-form-grid-2">
        <Select
          label="Lead source"
          hint="How did you hear about us?"
          value={sourceId}
          onChange={setSourceId}
          disabled={leadSources === null}
        >
          <option value="">{leadSources === null ? "Loading…" : "Select lead source"}</option>
          {(leadSources ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Select
          label="Sales representative"
          hint="Who is handling this opportunity?"
          value={salesRepId}
          onChange={setSalesRepId}
          disabled={salesReps === null}
        >
          <option value="">{salesReps === null ? "Loading…" : "None"}</option>
          {repOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.active ? "" : " (inactive)"}
            </option>
          ))}
        </Select>
        <Input
          label="Team size"
          aria-label="Team size"
          inputMode="numeric"
          placeholder="Start typing…"
          value={teamSize}
          onChange={(e) => setTeamSize(e.target.value)}
          state={fieldErrors.team_size ? "error" : "default"}
          hint={fieldErrors.team_size ?? "Estimated number of people."}
          style={inputWide}
        />
        <DateField
          label="Expected close date"
          value={expectedCloseDate}
          onChange={setExpectedCloseDate}
          hint="When do you expect to close this deal?"
        />

        <Select
          label="Service term"
          hint={fieldErrors.service_term ?? "Expected duration of the engagement."}
          state={fieldErrors.service_term ? "error" : "default"}
          value={serviceTerm}
          onChange={setServiceTerm}
          style={inputWide}
        >
          <option value="">Select service term</option>
          {SERVICE_TERMS.map((t) => (
            <option key={t} value={t}>
              {SERVICE_TERM_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>
    </Section>
  );
}
