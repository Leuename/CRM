import { describe, expect, it } from "vitest";
import { normalizeExternalUrl } from "./external-url";

describe("normalizeExternalUrl", () => {
  it("normalizes absolute HTTP and HTTPS URLs", () => {
    expect(normalizeExternalUrl(" https://example.com/path ")).toBe("https://example.com/path");
    expect(normalizeExternalUrl("http://example.com")).toBe("http://example.com/");
  });

  it("rejects unsafe, relative, credentialed, and non-string values", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,<script>",
      "//example.com/path",
      "https://user:password@example.com",
      "not a URL",
      null,
      undefined,
      42,
      {},
    ]) {
      expect(normalizeExternalUrl(value)).toBeNull();
    }
  });
});
