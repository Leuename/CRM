/* eslint-disable @typescript-eslint/no-explicit-any -- JSON API rows are intentionally open shapes. */
import { createDemoSeed, DEMO_USERS, DEMO_VAT_RATE } from "./demo-data";
import { INVALID_EXTERNAL_URL_MESSAGE, normalizeExternalUrl } from "./external-url";

type Row = Record<string, any>;
type State = {
  version: number;
  user_id: string | null;
  contacts: Row[];
  companies: Row[];
  products: Row[];
  opportunities: Row[];
  activities: Row[];
  stages: Row[];
  sources: Row[];
  reps: Row[];
  loss_reasons: Row[];
  loss_reason_required: boolean;
  audit: Row[];
  consents: Row[];
};

const STORE_KEY = "aster-crm-demo-v2";
const LEGACY_STORE_KEY = "aster-crm-demo-v1";
const SYNTHETIC_NOTE = "Fictional sample note for the Aster CRM demo.";
const SAFE_ACTIVITY_TIMES = [
  "2026-10-13T00:00:00.000Z",
  "2026-10-13T23:59:59.999Z",
  "2026-10-12T23:59:59.999Z",
  "2026-10-14T00:00:00.000Z",
];
const SAFE_QUANTITIES = ["1", "2", "3", "4"];
const SAFE_PRICES = ["100.00", "250.00", "500.00", "750.00", "1000.00"];
const MONEY_ROLES = new Set(["ADMIN", "MANAGER", "SALES", "FINANCE"]);
const PROBABILITY_ROLES = new Set(["ADMIN", "MANAGER"]);

class HttpFailure extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = "DEMO_ERROR",
    readonly fields?: Record<string, string>,
    readonly duplicates?: Row[],
  ) {
    super(message);
  }
}

function readState(): State {
  // Older demo builds allowed free-form values. Drop that tab-local state so
  // records entered before synthetic-only writes cannot reappear after upgrade.
  sessionStorage.removeItem(LEGACY_STORE_KEY);
  const stored = sessionStorage.getItem(STORE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as State;
      if (
        parsed.version === 2 &&
        Array.isArray(parsed.contacts) &&
        Array.isArray(parsed.companies) &&
        Array.isArray(parsed.products) &&
        Array.isArray(parsed.opportunities) &&
        Array.isArray(parsed.activities) &&
        Array.isArray(parsed.stages) &&
        Array.isArray(parsed.sources) &&
        Array.isArray(parsed.reps) &&
        Array.isArray(parsed.loss_reasons) &&
        Array.isArray(parsed.audit) &&
        Array.isArray(parsed.consents)
      ) {
        return parsed;
      }
      sessionStorage.removeItem(STORE_KEY);
    } catch {
      sessionStorage.removeItem(STORE_KEY);
    }
  }
  const state = createDemoSeed() as unknown as State;
  writeState(state);
  return state;
}

