# Release readiness

## Current status

Aster CRM is a client-side demo with fictional seed records and editable create/update workflows. User-entered values are kept as entered in the current browser tab's `sessionStorage`. The sign-in, CRM, and kiosk screens clearly warn visitors not to enter real customer, employee, personal, or confidential data. Business changes are not sent to a CRM service or database.

**Public production launch is on hold.** As of 2026-10-14T05:09:47Z, the official Next.js blog still lists its October 14 update as upcoming. The announcement says affected packages, version ranges, and upgrade guidance will be published with the advisories; the advisory index has no October 14 entries yet. The locked Next.js 16.4.0 cannot be mapped to the unpublished ranges. Wait for that guidance, upgrade if affected, and repeat release checks before production. See the [official announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [Next.js advisories](https://github.com/vercel/next.js/security/advisories).

Vercel's read-only project, deployment, and domain APIs were checked at 2026-10-14T05:04Z. The `crm` project reports `live=false`; its latest READY deployment is a protected Preview (`target=null`) at commit `b64e94103bc856fec79140bdb1b65843ab958afa`, and SSO protects all deployments. The current worktree has 19 modified files that are not included in that deployment. No anonymous public Production deployment of this release is verified. The project API response did not expose the Root Directory or shared-source build setting.

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

- Wait for the October 14 Next.js advisory, map affected packages and ranges to the current lockfile, and apply an update if needed.
- After the official Next.js advisory is published and any required update is applied, rerun source and dependency checks against the exact release SHA.
- Re-run the production and full dependency audits, secret scan, local checks, and deployed browser/network review against the exact release SHA.
- Confirm the Vercel root directory and shared-source build setting. The latest protected Preview built successfully, but the project API response did not expose these settings.
- Keep preview deployments protected. Once all gates clear, publish the verified commit to Production, scope SSO protection to Preview only, associate the chosen domain with Production, and verify anonymous sign-in, editable CRUD, same-origin traffic, warning visibility, and per-tab isolation.

## Known limits

Simulated login and roles are not production authentication or authorization. The mock service has no server-side persistence, cross-tab synchronization, or complete backend validation and transaction behavior. Deliberate browser-tool edits can alter the local simulator. Browser `sessionStorage` is isolated across fresh tabs in tests, but a browser can copy it when a tab is duplicated or opened with an opener.
