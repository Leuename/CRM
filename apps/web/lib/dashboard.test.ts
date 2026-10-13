import { describe, expect, it } from "vitest";
import { stageCssColor, stageTintColor } from "./dashboard";

describe("legacy stage colors", () => {
  it("renders legacy green stages with blue chart and tint tokens", () => {
    expect(stageCssColor("green")).toBe("var(--stage-blue)");
    expect(stageTintColor("green")).toBe("var(--stage-tint-blue)");
  });
});