function writeState(state: State) {
  sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function noContent(): Response {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

function fail(
  status: number,
  message: string,
  code?: string,
  fields?: Record<string, string>,
  duplicates?: Row[],
): never {
  throw new HttpFailure(status, message, code, fields, duplicates);
}
function companyWebsite(value: unknown): string | null {
  if (value == null || (typeof value === "string" && !value.trim())) return null;
  if (typeof value !== "string") {
    fail(422, INVALID_EXTERNAL_URL_MESSAGE, "VALIDATION_ERROR", {
      website: INVALID_EXTERNAL_URL_MESSAGE,
    });
  }
  const normalized = normalizeExternalUrl(value);
  if (!normalized) {
    fail(422, INVALID_EXTERNAL_URL_MESSAGE, "VALIDATION_ERROR", {
      website: INVALID_EXTERNAL_URL_MESSAGE,
    });
  }
  return normalized;
}

function syntheticWebsite(value: unknown): unknown {
  if (value == null || (typeof value === "string" && !value.trim())) return value;
  if (typeof value !== "string") return value;
  const normalized = normalizeExternalUrl(value);
  if (!normalized) return value; // Preserve the existing validator's generic error behavior.
  const hostname = new URL(normalized).hostname.toLowerCase();
  return hostname === "example" || hostname.endsWith(".example") ? normalized : null;
}

function payload(init?: RequestInit): Row {
  if (!init?.body || typeof init.body !== "string") return {};
  try {
    const parsed = JSON.parse(init.body);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Row) : {};
  } catch {
    return {};
  }
}

function has(input: Row, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function copySafeText(output: Row, input: Row, key: string, replacement: string) {
  if (!has(input, key)) return;
  if (input[key] === null || (typeof input[key] === "string" && !input[key].trim())) {
    output[key] = input[key];
  } else if (hasText(input[key])) {
    output[key] = replacement;
  }
}

function copyBoolean(output: Row, input: Row, key: string) {
  if (typeof input[key] === "boolean") output[key] = input[key];
}

function fixtureIndex(index: number, length: number): number {
  return Math.max(0, index - 1) % Math.max(1, length);
}

function sampleContactInput(input: Row, state: State, contactId?: string): Row {
  const seeds = createDemoSeed() as unknown as State;
  const existingIndex = contactId ? state.contacts.findIndex((item) => item.id === contactId) : -1;
  const index = existingIndex >= 0 ? existingIndex + 1 : state.contacts.length + 1;
  const sample = seeds.contacts[fixtureIndex(index, seeds.contacts.length)];
  const output: Row = {};
  copySafeText(output, input, "first_name", sample.first_name);
  copySafeText(output, input, "last_name", sample.last_name);
  if (has(input, "email")) {
    output.email =
      input.email === null || input.email === ""
        ? input.email
        : hasText(input.email)
          ? `demo.contact.${index}@aster.example`
          : null;
  }
  if (has(input, "phone")) {
    output.phone =
      input.phone === null || input.phone === ""
        ? input.phone
        : hasText(input.phone)
          ? `+1-202-555-01${String(index % 100).padStart(2, "0")}`
          : null;
  }
  copySafeText(output, input, "position", sample.position);
  if (
    has(input, "client_status") &&
    ["NEW_CLIENT", "EXISTING_CLIENT"].includes(input.client_status)
  )
    output.client_status = input.client_status;
  if (has(input, "company_id"))
    output.company_id =
      input.company_id === null || state.companies.some((item) => item.id === input.company_id)
        ? input.company_id
        : null;
  if (has(input, "source_id"))
    output.source_id =
      input.source_id === null || state.sources.some((item) => item.id === input.source_id)
        ? input.source_id
        : null;
  if (Array.isArray(input.tags)) output.tags = input.tags.length ? sample.tags : [];
  copySafeText(output, input, "notes", SYNTHETIC_NOTE);
  if (typeof input.confirm_duplicate === "boolean")
    output.confirm_duplicate = input.confirm_duplicate;
  return output;
}

function sampleCompanyInput(input: Row, state: State, companyId?: string): Row {
  const existingIndex = companyId ? state.companies.findIndex((item) => item.id === companyId) : -1;
  const index = existingIndex >= 0 ? existingIndex + 1 : state.companies.length + 1;
  const output: Row = {};
  const name = `Demo Company ${index}`;
  copySafeText(output, input, "name", name);
  copySafeText(output, input, "legal_name", `${name}, LLC`);
  if (has(input, "industry"))
    output.industry =
      input.industry === null || input.industry === "" ? input.industry : "Advisory";
  if (has(input, "website")) output.website = syntheticWebsite(input.website);
  if (has(input, "phone"))
    output.phone =
      input.phone === null || input.phone === ""
        ? input.phone
        : hasText(input.phone)
          ? `+1-202-555-02${String(index % 100).padStart(2, "0")}`
          : null;
  if (has(input, "employee_count")) {
    output.employee_count =
      input.employee_count === null ? null : [6, 12, 24, 48][fixtureIndex(index, 4)];
  }
  if (has(input, "billing_address")) {
    output.billing_address =
      input.billing_address === null
        ? null
        : {
            street: `${100 + fixtureIndex(index, 80)} Sample Avenue`,
            city: "Example City",
            province: "Demo Province",
            postal_code: "00000",
            country: "United States",
          };
  }
  copySafeText(output, input, "notes", SYNTHETIC_NOTE);
  return output;
}

function validReference(
  state: State,
  collection: keyof Pick<
    State,
    | "contacts"
    | "companies"
    | "products"
    | "opportunities"
    | "stages"
    | "sources"
    | "reps"
    | "loss_reasons"
  >,
  value: unknown,
) {
  return typeof value === "string" && state[collection].some((item) => item.id === value);
}

function sampleProductLine(input: Row, state: State, index: number): Row {
  const selected = validReference(state, "products", input.product_id)
    ? state.products.find((item) => item.id === input.product_id)!
    : (state.products.find((item) => item.active) ?? state.products[0]);
  const output: Row = { product_id: selected.id };
  if (typeof input.vat_exempt === "boolean") output.vat_exempt = input.vat_exempt;
  if (has(input, "quantity")) {
    const quantity = String(input.quantity);
    output.quantity = SAFE_QUANTITIES.includes(quantity)
      ? quantity
      : SAFE_QUANTITIES[fixtureIndex(index, 4)];
  }
  if (has(input, "unit_price"))
    output.unit_price = input.unit_price === null ? null : selected.default_price;
  if (has(input, "discount_percent"))
    output.discount_percent = ["0.00", "5.00"][fixtureIndex(index, 2)];
  copySafeText(output, input, "notes", SYNTHETIC_NOTE);
  if (has(input, "start_date"))
    output.start_date =
      input.start_date === null || input.start_date === "" ? input.start_date : "2026-11-01";
  if (has(input, "start_time"))
    output.start_time =
      input.start_time === null || input.start_time === "" ? input.start_time : "09:00";
  if (has(input, "end_date"))
    output.end_date =
      input.end_date === null || input.end_date === "" ? input.end_date : "2027-10-31";
  if (has(input, "end_time"))
    output.end_time = input.end_time === null || input.end_time === "" ? input.end_time : "17:00";
  copySafeText(output, input, "preferred_schedule", "Weekdays, 9am–5pm");
  return output;
}

function sampleOpportunityInput(input: Row, state: State, opportunityId?: string): Row {
  const seeds = createDemoSeed() as unknown as State;
  const index = opportunityId
    ? Math.max(1, state.opportunities.findIndex((item) => item.id === opportunityId) + 1)
    : state.opportunities.length + 1;
  const output: Row = {};
  for (const key of ["primary_contact_id", "company_id"] as const) {
    const collection = key === "primary_contact_id" ? "contacts" : "companies";
    if (has(input, key))
      output[key] =
        input[key] === null || validReference(state, collection, input[key]) ? input[key] : null;
  }
  if (has(input, "owner_id") && DEMO_USERS.some((item) => item.id === input.owner_id))
    output.owner_id = input.owner_id;
  if (has(input, "new_company") && input.new_company && typeof input.new_company === "object")
    output.new_company = sampleCompanyInput(input.new_company, state);
  if (has(input, "new_contact") && input.new_contact && typeof input.new_contact === "object")
    output.new_contact = sampleContactInput(input.new_contact, state);
  if (has(input, "expected_close_date"))
    output.expected_close_date =
      input.expected_close_date === null || input.expected_close_date === ""
        ? input.expected_close_date
        : seeds.opportunities[fixtureIndex(index, seeds.opportunities.length)].expected_close_date;
  if (has(input, "currency")) output.currency = "USD";
  if (has(input, "team_size"))
    output.team_size = input.team_size === null ? null : [4, 8, 12, 16][fixtureIndex(index, 4)];
  if (has(input, "service_start_date"))
    output.service_start_date =
      input.service_start_date === null || input.service_start_date === ""
        ? input.service_start_date
        : "2026-11-01";
  if (has(input, "service_end_date"))
    output.service_end_date =
      input.service_end_date === null || input.service_end_date === ""
        ? input.service_end_date
        : "2027-10-31";
  if (has(input, "service_start_time"))
    output.service_start_time =
      input.service_start_time === null || input.service_start_time === ""
        ? input.service_start_time
        : "09:00";
  if (has(input, "service_end_time"))
    output.service_end_time =
      input.service_end_time === null || input.service_end_time === ""
        ? input.service_end_time
        : "17:00";
  if (
    has(input, "service_term") &&
    ["ONCE", "DAILY", "WEEKLY", "MONTHLY", "ANNUALLY"].includes(input.service_term)
  )
    output.service_term = input.service_term;
  if (typeof input.vat_exempt === "boolean") output.vat_exempt = input.vat_exempt;
  if (has(input, "sales_representative_id"))
    output.sales_representative_id =
      input.sales_representative_id === null ||
      validReference(state, "reps", input.sales_representative_id)
        ? input.sales_representative_id
        : null;
  if (has(input, "selling_price_ex_vat")) {
    const price = String(input.selling_price_ex_vat);
    output.selling_price_ex_vat =
      input.selling_price_ex_vat === null || input.selling_price_ex_vat === ""
        ? input.selling_price_ex_vat
        : SAFE_PRICES.includes(price)
          ? price
          : "750.00";
  }
  if (has(input, "discount_percent"))
    output.discount_percent =
      input.discount_percent === null || input.discount_percent === ""
        ? input.discount_percent
        : "5.00";
  copySafeText(output, input, "notes", SYNTHETIC_NOTE);
  if (Array.isArray(input.products))
    output.products = input.products
      .filter(
        (line: unknown): line is Row =>
          Boolean(line) && typeof line === "object" && !Array.isArray(line),
      )
      .map((line: Row, lineIndex: number) => sampleProductLine(line, state, index + lineIndex));
  return output;
}

function sampleActivityInput(input: Row, state: State, activityId?: string): Row {
  const seeds = createDemoSeed() as unknown as State;
  const existingIndex = activityId
    ? state.activities.findIndex((item) => item.id === activityId)
    : -1;
  const index = existingIndex >= 0 ? existingIndex + 1 : state.activities.length + 1;
  const sample = seeds.activities[fixtureIndex(index, seeds.activities.length)];
  const output: Row = {};
  if (
    has(input, "activity_type") &&
    ["CALL", "EMAIL", "MEETING", "SITE_VISIT", "NOTE"].includes(input.activity_type)
  )
    output.activity_type = input.activity_type;
  copySafeText(output, input, "description", sample.description);
  for (const key of ["contact_id", "company_id", "opportunity_id"] as const) {
    const collection =
      key === "contact_id" ? "contacts" : key === "company_id" ? "companies" : "opportunities";
    if (has(input, key))
      output[key] =
        input[key] === null || validReference(state, collection, input[key]) ? input[key] : null;
  }
  if (has(input, "occurred_at")) {
    const newActivityOffset = Math.max(0, state.activities.length - seeds.activities.length);
    output.occurred_at = SAFE_ACTIVITY_TIMES[newActivityOffset % SAFE_ACTIVITY_TIMES.length];
  }
  return output;
}

/** Replace every visitor-supplied business value before mock handlers can persist or echo it. */
function syntheticMutationPayload(state: State, url: URL, method: string, raw: Row): Row {
  if (!["POST", "PATCH", "PUT"].includes(method)) return {};
  const path = url.pathname.replace(/^\/api\/v1/, "").replace(/\/$/, "") || "/";
  const [root, id, action] = path.split("/").filter(Boolean);
  if (root === "auth") return raw;
  if (root === "contacts" && (!id || !action))
    return sampleContactInput(raw, state, method === "PATCH" ? id : undefined);
  if (root === "companies" && (!id || !action))
    return sampleCompanyInput(raw, state, method === "PATCH" ? id : undefined);
  if (root === "products" && (!id || !action)) {
    const index = id
      ? Math.max(1, state.products.findIndex((item) => item.id === id) + 1)
      : state.products.length + 1;
    const seeds = createDemoSeed() as unknown as State;
    const output: Row = {};
    copySafeText(output, raw, "name", `Demo Service ${index}`);
    if (has(raw, "category"))
      output.category = raw.category === null || raw.category === "" ? raw.category : "Advisory";
    copySafeText(output, raw, "description", "A fictional advisory service for the demo catalog.");
    if (has(raw, "default_price"))
      output.default_price =
        raw.default_price === null || raw.default_price === ""
          ? raw.default_price
          : seeds.products[fixtureIndex(index, seeds.products.length)].default_price;
    if (has(raw, "currency")) output.currency = "USD";
    copyBoolean(output, raw, "active");
    return output;
  }
  if (root === "opportunities" && id && action === "stage") {
    const output: Row = {};
    if (validReference(state, "stages", raw.to_stage_id)) output.to_stage_id = raw.to_stage_id;
    if (validReference(state, "loss_reasons", raw.loss_reason_id))
      output.loss_reason_id = raw.loss_reason_id;
    copySafeText(output, raw, "reason", "Fictional demo stage update.");
    copySafeText(output, raw, "loss_note", SYNTHETIC_NOTE);
    return output;
  }
  if (root === "opportunities" && (!id || !action))
    return sampleOpportunityInput(raw, state, method === "PATCH" ? id : undefined);
  if (root === "pipeline-stages" && (!id || !action)) {
    const index = id
      ? Math.max(1, state.stages.findIndex((item) => item.id === id) + 1)
      : state.stages.length + 1;
    const output: Row = {};
    copySafeText(output, raw, "name", `Demo stage ${index}`);
    if (has(raw, "semantic_type") && ["ACTIVE", "WON", "LOST"].includes(raw.semantic_type))
      output.semantic_type = raw.semantic_type;
    if (has(raw, "probability")) output.probability = [20, 45, 70, 90][fixtureIndex(index, 4)];
    if (has(raw, "sort_order")) output.sort_order = index;
    if (has(raw, "color")) {
      if (raw.color === "green") output.color = "blue";
      else if (
        ["slate", "cyan", "orange", "yellow", "purple", "blue", "indigo", "red"].includes(raw.color)
      )
        output.color = raw.color;
    }
    copyBoolean(output, raw, "active");
    return output;
  }
  if (root === "activities" && (!id || !action))
    return sampleActivityInput(raw, state, method === "PATCH" ? id : undefined);
  if (root === "sales-representatives" && (!id || !action)) {
    const index = id
      ? Math.max(1, state.reps.findIndex((item) => item.id === id) + 1)
      : state.reps.length + 1;
    const output: Row = {};
    copySafeText(output, raw, "name", `Demo Representative ${index}`);
    copyBoolean(output, raw, "active");
    if (has(raw, "sort_order")) output.sort_order = index;
    return output;
  }
  if (root === "settings" && id === "loss-reason-required")
    return { required: raw.required === true };
  if (root === "kiosk" && id === "inquiries") {
    const output: Row = {};
    if (validReference(state, "contacts", raw.contact_id)) output.contact_id = raw.contact_id;
    if (raw.new_contact && typeof raw.new_contact === "object")
      output.new_contact = sampleContactInput(raw.new_contact, state);
    if (typeof raw.company_name === "string")
      output.company_name = hasText(raw.company_name)
        ? `Demo Company ${state.companies.length + 1}`
        : "";
    if (validReference(state, "products", raw.product_id)) output.product_id = raw.product_id;
    else
      output.product_id = state.products.find((item) => item.active)?.id ?? state.products[0]?.id;
    output.consent = raw.consent === true;
    output.marketing_opt_in = raw.marketing_opt_in === true;
    if (has(raw, "confirm_duplicate") && typeof raw.confirm_duplicate === "boolean")
      output.confirm_duplicate = raw.confirm_duplicate;
    copySafeText(output, raw, "notes", SYNTHETIC_NOTE);
    return output;
  }
  if (root === "kiosk" && id === "contacts" && action && !path.split("/").filter(Boolean)[3]) {
    const output = sampleContactInput(raw, state, action);
    if (has(raw, "company_name"))
      output.company_name =
        raw.company_name === null || raw.company_name === ""
          ? raw.company_name
          : `Demo Company ${state.companies.length + 1}`;
    return output;
  }
  return {};
}

function now() {
  return new Date().toISOString();
}
function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}
function money(value: number) {
  return value.toFixed(2);
}
function page<T>(
  items: T[],
  params: URLSearchParams,
): { items: T[]; total: number; limit: number; offset: number } {
  const limit = Math.max(1, Math.min(100, Number(params.get("limit") ?? 100)));
  const offset = Math.max(0, Number(params.get("offset") ?? 0));
  return { items: items.slice(offset, offset + limit), total: items.length, limit, offset };
}
function match(value: unknown, query: string) {
  return String(value ?? "")
    .toLowerCase()
    .includes(query.toLowerCase());
}
function currentUser(state: State) {
  return DEMO_USERS.find((user) => user.id === state.user_id) ?? null;
}
function requireUser(state: State) {
  const user = currentUser(state);
  if (!user) fail(401, "Sign in to continue", "UNAUTHENTICATED");
  return user;
}
function requireRole(state: State, roles: string[]) {
  const user = requireUser(state);
  if (!roles.includes(user.role))
    fail(403, "You do not have permission to perform this action", "FORBIDDEN");
  return user;
}
function requireOwnedOpportunity(user: Row, opportunity: Row) {
  if (user.role === "ADMIN" || user.role === "MANAGER") return;
  const ownerId = user.role === "TRIAGE" ? opportunity.created_by : opportunity.owner_id;
  if (ownerId !== user.id)
    fail(403, "You can only change your own demo opportunities", "FORBIDDEN");
}
function requireOpportunityWriter(user: Row, opportunity: Row) {
  if (!["ADMIN", "MANAGER", "SALES", "TRIAGE"].includes(user.role)) {
    fail(403, "You do not have permission to change opportunities", "FORBIDDEN");
  }
  requireOwnedOpportunity(user, opportunity);
}
function requireContactEditor(user: Row, contact: Row) {
  if (["ADMIN", "MANAGER", "SALES"].includes(user.role)) return;
  if (user.role === "TRIAGE" && contact.created_by === user.id) return;
  fail(403, "You can only edit customer records you created", "FORBIDDEN");
}
function contactName(contact: Row) {
  return [contact.first_name, contact.last_name].filter(Boolean).join(" ");
}
function hydrateContact(state: State, contact: Row, user = currentUser(state)): Row {
  const company = state.companies.find((item) => item.id === contact.company_id);
  const result: Row = { ...contact, company_name: company?.name ?? null };
  if (user?.role === "OPERATIONS") {
    result.email = null;
    result.phone = null;
  }
  return result;
}
function hydrateCompany(state: State, company: Row): Row {
  const count = state.contacts.filter(
    (item) => item.company_id === company.id && !item.archived_at,
  ).length;
  return { ...company, contact_count: count };
}
function hydrateOpportunity(state: State, opportunity: Row, user = currentUser(state)): Row {
  const result = structuredClone(opportunity);
  const contact = state.contacts.find((item) => item.id === result.primary_contact_id);
  const company = state.companies.find((item) => item.id === result.company_id);
  const stage = state.stages.find((item) => item.id === result.stage_id);
  const owner = DEMO_USERS.find((item) => item.id === result.owner_id);
  result.contact_name = contact ? contactName(contact) : result.contact_name;
  result.company_name = company?.name ?? null;
  result.stage_name = stage?.name ?? result.stage_name;
  result.stage_semantic_type = stage?.semantic_type ?? result.stage_semantic_type;
  result.stage_color = stage?.color ?? result.stage_color;
  result.probability = PROBABILITY_ROLES.has(user?.role ?? "")
    ? (stage?.probability ?? result.probability)
    : null;
  result.owner_name = owner?.display_name ?? result.owner_name;
  if (!MONEY_ROLES.has(user?.role ?? "")) {
    result.total_revenue_ex_vat = null;
    result.total_revenue_inc_vat = null;
    result.selling_price_ex_vat = null;
    result.products = result.products.map((line: Row) => ({
      ...line,
      vat_amount: null,
      line_total_inc_vat: null,
      unit_price: null,
      discount_percent: null,
      line_total: null,
    }));
  }
  return result;
}
function addAudit(
  state: State,
  action: string,
  entity_type: string,
  entity_id: string,
  before: Row | null,
  after: Row | null,
) {
  const user = currentUser(state);
  state.audit.unshift({
    id: newId("audit"),
    occurred_at: now(),
    actor_id: user?.id ?? "system",
    actor_name: user?.display_name ?? "Demo system",
    action,
    entity_type,
    entity_id,
    before,
    after,
    correlation_id: newId("demo"),
  });
}
function addActivity(state: State, type: string, description: string, refs: Row = {}) {
  const user = currentUser(state);
  const activity = {
    id: newId("activity"),
    activity_type: type,
    description,
    occurred_at: now(),
    contact_id: refs.contact_id ?? null,
    company_id: refs.company_id ?? null,
    opportunity_id: refs.opportunity_id ?? null,
    created_by: user?.id ?? "system",
    created_by_name: user?.display_name ?? "Demo system",
    created_at: now(),
  };
  state.activities.unshift(activity);
  return activity;
}
function checkDuplicate(
  state: State,
  email: string | null | undefined,
  exceptId?: string,
  confirmed = false,
) {
  if (!email || confirmed) return;
  const duplicates = state.contacts.filter(
    (item) => item.id !== exceptId && item.email?.toLowerCase() === email.toLowerCase(),
  );
  if (duplicates.length)
    fail(
      409,
      "A customer with this email already exists",
      "DUPLICATE_WARNING",
      undefined,
      duplicates.map((item) => ({
        id: item.id,
        first_name: item.first_name,
        last_name: item.last_name,
        email: item.email,
      })),
    );
}
function calculateOpportunity(state: State, record: Row) {
  const lines = record.products ?? [];
  if (!lines.length) {
    const net = Number(record.selling_price_ex_vat ?? 0);
    record.total_revenue_ex_vat = money(net);
    record.total_revenue_inc_vat = money(net * (record.vat_exempt ? 1 : 1 + DEMO_VAT_RATE));
    return;
  }
  let net = 0;
  let gross = 0;
  record.products = lines.map((line: Row) => {
    const product = state.products.find((item) => item.id === line.product_id);
    const price = Number(line.unit_price ?? product?.default_price ?? 0);
    const quantity = Number(line.quantity ?? 1);
    const discount = Number(line.discount_percent ?? 0);
    const lineNet = Math.max(0, price * quantity * (1 - discount / 100));
    const vat = line.vat_exempt ? 0 : lineNet * DEMO_VAT_RATE;
    net += lineNet;
    gross += lineNet + vat;
    return {
      ...line,
      id: line.id ?? newId("line"),
      product_name: product?.name ?? "Demo service",
      unit_price: money(price),
      line_total: money(lineNet),
      vat_amount: money(vat),
      line_total_inc_vat: money(lineNet + vat),
      quantity: String(quantity),
      discount_percent: money(discount),
    };
  });
  record.total_revenue_ex_vat = money(net);
  record.total_revenue_inc_vat = money(gross);
  record.selling_price_ex_vat = money(net);
}
function createContact(state: State, input: Row): Row {
  if (!String(input.first_name ?? "").trim())
    fail(422, "First name is required", "VALIDATION_ERROR", { first_name: "Enter a first name" });
  checkDuplicate(state, input.email, undefined, input.confirm_duplicate);
  const company = state.companies.find((item) => item.id === input.company_id);
  const record = {
    id: newId("contact"),
    first_name: String(input.first_name).trim(),
    last_name: input.last_name || null,
    email: input.email || null,
    phone: input.phone || null,
    position: input.position || null,
    client_status: input.client_status ?? "NEW_CLIENT",
    company_id: company?.id ?? null,
    company_name: company?.name ?? null,
    source_id: input.source_id || null,
    tags: input.tags ?? [],
    created_at: now(),
    updated_at: now(),
    notes: input.notes || null,
    created_by: currentUser(state)?.id ?? "system",
    archived_at: null,
  };
  state.contacts.unshift(record);
  addAudit(state, "CREATE", "contact", record.id, null, record);
  return record;
}
function createCompany(state: State, input: Row): Row {
  if (!String(input.name ?? "").trim())
    fail(422, "Company name is required", "VALIDATION_ERROR", { name: "Enter a company name" });
  const record = {
    id: newId("company"),
    name: String(input.name).trim(),
    legal_name: input.legal_name || null,
    industry: input.industry || null,
    website: companyWebsite(input.website),
    phone: input.phone || null,
    employee_count: input.employee_count ?? null,
    contact_count: 0,
    created_at: now(),
    updated_at: now(),
    billing_address: input.billing_address ?? null,
    notes: input.notes || null,
    archived_at: null,
  };
  state.companies.unshift(record);
  addAudit(state, "CREATE", "company", record.id, null, record);
  return record;
}
function createOpportunity(state: State, input: Row): Row {
  const user = requireUser(state);
  let contact = input.primary_contact_id
    ? state.contacts.find((item) => item.id === input.primary_contact_id)
    : null;
  if (!contact && input.new_contact) {
    let company = input.company_id
      ? state.companies.find((item) => item.id === input.company_id)
      : null;
    if (input.new_company) company = createCompany(state, input.new_company);
    contact = createContact(state, {
      ...input.new_contact,
      company_id: company?.id ?? input.new_contact.company_id,
      confirm_duplicate: input.new_contact.confirm_duplicate,
    });
  }
  if (!contact)
    fail(422, "Choose or create a customer", "VALIDATION_ERROR", {
      primary_contact_id: "Choose a customer",
    });
  const companyId = input.company_id ?? contact.company_id ?? null;
  const stage = state.stages
    .filter((item) => item.active && item.semantic_type === "ACTIVE")
    .sort((a, b) => a.sort_order - b.sort_order)[0];
  const record: Row = {
    id: newId("opportunity"),
    reference: `INQ-${String(2000 + state.opportunities.length + 1)}`,
    title: "",
    primary_contact_id: contact.id,
    company_id: companyId,
    owner_id: user.id,
    created_by: user.id,
    stage_id: stage.id,
    stage_name: stage.name,
    stage_semantic_type: stage.semantic_type,
    stage_color: stage.color,
    probability: stage.probability,
    expected_close_date: input.expected_close_date ?? null,
    currency: input.currency ?? "USD",
    created_at: now(),
    updated_at: now(),
    archived_at: null,
    reopened: false,
    team_size: input.team_size ?? null,
    service_start_date: null,
    service_end_date: null,
    service_start_time: null,
    service_end_time: null,
    service_term: input.service_term ?? null,
    vat_exempt: input.vat_exempt ?? false,
    sales_representative_id: input.sales_representative_id ?? null,
    sales_representative_name:
      state.reps.find((item) => item.id === input.sales_representative_id)?.name ?? null,
    service_term_text: null,
    selling_price_ex_vat: input.selling_price_ex_vat ?? null,
    discount_percent: input.discount_percent ?? null,
    notes: input.notes ?? null,
    closed_at: null,
    loss_reason_id: null,
    loss_reason_name: null,
    loss_note: null,
    source_id: contact.source_id,
    product_id: input.products?.[0]?.product_id ?? null,
    products: (input.products ?? []).map((line: Row) => ({
      ...line,
      id: newId("line"),
      product_name:
        state.products.find((item) => item.id === line.product_id)?.name ?? "Demo service",
      quantity: line.quantity ?? "1",
      unit_price:
        line.unit_price ??
        state.products.find((item) => item.id === line.product_id)?.default_price ??
        "0.00",
      vat_exempt: line.vat_exempt ?? false,
      notes: line.notes ?? null,
      start_date: line.start_date ?? null,
      start_time: line.start_time ?? null,
      end_date: line.end_date ?? null,
      end_time: line.end_time ?? null,
      preferred_schedule: line.preferred_schedule ?? null,
    })),
    history: [],
  };
  record.title = `${record.products[0]?.product_name ?? "Advisory inquiry"} · ${contactName(contact)}`;
  const firstHistory = {
    id: newId("history"),
    from_stage_id: null,
    from_stage_name: null,
    to_stage_id: stage.id,
    to_stage_name: stage.name,
    changed_by: user.id,
    changed_by_name: user.display_name,
    reason: "Opportunity created",
    changed_at: now(),
  };
  record.history = [firstHistory];
  calculateOpportunity(state, record);
  state.opportunities.unshift(record);
  addAudit(state, "CREATE", "opportunity", record.id, null, record);
  addActivity(state, "SYSTEM_EVENT", "Opportunity created", {
    contact_id: contact.id,
    company_id: companyId,
    opportunity_id: record.id,
  });
  return record;
}

function filterByDateBounds(
  rows: Row[],
  field: string,
  from: string | null,
  to: string | null,
  month: string | null = null,
) {
  return rows.filter((row) => {
    const value = String(row[field] ?? "");
    const date = value.slice(0, 10);
    if (value.includes("T") && (from?.includes("T") || to?.includes("T"))) {
      const timestamp = Date.parse(value);
      const fromTimestamp = from ? Date.parse(from) : null;
      const toTimestamp = to ? Date.parse(to) : null;
      return (
        Number.isFinite(timestamp) &&
        (!month || date.slice(0, 7) === month) &&
        (fromTimestamp === null ||
          (Number.isFinite(fromTimestamp) && timestamp >= fromTimestamp)) &&
        (toTimestamp === null || (Number.isFinite(toTimestamp) && timestamp < toTimestamp))
      );
    }
    const fromDate = from?.slice(0, 10);
    const toDate = to?.slice(0, 10);
    return (
      (!month || date.slice(0, 7) === month) &&
      (!fromDate || date >= fromDate) &&
      (!toDate || date <= toDate)
    );
  });
}

function filteredByDates(rows: Row[], params: URLSearchParams, field: string) {
  const from =
    params.get("date_from") ??
    params.get("created_from") ??
    params.get("close_from") ??
    params.get("occurred_from");
  const to =
    params.get("date_to") ??
    params.get("created_to") ??
    params.get("close_to") ??
    params.get("occurred_to");
  return filterByDateBounds(rows, field, from, to, params.get("month"));
}

type DashboardPeriod = { from: string | null; to: string | null; month: string | null };

function monthAtOffset(month: string, offset: number): string {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, number - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthEnd(month: string): string {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number, 0)).toISOString().slice(0, 10);
}

