import { describe, expect, it } from "vitest";
import { createDemoSeed, DEMO_VAT_RATE } from "./demo-data";

type ActivityRelationsSeed = {
  activities: Array<{ contact_id: string; company_id: string; opportunity_id: string }>;
  contacts: Array<{ id: string; company_id: string }>;
  opportunities: Array<{ id: string; primary_contact_id: string; company_id: string }>;
};
type OpportunityVatSeed = {
  products: Array<{ id: string; default_price: string }>;
  opportunities: Array<{
    total_revenue_ex_vat: string;
    total_revenue_inc_vat: string;
    products: Array<{
      product_id: string;
      quantity: string;
      unit_price: string;
      discount_percent: string;
      line_total: string;
      vat_amount: string;
      line_total_inc_vat: string;
    }>;
  }>;
};

describe("synthetic activity seed relationships", () => {
  it("keeps each activity linked to its opportunity's primary contact and company", () => {
    const seed = createDemoSeed() as ActivityRelationsSeed;

    for (const activity of seed.activities) {
      const contact = seed.contacts.find((candidate) => candidate.id === activity.contact_id);
      const opportunity = seed.opportunities.find(
        (candidate) => candidate.id === activity.opportunity_id,
      );

      expect(contact).toBeDefined();
      expect(opportunity).toBeDefined();
      expect(activity.contact_id).toBe(opportunity?.primary_contact_id);
      expect(activity.company_id).toBe(opportunity?.company_id);
      expect(contact?.company_id).toBe(activity.company_id);
    }
  });
});

describe("synthetic opportunity seed totals", () => {
  it("keeps seeded product pricing, discounts, VAT, and opportunity totals consistent", () => {
    const seed = createDemoSeed() as OpportunityVatSeed;

    for (const opportunity of seed.opportunities) {
      let opportunityNet = 0;
      for (const line of opportunity.products) {
        const product = seed.products.find((candidate) => candidate.id === line.product_id);
        expect(product).toBeDefined();
        expect(line.unit_price).toBe(product?.default_price);
        const expectedNet =
          Number(line.unit_price) *
          Number(line.quantity) *
          (1 - Number(line.discount_percent) / 100);
        const net = Number(line.line_total);
        expect(net).toBeCloseTo(expectedNet, 2);
        expect(line.vat_amount).toBe((net * DEMO_VAT_RATE).toFixed(2));
        expect(line.line_total_inc_vat).toBe((net + Number(line.vat_amount)).toFixed(2));
        opportunityNet += net;
      }
      expect(opportunity.total_revenue_ex_vat).toBe(opportunityNet.toFixed(2));
      expect(opportunity.total_revenue_inc_vat).toBe(
        (opportunityNet * (1 + DEMO_VAT_RATE)).toFixed(2),
      );
    }
  });
});
