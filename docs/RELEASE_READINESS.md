# Release readiness

## Current status

The Aster CRM demo is a client-side simulator with fictional seed data. Sign-in, roles, and changes are simulated; data stays in the current browser tab. This project is not suitable for real customer data or production CRM use.

**The local candidate passes its current functional checks, but production launch remains on hold.** As of `2026-10-14T00:11:12+08:00`, the current hosted candidate is a ready preview protected by Vercel SSO; anonymous requests redirect to SSO. Its branch build uses `apps/web` and includes the sibling `design-system`. Production is not live, and no production deployment exists from this candidate. The official Next.js security update scheduled for October 14 has not yet been published in the official release sources; affected versions and upgrade instructions remain pending. Hold production launch until that guidance is published, apply any required upgrade, and rerun the release checks. See the [official Next.js announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026).

The following local checks passed on October 13, 2026:

- TypeScript, ESLint, and the demo-boundary scan (160 application and design-system source/config files).
- 13 unit tests, including dashboard stage filtering, creation/close-period semantics, dense revenue windows, null-source drilldown, and blue legacy-stage color behavior.
- Optimized Next.js build with all 32 routes generated.
- 20 Playwright tests passed against the current production build on port 6969 with one worker, including all CRM list/detail/create/edit and settings routes, legacy redirects, sign-in validation announcements, kiosk routes, same-origin requests, URL safety, per-tab isolation, phone-width controls, pagination visibility, page navigation, and disabled boundary states. Accessibility coverage includes kiosk calendar and CRM detail-tab keyboard navigation, tab-panel relationships, inquiry-step announcements and focus, row-specific archive action names, skip links, landmarks, and the tablet login brand panel. The default six-worker run exceeded available Chromium memory; the serial run passed all 20. These runs predate the demo sign-in loading test; the suite now has 21 tests and needs a fresh `npm run e2e` run.
- Production dependency audit: 0 advisories.
- Route parity audit: source and demo have the same 32 page paths; all 49 frontend API request templates map to the in-browser simulator.
- A local production-build screenshot sweep captured the 31 login, CRM, and kiosk paths other than `/` at 1440×900 and 390×844 (62 screenshots). Every page returned HTTP 200 with no page errors, off-origin requests, or document-width overflow; Playwright separately verifies the root redirect. Full comparison with the source UI remains open.
- Mobile Lighthouse after the logo-link fix: sign-in and dashboard each scored 100 for accessibility, best practices, SEO, and agentic browsing, with no failed audits.
- Candidate commit Gitleaks scan: 0 leaks across 1.26 MB; repeat after the pending framework security update and before publishing.
- Current source-only Gitleaks scan: 0 leaks across 1.03 MB with generated `.next` output and installed `node_modules` excluded. A broad scan reported 16 generic API-key matches, all in the Git-ignored `.next` build output; redacted review identified generated Next.js preview and server-action metadata, not source files.
- Final local rerun at `2026-10-13T15:03Z`: typecheck, lint, formatting, demo boundary check, 13 unit tests, a fresh build generating all 32 routes, 20 serial Playwright tests, production dependency audit, and targeted source/documentation Gitleaks scans passed. The production audit found 0 vulnerabilities. The full audit still reports 5 High findings from the build-time `braces@3.0.3` chain; do not run the incompatible forced downgrade.

The full dependency audit reports 5 High findings in the build-time ESLint dependency chain ending in `braces@3.0.3`. Its automatic fix proposes an incompatible ESLint configuration downgrade. Recheck for a compatible fix before release; see [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

The manual browser pass covered 1440×900, 1024×768, 768×1024, 390×844, and a candidate-only route sweep at 1280×720. The checked flows had no browser errors or off-origin requests. A source-to-demo comparison of login and dashboard at 1440×900, 1024×768, and 390×844 found matching navigation width, KPI layout, and chart structure; the demo notice and blue palette explain the visible shifts. The source's signed-in views require its unavailable API backend, so full route-by-route visual comparison remains open. Keyboard checks confirmed the demo login order, Filters dialog focus entry and Escape return, phone-width pagination, kiosk skip-link navigation, kiosk service description behavior, calendar tabs, CRM detail tabs, and inquiry-step focus. The Chromium accessibility-tree audit found and fixed the wizard focus/announcement, repeated archive names, and CRM detail-tab semantics. Actual spoken output remains unverified: Narrator was not running and this environment cannot capture speech. The Opportunities create action, Products pagination, and kiosk customer edit dialog fit at phone width; pagination disables arrow controls at either end. The kiosk keeps its fixed 1024px layout and requires horizontal panning in portrait.

As of `2026-10-14T00:11:12+08:00`, the hosted candidate is a ready, SSO-protected preview built from `apps/web` with the sibling `design-system`; anonymous requests redirect to SSO. Production is not live, so an anonymously accessible public demo URL and production visitor-flow verification remain pending. Do not share a preview or branch alias as the public demo URL.

## Public-release gates

- As of `2026-10-14T00:11:12+08:00`, the official Next.js security update scheduled for October 14 had not yet appeared in the release sources checked; affected versions and upgrade instructions remain pending. Hold production launch until the official guidance is published, apply any required upgrade, and rerun dependency audits and all release checks. See [the official announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [deployment notes](DEPLOYMENT.md).
- Recheck the current full dependency audit; its five High findings are in the build-time ESLint chain, and the advisory has no compatible patched version in the current lockfile.
- Run `npm run e2e` (it builds and serves its own production server on free port 6969) and record the 21-test result.
- Inspect the final staged asset list and keep it aligned with [the documented attributions](../ATTRIBUTIONS.md).
- Complete source-to-demo visual comparison for the signed-in routes, and verify spoken announcements with a screen reader. The current candidate-only 1280×720 route pass, keyboard checks, and Lighthouse results do not replace those checks.
- Confirm the hosting project and public hostname, keep previews protected, and verify anonymous visitor access at the eventual public URL.
- After the security and accessibility gates, an owner-approved release (outside this feature-branch run) should verify the deployed source, browser requests, sign-in flow, CRUD paths, and per-tab isolation.

## Known limits

The mock service follows the UI-facing API shapes for the included workflows, but it does not provide server-side persistence, cross-tab synchronization, complete backend validation or transaction behavior, or full visual regression coverage. The kiosk keeps its 1024px touch layout and scrolls horizontally on narrower screens. Seed data is fictional. Visitors can still type real details, so the demo warning must stay visible on the CRM and kiosk screens.