function shiftDay(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function readDashboardPeriod(params: URLSearchParams, allowMonthAndRange = false): DashboardPeriod {
  const requestedMonth = params.get("month");
  let from = params.get("date_from");
  let to = params.get("date_to");
  if (
    requestedMonth &&
    (!/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth) ||
      !Number.isFinite(Date.parse(`${requestedMonth}-01T00:00:00.000Z`)))
  ) {
    fail(422, "month must be YYYY-MM", "VALIDATION_ERROR");
  }
  if (requestedMonth && (from || to) && !allowMonthAndRange)
    fail(422, "month cannot be combined with date_from/date_to", "VALIDATION_ERROR");
  if (requestedMonth && !from && !to) {
    from = `${requestedMonth}-01`;
    to = monthEnd(requestedMonth);
  }
  if (from && to && from > to) fail(422, "date_from must be <= date_to", "VALIDATION_ERROR");
  return {
    from,
    to,
    month:
      requestedMonth && !params.has("date_from") && !params.has("date_to") ? requestedMonth : null,
  };
}

function inDashboardPeriod(value: unknown, period: Pick<DashboardPeriod, "from" | "to">): boolean {
  const date = String(value ?? "").slice(0, 10);
  return (
    Boolean(date) && (!period.from || date >= period.from) && (!period.to || date <= period.to)
  );
}

