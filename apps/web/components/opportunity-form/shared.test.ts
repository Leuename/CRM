import { describe, expect, it } from "vitest";
import { buildCreatePayload, type FormValues, validateForm } from "./shared";

const baseValues: FormValues = {
  leadType: "COMPANY",
  contactMode: "new",
  contactId: "",
  newContact: { first_name: "Riley", last_name: "", email: "", phone: "", position: "" },
  newCompany: {
    name: "Sample Company",
    industry: "",
    website: "",
    employee_count: "",
    street: "",
    city: "",
    province: "",
    postal_code: "",
  },
  lines: [],
  sellingPrice: "",
  discountPercent: "",
  dealDiscountOn: false,
  dealVatExempt: false,
  teamSize: "",
  expectedCloseDate: "",
  serviceTerm: "",
  salesRepId: "",
  notes: "",
};

describe("company website URLs in opportunity forms", () => {
  it("rejects executable schemes and normalizes valid web URLs in the payload", () => {
    const unsafe = {
      ...baseValues,
      newCompany: { ...baseValues.newCompany, website: "javascript:alert(1)" },
    };
    expect(validateForm(unsafe)["new_company.website"]).toMatch(/http:\/\/ or https:\/\//);

    const safe = {
      ...baseValues,
      newCompany: { ...baseValues.newCompany, website: "https://demo.example" },
    };
    expect(validateForm(safe)).not.toHaveProperty("new_company.website");
    expect(
      buildCreatePayload(safe, {
        sourceId: "",
        confirmDuplicate: false,
        selectedContactCompanyId: null,
      }).new_company?.website,
    ).toBe("https://demo.example/");
  });
});
