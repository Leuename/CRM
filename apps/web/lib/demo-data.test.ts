import { describe, expect, it } from "vitest";
import { createDemoSeed } from "./demo-data";

type ActivityRelationsSeed = {
  activities: Array<{ contact_id: string; company_id: string; opportunity_id: string }>;
  contacts: Array<{ id: string; company_id: string }>;
  opportunities: Array<{ id: string; primary_contact_id: string; company_id: string }>;
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