function previousDashboardPeriod(period: DashboardPeriod): { from: string; to: string } | null {
  if (!period.from || !period.to) return null;
  if (period.month) {
    const previousMonth = monthAtOffset(period.month, -1);
    return { from: `${previousMonth}-01`, to: shiftDay(period.from, -1) };
  }
  const days =
    Math.round(
      (Date.parse(`${period.to}T00:00:00.000Z`) - Date.parse(`${period.from}T00:00:00.000Z`)) /
        86_400_000,
    ) + 1;
  const to = shiftDay(period.from, -1);
  return { from: shiftDay(to, -(days - 1)), to };
}

function dashboardSourceId(state: State, opportunity: Row): string | null {
  const contact = state.contacts.find((item) => item.id === opportunity.primary_contact_id);
  return (contact?.source_id as string | null | undefined) ?? null;
}

function dashboardSemanticType(state: State, opportunity: Row): string {
  return (
    state.stages.find((item) => item.id === opportunity.stage_id)?.semantic_type ??
    opportunity.stage_semantic_type
  );
}

function dashboardRevenue(opportunity: Row): number {
  return Number(opportunity.total_revenue_inc_vat ?? opportunity.total_revenue_ex_vat ?? 0);
}

function opportunityHasProduct(opportunity: Row, productId: string): boolean {
  return (
    opportunity.product_id === productId ||
    opportunity.products?.some((line: Row) => line.product_id === productId) === true
  );
}

