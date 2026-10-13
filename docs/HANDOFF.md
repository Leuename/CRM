# Handoff

## Demo summary

Aster CRM is a public-facing portfolio demo for fictional advisory firm Aster Advisory. Its sign-in and roles are simulated, and its business operations use an in-browser mock service with synthetic seed records. There is no production CRM service, database, or shared visitor storage. Each tab keeps its own state and resets on logout.

The app is for demonstration only. The forms accept arbitrary text, which could be real information if a visitor ignores the warnings. The persistent notices on the CRM and kiosk screens ask visitors not to enter real customer details.

## Verified locally on October 13, 2026

- TypeScript, ESLint, and the demo-boundary check passed; 157 app and design-system source/config files were scanned. The guard blocks non-example external domains and production service connections.
- 12 unit tests passed, including dashboard period/filter and null-source drilldown behavior.
- Optimized Next.js build generated all 32 routes.
- 12 Playwright browser tests passed against the current local production build. Coverage includes all CRM list/detail/create/edit and settings routes, legacy redirects, kiosk routes, sign-in validation announcements, same-origin requests, URL safety, per-tab isolation, the phone-width Opportunities create action, the phone-width kiosk customer edit and save flow, and pagination visibility, navigation, and disabled boundary states.
- Route parity audit found the same 32 page paths and all 49 frontend API request templates mapped to the in-browser simulator.
- Manual browser checks covered 1440×900, 1024×768, 768×1024, and 390×844. The checked CRM flows produced no browser errors or off-origin requests; the Opportunities create action, Products pagination, and kiosk customer edit dialog fit at phone width. Pagination exposes accessible labels and disables arrow controls at either end.
- A local production-build screenshot sweep captured the 31 login, CRM, and kiosk paths other than `/` at 1440×900 and 390×844 (62 screenshots). All returned HTTP 200 with no page errors, off-origin requests, or document-width overflow; Playwright separately verifies the root redirect. This is a rendering and viewport-fit check; a full source-to-demo visual comparison remains open. Captures are in the temporary folder `crm-release-visual-20261013`.
- `npm audit --omit=dev` reported no production dependency vulnerabilities.
- The kiosk was visually checked at 1024×768 and 768×1024. The persistent notice fit without covering its controls, horizontal scrolling exposed the Continue action on the portrait tablet, and the customer edit dialog and save flow fit a 390×844 viewport. The fixed-width kiosk still requires horizontal panning in portrait.
- After removing input autofocus, a production-browser check at 390×844 confirmed the kiosk starts at `scrollLeft=0`, keeping the left-side controls in view until the visitor taps the phone field.

## Before a public launch

- Apply the relevant Next.js security update announced for October 14, 2026, and rerun the full release checks. The installed dependency is Next.js 16.4.0; the upstream advisories and fixed versions are not published yet. See [deployment notes](DEPLOYMENT.md).
- Mobile Lighthouse passed after labeling the compact Aster dashboard link: sign-in and dashboard both scored 100 in accessibility, best practices, SEO, and agentic browsing, with zero failed audits. A focused keyboard pass covered demo sign-in, Filters dialog focus and Escape return, and phone-width pagination. Full keyboard coverage, manual screen-reader review, and route-by-route visual comparison remain open.
- Recheck the full dependency audit. It currently reports five High findings in the build-time ESLint dependency chain through `braces@3.0.3`; the advisory has no patched version at this time.
- Finish the route-by-route visual comparison, full keyboard pass, and manual screen-reader review.
- Create or import the hosting project, deploy the verified build, and confirm public requests, sign-in roles, CRUD flows, and per-tab isolation.
- The candidate commit passed Gitleaks on `2026-10-13`: 0 leaks across 1.26 MB. Repeat the scan after the pending framework security update and immediately before publishing.

No public deployment has been verified yet. The local preview runs at `http://127.0.0.1:6969/login`.

See [release readiness](RELEASE_READINESS.md), [test plan](TEST_PLAN.md), and [attributions](../ATTRIBUTIONS.md) for detail.
