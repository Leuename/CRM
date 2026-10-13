import { demoFetch } from "./demo-fetch";
// Data-access layer. UI components never call fetch directly.
// The browser-local demo simulator handles session identity and CRM responses.

// DS Tag tones — re-exported so lib/contacts.ts stays decoupled from the DS.
export type Tone = "primary" | "blue" | "lightblue" | "yellow" | "red" | "grey";

// ContactSummary (list rows). See API contract  /contacts.
export interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  client_status: string;
  company_id: string | null;
  company_name: string | null;
  source_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ContactDetail = ContactSummary + notes/created_by/archived_at.
export interface ContactDetail extends Contact {
  notes: string | null;
  created_by: string;
  archived_at: string | null;
}

// Write shape for POST/PATCH. All optional except first_name on create; the
// server validates and is the authority on required fields.
export interface ContactInput {
  first_name?: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  company_id?: string | null;
  source_id?: string | null;
  client_status?: string;
  notes?: string | null;
  tags?: string[];
  confirm_duplicate?: boolean;
}

export interface LeadSource {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
}

export interface OpportunityRef {
  id: string;
  // Optional here, unlike on OpportunitySummary/Detail: GET /contacts/{id}/opportunities
  // serves this narrower shape and is not part of the reference rollout, so the
  // kiosk renders the handle only when the server actually sends one.
  reference?: string | null;
  title: string;
  stage_id: string;
  expected_close_date: string | null;
  total_revenue_ex_vat: string | null;

  total_revenue_inc_vat: string | null;
  currency: string | null;
  created_at: string;
}

export interface ActivityRef {
  id: string;
  activity_type: string;
  description: string | null;
  occurred_at: string;
  created_at: string;
}