function dashboardScope(
  state: State,
  params: URLSearchParams,
  { includeStage = true, noSource = false }: { includeStage?: boolean; noSource?: boolean } = {},
): Row[] {
  return state.opportunities.filter((item) => {
    if (item.archived_at) return false;
    if (params.get("owner_id") && item.owner_id !== params.get("owner_id")) return false;
    if (includeStage && params.get("stage_id") && item.stage_id !== params.get("stage_id"))
      return false;
    const sourceId = dashboardSourceId(state, item);
    if (noSource && sourceId !== null) return false;
    if (params.get("source_id") && !noSource && sourceId !== params.get("source_id")) return false;
    const productId = params.get("product_id");
    if (productId && !opportunityHasProduct(item, productId)) return false;
    return true;
  });
}

function dashboard(state: State, path: string, params: URLSearchParams): Row {
  const user = requireUser(state);
  const metric = params.get("metric");
  const isDrilldown = path === "drilldown";
  if (isDrilldown) requireRole(state, ["ADMIN"]);
  const isRevenueMonth = isDrilldown && metric === "revenue_month";
  const period = readDashboardPeriod(params, isRevenueMonth);
  const moneyAllowed = MONEY_ROLES.has(user.role);
  const sum = (rows: Row[]) => rows.reduce((total, item) => total + dashboardRevenue(item), 0);
  const semantic = (rows: Row[], type: string) =>
    rows.filter((item) => dashboardSemanticType(state, item) === type);
  const initialStageId = state.stages
    .filter((stage) => stage.active && stage.semantic_type === "ACTIVE")
    .sort((a, b) => a.sort_order - b.sort_order)[0]?.id;

  if (path === "pipeline") {
    const scoped = dashboardScope(state, params, { includeStage: false });
    const items = state.stages
      .map((stage) => ({ stage, rows: scoped.filter((item) => item.stage_id === stage.id) }))
      .filter(({ stage, rows }) => stage.active || rows.length > 0)
      .sort(
        (a, b) =>
          a.stage.sort_order - b.stage.sort_order || a.stage.name.localeCompare(b.stage.name),
      )
      .map(({ stage, rows }) => ({
        stage_id: stage.id,
        stage_name: stage.name,
        semantic_type: stage.semantic_type,
        stage_color: stage.color,
        sort_order: stage.sort_order,
        count: rows.length,
        value: moneyAllowed ? money(sum(rows)) : null,
      }));
    return { items, currency: "USD" };
  }

  if (path === "sources") {
    const scoped = dashboardScope(state, params);
    const groups = new Map<string, Row[]>();
    for (const item of scoped) {
      const id = dashboardSourceId(state, item) ?? "__no_source__";
      groups.set(id, [...(groups.get(id) ?? []), item]);
    }
    const items = [...groups.entries()]
      .map(([id, rows]) => {
        const created = rows.filter((item) => inDashboardPeriod(item.created_at, period));
        const closedWon = semantic(rows, "WON").filter((item) =>
          inDashboardPeriod(item.closed_at, period),
        );
        const source = id === "__no_source__" ? null : state.sources.find((item) => item.id === id);
        return {
          source_id: source?.id ?? null,
          source_name: source?.name ?? "No source",
          inquiries: created.length,
          won_revenue: moneyAllowed ? money(sum(closedWon)) : null,
        };
      })
      .sort((a, b) => b.inquiries - a.inquiries || a.source_name.localeCompare(b.source_name));
    return { items, currency: "USD" };
  }

  if (path === "revenue") {
    const scoped = dashboardScope(state, params);
    const lastMonth = period.to ? period.to.slice(0, 7) : new Date().toISOString().slice(0, 7);
    const firstMonth = period.from ? period.from.slice(0, 7) : monthAtOffset(lastMonth, -11);
    const [firstYear, firstNumber] = firstMonth.split("-").map(Number);
    const [lastYear, lastNumber] = lastMonth.split("-").map(Number);
    const monthCount = (lastYear - firstYear) * 12 + lastNumber - firstNumber + 1;
    if (monthCount > 120) fail(422, "period exceeds 120 months", "VALIDATION_ERROR");
    const won = semantic(scoped, "WON");
    const items = Array.from({ length: Math.max(0, monthCount) }, (_, index) => {
      const month = monthAtOffset(firstMonth, index);
      const closed = won.filter(
        (item) =>
          String(item.closed_at ?? "").slice(0, 7) === month &&
          inDashboardPeriod(item.closed_at, period),
      );
      return { month, won_revenue: money(sum(closed)) };
    });
    return { items, currency: "USD" };
  }

  if (isDrilldown) {
    const metrics = new Set([
      "total_inquiries",
      "new_inquiries",
      "source_inquiries",
      "active_opportunities",
      "active_pipeline_value",
      "weighted_pipeline_value",
      "won_opportunities",
      "won_revenue",
      "lost_opportunities",
      "revenue_month",
      "pipeline_stage",
    ]);
    if (!metric || !metrics.has(metric))
      fail(422, `Unknown metric '${metric ?? ""}'`, "VALIDATION_ERROR");
    if (metric === "source_inquiries" && !params.get("source_id"))
      fail(422, "source_id is required for metric 'source_inquiries'", "VALIDATION_ERROR");
    if (metric === "pipeline_stage" && !params.get("stage_id"))
      fail(422, "stage_id is required for metric 'pipeline_stage'", "VALIDATION_ERROR");
    if (metric === "revenue_month" && !params.get("month"))
      fail(422, "month is required for metric 'revenue_month'", "VALIDATION_ERROR");
    const noSource = params.get("source_id") === "none";
    if (noSource && metric !== "source_inquiries")
      fail(422, "source_id='none' applies only to metric 'source_inquiries'", "VALIDATION_ERROR");
    let rows = dashboardScope(state, params, { noSource });
    if (
      ["active_opportunities", "active_pipeline_value", "weighted_pipeline_value"].includes(metric)
    )
      rows = semantic(rows, "ACTIVE");
    if (["won_opportunities", "won_revenue", "revenue_month"].includes(metric))
      rows = semantic(rows, "WON");
    if (metric === "lost_opportunities") rows = semantic(rows, "LOST");
    if (metric === "new_inquiries") rows = rows.filter((item) => item.stage_id === initialStageId);
    if (["total_inquiries", "new_inquiries", "source_inquiries"].includes(metric))
      rows = rows.filter((item) => inDashboardPeriod(item.created_at, period));
    if (["won_opportunities", "won_revenue", "lost_opportunities"].includes(metric))
      rows = rows.filter((item) => inDashboardPeriod(item.closed_at, period));
    if (metric === "revenue_month") {
      const month = params.get("month")!;
      const monthRange = { from: `${month}-01`, to: monthEnd(month) };
      const range = {
        from: period.from
          ? period.from > monthRange.from
            ? period.from
            : monthRange.from
          : monthRange.from,
        to: period.to ? (period.to < monthRange.to ? period.to : monthRange.to) : monthRange.to,
      };
      rows = rows.filter((item) => inDashboardPeriod(item.closed_at, range));
    }
    return page(
      rows.map((item) => hydrateOpportunity(state, item, user)),
      params,
    );
  }

  const scoped = dashboardScope(state, params);
  const created = scoped.filter((item) => inDashboardPeriod(item.created_at, period));
  const won = semantic(scoped, "WON").filter((item) => inDashboardPeriod(item.closed_at, period));
  const lost = semantic(scoped, "LOST").filter((item) => inDashboardPeriod(item.closed_at, period));
  const active = semantic(scoped, "ACTIVE");
  const previousPeriod = previousDashboardPeriod(period);
  const previousCreated = previousPeriod
    ? scoped.filter((item) => inDashboardPeriod(item.created_at, previousPeriod))
    : [];
  const previousWon = previousPeriod
    ? semantic(scoped, "WON").filter((item) => inDashboardPeriod(item.closed_at, previousPeriod))
    : [];
  const previousLost = previousPeriod
    ? semantic(scoped, "LOST").filter((item) => inDashboardPeriod(item.closed_at, previousPeriod))
    : [];
  const conversion = (wins: Row[], losses: Row[]) =>
    wins.length + losses.length ? money((wins.length / (wins.length + losses.length)) * 100) : null;
  const previous = previousPeriod
    ? {
        period_from: previousPeriod.from,
        period_to: previousPeriod.to,
        total_inquiries: previousCreated.length,
        new_inquiries: previousCreated.filter((item) => item.stage_id === initialStageId).length,
        won_opportunities: previousWon.length,
        lost_opportunities: previousLost.length,
        conversion_rate: conversion(previousWon, previousLost),
        won_revenue: moneyAllowed ? money(sum(previousWon)) : null,
      }
    : null;
  const weighted = active.reduce(
    (total, item) => total + (dashboardRevenue(item) * Number(item.probability ?? 0)) / 100,
    0,
  );
  return {
    total_inquiries: created.length,
    new_inquiries: created.filter((item) => item.stage_id === initialStageId).length,
    active_opportunities: active.length,
    won_opportunities: won.length,
    lost_opportunities: lost.length,
    conversion_rate: conversion(won, lost),
    won_revenue: moneyAllowed ? money(sum(won)) : null,
    active_pipeline_value: moneyAllowed ? money(sum(active)) : null,
    weighted_pipeline_value: moneyAllowed ? money(weighted) : null,
    currency: "USD",
    period_from: period.from,
    period_to: period.to,
    previous,
  };
}

