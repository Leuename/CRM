# Release readiness

## Current status

Aster CRM is a client-side demo with fictional seed records and editable create/update workflows. User-entered values are kept as entered in the current browser tab's `sessionStorage`. The sign-in, CRM, and kiosk screens clearly warn visitors not to enter real customer, employee, personal, or confidential data. Business changes are not sent to a CRM service or database.

**Public production launch is on hold.** At 2026-10-14T05:37:31Z, the official Next.js blog still listed its October 14 Pacific security update as upcoming. The announcement says affected packages, version ranges, and upgrade guidance will be published with the advisories. `npm view next@latest version` still returned `16.4.0`, so the locked version cannot yet be mapped to the unpublished ranges. The production dependency audit reports zero known vulnerabilities; repeat the audit and apply the official guidance when published. See the [official announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [Next.js advisories](https://github.com/vercel/next.js/security/advisories).

At 2026-10-14T05:37:31Z, the `crm` project reported `live=false`; commit `809278ad338f4090d273ee5cfbb05fe321fee6c4` was READY as a protected Preview (`target=null`) at [crm-jcbv06uct-grade-fit-s-projects.vercel.app](https://crm-jcbv06uct-grade-fit-s-projects.vercel.app), with SSO protecting all deployments. An anonymous `/login` request at 05:25:45Z returned HTTP 302 to Vercel SSO. A protected-deployment fetch through the Vercel connector at 05:38:36Z returned HTTP 200 with CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`; Preview also returned `X-Robots-Tag: noindex`. A Production-target lookup at 05:40:15Z found one deployment, in CANCELED state; no READY Production deployment was listed. The 19-file release change is committed on PR #1. The project API did not expose the Root Directory or shared-source setting; the successful Preview build confirms the current build can resolve the sibling design-system source.

From `apps/web`, the full `npm audit --audit-level=high` reports five High findings in the development-only Next ESLint dependency chain through `braces@3.0.3`; the advisory lists no patched version and npm's forced fix proposes an incompatible `eslint-config-next` downgrade. `npm audit --omit=dev --audit-level=low` reports zero production vulnerabilities. Keep the full-audit finding documented and recheck it before publication: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

The Codex Security Standard scan completed at 2026-10-14T05:10Z against the 194-file non-generated worktree snapshot, including the 19 modified files. It reported zero findings across nine reviewed surfaces. The scan excludes provider control-plane settings and hosted Production traffic; those remain separate deployment checks. The earlier diff scan also reported zero findings across the 19 changed files.

## Local verification

The release candidate passed these local checks on October 14, 2026:

- TypeScript typecheck and ESLint.
- `npm run check:demo` over 168 frontend and design-system source/config files.
- All 4 boundary-guard tests and 24 unit tests across 6 files.
- An optimized Next.js 16.4.0 build with all 32 application routes.
- All 23 Playwright tests against a production build on isolated port 6971. Coverage includes the sign-in warning and demo autofill, warning visibility in CRM and kiosk, route coverage, accessibility, safe URLs, editable CRM and kiosk values, reload persistence, same-origin requests, and fresh-tab isolation. The user's local demo remains on port 6969.
- `npm audit --omit=dev --audit-level=low`: zero production dependency vulnerabilities; the full audit result is described above.
- Gitleaks: zero findings in the 1.10 MB public source, config, and documentation snapshot (tracked plus non-ignored working-tree files). Generated `.next` build output was excluded.
- `git diff --check` and scoped Prettier checks passed. The repository-wide format check reports pre-existing files outside this release patch.

## Visual and accessibility evidence

- The login and dashboard were compared with the source at 1440×900, 1024×768, and 390×844. Navigation width, KPI layout, and chart structure match; the blue theme and demo notices account for intentional differences.
- A local production-build sweep captured all 32 routes at desktop and phone widths. All pages returned HTTP 200 with no page errors, off-origin requests, or document-width overflow. Playwright separately verifies the root redirect.
- The opportunity pipeline fits all eight cards in the 1670×941 reference view, and the warning uses less vertical space. The Qualified accent renders blue as `rgb(45, 112, 200)`. Opportunity detail and create pages expose one H1, with page titles as H2.
- Mobile Lighthouse for sign-in and dashboard scored 100 in accessibility, best practices, SEO, and agentic browsing. Keyboard and accessibility-tree checks cover skip links, dialogs, CRM tabs, form validation and field focus, kiosk controls, contextual archive names, and inquiry-step announcements.
- The source's signed-in screens require an unavailable backend, so full route-by-route source comparison is not possible. Spoken screen-reader output was not verified because a screen reader was unavailable. The fixed-width kiosk still requires horizontal panning in portrait.

## Before production

- Wait for the October 14 Next.js advisory, map affected packages and ranges to the current lockfile, and apply the official update if needed.
- After the official Next.js advisory is published and any required update is applied, rerun source and dependency checks against the exact release SHA.
- Re-run the production and full dependency audits, secret scan, local checks, and deployed browser/network review against the exact release SHA.
- Confirm the Vercel root directory and shared-source build setting. The latest protected Preview built successfully, but the project API response did not expose these settings.
- Keep preview deployments protected. Once all gates clear, publish the verified commit to Production, scope SSO protection to Preview only, associate the chosen domain with Production, and verify anonymous sign-in, editable CRUD, same-origin traffic, warning visibility, and per-tab isolation.

## Known limits

Simulated login and roles are not production authentication or authorization. The mock service has no server-side persistence, cross-tab synchronization, or complete backend validation and transaction behavior. Deliberate browser-tool edits can alter the local simulator. Browser `sessionStorage` is isolated across fresh tabs in tests, but a browser can copy it when a tab is duplicated or opened with an opener.
