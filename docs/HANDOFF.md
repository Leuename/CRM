# Handoff

## Demo summary

Aster CRM is a public-facing portfolio demo for fictional advisory firm Aster Advisory. Its sign-in and roles are simulated, and its business operations use an in-browser mock service with synthetic seed records. There is no production CRM service, database, or shared visitor storage. Each tab keeps its own state and resets on logout.

The app is for demonstration only. The forms accept arbitrary text, which could be real information if a visitor ignores the warnings. The persistent notices on the CRM and kiosk screens ask visitors not to enter real customer details.

## Verified locally on October 13, 2026

- TypeScript, ESLint, and the demo-boundary check passed; 160 app and design-system source/config files were scanned. The guard blocks non-example external domains and production service connections.
- 13 unit tests passed, including dashboard period/filter, null-source drilldown, and blue legacy-stage color behavior.
- Optimized Next.js build generated all 32 routes.
- Playwright browser tests: the last recorded run passed 20 tests before the demo sign-in loading test was added; the suite now has 21. See [release readiness](RELEASE_READINESS.md) for coverage and the pending rerun.
- Route parity audit found the same 32 page paths and all 49 frontend API request templates mapped to the in-browser simulator.
- Manual browser checks covered 1440×900, 1024×768, 768×1024, and 390×844. The checked CRM flows produced no browser errors or off-origin requests; the Opportunities create action, Products pagination, and kiosk customer edit dialog fit at phone width. Pagination exposes accessible labels and disables arrow controls at either end.
- A source-to-demo comparison of the login and dashboard at 1440×900, 1024×768, and 390×844 found matching navigation width, KPI layout, and chart structure. A candidate-only pass captured all 32 paths at 1280×720. The source's signed-in pages need its unavailable API backend, so a full route-by-route comparison remains open.
- A local production-build screenshot sweep captured the 31 login, CRM, and kiosk paths other than `/` at 1440×900 and 390×844 (62 screenshots). All returned HTTP 200 with no page errors, off-origin requests, or document-width overflow; Playwright separately verifies the root redirect. This is a rendering and viewport-fit check; a full source-to-demo visual comparison remains open. The temporary screenshots were reviewed and remain in local temporary folders; they are not part of the repository.
- `npm audit --omit=dev` reported no production dependency vulnerabilities.
- The kiosk was visually checked at 1024×768 and 768×1024. The persistent notice fit without covering its controls, horizontal scrolling exposed the Continue action on the portrait tablet, and the customer edit dialog and save flow fit a 390×844 viewport. The fixed-width kiosk still requires horizontal panning in portrait.
- After removing input autofocus, a production-browser check at 390×844 confirmed the kiosk starts at `scrollLeft=0`, keeping the left-side controls in view until the visitor taps the phone field.
- Current authenticated production screenshots cover the kiosk home and customer record at 1024×768 and 390×844, and the dashboard and individual detail at 1440×900 and 390×844. The kiosk main skip target receives focus; at 390px its 1024px canvas pans to the right-side controls. Dashboard and individual pages fit the 390px document width. The login brand panel stays at least 320px wide with readable copy at 1024px and hides at 390px. These temporary screenshots were reviewed and remain in local temporary folders; they are not part of the repository.

## Before a public launch

- Apply the relevant Next.js security update announced for October 14, 2026, and rerun the full release checks. The installed dependency is Next.js 16.4.0; the upstream advisories and fixed versions are not published yet. See [deployment notes](DEPLOYMENT.md).
- Targeted accessibility checks passed for inquiry-step focus and announcement, row-specific archive names, CRM detail-tab semantics and arrow navigation, kiosk calendar tab-panel relationships, service description keyboard behavior, skip-link navigation, kiosk main landmarks and one h1 per route, dashboard inquiry labels, and the individual-contact heading. Mobile Lighthouse passed after labeling the compact Aster dashboard link: sign-in and dashboard both scored 100 in accessibility, best practices, SEO, and agentic browsing, with zero failed audits. Actual spoken screen-reader output remains unverified because Narrator was not running and speech cannot be captured here. Full keyboard coverage and signed-in route visual comparison remain open.
- Recheck the full dependency audit. It currently reports five High findings in the build-time ESLint dependency chain through `braces@3.0.3`; the advisory has no patched version at this time.
- Finish the source-to-demo visual comparison for signed-in routes, full keyboard pass, and manual spoken screen-reader review.
- After the security update and release gates, an owner-approved release (outside this feature-branch run) should confirm the deployed source, public requests, sign-in flow, CRUD flows, and per-tab isolation.
- The candidate commit passed Gitleaks on `2026-10-13`: 0 leaks across 1.26 MB. Repeat the scan after the pending framework security update and immediately before publishing.
- The current source-only Gitleaks scan reported 0 leaks across 1.03 MB after excluding installed dependencies and generated build output. A broad scan reported 16 generic API-key matches, all in Git-ignored `.next` output; redacted path review identified generated Next.js preview and server-action metadata, not source files.

## Vercel status

- The hosted deployment has not been verified against the current source. Keep previews protected and do not share a preview or branch alias as the public demo URL; verify anonymous access at the eventual public URL.
- No public deployment verifies the current workspace. Confirm and configure a publicly accessible URL, then verify the deployed SHA and visitor flows.

See [release readiness](RELEASE_READINESS.md), [test plan](TEST_PLAN.md), and [attributions](../ATTRIBUTIONS.md) for detail.