function handle(state: State, url: URL, method: string, body: Row): Response {
  const path = url.pathname.replace(/^\/api\/v1/, "").replace(/\/$/, "") || "/";
  const params = url.searchParams;
  const parts = path.split("/").filter(Boolean);
  const [root, id, action, subaction] = parts;

  if (root === "auth" && id === "login" && method === "POST") {
    const user = DEMO_USERS.find(
      (item) => item.email.toLowerCase() === String(body.email ?? "").toLowerCase(),
    );
    if (!user || body.password !== "demo")
      fail(401, "Invalid email or password", "INVALID_CREDENTIALS");
    state.user_id = user.id;
    writeState(state);
    return json({ user });
  }
  if (root === "auth" && id === "logout" && method === "POST") {
    sessionStorage.removeItem(STORE_KEY);
    return noContent();
  }
  if (root === "auth" && id === "me" && method === "GET") {
    const user = requireUser(state);
    return json(user);
  }

  const user = requireUser(state);
  if (root === "contacts") {
    if (!id && method === "GET") {
      let rows = state.contacts.filter(
        (row) => Boolean(row.archived_at) === (params.get("archived") === "true"),
      );
      if (params.get("q"))
        rows = rows.filter((row) =>
          [row.first_name, row.last_name, row.email, row.phone, row.company_name].some((value) =>
            match(value, params.get("q")!),
          ),
        );
      if (params.get("client_status"))
        rows = rows.filter((row) => row.client_status === params.get("client_status"));
      if (params.get("source_id"))
        rows = rows.filter((row) => row.source_id === params.get("source_id"));
      if (params.getAll("tags").length)
        rows = rows.filter((row) => params.getAll("tags").every((tag) => row.tags.includes(tag)));
      return json(
        page(
          rows.map((row) => hydrateContact(state, row)),
          params,
        ),
      );
    }
    if (id && action === "opportunities" && method === "GET")
      return json({
        items: state.opportunities
          .filter((row) => row.primary_contact_id === id && !row.archived_at)
          .map((row) => {
            const opp = hydrateOpportunity(state, row);
            return {
              id: opp.id,
              reference: opp.reference,
              title: opp.title,
              stage_id: opp.stage_id,
              expected_close_date: opp.expected_close_date,
              total_revenue_ex_vat: opp.total_revenue_ex_vat,
              total_revenue_inc_vat: opp.total_revenue_inc_vat,
              currency: opp.currency,
              created_at: opp.created_at,
            };
          }),
      });
    if (!id && method === "POST") {
      requireRole(state, ["ADMIN", "MANAGER", "SALES", "OPERATIONS", "TRIAGE"]);
      return json(createContact(state, body), 201);
    }
    const record = state.contacts.find((row) => row.id === id);
    if (!record) fail(404, "Customer not found", "NOT_FOUND");
    if (action === "archive" && method === "POST") {
      requireRole(state, ["ADMIN", "MANAGER", "SALES"]);
      record.archived_at = now();
      record.updated_at = now();
      addAudit(state, "ARCHIVE", "contact", id!, null, { archived_at: record.archived_at });
      return json({ archived_at: record.archived_at });
    }
    if (action === "restore" && method === "POST") {
      requireRole(state, ["ADMIN", "MANAGER", "SALES"]);
      record.archived_at = null;
      record.updated_at = now();
      addAudit(state, "RESTORE", "contact", id!, null, record);
      return json({ archived_at: null });
    }
    if (!action && method === "GET") return json(hydrateContact(state, record));
    if (!action && method === "PATCH") {
      requireContactEditor(user, record);
      checkDuplicate(state, body.email, id, body.confirm_duplicate);
      const before = { ...record };
      Object.assign(record, body, { updated_at: now() });
      delete record.confirm_duplicate;
      if (record.company_id)
        record.company_name =
          state.companies.find((item) => item.id === record.company_id)?.name ?? null;
      addAudit(state, "UPDATE", "contact", id!, before, record);
      return json(hydrateContact(state, record));
    }
  }
  if (root === "lead-sources" && method === "GET") return json({ items: state.sources });

  if (root === "companies") {
    if (!id && method === "GET") {
      let rows = state.companies.filter(
        (row) => Boolean(row.archived_at) === (params.get("archived") === "true"),
      );
      if (params.get("q"))
        rows = rows.filter((row) =>
          [row.name, row.legal_name, row.industry, row.website].some((value) =>
            match(value, params.get("q")!),
          ),
        );
      return json(
        page(
          rows.map((row) => hydrateCompany(state, row)),
          params,
        ),
      );
    }
    if (!id && method === "POST") {
      requireRole(state, ["ADMIN", "MANAGER", "SALES", "OPERATIONS", "TRIAGE"]);
      return json(createCompany(state, body), 201);
    }
    const record = state.companies.find((row) => row.id === id);
    if (!record) fail(404, "Company not found", "NOT_FOUND");
    if (action === "contacts" && method === "GET")
      return json({
        items: state.contacts
          .filter((row) => row.company_id === id && !row.archived_at)
          .map((row) => hydrateContact(state, row)),
      });
    if (action === "opportunities" && method === "GET")
      return json({
        items: state.opportunities
          .filter((row) => row.company_id === id && !row.archived_at)
          .map((row) => {
            const opp = hydrateOpportunity(state, row);
            return {
              id: opp.id,
              reference: opp.reference,
              title: opp.title,
              stage_id: opp.stage_id,
              expected_close_date: opp.expected_close_date,
              total_revenue_ex_vat: opp.total_revenue_ex_vat,
              total_revenue_inc_vat: opp.total_revenue_inc_vat,
              currency: opp.currency,
              created_at: opp.created_at,
            };
          }),
      });
    if (action === "archive" && method === "POST") {
      requireRole(state, ["ADMIN", "MANAGER", "SALES"]);
      record.archived_at = now();
      record.updated_at = now();
      addAudit(state, "ARCHIVE", "company", id!, null, { archived_at: record.archived_at });
      return json({ archived_at: record.archived_at });
    }
    if (action === "restore" && method === "POST") {
      requireRole(state, ["ADMIN", "MANAGER", "SALES"]);
      record.archived_at = null;
      record.updated_at = now();
      addAudit(state, "RESTORE", "company", id!, null, record);
      return json({ archived_at: null });
    }
    if (!action && method === "GET") return json(hydrateCompany(state, record));
    if (!action && method === "PATCH") {
      requireRole(state, ["ADMIN", "MANAGER", "SALES"]);
      if (Object.prototype.hasOwnProperty.call(body, "website"))
        body.website = companyWebsite(body.website);
      const before = { ...record };
      Object.assign(record, body, { updated_at: now() });
      addAudit(state, "UPDATE", "company", id!, before, record);
      return json(hydrateCompany(state, record));
    }
  }

  if (root === "products") {
    if (!id && method === "GET") {
      let rows = state.products;
      if (params.has("active"))
        rows = rows.filter((row) => row.active === (params.get("active") === "true"));
      if (params.get("category"))
        rows = rows.filter((row) => row.category === params.get("category"));
      if (params.get("q"))
        rows = rows.filter((row) =>
          [row.name, row.category, row.description].some((value) => match(value, params.get("q")!)),
        );
      return json(page(rows, params));
    }
    if (!id && method === "POST") {
      requireRole(state, ["ADMIN"]);
      if (!body.name)
        fail(422, "Product name is required", "VALIDATION_ERROR", { name: "Enter a product name" });
      const record = {
        id: newId("product"),
        name: body.name,
        category: body.category ?? null,
        description: body.description ?? null,
        default_price: body.default_price ?? null,
        price_unit: null,
        currency: body.currency ?? "USD",
        active: body.active ?? true,
        created_at: now(),
        updated_at: now(),
      };
      state.products.unshift(record);
      addAudit(state, "CREATE", "product", record.id, null, record);
      return json(record, 201);
    }
    const record = state.products.find((row) => row.id === id);
    if (!record) fail(404, "Product not found", "NOT_FOUND");
    if (method === "GET") return json(record);
    if (method === "PATCH") {
      requireRole(state, ["ADMIN"]);
      const before = { ...record };
      Object.assign(record, body, { updated_at: now() });
      addAudit(state, "UPDATE", "product", id!, before, record);
      return json(record);
    }
  }

  if (root === "opportunities") {
    if (!id && method === "GET") {
      let rows = state.opportunities.filter(
        (row) => Boolean(row.archived_at) === (params.get("archived") === "true"),
      );
      if (params.get("q"))
        rows = rows.filter((row) =>
          [row.reference, row.title, row.contact_name, row.company_name].some((value) =>
            match(value, params.get("q")!),
          ),
        );
      if (params.get("owner_id"))
        rows = rows.filter((row) => row.owner_id === params.get("owner_id"));
      if (params.get("stage_id"))
        rows = rows.filter((row) => row.stage_id === params.get("stage_id"));
      if (params.get("source_id"))
        rows = rows.filter((row) => row.source_id === params.get("source_id"));
      if (params.get("product_id"))
        rows = rows.filter((row) => opportunityHasProduct(row, params.get("product_id")!));
      if (params.get("status") === "active")
        rows = rows.filter((row) => row.stage_semantic_type === "ACTIVE");
      if (params.get("status") === "won")
        rows = rows.filter((row) => row.stage_semantic_type === "WON");
      if (params.get("status") === "lost")
        rows = rows.filter((row) => row.stage_semantic_type === "LOST");
      const hasCreationBounds = params.has("created_from") || params.has("created_to");
      const hasCloseBounds = params.has("close_from") || params.has("close_to");
      if (hasCreationBounds && hasCloseBounds) {
        rows = filterByDateBounds(
          rows,
          "created_at",
          params.get("created_from"),
          params.get("created_to"),
        );
        rows = filterByDateBounds(
          rows,
          "expected_close_date",
          params.get("close_from"),
          params.get("close_to"),
        );
      } else {
        rows = filteredByDates(rows, params, hasCloseBounds ? "expected_close_date" : "created_at");
      }
      return json(
        page(
          rows.map((row) => hydrateOpportunity(state, row, user)),
          params,
        ),
      );
    }
    if (!id && method === "POST") {
      requireRole(state, ["ADMIN", "MANAGER", "SALES", "TRIAGE"]);
      return json(hydrateOpportunity(state, createOpportunity(state, body)), 201);
    }
    const record = state.opportunities.find((row) => row.id === id);
    if (!record) fail(404, "Opportunity not found", "NOT_FOUND");
    if (action === "history" && method === "GET") return json({ items: record.history ?? [] });
    if (action === "archive" && method === "POST") {
      requireOpportunityWriter(user, record);
      record.archived_at = now();
      record.updated_at = now();
      addAudit(state, "ARCHIVE", "opportunity", id!, null, { archived_at: record.archived_at });
      return json({ archived_at: record.archived_at });
    }
    if (action === "restore" && method === "POST") {
      requireOpportunityWriter(user, record);
      record.archived_at = null;
      record.updated_at = now();
      addAudit(state, "RESTORE", "opportunity", id!, null, record);
      return json({ archived_at: null });
    }
    if (action === "stage" && method === "POST") {
      requireRole(state, ["ADMIN", "MANAGER", "SALES", "TRIAGE"]);
      requireOwnedOpportunity(user, record);
      const stage = state.stages.find((item) => item.id === body.to_stage_id);
      if (!stage)
        fail(422, "Choose a valid pipeline stage", "VALIDATION_ERROR", {
          to_stage_id: "Choose a stage",
        });
      if (stage.semantic_type === "LOST" && state.loss_reason_required && !body.loss_reason_id)
        fail(422, "Choose a loss reason", "VALIDATION_ERROR", {
          loss_reason_id: "Choose a reason",
        });
      const previous = state.stages.find((item) => item.id === record.stage_id);
      const before = { stage_id: record.stage_id, stage_name: previous?.name };
      record.stage_id = stage.id;
      record.stage_name = stage.name;
      record.stage_semantic_type = stage.semantic_type;
      record.stage_color = stage.color;
      record.probability = stage.probability;
      record.updated_at = now();
      record.closed_at = stage.semantic_type === "ACTIVE" ? null : now();
      if (stage.semantic_type === "LOST") {
        record.loss_reason_id = body.loss_reason_id ?? null;
        record.loss_reason_name =
          state.loss_reasons.find((item) => item.id === body.loss_reason_id)?.name ?? null;
        record.loss_note = body.loss_note ?? null;
      }
      if (previous && previous.semantic_type !== "ACTIVE" && stage.semantic_type === "ACTIVE")
        record.reopened = true;
      record.history.unshift({
        id: newId("history"),
        from_stage_id: previous?.id ?? null,
        from_stage_name: previous?.name ?? null,
        to_stage_id: stage.id,
        to_stage_name: stage.name,
        changed_by: user.id,
        changed_by_name: user.display_name,
        reason: body.reason ?? null,
        changed_at: now(),
      });
      addAudit(state, "STAGE_CHANGE", "opportunity", id!, before, {
        stage_id: stage.id,
        stage_name: stage.name,
      });
      addActivity(state, "STATUS_CHANGE", `Moved to ${stage.name}`, {
        contact_id: record.primary_contact_id,
        company_id: record.company_id,
        opportunity_id: record.id,
      });
      return json(hydrateOpportunity(state, record, user));
    }
    if (!action && method === "GET") return json(hydrateOpportunity(state, record, user));
    if (!action && method === "PATCH") {
      requireOpportunityWriter(user, record);
      const before = structuredClone(record);
      if (body.owner_id && user.role !== "ADMIN" && user.role !== "MANAGER")
        fail(403, "Only a manager can reassign an opportunity", "FORBIDDEN");
      Object.assign(record, body, { updated_at: now() });
      if (body.owner_id)
        record.owner_name =
          DEMO_USERS.find((item) => item.id === body.owner_id)?.display_name ?? null;
      if ("sales_representative_id" in body)
        record.sales_representative_name = body.sales_representative_id
          ? (state.reps.find((item) => item.id === body.sales_representative_id)?.name ?? null)
          : null;
      if (body.products) {
        record.product_id = body.products[0]?.product_id ?? null;
        record.products = body.products.map((line: Row) => ({
          ...line,
          id: newId("line"),
          product_name:
            state.products.find((item) => item.id === line.product_id)?.name ?? "Demo service",
        }));
      }
      calculateOpportunity(state, record);
      addAudit(state, "UPDATE", "opportunity", id!, before, record);
      addActivity(state, "SYSTEM_EVENT", "Opportunity updated", {
        contact_id: record.primary_contact_id,
        company_id: record.company_id,
        opportunity_id: id,
      });
      return json(hydrateOpportunity(state, record, user));
    }
  }

  if (root === "pipeline-stages") {
    if (!id && method === "GET")
      return json({ items: state.stages.slice().sort((a, b) => a.sort_order - b.sort_order) });
    if (!id && method === "POST") {
      requireRole(state, ["ADMIN"]);
      const record = {
        id: newId("stage"),
        name: body.name,
        semantic_type: body.semantic_type ?? "ACTIVE",
        probability: Number(body.probability ?? 0),
        sort_order: Number(body.sort_order ?? state.stages.length + 1),
        color: body.color ?? "slate",
        active: body.active ?? true,
      };
      state.stages.push(record);
      addAudit(state, "CREATE", "pipeline_stage", record.id, null, record);
      return json(record, 201);
    }
    const record = state.stages.find((row) => row.id === id);
    if (!record) fail(404, "Pipeline stage not found", "NOT_FOUND");
    if (method === "PATCH") {
      requireRole(state, ["ADMIN"]);
      const before = { ...record };
      Object.assign(record, body, {
        probability: body.probability === undefined ? record.probability : Number(body.probability),
      });
      addAudit(state, "UPDATE", "pipeline_stage", id!, before, record);
      return json(record);
    }
  }
  if (root === "users" && method === "GET")
    return json({
      items: DEMO_USERS.map(({ id, display_name, role }) => ({ id, display_name, role })),
    });

  if (root === "activities") {
    if (!id && method === "GET") {
      let rows = state.activities;
      for (const key of ["contact_id", "company_id", "opportunity_id", "activity_type"] as const)
        if (params.get(key)) rows = rows.filter((row) => row[key] === params.get(key));
      rows = filteredByDates(rows, params, "occurred_at");
      rows = rows.slice().sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
      return json(page(rows, params));
    }
    if (!id && method === "POST") {
      if (!body.contact_id && !body.company_id && !body.opportunity_id)
        fail(422, "Link this activity to a customer, company, or opportunity", "VALIDATION_ERROR", {
          contact_id: "Choose a record",
        });
      const record = addActivity(state, body.activity_type, body.description, body);
      if (body.occurred_at) record.occurred_at = body.occurred_at;
      addAudit(state, "CREATE", "activity", record.id, null, record);
      return json(record, 201);
    }
    const record = state.activities.find((row) => row.id === id);
    if (!record) fail(404, "Activity not found", "NOT_FOUND");
    if (method === "GET") return json(record);
    if (method === "PATCH") {
      requireRole(state, ["ADMIN", "MANAGER", "SALES"]);
      if (user.role === "SALES" && record.created_by !== user.id)
        fail(403, "You can only edit your own activity notes", "FORBIDDEN");
      if (["SYSTEM_EVENT", "STATUS_CHANGE"].includes(record.activity_type))
        fail(403, "System activities cannot be edited", "FORBIDDEN");
      const before = { ...record };
      Object.assign(record, body);
      addAudit(state, "UPDATE", "activity", id!, before, record);
      return json(record);
    }
  }
  if (root === "audit" && method === "GET") {
    requireRole(state, ["ADMIN"]);
    let rows = state.audit;
    for (const key of ["entity_type", "entity_id", "actor_id", "action", "correlation_id"] as const)
      if (params.get(key))
        rows = rows.filter((row) =>
          String(row[key]).toLowerCase().includes(params.get(key)!.toLowerCase()),
        );
    rows = filteredByDates(rows, params, "occurred_at");
    return json(page(rows, params));
  }

  if (root === "dashboard" && id && method === "GET") {
    if (id === "revenue") requireRole(state, ["ADMIN", "MANAGER", "SALES", "FINANCE"]);
    return json(dashboard(state, id, params));
  }
  if (root === "sales-representatives") {
    if (!id && method === "GET")
      return json({
        items: params.has("active")
          ? state.reps.filter((row) => row.active === (params.get("active") === "true"))
          : state.reps,
      });
    if (!id && method === "POST") {
      requireRole(state, ["ADMIN"]);
      const record = {
        id: newId("rep"),
        name: body.name,
        active: body.active ?? true,
        sort_order: Number(body.sort_order ?? state.reps.length + 1),
      };
      state.reps.push(record);
      addAudit(state, "CREATE", "sales_representative", record.id, null, record);
      return json(record, 201);
    }
    const record = state.reps.find((row) => row.id === id);
    if (!record) fail(404, "Sales representative not found", "NOT_FOUND");
    if (method === "PATCH") {
      requireRole(state, ["ADMIN"]);
      const before = { ...record };
      Object.assign(record, body);
      addAudit(state, "UPDATE", "sales_representative", id!, before, record);
      return json(record);
    }
  }
  if (root === "loss-reasons" && method === "GET")
    return json({
      items: params.has("active")
        ? state.loss_reasons.filter((row) => row.active === (params.get("active") === "true"))
        : state.loss_reasons,
      required: state.loss_reason_required,
    });
  if (root === "settings" && id === "loss-reason-required" && method === "PATCH") {
    requireRole(state, ["ADMIN"]);
    state.loss_reason_required = Boolean(body.required);
    addAudit(state, "UPDATE", "setting", "loss_reason_required", null, {
      required: state.loss_reason_required,
    });
    return json({ required: state.loss_reason_required });
  }

  if (root === "kiosk" && id === "inquiries" && method === "POST") {
    requireRole(state, ["ADMIN", "OPERATIONS"]);
    if (!body.consent)
      fail(422, "Consent is required to submit this inquiry", "VALIDATION_ERROR", {
        consent: "Consent is required",
      });
    let contact = state.contacts.find((item) => item.id === body.contact_id);
    if (!contact && body.new_contact)
      contact = createContact(state, {
        ...body.new_contact,
        company_id: null,
        confirm_duplicate: body.confirm_duplicate,
      });
    if (!contact)
      fail(422, "Select a customer or enter new customer details", "VALIDATION_ERROR", {
        contact_id: "Select a customer",
      });
    let companyId = contact.company_id;
    if (body.company_name && !companyId) {
      let company = state.companies.find(
        (item) => item.name.toLowerCase() === String(body.company_name).toLowerCase(),
      );
      if (!company) company = createCompany(state, { name: body.company_name });
      companyId = company.id;
      contact.company_id = companyId;
      contact.company_name = company.name;
    }
    state.consents.unshift({
      id: newId("consent"),
      contact_id: contact.id,
      accepted: true,
      marketing_opt_in: Boolean(body.marketing_opt_in),
      accepted_at: now(),
      wording: "Aster Advisory demo inquiry consent",
    });
    const opportunity = createOpportunity(state, {
      primary_contact_id: contact.id,
      company_id: companyId,
      products: [{ product_id: body.product_id, quantity: "1" }],
      notes: body.notes,
    });
    return json(
      {
        id: opportunity.id,
        reference: opportunity.reference,
        contact_id: contact.id,
        contact_name: contactName(contact),
        company_name: state.companies.find((item) => item.id === companyId)?.name ?? null,
        product_name: opportunity.products[0]?.product_name ?? "Advisory inquiry",
        stage_name: opportunity.stage_name,
        created_at: opportunity.created_at,
      },
      201,
    );
  }
  if (
    root === "kiosk" &&
    id === "contacts" &&
    action &&
    subaction === "reveal" &&
    method === "POST"
  ) {
    requireRole(state, ["ADMIN", "MANAGER", "SALES", "OPERATIONS", "FINANCE", "TRIAGE"]);
    const contact = state.contacts.find((item) => item.id === action);
    if (!contact) fail(404, "Customer not found", "NOT_FOUND");
    addAudit(state, "REVEAL_CONTACT", "contact", action, null, { fields: ["email", "phone"] });
    return json({ email: contact.email, phone: contact.phone });
  }
  if (root === "kiosk" && id === "contacts" && action && !subaction && method === "PATCH") {
    requireRole(state, ["ADMIN", "OPERATIONS"]);
    const contact = state.contacts.find((item) => item.id === action);
    if (!contact) fail(404, "Customer not found", "NOT_FOUND");
    checkDuplicate(state, body.email, action, body.confirm_duplicate);
    const before = { ...contact };
    for (const key of ["first_name", "last_name", "email", "phone"] as const)
      if (body[key] !== undefined) contact[key] = body[key] || null;
    if (body.company_name !== undefined) {
      let company = body.company_name
        ? state.companies.find(
            (item) => item.name.toLowerCase() === String(body.company_name).toLowerCase(),
          )
        : null;
      if (body.company_name && !company)
        company = createCompany(state, { name: body.company_name });
      contact.company_id = company?.id ?? null;
      contact.company_name = company?.name ?? null;
    }
    contact.updated_at = now();
    addAudit(state, "UPDATE", "contact", action, before, contact);
    return json(hydrateContact(state, contact));
  }

  fail(404, `No demo handler for ${method} ${path}`, "NOT_FOUND");
}

/** Same-origin, sessionStorage-backed transport. It never delegates to network fetch. */
export async function demoFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof window === "undefined")
    throw new Error("The Aster demo API can only run in a browser session");
  if (init?.signal?.aborted) throw new DOMException("The request was aborted", "AbortError");
  const url = new URL(
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
    window.location.origin,
  );
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const state = readState();
  try {
    const response = handle(
      state,
      url,
      method,
      syntheticMutationPayload(state, url, method, payload(init)),
    );
    if (response.status !== 204) writeState(state);
    return response;
  } catch (error) {
    if (error instanceof HttpFailure)
      return json(
        {
          error: {
            code: error.code,
            message: error.message,
            fields: error.fields,
            duplicates: error.duplicates,
          },
        },
        error.status,
      );
    return json(
      { error: { code: "DEMO_ERROR", message: "The demo request could not be completed" } },
      500,
    );
  }
}
