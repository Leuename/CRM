import {
  ApiError,
  type DuplicateMatch,
  type OpportunityCreateInput,
  type OpportunityDetail,
  type OpportunityLineInput,
} from "@/lib/api";
import { INVALID_EXTERNAL_URL_MESSAGE, normalizeExternalUrl } from "@/lib/external-url";

// MONEY RULE: money values are kept as the raw strings the user typed and
// submitted as strings (never numbers). These regexes are display-side format
// guards only; the server re-validates the decimals and is the authority.
export const AMOUNT_RE = /^\d+(\.\d{1,2})?$/; // non-negative, up to 2 decimals
export const QTY_RE = /^\d+(\.\d{1,4})?$/; // non-negative quantity

// Fields whose <Input> renders `hint`, so a 422 against them is already visible
// beside the box. Everything else needs the banner — see the 422 handler.
export const HINTED_FIELDS = new Set([
  "team_size",
  "selling_price_ex_vat",
  "discount_percent",
  "new_contact.first_name",
  "new_contact.email",
  "new_contact.phone",
  "new_contact.position",
  "new_company.name",
  "new_company.industry",
  "new_company.website",
]);

// never sent. The company relationship the server stores is unchanged
// () — an Individual lead simply isn't asked for company details.
export type LeadType = "INDIVIDUAL" | "COMPANY";

// existing deal can only be re-pointed at a contact that already exists.
export type ContactMode = "existing" | "new";

// What the "New" option collects. Mirrors ContactCreate/CompanyCreate minus
// client_status, which this form has no business setting: the server defaults it

export interface NewContactDraft {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
}

export interface NewCompanyDraft {
  name: string;
  industry: string;
  website: string;

  // asked for either — that split is exactly what Lead Type is for.
  employee_count: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
}

export const emptyNewContact: NewContactDraft = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  position: "",
};

export const emptyNewCompany: NewCompanyDraft = {
  name: "",
  industry: "",
  website: "",
  employee_count: "",
  street: "",
  city: "",
  province: "",
  postal_code: "",
};

// is not an address, and storing one would make "has an address" untestable.
export function billingAddressOf(c: NewCompanyDraft): Record<string, string> | null {
  const entries = Object.entries({
    street: c.street.trim(),
    city: c.city.trim(),
    province: c.province.trim(),
    postal_code: c.postal_code.trim(),
  }).filter(([, v]) => v !== "");
  return entries.length === 0 ? null : Object.fromEntries(entries);
}

// Widened past Contact so a DuplicateMatch — which carries only the name and
// email — can be labelled by the same helper as a full record.
export function fullName(c: { first_name: string; last_name?: string | null }): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "(no name)";
}

// A product line in the editor. Money/qty are raw strings — never coerced for
// submission. `key` is a stable React identity only.
export interface LineRow {
  key: string;
  product_id: string;
  quantity: string;
  unit_price: string;
  // a prior form update. True only while unit_price holds a default WE seeded and the rep has
  // not edited it. A hand-entered price (this false) is never overwritten by a
  // product change, even when it happens to equal the previous product's
  // default — the value-equality heuristic this replaced could not tell the two
  // apart. Presentation-only: buildLines() never sends it.
  priceSeeded: boolean;
  discount_percent: string;

  // percent input stays disabled until this is ticked. Unticking clears the
  // percent, so a disabled value can never ride along into the payload.
  discount_on: boolean;
  // vat_exempt is the exception to VAT applying by default. No service_term: it

  vat_exempt: boolean;
  notes: string;

  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  preferred_schedule: string;
}

let LINE_SEQ = 0;
export function emptyLine(): LineRow {
  return {
    key: `line-${LINE_SEQ++}`,
    product_id: "",
    quantity: "1",
    unit_price: "",
    priceSeeded: false,
    discount_percent: "",
    discount_on: false,
    vat_exempt: false,
    notes: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    preferred_schedule: "",
  };
}

// a prior form update. Deciding a line's price when its product changes. Pure, so the money
// rule is unit-testable away from React state. A price is ours to overwrite
// only when the box is empty or holds a default we seeded that the rep never
// edited; a hand-entered price is kept, even one equal to some product's
// default. When we do seed, mark it seeded — but seeding an empty default (a
// product with no default price) leaves nothing seeded.
export function seedPriceOnProductChange(
  row: Pick<LineRow, "unit_price" | "priceSeeded">,
  nextDefault: string,
): Pick<LineRow, "unit_price" | "priceSeeded"> {
  const ours = row.priceSeeded || row.unit_price.trim() === "";
  if (!ours) return { unit_price: row.unit_price, priceSeeded: false };
  return { unit_price: nextDefault, priceSeeded: nextDefault.trim() !== "" };
}

