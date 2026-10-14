import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  archiveContact,
  changeStage,
  createContact,
  createCompany,
  createOpportunity,
  createProduct,
  createPipelineStage,
  createSalesRepresentative,
  createKioskInquiry,
  createActivity,
  getDashboardDrilldown,
  getDashboardPipeline,
  getDashboardRevenue,
  getDashboardSources,
  getCompany,
  getOpportunity,
  getOpportunityHistory,
  getDashboardSummary,
  getMe,
  listContacts,
  listActivities,
  listAudit,
  listOpportunities,
  listSalesRepresentatives,
  login,
  logout,
  revealKioskContact,
  updateContact,
  updateCompany,
  updateOpportunity,
  updateProduct,
  updateActivity,
  updatePipelineStage,
  updateSalesRepresentative,
  updateKioskContact,
  NO_SOURCE,
} from "./api";

describe("Aster demo API session", () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it("keeps CRUD and archive changes during one login, then starts from seed after logout", async () => {
    await login("admin@aster.example", "demo");
    expect((await getMe()).role).toBe("ADMIN");

    const contact = await createContact({
      first_name: "Robin",
      last_name: "Sample",
      email: "robin.sample@aster.example",
    });
    const search = contact.email!;
    const visible = await listContacts({ limit: 100, offset: 0, q: search });
    expect(visible.items).toHaveLength(1);
    expect(visible.items[0].id).toBe(contact.id);
    await archiveContact(contact.id);
    expect((await listContacts({ limit: 100, offset: 0, q: search })).total).toBe(0);
    expect((await listContacts({ limit: 100, offset: 0, q: search, archived: true })).total).toBe(
      1,
    );

    await logout();
    await login("admin@aster.example", "demo");
    expect((await listContacts({ limit: 100, offset: 0, q: search })).total).toBe(0);
  });

  it("updates the pipeline and computed dashboard counts through a simulated sale", async () => {
    await login("sales@aster.example", "demo");
    const before = await getDashboardSummary({});
    const opportunity = await createOpportunity({
      primary_contact_id: "contact_01",
      products: [{ product_id: "product_01", quantity: "2" }],
    });

    expect(opportunity.stage_id).toBe("stage_inquiry");
    expect(opportunity.total_revenue_inc_vat).toBe("10752.00");
    expect(opportunity.products[0]).toMatchObject({
      vat_amount: "1152.00",
      line_total_inc_vat: "10752.00",
    });
    expect((await getDashboardSummary({})).active_opportunities).toBe(
      before.active_opportunities + 1,
    );

    await changeStage(opportunity.id, {
      to_stage_id: "stage_won",
      reason: "Accepted demo proposal",
    });
    const after = await getDashboardSummary({});
    expect(after.won_opportunities).toBe(before.won_opportunities + 1);
    expect(after.active_opportunities).toBe(before.active_opportunities);
  });

  it("calculates 12% VAT for manual prices and exempts VAT when selected", async () => {
    await login("admin@aster.example", "demo");

    const taxable = await createOpportunity({
      primary_contact_id: "contact_01",
      selling_price_ex_vat: "100.00",
    });
    expect(taxable.total_revenue_ex_vat).toBe("100.00");
    expect(taxable.total_revenue_inc_vat).toBe("112.00");

    const exempt = await createOpportunity({
      primary_contact_id: "contact_02",
      selling_price_ex_vat: "100.00",
      vat_exempt: true,
    });
    expect(exempt.total_revenue_inc_vat).toBe("100.00");
  });

  it("filters opportunities by expected close date and every product line", async () => {
    await login("admin@aster.example", "demo");

    const closeDate = await listOpportunities({
      limit: 100,
      offset: 0,
      close_from: "2026-10-14",
      close_to: "2026-10-14",
    });
    expect(closeDate.items.map((item) => item.id)).toContain("opportunity_01");

    const combinedDateFilters = await listOpportunities({
      limit: 100,
      offset: 0,
      created_from: "2026-10-09",
      created_to: "2026-10-09",
      close_from: "2026-10-14",
      close_to: "2026-10-14",
    });
    expect(combinedDateFilters.items.map((item) => item.id)).toEqual(["opportunity_18"]);

    const multiProduct = await createOpportunity({
      primary_contact_id: "contact_03",
      products: [
        { product_id: "product_01", quantity: "1" },
        { product_id: "product_02", quantity: "1" },
      ],
    });
    const secondProductMatches = await listOpportunities({
      limit: 100,
      offset: 0,
      product_id: "product_02",
    });
    const unrelatedProductMatches = await listOpportunities({
      limit: 100,
      offset: 0,
      product_id: "product_03",
    });
    expect(secondProductMatches.items.map((item) => item.id)).toContain(multiProduct.id);
    expect(unrelatedProductMatches.items.map((item) => item.id)).not.toContain(multiProduct.id);
  });

  it("clears both the representative id and its resolved name", async () => {
    await login("admin@aster.example", "demo");
    expect((await getOpportunity("opportunity_01")).sales_representative_name).toBeTruthy();

    const updated = await updateOpportunity("opportunity_01", { sales_representative_id: null });
    expect(updated).toMatchObject({
      sales_representative_id: null,
      sales_representative_name: null,
    });
    expect(await getOpportunity("opportunity_01")).toMatchObject({
      sales_representative_id: null,
      sales_representative_name: null,
    });
  });

  it("uses inclusive activity start and exclusive end instants", async () => {
    await login("admin@aster.example", "demo");
    const boundaryRows = [
      ["activity_before_start", "2026-10-12T23:59:59.999Z"],
      ["activity_at_start", "2026-10-13T00:00:00.000Z"],
      ["activity_before_end", "2026-10-13T23:59:59.999Z"],
      ["activity_at_end", "2026-10-14T00:00:00.000Z"],
    ] as const;

    const boundaryIds: string[] = [];
    for (const [description, occurred_at] of boundaryRows) {
      const activity = await createActivity({
        activity_type: "NOTE",
        description,
        occurred_at,
        contact_id: "contact_01",
      });
      boundaryIds.push(activity.id);
    }

    const filtered = await listActivities({
      limit: 100,
      offset: 0,
      contact_id: "contact_01",
      occurred_from: "2026-10-13T00:00:00.000Z",
      occurred_to: "2026-10-14T00:00:00.000Z",
    });
    const filteredIds = filtered.items.map((item) => item.id);
    expect(filteredIds).toEqual(expect.arrayContaining([boundaryIds[0], boundaryIds[1]]));
    expect(filteredIds).not.toContain(boundaryIds[2]);
    expect(filteredIds).not.toContain(boundaryIds[3]);
  });

  it("applies the audit date range to generated audit events", async () => {
    await login("admin@aster.example", "demo");
    const contact = await createContact({ first_name: "Date", last_name: "Filtered" });
    const generated = await listAudit({
      limit: 100,
      offset: 0,
      entity_type: "contact",
      entity_id: contact.id,
    });
    expect(generated.items).toHaveLength(1);
    const event = generated.items[0];
    expect(event).toMatchObject({ entity_type: "contact", entity_id: contact.id });
    const occurredAt = Date.parse(event.occurred_at);

    const includedAtStart = await listAudit({
      limit: 100,
      offset: 0,
      entity_type: "contact",
      entity_id: contact.id,
      date_from: new Date(occurredAt).toISOString(),
      date_to: new Date(occurredAt + 1).toISOString(),
    });
    const excludedAtEnd = await listAudit({
      limit: 100,
      offset: 0,
      entity_type: "contact",
      entity_id: contact.id,
      date_from: new Date(occurredAt - 1).toISOString(),
      date_to: new Date(occurredAt).toISOString(),
    });
    const excludedBeforeStart = await listAudit({
      limit: 100,
      offset: 0,
      entity_type: "contact",
      entity_id: contact.id,
      date_from: new Date(occurredAt + 1).toISOString(),
      date_to: new Date(occurredAt + 2).toISOString(),
    });
    expect(includedAtStart.items.map((item) => item.id)).toContain(event.id);
    expect(excludedAtEnd.items.map((item) => item.id)).not.toContain(event.id);
    expect(excludedBeforeStart.items.map((item) => item.id)).not.toContain(event.id);
  });

  it("matches dashboard creation, close, snapshot, and stage-filter periods", async () => {
    await login("admin@aster.example", "demo");

    const closeDay = { date_from: "2026-10-10", date_to: "2026-10-10", stage_id: "stage_won" };
    const summary = await getDashboardSummary(closeDay);
    expect(summary.total_inquiries).toBe(0);
    expect(summary.won_opportunities).toBe(3);
    expect(summary.period_from).toBe("2026-10-10");
    expect(summary.period_to).toBe("2026-10-10");
    expect(summary.previous).toMatchObject({ period_from: "2026-10-09", period_to: "2026-10-09" });

    const revenue = await getDashboardRevenue(closeDay);
    expect(revenue.items).toHaveLength(1);
    expect(revenue.items[0]).toMatchObject({ month: "2026-10", won_revenue: summary.won_revenue });
    expect((await getDashboardRevenue({})).items).toHaveLength(12);
    expect((await getDashboardSummary({})).previous).toBeNull();

    const pipeline = await getDashboardPipeline(closeDay);
    expect(
      pipeline.items.find((stage) => stage.stage_id === "stage_inquiry")?.count,
    ).toBeGreaterThan(0);
    expect(pipeline.items.find((stage) => stage.stage_id === "stage_won")?.count).toBe(3);
  });

  it("includes the null-source bucket and drills into its matching inquiry", async () => {
    await login("admin@aster.example", "demo");
    await updateContact("contact_01", { source_id: null });

    const sources = await getDashboardSources({});
    expect(sources.items).toContainEqual(
      expect.objectContaining({ source_id: null, source_name: "No source", inquiries: 1 }),
    );
    const drilldown = await getDashboardDrilldown({
      metric: "source_inquiries",
      source_id: NO_SOURCE,
      limit: 100,
      offset: 0,
    });
    expect(drilldown.items.map((item) => item.id)).toContain("opportunity_01");
    expect(drilldown.total).toBe(1);
  });

  it("keeps the existing role error envelope for read-only demo accounts", async () => {
    await login("finance@aster.example", "demo");
    await expect(createContact({ first_name: "Read-only" })).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
  });

  it("masks front-desk PII and records a reveal, while retaining public catalogue prices", async () => {
    await login("desk@aster.example", "demo");
    const contact = (await listContacts({ limit: 100, offset: 0, q: "Amara" })).items[0];
    expect(contact.email).toBeNull();
    expect(contact.phone).toBeNull();
    expect(await revealKioskContact(contact.id)).toMatchObject({
      email: expect.stringContaining("@"),
      phone: expect.stringContaining("+1-202-555-"),
    });
  });

  it("scopes triage edits to records created by that triage user", async () => {
    await login("triage@aster.example", "demo");
    const ownedContact = (await listContacts({ limit: 100, offset: 0, q: "Elena" })).items[0];
    await updateContact(ownedContact.id, { position: "Intake Coordinator" });
    const otherContact = (await listContacts({ limit: 100, offset: 0, q: "Noah" })).items[0];
    await expect(updateContact(otherContact.id, { position: "Not allowed" })).rejects.toMatchObject(
      { status: 403 },
    );
    await expect(archiveContact(ownedContact.id)).rejects.toMatchObject({ status: 403 });

    await changeStage("opportunity_01", {
      to_stage_id: "stage_qualified",
      reason: "Triage follow-up",
    });
    await expect(
      changeStage("opportunity_02", { to_stage_id: "stage_qualified", reason: "Not owned" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rejects unknown demo accounts with the normal API error shape", async () => {
    await expect(login("nobody@aster.example", "wrong")).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });
  });

  it("accepts only safe web URLs for company websites in create and update requests", async () => {
    await login("admin@aster.example", "demo");

    await expect(
      createCompany({ name: "Unsafe Sample", website: "javascript:alert(1)" }),
    ).rejects.toMatchObject({
      status: 422,
      fields: { website: expect.stringContaining("http:// or https://") },
    });

    const company = await createCompany({ name: "Safe Sample", website: "https://demo.example" });
    await expect(
      updateCompany(company.id, { website: "data:text/html,<script>alert(1)</script>" }),
    ).rejects.toMatchObject({
      status: 422,
      fields: { website: expect.stringContaining("http:// or https://") },
    });
    expect((await getCompany(company.id)).website).toBe("https://demo.example/");
  });

  it("stores and returns only fictional presets from editable and nested demo fields", async () => {
    await login("admin@aster.example", "demo");
    const sentinel = "SENTINEL_PRIVATE_8712";

    const contact = await createContact({
      first_name: sentinel,
      last_name: sentinel,
      email: `${sentinel}@private.test`,
      phone: "+1-415-555-0199",
      notes: sentinel,
    });
    expect(JSON.stringify(contact)).not.toContain(sentinel);
    expect(contact.email).toMatch(/^demo\.contact\.\d+@aster\.example$/);
    const updatedContact = await updateContact(contact.id, {
      first_name: sentinel,
      email: `${sentinel}.update@private.test`,
      notes: sentinel,
    });
    expect(JSON.stringify(updatedContact)).not.toContain(sentinel);
    const kioskUpdatedContact = await updateKioskContact(contact.id, {
      first_name: sentinel,
      email: `${sentinel}.kiosk@private.test`,
      company_name: sentinel,
    });
    expect(JSON.stringify(kioskUpdatedContact)).not.toContain(sentinel);

    const company = await createCompany({
      name: sentinel,
      website: "https://private.example.com",
      billing_address: { street: sentinel, city: sentinel, postal_code: "94105" },
      notes: sentinel,
    });
    expect(JSON.stringify(company)).not.toContain(sentinel);
    expect(company.name).toMatch(/^Demo Company \d+$/);
    expect(company.website).toBeNull();

    const product = await createProduct({
      name: sentinel,
      category: sentinel,
      description: sentinel,
      default_price: "987654.32",
    });
    expect(JSON.stringify(product)).not.toContain(sentinel);
    expect(product.name).toMatch(/^Demo Service \d+$/);
    const updatedProduct = await updateProduct(product.id, {
      name: sentinel,
      description: sentinel,
      default_price: "999999.99",
    });
    expect(JSON.stringify(updatedProduct)).not.toContain(sentinel);

    const stage = await createPipelineStage({
      name: sentinel,
      semantic_type: "ACTIVE",
      probability: "43",
    });
    const updatedStage = await updatePipelineStage(stage.id, { name: sentinel });
    expect(JSON.stringify(updatedStage)).not.toContain(sentinel);
    expect(updatedStage.name).toMatch(/^Demo stage \d+$/);

    const representative = await createSalesRepresentative({ name: sentinel });
    const updatedRepresentative = await updateSalesRepresentative(representative.id, {
      name: sentinel,
    });
    expect(JSON.stringify(updatedRepresentative)).not.toContain(sentinel);
    expect(updatedRepresentative.name).toMatch(/^Demo Representative \d+$/);
    expect(JSON.stringify(await listSalesRepresentatives())).not.toContain(sentinel);

    const opportunity = await createOpportunity({
      new_contact: {
        first_name: sentinel,
        last_name: sentinel,
        email: `${sentinel}.nested@private.test`,
        phone: "+1-415-555-0123",
      },
      new_company: { name: sentinel, website: "https://private.example.com", notes: sentinel },
      products: [
        {
          product_id: "product_01",
          quantity: "987",
          notes: sentinel,
          preferred_schedule: sentinel,
        },
      ],
      notes: sentinel,
    });
    expect(JSON.stringify(opportunity)).not.toContain(sentinel);
    expect(opportunity.notes).toBe("Fictional sample note for the Aster CRM demo.");
    expect(opportunity.products[0].notes).toBe("Fictional sample note for the Aster CRM demo.");
    const updatedOpportunity = await updateOpportunity(opportunity.id, {
      notes: sentinel,
      products: [
        {
          product_id: "product_02",
          quantity: "987",
          notes: sentinel,
          preferred_schedule: sentinel,
        },
      ],
    });
    expect(JSON.stringify(updatedOpportunity)).not.toContain(sentinel);

    const activity = await createActivity({
      activity_type: "NOTE",
      description: sentinel,
      occurred_at: "2040-02-03T04:05:06.000Z",
      contact_id: contact.id,
    });
    expect(JSON.stringify(activity)).not.toContain(sentinel);
    expect(activity.description).not.toBe(sentinel);
    expect(activity.occurred_at).toMatch(/^2026-10-(12|13|14)T/);
    const updatedActivity = await updateActivity(activity.id, {
      description: sentinel,
      occurred_at: "2040-02-03T04:05:06.000Z",
    });
    expect(JSON.stringify(updatedActivity)).not.toContain(sentinel);

    const inquiry = await createKioskInquiry({
      new_contact: {
        first_name: sentinel,
        last_name: sentinel,
        email: `${sentinel}.walkin@private.test`,
        phone: "+1-415-555-0188",
      },
      company_name: sentinel,
      product_id: "product_01",
      notes: sentinel,
      consent: true,
    });
    expect(JSON.stringify(inquiry)).not.toContain(sentinel);

    await changeStage("opportunity_01", {
      to_stage_id: "stage_lost",
      reason: sentinel,
      loss_reason_id: "loss_timing",
      loss_note: sentinel,
    });
    expect(JSON.stringify(await getOpportunityHistory("opportunity_01"))).not.toContain(sentinel);
    expect(sessionStorage.getItem("aster-crm-demo-v2")).not.toContain(sentinel);
    expect(JSON.stringify(await listAudit({ limit: 100, offset: 0 }))).not.toContain(sentinel);
  });

  it("drops legacy tab state that may contain visitor-entered values", async () => {
    const legacySentinel = "PRIVATE_LEGACY_CONTACT_4821";
    sessionStorage.setItem(
      "aster-crm-demo-v1",
      JSON.stringify({ version: 1, contacts: [{ first_name: legacySentinel }] }),
    );

    await login("admin@aster.example", "demo");
    const contacts = await listContacts({ limit: 100, offset: 0, q: legacySentinel });
    expect(contacts.total).toBe(0);
    expect(sessionStorage.getItem("aster-crm-demo-v1")).toBeNull();
    expect(sessionStorage.getItem("aster-crm-demo-v2")).not.toContain(legacySentinel);
  });
});
