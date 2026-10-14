# Release readiness

## Current status

The Aster CRM demo is a client-side simulator with fictional seed data. Sign-in, roles, and business changes are simulated; supported writes convert editable inputs to fictional presets, and data stays in the current browser tab. It is not suitable for real customer data or production CRM use.

**Do not publish yet.** As of 2026-10-14T08:40:13+08:00 (Manila), the official Next.js notice still describes its October 14 security update as planned; affected and fixed ranges have not been published, and the advisory index’s newest publication remains September 30. The working tree uses Next.js 16.4.0 and is based on 79e87a233ee029d885338e71dde341832e2eabb3. Vercel’s latest READY preview still represents that earlier commit, reports live=false, and has SSO protection enabled for all deployments. No public production deployment exists. Supported editable inputs now become fictional presets before writes or responses; deliberate DevTools/runtime tampering remains possible in this client-only demo. The current production dependency audit is clean. The ranges checked for several September issues end at 16.3.8 and do not affect 16.4.0, but the announced upstream advisories are still unknown. Wait for those ranges, compare affected packages with the lockfile, apply any required dependency update, and rerun release checks. See the [official announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [Next.js advisories](https://github.com/vercel/next.js/security/advisories).

## Latest local verification

The current working tree passed these checks on October 14, 2026:

- TypeScript, ESLint, and the production-boundary guard. The guard scanned 168 frontend and design-system source/config files.
- All 4 production-boundary guard tests and 24 unit tests across 6 files. New tests cover input normalization on edit and nested kiosk paths, audit/history safety, and legacy state removal.
- A fresh optimized Next.js 16.4.0 build generated all 32 application routes.
- All 23 Playwright tests passed serially against a production build on isolated port 6971. The suite covers demo sign-in autofill and dashboard navigation, route coverage, keyboard behavior, form validation, synthetic contact and kiosk edits, phone-width controls, same-origin requests, safe URLs, and fresh-tab isolation. Port 6969 remains the local demo port.
- npm audit --omit=dev --audit-level=low at 2026-10-14T00:18:52Z: zero production dependency findings. The full audit reports five High findings in the development-only ESLint dependency chain through braces@3.0.3; npm’s forced fix proposes an incompatible ESLint configuration downgrade.
- Prettier check passed for the files changed in this release. The repository-wide `npm run format:check` still flags files outside this release patch; unrelated files were not reformatted.
- Gitleaks scanned all 192 tracked public files at base commit 79e87a233ee029d885338e71dde341832e2eabb3 with zero findings. The exact staged candidate was scanned after the final documentation update; zero findings were reported.

The current fixes align seeded opportunity totals with product price, quantity, discount, and 12% VAT; use expected close dates and every product line for opportunity filters; clear a removed sales representative’s name; and use inclusive-start/exclusive-end calendar ranges for activity and audit entries, including combined creation-date and close-date filters.

The development-only audit finding is tracked as [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). It is not present in the production dependency set. Recheck the audit before publishing.

## Visual and accessibility evidence

- The login and dashboard were compared with the source at 1440×900, 1024×768, and 390×844. Navigation width, KPI layout, and chart structure match; the blue theme and demo notices account for intentional differences.
- A local production-build sweep captured all 32 routes at desktop and phone widths. All pages returned HTTP 200 with no page errors, off-origin requests, or document-width overflow. Playwright separately verifies the root redirect.
- The opportunity pipeline now fits all eight cards in the 1670×941 reference view, and the safety notice uses less vertical space. The formerly teal Qualified accent and its card tint are blue; a production-browser screenshot confirmed the rendered accent is `rgb(45, 112, 200)` with no page errors. The opportunity detail and create pages expose one H1, with their page titles as H2.
- Mobile Lighthouse for sign-in and dashboard scored 100 in accessibility, best practices, SEO, and agentic browsing. Keyboard and accessibility-tree checks cover skip links, dialogs, CRM tabs, form validation and field focus, kiosk controls, contextual archive names, and inquiry-step announcements.
- The source's signed-in screens require an unavailable backend, so full route-by-route source comparison is not possible. Real spoken output was not verified because a screen reader was not available. The fixed-width kiosk still requires horizontal panning in portrait.

## Production release checks

- Recheck the announced Next.js update and apply any required framework or upstream dependency fix. At 2026-10-14T08:40:13+08:00, the official announcement remained pending and the advisory index’s newest publication was dated September 30, 2026.
- Review the final public tree, asset attributions, production environment variables, and hosted source commit.
- Keep preview deployments protected. After the verified commit is merged, scope Vercel SSO protection to previews so production can be public, then confirm anonymous access to the production URL.
- Verify deployed sign-in, synthetic CRUD flows, same-origin network activity, and per-tab isolation.

## Known limits

The mock service follows the UI-facing API shapes for included workflows, but it has no server-side persistence, cross-tab synchronization, or complete backend validation and transaction behavior. Supported app writes normalize visitor values before storage; deliberate DevTools/runtime tampering remains possible. Browser `sessionStorage` can be copied when a tab is duplicated or opened with an opener, so current tests verify fresh-tab isolation, not every browser duplication behavior.
