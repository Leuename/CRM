import { defineConfig, devices } from "@playwright/test";

const e2ePort = Number(process.env.E2E_PORT ?? "6971");

if (!Number.isInteger(e2ePort) || e2ePort < 1024 || e2ePort > 65535) {
  throw new Error("E2E_PORT must be an integer between 1024 and 65535");
}

const e2eOrigin = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: e2eOrigin,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Production build: `next dev` compiles routes on first hit and makes e2e timings flaky.
    command: `npm run build && npx next start --hostname 127.0.0.1 --port ${e2ePort}`,
    url: `${e2eOrigin}/login`,
    // Keep browser tests separate from the demo server; never reuse another process.
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