export function lineFromDetail(l: OpportunityDetail["products"][number]): LineRow {
  const disc = l.discount_percent ?? "";
  return {
    key: `line-${LINE_SEQ++}`,
    product_id: l.product_id,
    quantity: l.quantity ?? "1",
    unit_price: l.unit_price ?? "",
    // A saved record's price is the record's, not a fresh seed of ours, so a
    // later product change must never overwrite it.
    priceSeeded: false,
    discount_percent: disc,
    // A stored non-zero discount opens the checkbox, so an edit shows the
    // number that is actually on the record rather than hiding it behind an
    // unticked box the user never sees.
    discount_on: disc.trim() !== "" && Number(disc) > 0,
    vat_exempt: l.vat_exempt,
    notes: l.notes ?? "",
    start_date: l.start_date ?? "",
    // <input type="time"> wants HH:MM; the API returns HH:MM:SS.
    start_time: (l.start_time ?? "").slice(0, 5),
    end_date: l.end_date ?? "",
    end_time: (l.end_time ?? "").slice(0, 5),
    preferred_schedule: l.preferred_schedule ?? "",
  };
}

export function seedServiceSchedule(rows: LineRow[], initial: OpportunityDetail): LineRow[] {
  const hasLegacy =
    initial.service_start_date ||
    initial.service_end_date ||
    initial.service_start_time ||
    initial.service_end_time;
  if (!hasLegacy || rows.length === 0) return rows;
  const [first, ...rest] = rows;
  const untouched = !first.start_date && !first.start_time && !first.end_date && !first.end_time;
  if (!untouched) return rows;
  return [
    {
      ...first,
      start_date: initial.service_start_date ?? "",
      start_time: (initial.service_start_time ?? "").slice(0, 5),
      end_date: initial.service_end_date ?? "",
      end_time: (initial.service_end_time ?? "").slice(0, 5),
    },
    ...rest,
  ];
}

const PREVIEW_VAT_RATE = 0.12;

function displaySubtotal(
  quantity: string,
  unitPrice: string,
  discountPercent: string,
): number | null {
  if (unitPrice.trim() === "") return null;
  const q = Number(quantity || "0");
  const p = Number(unitPrice);
  const d = Number(discountPercent || "0");
  if (!Number.isFinite(q) || !Number.isFinite(p) || !Number.isFinite(d)) return null;
  return q * p * (1 - d / 100);
}

// The same preview, grossed up. Still display-only and still never submitted —
// the server rounds per line in Decimal and its answer is the one that is
// stored, so a cent of disagreement here is expected and harmless.
export function displaySubtotalIncVat(line: LineRow): number | null {
  const net = displaySubtotal(line.quantity, line.unit_price, line.discount_percent);
  if (net === null) return null;
  return line.vat_exempt ? net : net * (1 + PREVIEW_VAT_RATE);
}

