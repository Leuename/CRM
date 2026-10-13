import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  archiveContact,
  changeStage,
  createContact,
  createCompany,
  createOpportunity,
  getDashboardDrilldown,
  getDashboardPipeline,
  getDashboardRevenue,
  getDashboardSources,
  getCompany,
  getDashboardSummary,
  getMe,
  listContacts,
  login,
  logout,
  revealKioskContact,
  updateContact,
  updateCompany,
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
    const visible = await listContacts({ limit: 100, offset: 0, q: "robin.sample" });
    expect(visible.items).toHaveLength(1);
    expect(visible.items[0].id).toBe(contact.id);
    await archiveContact(contact.id);
    expect((await listContacts({ limit: 100, offset: 0, q: "robin.sample" })).total).toBe(0);
    expect(
      (await listContacts({ limit: 100, offset: 0, q: "robin.sample", archived: true })).total,
    ).toBe(1);

    await logout();
    await login("admin@aster.example", "demo");
    expect((await listContacts({ limit: 100, offset: 0, q: "robin.sample" })).total).toBe(0);
  });

  it("updates the pipeline and computed dashboard counts through a simulated sale", async () => {
    await login("sales@aster.example", "demo");
    const before = await getDashboardSummary({});
    const opportunity = await createOpportunity({
      primary_contact_id: "contact_01",
      products: [{ product_id: "product_01", quantity: "2" }],
    });

    expect(opportunity.stage_id).toBe("stage_inquiry");
    expect(opportunity.total_revenue_inc_vat).toBe("10368.00");
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
});
