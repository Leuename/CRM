import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inspectDependencies, inspectSource } from "./check-demo-boundaries.mjs";

describe("demo boundary guard", () => {
  it("rejects native network calls from frontend source", () => {
    const findings = inspectSource(
      'export async function load() { return fetch("https://api.example.net"); }',
      "app/page.tsx",
    );

    assert.ok(findings.some((finding) => finding.includes("native network transport")));
    assert.ok(findings.some((finding) => finding.includes("unapproved external domain")));
  });

  it("rejects backend environment settings in source and configuration", () => {
    const sourceFindings = inspectSource(
      "const endpoint = process.env.NEXT_PUBLIC_API_URL;",
      "next.config.ts",
    );
    const configFindings = inspectSource(
      '"DATABASE_URL": "postgres://localhost/db"',
      "config.json",
    );

    assert.ok(
      sourceFindings.some((finding) => finding.includes("production service configuration")),
    );
    assert.ok(
      configFindings.some((finding) => finding.includes("production service configuration")),
    );
  });

  it("rejects backend client dependencies from every dependency group", () => {
    const findings = inspectDependencies({
      dependencies: { "@supabase/supabase-js": "1.0.0" },
      optionalDependencies: { pg: "8.0.0" },
    });

    assert.equal(findings.length, 2);
  });

  it("allows the in-browser simulator and reserved example domains", () => {
    const findings = inspectSource(
      'return demoFetch("/api/opportunities"); const site = "https://demo.example";',
      "lib/demo-fetch.ts",
    );

    assert.deepEqual(findings, []);
  });
});
