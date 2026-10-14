import { describe, expect, it } from "vitest";
import { dateInputEndExclusiveIso, dateInputStartIso } from "./date-range";

describe("date input boundaries", () => {
  it("converts a calendar date to local midnight and the next local midnight", () => {
    const start = dateInputStartIso("2026-11-01");
    const endExclusive = dateInputEndExclusiveIso("2026-11-01");

    expect(start).toBe(new Date(2026, 10, 1).toISOString());
    expect(endExclusive).toBe(new Date(2026, 10, 2).toISOString());
    expect(Date.parse(endExclusive!) - Date.parse(start!)).toBeGreaterThan(0);
  });

  it("omits missing dates", () => {
    expect(dateInputStartIso("")).toBeUndefined();
    expect(dateInputEndExclusiveIso("")).toBeUndefined();
  });
});
