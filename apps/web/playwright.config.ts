import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:6969",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Production build: `next dev` compiles routes on first hit and makes e2e timings flaky.
    command: "npm run build && npm run start -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:6969/login",
    // Never reuse whatever already listens on 6969; it may be a stale or unrelated server.
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