// DISPLAY-ONLY grand total estimate — sums the per-line preview subtotals.
// Never submitted; the server owns the authoritative total.
export function grandEstimate(lines: LineRow[]): number {
  let total = 0;
  for (const l of lines) {
    const sub = displaySubtotalIncVat(l);
    if (sub !== null) total += sub;
  }
  return total;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION AND PAYLOAD BUILDING. Pure, so every rule below is testable away
// from React state and the orchestrator keeps only the wiring.

// Everything the rules below read off the form. One bag rather than a dozen
// positional arguments — validation and payload building want almost the same
// set, so they share it.
export interface FormValues {
  leadType: LeadType;
  contactMode: ContactMode;
  contactId: string;
  newContact: NewContactDraft;
  newCompany: NewCompanyDraft;
  lines: LineRow[];
  sellingPrice: string;
  discountPercent: string;
  dealDiscountOn: boolean;
  dealVatExempt: boolean;
  teamSize: string;
  expectedCloseDate: string;
  serviceTerm: string;
  salesRepId: string;
  notes: string;
}

export function validateForm(v: FormValues): Record<string, string> {
  const errs: Record<string, string> = {};
  if (v.contactMode === "existing") {
    if (!v.contactId) errs.primary_contact_id = "Select a contact, or create a new one.";
  } else if (!v.newContact.first_name.trim()) {
    errs["new_contact.first_name"] = "A first name is required.";
  }
  if (v.contactMode === "new" && v.leadType === "COMPANY" && !v.newCompany.name.trim()) {
    errs["new_company.name"] = "A company name is required for a company lead.";
  }
  if (
    v.contactMode === "new" &&
    v.leadType === "COMPANY" &&
    v.newCompany.website.trim() &&
    !normalizeExternalUrl(v.newCompany.website)
  ) {
    errs["new_company.website"] = INVALID_EXTERNAL_URL_MESSAGE;
  }
  // The deal-level price only exists while there are no lines, so it is only
  // worth validating there — see SectionProductLine.
  if (v.lines.length === 0) {
    if (v.sellingPrice.trim() && !AMOUNT_RE.test(v.sellingPrice.trim())) {
      errs.selling_price_ex_vat = "Enter a non-negative amount, up to 2 decimals.";
    }
    if (v.dealDiscountOn && v.discountPercent.trim() && !AMOUNT_RE.test(v.discountPercent.trim())) {
      errs.discount_percent = "Enter a percentage between 0 and 100.";
    }
  }
  for (const l of v.lines) {
    if (l.quantity.trim() && !QTY_RE.test(l.quantity.trim())) {
      errs.products = "A line quantity is not a valid number.";
    }
    if (l.unit_price.trim() && !AMOUNT_RE.test(l.unit_price.trim())) {
      errs.products = "A line unit price is not a valid amount.";
    }
    if (l.discount_on && l.discount_percent.trim() && !AMOUNT_RE.test(l.discount_percent.trim())) {
      errs.products = "A line discount is not a valid percentage.";
    }
  }
  return errs;
}

// Lines with a chosen product become payload rows. Money/qty submitted as
// strings (or null). line_total is NEVER sent — the server computes it.
export function buildLines(lines: LineRow[]): OpportunityLineInput[] {
  return lines
    .filter((l) => l.product_id)
    .map((l) => ({
      product_id: l.product_id,
      quantity: l.quantity.trim() || "1",
      unit_price: l.unit_price.trim() || null,
      // An unticked checkbox is a zero, not an omission: the server defaults
      // discount_percent to 0 and this keeps the two agreeing.
      discount_percent: l.discount_on ? l.discount_percent.trim() || "0" : "0",
      vat_exempt: l.vat_exempt,
      notes: l.notes.trim() || null,
      start_date: l.start_date || null,
      start_time: l.start_time || null,
      end_date: l.end_date || null,
      end_time: l.end_time || null,
      preferred_schedule: l.preferred_schedule.trim() || null,
    }));
}

export function commonFields(v: FormValues) {
  return {
    team_size: v.teamSize.trim() ? Number(v.teamSize) : null,
    expected_close_date: v.expectedCloseDate || null,
    service_term: (v.serviceTerm || null) as OpportunityCreateInput["service_term"],
    sales_representative_id: v.salesRepId || null,
    ...(v.lines.length > 0
      ? {}
      : {
          selling_price_ex_vat: v.sellingPrice.trim() || null,
          discount_percent: v.dealDiscountOn ? v.discountPercent.trim() || "0" : "0",
          vat_exempt: v.dealVatExempt,
        }),
    notes: v.notes.trim() || null,
    products: buildLines(v.lines),
  };
}

export function buildCreatePayload(
  v: FormValues,
  ctx: {
    sourceId: string;
    confirmDuplicate: boolean;

    selectedContactCompanyId: string | null;
  },
): OpportunityCreateInput {
  if (v.contactMode !== "new") {
    return {
      primary_contact_id: v.contactId,
      company_id: ctx.selectedContactCompanyId,
      ...commonFields(v),
    };
  }
  return {
    new_contact: {
      first_name: v.newContact.first_name.trim(),
      last_name: v.newContact.last_name.trim() || null,
      email: v.newContact.email.trim() || null,
      phone: v.newContact.phone.trim() || null,
      position: v.newContact.position.trim() || null,
      source_id: ctx.sourceId || null,
      confirm_duplicate: ctx.confirmDuplicate,
    },
    // No company_id alongside new_contact — the API refuses the pair so a
    // contact and its deal can never disagree about which company this is.
    ...(v.leadType === "COMPANY" && v.newCompany.name.trim()
      ? {
          new_company: {
            name: v.newCompany.name.trim(),
            industry: v.newCompany.industry.trim() || null,
            website: normalizeExternalUrl(v.newCompany.website),
            employee_count: v.newCompany.employee_count.trim()
              ? Number(v.newCompany.employee_count)
              : null,
            billing_address: billingAddressOf(v.newCompany),
          },
        }
      : {}),
    ...commonFields(v),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ERROR READING

// One follow-up request failed after something was already saved. `forbidden`
// names what the 403 was about, since "not permitted" alone tells the user
// nothing about which of the two writes was refused.
export function apiErrorMessage(err: unknown, forbidden: string): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return forbidden;
    if (err.status === 422) return Object.values(err.fields ?? {}).join(" ") || err.message;
    return err.message;
  }
  return err instanceof Error ? err.message : "Unknown error";
}

export interface SubmitErrorState {
  /** Undefined leaves the current warning standing — a 422 on the confirm
   *  attempt must not silently drop the duplicate list it was answering. */
  duplicates?: DuplicateMatch[];
  fieldErrors: Record<string, string>;
  lineError: string | null;
  formError: string | null;
}

// A failed save, read into the four pieces of state the banner and hints show.
export function errorToFormState(err: unknown): SubmitErrorState {
  if (!(err instanceof ApiError)) {
    return {
      fieldErrors: {},
      lineError: null,
      formError: err instanceof Error ? err.message : "Unknown error",
    };
  }
  if (err.status === 409 && err.code === "DUPLICATE_WARNING") {
    // Warn, allow confirm-to-proceed, never destructively merge ().
    return { duplicates: err.duplicates ?? [], fieldErrors: {}, lineError: null, formError: null };
  }
  if (err.status === 422) {
    // Line-level errors (e.g. products.0.quantity) surface in the banner.
    const lineMsg = err.fields
      ? Object.entries(err.fields).find(([k]) => k.startsWith("products"))?.[1]
      : undefined;
    // A field error with nowhere to render is a silent refusal — the defect
    // slice 1 fixed for the stage form. Select has no hint surface, so anything
    // keyed to one (service_term, the party pickers) would vanish. Send those to
    // the form banner instead.
    const orphaned = Object.entries(err.fields ?? {})
      .filter(([k]) => !HINTED_FIELDS.has(k) && !k.startsWith("products"))
      .map(([, msg]) => msg);
    return {
      fieldErrors: err.fields ?? {},
      lineError: lineMsg ?? null,
      formError: err.fields ? (orphaned.length > 0 ? orphaned.join(" ") : null) : err.message,
    };
  }
  const formError =
    err.status === 403
      ? "You are not permitted to make this change."
      : err.status === 404
        ? "A selected contact, company or product no longer exists."
        : err.message;
  return { fieldErrors: {}, lineError: null, formError };
}

export const errorBanner: React.CSSProperties = {
  marginBottom: 20,
  padding: "12px 16px",
  borderRadius: "var(--radius-md)",
  background: "rgba(196,86,78,0.10)",
  color: "var(--secondary-red)",
  font: "400 14px/21px var(--font-ui)",
};

export const warnBanner: React.CSSProperties = {
  marginBottom: 20,
  padding: "12px 16px",
  borderRadius: "var(--radius-md)",
  background: "rgba(214,158,46,0.12)",
  color: "var(--text-primary)",
  border: "1px solid rgba(214,158,46,0.45)",
  font: "400 14px/21px var(--font-ui)",
};

// Retry sits inside the warning banner and reuses its text colour rather than
// introducing a second button style.
export const retryBtn: React.CSSProperties = {
  marginLeft: 8,
  padding: 0,
  border: 0,
  background: "none",
  font: "500 14px/21px var(--font-ui)",
  color: warnBanner.color,
  textDecoration: "underline",
  cursor: "pointer",
};

export const fieldErrStyle: React.CSSProperties = {
  marginTop: 6,
  font: "400 12px/18px var(--font-ui)",
  color: "var(--secondary-red)",
};

export const thStyle: React.CSSProperties = {
  textAlign: "left",
  font: "400 12px/18px var(--font-ui)",
  color: "var(--text-secondary)",
  padding: "0 10px 8px 0",
  borderBottom: "1px solid var(--outline-resting)",
};

export const tdStyle: React.CSSProperties = {
  padding: "8px 10px 8px 0",
  borderBottom: "1px solid var(--outline-resting)",
  verticalAlign: "middle",
};

// The line's service schedule. Wraps rather than scrolls, so the fields stay
// reachable at tablet width instead of hiding behind a horizontal scrollbar.
export const serviceScheduleRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
  alignItems: "flex-end",
};

export const inputWide = { width: "100%" } as const;
