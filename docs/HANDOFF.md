# Handoff

## Demo summary

Aster CRM is a public-facing portfolio demo for fictional advisory firm Aster Advisory. Its sign-in and roles are simulated, and its business operations use an in-browser mock service with synthetic seed records. There is no production CRM service, database, or shared visitor storage. Each tab keeps its own state and resets on logout.

The app is for demonstration only. The forms accept arbitrary text, which could be real information if a visitor ignores the warnings. The persistent notices on the CRM and kiosk screens ask visitors not to enter real customer details.

## Verified locally on October 13, 2026

- TypeScript, ESLint, and the demo-boundary check passed; 160 app and design-system source/config files were scanned. The guard blocks non-example external domains and production service connections.
- 13 unit tests passed, including dashboard period/filter, null-source drilldown, and blue legacy-stage color behavior.
- Optimized Next.js build generated all 32 routes.
- 17 Playwright browser tests passed against a fresh isolated production build on port 6975. Coverage includes all CRM list/detail/create/edit and settings routes, legacy redirects, kiosk routes, sign-in validation announcements, same-origin requests, URL safety, per-tab isolation, the phone-width Opportunities create action, the phone-width kiosk customer edit and save flow, pagination visibility, navigation, and disabled boundary states, plus kiosk calendar arrow/Home/End keyboard navigation and tab-panel labeling, kiosk service description keyboard behavior, skip-link and landmark checks, dashboard inquiry labels, the individual-contact heading, and the tablet login brand panel.
- Route parity audit found the same 32 page paths and all 49 frontend API request templates mapped to the in-browser simulator.
- Manual browser checks covered 1440×900, 1024×768, 768×1024, and 390×844. The checked CRM flows produced no browser errors or off-origin requests; the Opportunities create action, Products pagination, and kiosk customer edit dialog fit at phone width. Pagination exposes accessible labels and disables arrow controls at either end.
- A source-to-demo comparison of the login and dashboard at 1440×900, 1024×768, and 390×844 found matching navigation width, KPI layout, and chart structure. The demo notice and blue palette account for the visible shifts; full route-by-route comparison remains open.
- A local production-build screenshot sweep captured the 31 login, CRM, and kiosk paths other than `/` at 1440×900 and 390×844 (62 screenshots). All returned HTTP 200 with no page errors, off-origin requests, or document-width overflow; Playwright separately verifies the root redirect. This is a rendering and viewport-fit check; a full source-to-demo visual comparison remains open. The temporary screenshots were reviewed and remain in local temporary folders; they are not part of the repository.
- `npm audit --omit=dev` reported no production dependency vulnerabilities.
- The kiosk was visually checked at 1024×768 and 768×1024. The persistent notice fit without covering its controls, horizontal scrolling exposed the Continue action on the portrait tablet, and the customer edit dialog and save flow fit a 390×844 viewport. The fixed-width kiosk still requires horizontal panning in portrait.
- After removing input autofocus, a production-browser check at 390×844 confirmed the kiosk starts at `scrollLeft=0`, keeping the left-side controls in view until the visitor taps the phone field.
- Current authenticated production screenshots cover the kiosk home and customer record at 1024×768 and 390×844, and the dashboard and individual detail at 1440×900 and 390×844. The kiosk main skip target receives focus; at 390px its 1024px canvas pans to the right-side controls. Dashboard and individual pages fit the 390px document width. The login brand panel stays at least 320px wide with readable copy at 1024px and hides at 390px. These temporary screenshots were reviewed and remain in local temporary folders; they are not part of the repository.

## Before a public launch

- Apply the relevant Next.js security update announced for October 14, 2026, and rerun the full release checks. The installed dependency is Next.js 16.4.0; the upstream advisories and fixed versions are not published yet. See [deployment notes](DEPLOYMENT.md).
- Targeted accessibility checks passed for kiosk calendar keyboard navigation and tab-panel relationships, service description keyboard behavior, skip-link navigation, kiosk main landmarks and one h1 per route, dashboard inquiry labels, and the individual-contact heading. Mobile Lighthouse passed after labeling the compact Aster dashboard link: sign-in and dashboard both scored 100 in accessibility, best practices, SEO, and agentic browsing, with zero failed audits. A focused keyboard pass covered demo sign-in, Filters dialog focus and Escape return, phone-width pagination, and kiosk skip navigation. Full keyboard coverage, manual screen-reader review, and route-by-route visual comparison remain open.
- Recheck the full dependency audit. It currently reports five High findings in the build-time ESLint dependency chain through `braces@3.0.3`; the advisory has no patched version at this time.
- Finish the route-by-route visual comparison, full keyboard pass, and manual screen-reader review.
- After the security update and release gates, publish the current verified source to the existing Vercel project and confirm the deployment SHA, public requests, sign-in flow, CRUD flows, and per-tab isolation.
- The candidate commit passed Gitleaks on `2026-10-13`: 0 leaks across 1.26 MB. Repeat the scan after the pending framework security update and immediately before publishing.
- The current source-only Gitleaks scan reported 0 leaks across 1.03 MB after excluding installed dependencies and generated build output. A broad scan reported 16 generic API-key matches, all in Git-ignored `.next` output; redacted path review identified generated Next.js preview and server-action metadata, not source files.

## Existing public deployment

- The Vercel project already has a public production-target deployment at [crm-iota-ashy-10.vercel.app](https://crm-iota-ashy-10.vercel.app/login). Its login page and demo sign-in were checked anonymously on October 13, 2026; the button filled fictional credentials, opened the dashboard, and the browser reported no console errors.
- That deployment is built from snapshot SHA `09b17475ab6b0596561a7ae25f9464808d81de14` on `deploy/snapshot-20261013-2112`. It is not the current local branch HEAD (`f7d86ddf0262a8a4702b3f93b4d01a4c69d93d59`), which has uncommitted changes. Do not treat the public deployment as verification of the current workspace.
- The assigned project domain is publicly reachable; other deployment aliases redirect visitors to Vercel SSO. The Vercel project API's `live:false` field conflicts with the ready production target and public HTTP response. Keep protection settings unchanged and recheck that status before promotion.
- The existing local preview at `http://127.0.0.1:6969/login` is stale: its login responds successfully, but its dashboard JavaScript chunk returns HTTP 500. Restart the preview from the latest build before reviewing it on that port.

See [release readiness](RELEASE_READINESS.md), [test plan](TEST_PLAN.md), and [attributions](../ATTRIBUTIONS.md) for detail.
