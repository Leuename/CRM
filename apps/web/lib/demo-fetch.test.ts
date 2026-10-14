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
    expect(filteredIds).toEqual(expect.arrayContaining([boundaryIds[1], boundaryIds[2]]));
    expect(filteredIds).not.toContain(boundaryIds[0]);
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

  it("keeps editable CRUD values only in this tab and drops unknown fields", async () => {
    await login("admin@aster.example", "demo");
    const sentinel = "EDITABLE_DEMO_8712";

    const contact = await createContact({
      first_name: "Robin",
      last_name: sentinel,
      email: "robin.editable@example.com",
      phone: "(202) 555-0129",
      notes: sentinel,
      tags: ["demo", sentinel],
    });
    expect(contact.first_name).toBe("Robin");
    expect(contact.last_name).toBe(sentinel);
    expect(contact.email).toBe("robin.editable@example.com");
    expect(contact.phone).toBe("(202) 555-0129");
    expect(contact.notes).toBe(sentinel);

    const updatedContact = await updateContact(contact.id, {
      first_name: "Robin Updated",
      email: "robin.updated@example.com",
      notes: `${sentinel}_UPDATED`,
      id: "contact_intruder",
      created_by: "user_intruder",
      archived_at: "2040-02-03T04:05:06.000Z",
    } as unknown as Parameters<typeof updateContact>[1]);
    expect(updatedContact.id).toBe(contact.id);
    expect(updatedContact.first_name).toBe("Robin Updated");
    expect(updatedContact.email).toBe("robin.updated@example.com");
    expect(updatedContact.notes).toBe(`${sentinel}_UPDATED`);
    expect(updatedContact.archived_at).toBeNull();
    const kioskUpdatedContact = await updateKioskContact(contact.id, {
      first_name: "Robin at the demo desk",
      email: "robin.desk@example.com",
      company_name: "Aster Demo Group",
    });
    expect(kioskUpdatedContact.first_name).toBe("Robin at the demo desk");
    expect(kioskUpdatedContact.company_name).toBe("Aster Demo Group");

    const company = await createCompany({
      name: `${sentinel} Company`,
      website: "https://private.example.com",
      billing_address: { street: `${sentinel} Street`, city: "Example City", postal_code: "94105" },
      notes: sentinel,
    });
    expect(company.name).toBe(`${sentinel} Company`);
    expect(company.website).toBe("https://private.example.com/");
    expect(company.billing_address?.street).toBe(`${sentinel} Street`);
    expect(company.notes).toBe(sentinel);
    const updatedCompany = await updateCompany(company.id, { name: `${sentinel} Updated` });
    expect(updatedCompany.name).toBe(`${sentinel} Updated`);

    const product = await createProduct({
      name: `${sentinel} Service`,
      category: "Demo category",
      description: sentinel,
      default_price: "9876.54",
    });
    expect(product.name).toBe(`${sentinel} Service`);
    expect(product.category).toBe("Demo category");
    expect(product.description).toBe(sentinel);
    expect(product.default_price).toBe("9876.54");
    const updatedProduct = await updateProduct(product.id, {
      name: `${sentinel} Service Updated`,
      default_price: "9999.99",
    });
    expect(updatedProduct.name).toBe(`${sentinel} Service Updated`);
    expect(updatedProduct.default_price).toBe("9999.99");

    const stage = await createPipelineStage({
      name: `${sentinel} Stage`,
      semantic_type: "ACTIVE",
      probability: "43",
      color: "green",
    });
    expect(stage.name).toBe(`${sentinel} Stage`);
    expect(stage.probability).toBe(43);
    expect(stage.color).toBe("blue");
    const updatedStage = await updatePipelineStage(stage.id, { name: `${sentinel} Stage Updated` });
    expect(updatedStage.name).toBe(`${sentinel} Stage Updated`);

    const representative = await createSalesRepresentative({ name: `${sentinel} Representative` });
    expect(representative.name).toBe(`${sentinel} Representative`);
    const updatedRepresentative = await updateSalesRepresentative(representative.id, {
      name: `${sentinel} Representative Updated`,
    });
    expect(updatedRepresentative.name).toBe(`${sentinel} Representative Updated`);

    const opportunity = await createOpportunity({
      new_contact: {
        first_name: "Casey",
        last_name: sentinel,
        email: "casey.editable@example.com",
        phone: "(202) 555-0142",
      },
      new_company: {
        name: `${sentinel} Labs`,
        website: "https://labs.example.com",
        notes: sentinel,
      },
      expected_close_date: "2040-02-03",
      team_size: 7,
      sales_representative_id: representative.id,
      selling_price_ex_vat: "1234.56",
      discount_percent: "12.00",
      notes: sentinel,
      products: [
        {
          product_id: "product_01",
          quantity: "7",
          unit_price: "123.45",
          discount_percent: "12.00",
          notes: sentinel,
          preferred_schedule: "Tuesdays after 10am",
        },
      ],
    });
    expect(opportunity.contact_name).toContain(sentinel);
    expect(opportunity.company_name).toBe(`${sentinel} Labs`);
    expect(opportunity.expected_close_date).toBe("2040-02-03");
    expect(opportunity.team_size).toBe(7);
    expect(opportunity.sales_representative_id).toBe(representative.id);
    expect(opportunity.notes).toBe(sentinel);
    expect(opportunity.products[0].quantity).toBe("7");
    expect(opportunity.products[0].unit_price).toBe("123.45");
    expect(opportunity.products[0].preferred_schedule).toBe("Tuesdays after 10am");
    const updatedOpportunity = await updateOpportunity(opportunity.id, {
      notes: `${sentinel}_UPDATED`,
      products: [
        {
          product_id: "product_02",
          quantity: "9",
          unit_price: "456.78",
          discount_percent: "8.00",
          notes: `${sentinel}_LINE`,
        },
      ],
    });
    expect(updatedOpportunity.notes).toBe(`${sentinel}_UPDATED`);
    expect(updatedOpportunity.products[0].quantity).toBe("9");
    expect(updatedOpportunity.products[0].unit_price).toBe("456.78");
    expect(updatedOpportunity.products[0].notes).toBe(`${sentinel}_LINE`);

    const activity = await createActivity({
      activity_type: "NOTE",
      description: sentinel,
      occurred_at: "2040-02-03T04:05:06.000Z",
      contact_id: contact.id,
    });
    expect(activity.description).toBe(sentinel);
    expect(activity.occurred_at).toBe("2040-02-03T04:05:06.000Z");
    const updatedActivity = await updateActivity(activity.id, {
      description: `${sentinel}_ACTIVITY`,
      occurred_at: "2041-03-04T05:06:07.000Z",
    });
    expect(updatedActivity.description).toBe(`${sentinel}_ACTIVITY`);
    expect(updatedActivity.occurred_at).toBe("2041-03-04T05:06:07.000Z");

    const inquiry = await createKioskInquiry({
      new_contact: {
        first_name: "Walk-in",
        last_name: sentinel,
        email: "walkin.editable@example.com",
        phone: "(202) 555-0118",
      },
      company_name: `${sentinel} Event Co`,
      product_id: "product_01",
      notes: sentinel,
      consent: true,
    });
    expect(inquiry.contact_name).toContain(sentinel);
    expect(inquiry.company_name).toBe(`${sentinel} Event Co`);

    await changeStage("opportunity_01", {
      to_stage_id: "stage_lost",
      reason: sentinel,
      loss_reason_id: "loss_timing",
      loss_note: `${sentinel}_LOSS`,
    });
    expect(JSON.stringify(await getOpportunityHistory("opportunity_01"))).toContain(sentinel);

    const saved = JSON.parse(sessionStorage.getItem("aster-crm-demo-v2") ?? "null");
    expect(JSON.stringify(saved)).toContain(sentinel);
    expect(localStorage.getItem("aster-crm-demo-v2")).toBeNull();
    expect(JSON.stringify(await listAudit({ limit: 100, offset: 0 }))).toContain(sentinel);
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