// A probable-duplicate match returned in a 409 DUPLICATE_WARNING envelope.
export interface DuplicateMatch {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

// Carries the HTTP status so callers can branch (401 → sign in, 4xx → show the
// server's message, 5xx → generic failure). `code` is the  envelope code.
// `fields` carries per-field validation messages (422); `duplicates` carries
// the probable matches for a 409 DUPLICATE_WARNING.
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fields?: Record<string, string>;
  readonly duplicates?: DuplicateMatch[];
  constructor(
    status: number,
    message: string,
    code?: string,
    fields?: Record<string, string>,
    duplicates?: DuplicateMatch[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.duplicates = duplicates;
  }
}

// Reads the  error envelope { error: { code, message, fields?, duplicates? } };
// tolerates a non-JSON body (e.g. a proxy 502).
async function toApiError(res: Response): Promise<ApiError> {
  let code: string | undefined;
  let message = `Request failed with status ${res.status}`;
  let fields: Record<string, string> | undefined;
  let duplicates: DuplicateMatch[] | undefined;
  try {
    const body = (await res.json()) as {
      error?: {
        code?: string;
        message?: string;
        fields?: Record<string, unknown>;
        duplicates?: DuplicateMatch[];
      };
    };
    if (body?.error) {
      code = body.error.code;
      if (body.error.message) message = body.error.message;
      if (body.error.fields && typeof body.error.fields === "object") {
        fields = {};
        for (const [key, val] of Object.entries(body.error.fields)) {
          // Coerce array/string/other into a single displayable message.
          fields[key] = Array.isArray(val) ? String(val[0] ?? "") : String(val);
        }
      }
      if (Array.isArray(body.error.duplicates)) duplicates = body.error.duplicates;
    }
  } catch {
    // non-JSON body — keep the generic message
  }
  return new ApiError(res.status, message, code, fields, duplicates);
}

const jsonHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export async function login(email: string, password: string): Promise<User> {
  const res = await demoFetch(`/api/v1/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw await toApiError(res);
  const body = (await res.json()) as { user: User };
  return body.user;
}

// Idempotent: the endpoint returns 204 whether or not a session existed.
export async function logout(): Promise<void> {
  await demoFetch(`/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}

export async function getMe(signal?: AbortSignal): Promise<User> {
  const res = await demoFetch(`/api/v1/auth/me`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as User;
}

export interface ListContactsParams {
  limit: number;
  offset: number;
  q?: string;
  client_status?: string;
  source_id?: string;
  tags?: string[];
  archived?: boolean;
}

export async function listContacts(
  params: ListContactsParams,
  signal?: AbortSignal,
): Promise<Page<Contact>> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.q) query.set("q", params.q);
  if (params.client_status) query.set("client_status", params.client_status);
  if (params.source_id) query.set("source_id", params.source_id);
  if (params.archived) query.set("archived", "true");
  for (const tag of params.tags ?? []) query.append("tags", tag);

  const res = await demoFetch(`/api/v1/contacts?${query}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Page<Contact>;
}

export async function getContact(id: string, signal?: AbortSignal): Promise<ContactDetail> {
  const res = await demoFetch(`/api/v1/contacts/${id}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as ContactDetail;
}

export async function createContact(payload: ContactInput): Promise<ContactDetail> {
  const res = await demoFetch(`/api/v1/contacts`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as ContactDetail;
}

export async function updateContact(id: string, payload: ContactInput): Promise<ContactDetail> {
  const res = await demoFetch(`/api/v1/contacts/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as ContactDetail;
}

// Archive/restore are idempotent 200s. The response body is unspecified in the
// contract, so callers re-fetch the contact/list rather than trusting it.
export async function archiveContact(id: string): Promise<void> {
  const res = await demoFetch(`/api/v1/contacts/${id}/archive`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
}

export async function restoreContact(id: string): Promise<void> {
  const res = await demoFetch(`/api/v1/contacts/${id}/restore`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
}

export async function getContactOpportunities(
  id: string,
  signal?: AbortSignal,
): Promise<OpportunityRef[]> {
  const res = await demoFetch(`/api/v1/contacts/${id}/opportunities`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  const body = (await res.json()) as { items: OpportunityRef[] };
  return body.items;
}

export async function listLeadSources(signal?: AbortSignal): Promise<LeadSource[]> {
  const res = await demoFetch(`/api/v1/lead-sources`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  const body = (await res.json()) as { items: LeadSource[] };
  return body.items;
}

// CompanySummary (list rows). contact_count = non-archived contacts joined.
export interface Company {
  id: string;
  name: string;
  legal_name: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  employee_count: number | null;
  contact_count: number;
  created_at: string;
  updated_at: string;
}

// CompanyDetail = CompanySummary + billing_address/notes/archived_at.
// billing_address is JSONB (COMP2): displayed if present, no structured editor
// in Phase 1. Shape is intentionally open until billing (Phase 3) fixes it.
export interface CompanyDetail extends Company {
  billing_address: Record<string, unknown> | null;
  notes: string | null;
  archived_at: string | null;
}

export interface BillingAddress {
  street?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
}

export interface CompanyInput {
  name?: string;
  legal_name?: string | null;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  employee_count?: number | null;
  billing_address?: BillingAddress | null;
  notes?: string | null;
}

export interface ListCompaniesParams {
  limit: number;
  offset: number;
  q?: string;
  archived?: boolean;
}

export async function listCompanies(
  params: ListCompaniesParams,
  signal?: AbortSignal,
): Promise<Page<Company>> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.q) query.set("q", params.q);
  if (params.archived) query.set("archived", "true");

  const res = await demoFetch(`/api/v1/companies?${query}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Page<Company>;
}

export async function getCompany(id: string, signal?: AbortSignal): Promise<CompanyDetail> {
  const res = await demoFetch(`/api/v1/companies/${id}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as CompanyDetail;
}

export async function createCompany(payload: CompanyInput): Promise<CompanyDetail> {
  const res = await demoFetch(`/api/v1/companies`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as CompanyDetail;
}

export async function updateCompany(id: string, payload: CompanyInput): Promise<CompanyDetail> {
  const res = await demoFetch(`/api/v1/companies/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as CompanyDetail;
}

// Archive/restore are idempotent 200s; callers re-fetch rather than trust the body.
export async function archiveCompany(id: string): Promise<void> {
  const res = await demoFetch(`/api/v1/companies/${id}/archive`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
}

export async function restoreCompany(id: string): Promise<void> {
  const res = await demoFetch(`/api/v1/companies/${id}/restore`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
}

export async function getCompanyContacts(id: string, signal?: AbortSignal): Promise<Contact[]> {
  const res = await demoFetch(`/api/v1/companies/${id}/contacts?limit=100&offset=0`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  const body = (await res.json()) as { items: Contact[] };
  return body.items;
}

export async function getCompanyOpportunities(
  id: string,
  signal?: AbortSignal,
): Promise<OpportunityRef[]> {
  const res = await demoFetch(`/api/v1/companies/${id}/opportunities`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  const body = (await res.json()) as { items: OpportunityRef[] };
  return body.items;
}

export interface Product {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  default_price: string | null;
  // What default_price is charged per — "hour", "seat", "month" — or null where
  // the price stands on its own. Printed after a slash: "₱1,800 / hour".
  price_unit: string | null;
  currency: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Write shape for POST/PATCH. All optional except name on create; the server
// validates and is the authority (bad decimal / negative price / bad currency → 422).
// default_price is sent as the raw string the user typed (or null) — never a number.
export interface ProductInput {
  name?: string;
  category?: string | null;
  description?: string | null;
  default_price?: string | null;
  currency?: string;
  active?: boolean;
}

export interface ListProductsParams {
  limit: number;
  offset: number;
  q?: string;
  category?: string;
  // omit = all; true = active only; false = inactive only.
  active?: boolean;
}

export async function listProducts(
  params: ListProductsParams,
  signal?: AbortSignal,
): Promise<Page<Product>> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.active !== undefined) query.set("active", String(params.active));

  const res = await demoFetch(`/api/v1/products?${query}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Page<Product>;
}

export async function getProduct(id: string, signal?: AbortSignal): Promise<Product> {
  const res = await demoFetch(`/api/v1/products/${id}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Product;
}

export async function createProduct(payload: ProductInput): Promise<Product> {
  const res = await demoFetch(`/api/v1/products`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Product;
}

export async function updateProduct(id: string, payload: ProductInput): Promise<Product> {
  const res = await demoFetch(`/api/v1/products/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Product;
}

// OpportunitySummary (list rows). Money fields are null when masked for callers
// lacking view_revenue (SECURITY boundary lives on the server).
export interface OpportunitySummary {
  id: string;
  // The customer-facing handle ("INQ-0184"). Printed on the kiosk and matched by
  // GET /opportunities?q=, so a walk-in can be found by the number on their slip.
  reference: string;
  title: string;
  primary_contact_id: string;
  contact_name: string | null;
  company_id: string | null;
  company_name: string | null;
  owner_id: string;
  owner_name: string | null;
  stage_id: string;
  stage_name: string;
  stage_semantic_type: string;
  stage_color: string;
  probability: number | null;
  expected_close_date: string | null;
  total_revenue_ex_vat: string | null; // NET; masked → null
  total_revenue_inc_vat: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  //  Q9. Server-DERIVED from this deal's own stage history: true iff it has
  // ever moved from a Won/Lost stage back to an active one. Not a column, so it
  // cannot drift, and it survives every later ordinary stage move.
  reopened: boolean;
}

// One nested product line. line_total is computed-on-read by the server;
// unit_price and line_total are nulled when masked. quantity is a decimal string.
export interface OpportunityLine {
  id: string;
  product_id: string;
  product_name: string;
  service_term: ServiceTerm | null;
  vat_exempt: boolean;
  // Both masked alongside line_total: either one alone divides back to the net.
  vat_amount: string | null;
  line_total_inc_vat: string | null;
  quantity: string;
  unit_price: string | null;
  discount_percent: string | null;
  line_total: string | null; // server-computed; masked → null
  notes: string | null;
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  preferred_schedule: string | null; // free text: "9am-6pm, weekdays only"
}

export const SERVICE_TERMS = ["ONCE", "DAILY", "WEEKLY", "MONTHLY", "ANNUALLY"] as const;
export type ServiceTerm = (typeof SERVICE_TERMS)[number];

export const SERVICE_TERM_LABELS: Record<ServiceTerm, string> = {
  ONCE: "Once",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  ANNUALLY: "Annually",
};

// OpportunityDetail = Summary + header extras + nested product lines.
export interface OpportunityDetail extends OpportunitySummary {
  team_size: number | null;
  service_start_date: string | null;
  service_end_date: string | null;
  service_start_time: string | null;
  service_end_time: string | null;
  service_term: ServiceTerm | null;
  vat_exempt: boolean;
  sales_representative_id: string | null;
  // Resolved server-side, and still returned when the representative has been
  // deactivated — retiring someone must not blank the deals they closed.
  sales_representative_name: string | null;
  service_term_text: string | null;
  selling_price_ex_vat: string | null; // masked → null
  discount_percent: string | null; // masked → null
  notes: string | null;
  closed_at: string | null;
  //  Q8. Set on the transition INTO a Lost stage and never cleared by a later
  // move — "why this deal was lost" is history. loss_reason_name is resolved
  // server-side and is still returned when the reason has been retired.
  loss_reason_id: string | null;
  loss_reason_name: string | null;
  loss_note: string | null;
  products: OpportunityLine[];
}

// Write shape for a product line. quantity/unit_price/discount_percent are the
// raw strings the user typed (or null) — never numbers. The server validates and
// re-computes; the client never submits a line_total.
export interface OpportunityLineInput {
  product_id: string;
  vat_exempt?: boolean;
  quantity?: string;
  unit_price?: string | null;
  discount_percent?: string;
  notes?: string | null;
  start_date?: string | null;
  start_time?: string | null;
  end_date?: string | null;
  end_time?: string | null;
  preferred_schedule?: string | null;
}

export interface NewContactInput {
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  source_id?: string | null;
  // An existing company for a new contact. Mutually exclusive with new_company.
  company_id?: string | null;
  confirm_duplicate?: boolean;
}

export interface NewCompanyInput {
  name: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  legal_name?: string | null;
  employee_count?: number | null;
  billing_address?: BillingAddress | null;
  notes?: string | null;
}

export interface OpportunityCreateInput {
  // Optional because new_contact is the other half of the pair — supplying both
  // or neither is a 422, so neither field can be required on its own.
  primary_contact_id?: string;
  new_contact?: NewContactInput;
  // Only alongside new_contact, and never with a top-level company_id.
  new_company?: NewCompanyInput;
  company_id?: string | null;
  team_size?: number | null;
  expected_close_date?: string | null;
  service_term?: ServiceTerm | null;
  vat_exempt?: boolean;
  sales_representative_id?: string | null;
  selling_price_ex_vat?: string | null;
  discount_percent?: string;
  currency?: string;
  notes?: string | null;
  products?: OpportunityLineInput[];
}

// PATCH /opportunities/{id} body — all fields optional (partial). NO stage_id
// (transitions go through /stage only). owner_id requires reassign_opportunity_owner
// server-side (403 otherwise). products present → replace-all; omitted → untouched.
export interface OpportunityUpdateInput {
  // no `title` — server-generated (see OpportunityCreateInput)
  primary_contact_id?: string;
  company_id?: string | null;
  team_size?: number | null;
  expected_close_date?: string | null;
  service_term?: ServiceTerm | null;
  vat_exempt?: boolean;
  sales_representative_id?: string | null;
  selling_price_ex_vat?: string | null;
  discount_percent?: string;
  currency?: string;
  notes?: string | null;
  owner_id?: string;
  products?: OpportunityLineInput[];
}

export interface StageChangeRequest {
  to_stage_id: string;
  reason?: string | null;
  loss_reason_id?: string | null;
  loss_note?: string | null;
}

export interface StageHistoryEntry {
  id: string;
  from_stage_id: string | null;
  from_stage_name: string | null;
  to_stage_id: string;
  to_stage_name: string;
  changed_by: string;
  changed_by_name: string | null;
  reason: string | null;
  changed_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  semantic_type: string;
  probability: number | null;
  sort_order: number;
  color: string;
  active: boolean;
}

export interface UserRef {
  id: string;
  display_name: string;
  role: string;
}

export interface ListOpportunitiesParams {
  limit: number;
  offset: number;
  q?: string;
  owner_id?: string;
  stage_id?: string;
  source_id?: string;
  product_id?: string;
  status?: "active" | "won" | "lost";
  close_from?: string;
  close_to?: string;
  created_from?: string;
  created_to?: string;
  archived?: boolean;
}

export async function listOpportunities(
  params: ListOpportunitiesParams,
  signal?: AbortSignal,
): Promise<Page<OpportunitySummary>> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.q) query.set("q", params.q);
  if (params.owner_id) query.set("owner_id", params.owner_id);
  if (params.stage_id) query.set("stage_id", params.stage_id);
  if (params.source_id) query.set("source_id", params.source_id);
  if (params.product_id) query.set("product_id", params.product_id);
  if (params.status) query.set("status", params.status);
  if (params.close_from) query.set("close_from", params.close_from);
  if (params.close_to) query.set("close_to", params.close_to);
  if (params.created_from) query.set("created_from", params.created_from);
  if (params.created_to) query.set("created_to", params.created_to);
  if (params.archived) query.set("archived", "true");

  const res = await demoFetch(`/api/v1/opportunities?${query}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Page<OpportunitySummary>;
}

export async function getOpportunity(id: string, signal?: AbortSignal): Promise<OpportunityDetail> {
  const res = await demoFetch(`/api/v1/opportunities/${id}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as OpportunityDetail;
}

export async function createOpportunity(
  payload: OpportunityCreateInput,
): Promise<OpportunityDetail> {
  const res = await demoFetch(`/api/v1/opportunities`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as OpportunityDetail;
}

export async function updateOpportunity(
  id: string,
  payload: OpportunityUpdateInput,
): Promise<OpportunityDetail> {
  const res = await demoFetch(`/api/v1/opportunities/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as OpportunityDetail;
}

// Archive/restore are idempotent 200s; callers re-fetch rather than trust the body.
export async function archiveOpportunity(id: string): Promise<void> {
  const res = await demoFetch(`/api/v1/opportunities/${id}/archive`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
}

export async function restoreOpportunity(id: string): Promise<void> {
  const res = await demoFetch(`/api/v1/opportunities/${id}/restore`, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
}

// Records a stage transition (always appends a history row server-side). Returns
// the refreshed detail. 403 when the caller is neither owner nor elevated.
export async function changeStage(
  id: string,
  payload: StageChangeRequest,
): Promise<OpportunityDetail> {
  const res = await demoFetch(`/api/v1/opportunities/${id}/stage`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as OpportunityDetail;
}

export async function getOpportunityHistory(
  id: string,
  signal?: AbortSignal,
): Promise<StageHistoryEntry[]> {
  const res = await demoFetch(`/api/v1/opportunities/${id}/history`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  const body = (await res.json()) as { items: StageHistoryEntry[] };
  return body.items;
}

export async function listPipelineStages(signal?: AbortSignal): Promise<PipelineStage[]> {
  const res = await demoFetch(`/api/v1/pipeline-stages`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  const body = (await res.json()) as { items: PipelineStage[] };
  return body.items;
}

export interface PipelineStageInput {
  name?: string;
  semantic_type?: string;
  probability?: string;
  sort_order?: number;
  color?: string | null;
  active?: boolean;
}

export async function createPipelineStage(payload: PipelineStageInput): Promise<PipelineStage> {
  const res = await demoFetch(`/api/v1/pipeline-stages`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as PipelineStage;
}

export async function updatePipelineStage(
  id: string,
  payload: PipelineStageInput,
): Promise<PipelineStage> {
  const res = await demoFetch(`/api/v1/pipeline-stages/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as PipelineStage;
}

export async function listUsers(signal?: AbortSignal): Promise<UserRef[]> {
  const res = await demoFetch(`/api/v1/users`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  const body = (await res.json()) as { items: UserRef[] };
  return body.items;
}

export interface Activity {
  id: string;
  activity_type: string;
  description: string;
  occurred_at: string;
  contact_id: string | null;
  company_id: string | null;
  opportunity_id: string | null;
  created_by: string;
  created_by_name: string | null;
  created_at: string;
}

// POST body. At least one of contact_id/company_id/opportunity_id is required
// (server 422s if none). occurred_at omitted → server defaults now().
// created_by is the authenticated user (any body value is ignored).
export interface ActivityCreateInput {
  activity_type: string;
  description: string;
  occurred_at?: string;
  contact_id?: string | null;
  company_id?: string | null;
  opportunity_id?: string | null;
}

// PATCH body — all optional. activity_type may not be set to a system type, and
// system-type activities cannot be edited at all (server 403).
export interface ActivityUpdateInput {
  description?: string;
  occurred_at?: string;
  activity_type?: string;
}

export interface ListActivitiesParams {
  limit: number;
  offset: number;
  contact_id?: string;
  company_id?: string;
  opportunity_id?: string;
  activity_type?: string;
  occurred_from?: string;
  occurred_to?: string;
}

export async function listActivities(
  params: ListActivitiesParams,
  signal?: AbortSignal,
): Promise<Page<Activity>> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.contact_id) query.set("contact_id", params.contact_id);
  if (params.company_id) query.set("company_id", params.company_id);
  if (params.opportunity_id) query.set("opportunity_id", params.opportunity_id);
  if (params.activity_type) query.set("activity_type", params.activity_type);
  if (params.occurred_from) query.set("occurred_from", params.occurred_from);
  if (params.occurred_to) query.set("occurred_to", params.occurred_to);

  const res = await demoFetch(`/api/v1/activities?${query}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Page<Activity>;
}

export async function getActivity(id: string, signal?: AbortSignal): Promise<Activity> {
  const res = await demoFetch(`/api/v1/activities/${id}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Activity;
}

export async function createActivity(payload: ActivityCreateInput): Promise<Activity> {
  const res = await demoFetch(`/api/v1/activities`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Activity;
}

export async function updateActivity(id: string, payload: ActivityUpdateInput): Promise<Activity> {
  const res = await demoFetch(`/api/v1/activities/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as Activity;
}

export interface AuditEvent {
  id: string;
  occurred_at: string;
  actor_id: string;
  actor_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  correlation_id: string | null;
}

export type AuditPage = Page<AuditEvent>;

export interface ListAuditParams {
  limit: number;
  offset: number;
  entity_type?: string;
  entity_id?: string;
  actor_id?: string;
  action?: string;
  correlation_id?: string;
  date_from?: string;
  date_to?: string;
}

export async function listAudit(params: ListAuditParams, signal?: AbortSignal): Promise<AuditPage> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.entity_type) query.set("entity_type", params.entity_type);
  if (params.entity_id) query.set("entity_id", params.entity_id);
  if (params.actor_id) query.set("actor_id", params.actor_id);
  if (params.action) query.set("action", params.action);
  if (params.correlation_id) query.set("correlation_id", params.correlation_id);
  if (params.date_from) query.set("date_from", params.date_from);
  if (params.date_to) query.set("date_to", params.date_to);

  const res = await demoFetch(`/api/v1/audit?${query}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as AuditPage;
}

// Shared filter set for all four endpoints. `month` (YYYY-MM) is sugar for a
// from/to pair — the server 422s if it is combined with date_from/date_to.
// stage_id is structural and is ignored by /dashboard/pipeline.
export interface DashboardFilters {
  date_from?: string;
  date_to?: string;
  month?: string;
  owner_id?: string;
  source_id?: string;
  product_id?: string;
  stage_id?: string;
}

// The equal-length period immediately before the applied one (). Only
// period-bound metrics — snapshot metrics have no previous value. The server
// computes this; the client never derives a delta from two requests.
export interface DashboardSummaryPrevious {
  period_from: string; // ISO date
  period_to: string; // ISO date, inclusive
  total_inquiries: number;
  new_inquiries: number;
  won_opportunities: number;
  lost_opportunities: number;
  conversion_rate: string | null;
  won_revenue: string | null; // masked → null
}

export interface DashboardSummary {
  total_inquiries: number;
  new_inquiries: number;
  active_opportunities: number;
  won_opportunities: number;
  lost_opportunities: number;
  conversion_rate: string | null; // percent string ("66.67"); null when won+lost=0
  won_revenue: string | null; // masked → null
  active_pipeline_value: string | null; // masked → null
  weighted_pipeline_value: string | null; // masked → null
  currency: string;
  period_from: string | null; // echo of the applied period; null = open-ended
  period_to: string | null; // inclusive
  previous: DashboardSummaryPrevious | null; // null when the period is open-ended
}

export interface PipelineStageStat {
  stage_id: string;
  stage_name: string;
  semantic_type: string;
  stage_color: string | null;
  sort_order: number;
  count: number;
  value: string | null; // masked → null
}

export interface DashboardPipeline {
  items: PipelineStageStat[];
  currency: string;
}

export interface SourceStat {
  source_id: string | null;
  source_name: string | null; // null bucket is labelled "No source" by the server
  inquiries: number;
  won_revenue: string | null; // masked → null
}

export interface DashboardSources {
  items: SourceStat[];
  currency: string;
}

export interface RevenueMonth {
  month: string; // "YYYY-MM"
  won_revenue: string; // dense zero-filled ("0.00" for empty months)
}

export interface DashboardRevenue {
  items: RevenueMonth[];
  currency: string;
}

function dashboardQuery(filters: DashboardFilters): URLSearchParams {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  return query;
}

async function getDashboard<T>(
  path: string,
  filters: DashboardFilters,
  signal?: AbortSignal,
  // Non-filter query parameters (drill-down's metric + page). Kept out of
  // DashboardFilters because the four count endpoints do not accept them.
  extra?: Record<string, string>,
): Promise<T> {
  const query = dashboardQuery(filters);
  for (const [key, value] of Object.entries(extra ?? {})) query.set(key, value);
  const res = await demoFetch(`/api/v1/dashboard/${path}?${query}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

export function getDashboardSummary(
  filters: DashboardFilters,
  signal?: AbortSignal,
): Promise<DashboardSummary> {
  return getDashboard<DashboardSummary>("summary", filters, signal);
}

export function getDashboardPipeline(
  filters: DashboardFilters,
  signal?: AbortSignal,
): Promise<DashboardPipeline> {
  return getDashboard<DashboardPipeline>("pipeline", filters, signal);
}

export function getDashboardSources(
  filters: DashboardFilters,
  signal?: AbortSignal,
): Promise<DashboardSources> {
  return getDashboard<DashboardSources>("sources", filters, signal);
}

// Whole endpoint is gated on view_revenue: callers without it get 403 (not a
// masked body) — the dashboard catches that and shows an access empty state.
export function getDashboardRevenue(
  filters: DashboardFilters,
  signal?: AbortSignal,
): Promise<DashboardRevenue> {
  return getDashboard<DashboardRevenue>("revenue", filters, signal);
}

// The metric names the API accepts, mirrored from dashboard.METRICS. A value
// outside this set is a 422 there, so the union keeps it a compile error here.
export const DRILLDOWN_METRICS = [
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
] as const;
export type DrilldownMetric = (typeof DRILLDOWN_METRICS)[number];

// The donut's "No source" slice as a source_id. A null cannot travel as a query
// parameter, so the server reserves this literal for the null-source bucket.
export const NO_SOURCE = "none";

export interface DrilldownParams extends DashboardFilters {
  metric: DrilldownMetric;
  limit: number;
  offset: number;
}

export function getDashboardDrilldown(
  params: DrilldownParams,
  signal?: AbortSignal,
): Promise<Page<OpportunitySummary>> {
  const { metric, limit, offset, ...filters } = params;
  return getDashboard<Page<OpportunitySummary>>("drilldown", filters, signal, {
    metric,
    limit: String(limit),
    offset: String(offset),
  });
}

export interface SalesRepresentative {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
}

/** `activeOnly` for the opportunity picker; omit it in Settings to show retired ones. */
export async function listSalesRepresentatives(
  activeOnly?: boolean,
  signal?: AbortSignal,
): Promise<SalesRepresentative[]> {
  const qs = activeOnly === undefined ? "" : `?active=${activeOnly}`;
  const res = await demoFetch(`/api/v1/sales-representatives${qs}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return ((await res.json()) as { items: SalesRepresentative[] }).items;
}

export async function createSalesRepresentative(body: {
  name: string;
  active?: boolean;
  sort_order?: number;
}): Promise<SalesRepresentative> {
  const res = await demoFetch(`/api/v1/sales-representatives`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as SalesRepresentative;
}

/** No delete: a representative is retired with active=false so historical deals keep them. */
export async function updateSalesRepresentative(
  id: string,
  body: { name?: string; active?: boolean; sort_order?: number },
): Promise<SalesRepresentative> {
  const res = await demoFetch(`/api/v1/sales-representatives/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as SalesRepresentative;
}

// --- loss reasons + the one ADMIN switch ( Q8) ---------------------------
// A configurable list with STABLE ids, shaped exactly like sales representatives
// — renaming "Price" to "Budget" does not corrupt the deals already tagged with
// it. Read-only over HTTP: rows are edited directly until the owner asks for a
// settings screen (deferred by the design, not forgotten).

export interface LossReason {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
}

export interface LossReasonList {
  items: LossReason[];
  // Mirrors the ADMIN setting. A CONVENIENCE for the browser's pre-validation
  // message only — the rule is enforced in the server's stage-transition
  // service, which returns 422 naming loss_reason_id whatever the browser did.
  required: boolean;
}

/** `activeOnly` for the stage control's picker; omit it to include retired ones. */
export async function listLossReasons(
  activeOnly?: boolean,
  signal?: AbortSignal,
): Promise<LossReasonList> {
  const qs = activeOnly === undefined ? "" : `?active=${activeOnly}`;
  const res = await demoFetch(`/api/v1/loss-reasons${qs}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as LossReasonList;
}

/** ADMIN-only (configure_settings). 403 for every other role, whatever renders. */
export async function setLossReasonRequired(required: boolean): Promise<boolean> {
  const res = await demoFetch(`/api/v1/settings/loss-reason-required`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ required }),
  });
  if (!res.ok) throw await toApiError(res);
  return ((await res.json()) as { required: boolean }).required;
}

/* -----------------------------------------------------------------------------
   Kiosk (OPERATIONS front desk)

   One narrow door instead of POST /opportunities: that endpoint is gated on
   create_opportunities, which also gates PATCH, archive and restore — far more
   authority than a front desk needs. This endpoint is gated on create_inquiries
   and cannot carry money, owner, stage or probability at all (the server refuses
   unknown keys), so a walk-in inquiry is the only thing it can create.
   -------------------------------------------------------------------------- */

export interface KioskContactInput {
  first_name: string;
  last_name?: string | null;
  email: string;
  phone: string;
}

export interface KioskInquiryInput {
  // Exactly one of these two: an existing customer, or one to create.
  contact_id?: string | null;
  new_contact?: KioskContactInput | null;
  company_name?: string | null;
  product_id: string;
  notes?: string | null;
  consent: boolean;
  marketing_opt_in?: boolean;
  confirm_duplicate?: boolean;
}

// Deliberately narrow: no money field exists on this response, so the kiosk
// cannot print one even by accident.
export interface KioskInquiry {
  id: string;
  reference: string;
  contact_id: string;
  contact_name: string;
  company_name: string | null;
  product_name: string;
  stage_name: string;
  created_at: string;
}

export async function createKioskInquiry(payload: KioskInquiryInput): Promise<KioskInquiry> {
  const res = await demoFetch(`/api/v1/kiosk/inquiries`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as KioskInquiry;
}

/**
 * The kiosk's narrow customer edit. A separate door from PATCH /contacts/{id},
 * which is gated on edit_contacts — a capability that also carries archiving a
 * customer and editing companies and activities. This one is gated on
 * edit_customer_profile and can only reach the five fields below.
 *
 * Every field is optional to OMIT. None may be sent as null: the server refuses
 * an explicit null rather than clearing the column. `last_name` and `email`
 * accept "" to clear, matching the rest of the API.
 */
export interface KioskContactPatch {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  confirm_duplicate?: boolean;
}

export async function updateKioskContact(
  id: string,
  payload: KioskContactPatch,
): Promise<ContactDetail> {
  const res = await demoFetch(`/api/v1/kiosk/contacts/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as ContactDetail;
}

// Exactly the two masked values, and every call writes an audit row — which is
// why it is a POST and why the kiosk asks the server rather than unmasking what
// it already holds.
export interface RevealedContact {
  phone: string | null;
  email: string | null;
}

export async function revealKioskContact(id: string): Promise<RevealedContact> {
  const res = await demoFetch(`/api/v1/kiosk/contacts/${id}/reveal`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
  });
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as RevealedContact;
}

export async function listAllProducts(
  params: Omit<ListProductsParams, "limit" | "offset">,
  signal?: AbortSignal,
  maxPages = 20,
): Promise<Product[]> {
  const items: Product[] = [];
  for (let page = 0; page < maxPages; page++) {
    const chunk = await listProducts({ ...params, limit: 100, offset: page * 100 }, signal);
    items.push(...chunk.items);
    if (items.length >= chunk.total || chunk.items.length === 0) return items;
  }
  console.warn(
    `listAllProducts stopped at ${maxPages} pages (${items.length} products); the catalogue is larger than expected.`,
  );
  return items;
}
