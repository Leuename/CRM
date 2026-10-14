# Release readiness

## Current status

The Aster CRM demo is a client-side simulator with fictional seed data. Sign-in, roles, and business changes are simulated; supported writes convert editable inputs to fictional presets, and data stays in the current browser tab. It is not suitable for real customer data or production CRM use.

**Public production launch is on hold.** As of 2026-10-14T09:19+08:00 (Manila), the official Next.js blog still lists its October 14 security update as upcoming; affected and fixed ranges have not been published. It covers three upstream vulnerabilities, two Critical and one High. At the latest check, PR #1 was open at commit `f7e46599fd874781e270a6e8e43fdc9eee000c41`; both Vercel checks passed, and Vercel reported a READY preview at https://crm-7cjlyj990-grade-fit-s-projects.vercel.app. Vercel reports live=false and SSO protection for all deployments, so this remains a protected preview. Supported editable inputs become fictional presets before writes or responses; deliberate DevTools/runtime tampering remains possible in this client-only demo. A fresh production dependency audit is clean. The September advisories checked end at 16.3.8 and do not affect the locked Next.js 16.4.0, but the announced upstream advisories still cannot be mapped to the lockfile. Wait for the official guidance, compare affected packages, apply any required update, and rerun release checks. See the [official announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [Next.js advisories](https://github.com/vercel/next.js/security/advisories).

## Latest local verification

The release candidate passed these checks on October 14, 2026:

- TypeScript, ESLint, and the production-boundary guard. The guard scanned 168 frontend and design-system source/config files.
- All 4 production-boundary guard tests and 24 unit tests across 6 files. New tests cover input normalization on edit and nested kiosk paths, audit/history safety, and legacy state removal.
- A fresh optimized Next.js 16.4.0 build generated all 32 application routes.
- All 23 Playwright tests passed serially against a production build on isolated port 6971. The suite covers demo sign-in autofill and dashboard navigation, route coverage, keyboard behavior, form validation, synthetic contact and kiosk edits, phone-width controls, same-origin requests, safe URLs, and fresh-tab isolation. Port 6969 remains the local demo port.
- A fresh `npm audit --omit=dev --audit-level=low` at 2026-10-14T01:16:51Z found zero production dependency vulnerabilities. The full audit still reports five High findings in the development-only ESLint dependency chain through braces@3.0.3; the advisory lists no patched version, and npm’s forced fix proposes an incompatible ESLint configuration downgrade.
- Prettier check passed for the files changed in this release. The repository-wide `npm run format:check` still flags files outside this release patch; unrelated files were not reformatted.
- Gitleaks found zero findings in the 192-file base candidate scan and in a separate scan of all 20 source and status-document files modified in the code follow-up. The five updated release-status documents were scanned again after this refresh with zero findings. A workspace-wide scan matched only generated `.next` cache and manifest artifacts, not tracked public source.
- PR #1's Vercel Preview Comments and Vercel deployment checks passed for commit `f7e46599fd874781e270a6e8e43fdc9eee000c41`; Vercel reports its preview READY.

The current fixes align seeded opportunity totals with product price, quantity, discount, and 12% VAT; use expected close dates and every product line for opportunity filters; clear a removed sales representative’s name; and use inclusive-start/exclusive-end calendar ranges for activity and audit entries, including combined creation-date and close-date filters.

The development-only audit finding is tracked as [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). It is not present in the production dependency set. Recheck the audit before publishing.

## Visual and accessibility evidence

- The login and dashboard were compared with the source at 1440×900, 1024×768, and 390×844. Navigation width, KPI layout, and chart structure match; the blue theme and demo notices account for intentional differences.
- A local production-build sweep captured all 32 routes at desktop and phone widths. All pages returned HTTP 200 with no page errors, off-origin requests, or document-width overflow. Playwright separately verifies the root redirect.
- The opportunity pipeline now fits all eight cards in the 1670×941 reference view, and the safety notice uses less vertical space. The formerly teal Qualified accent and its card tint are blue; a production-browser screenshot confirmed the rendered accent is `rgb(45, 112, 200)` with no page errors. The opportunity detail and create pages expose one H1, with their page titles as H2.
- Mobile Lighthouse for sign-in and dashboard scored 100 in accessibility, best practices, SEO, and agentic browsing. Keyboard and accessibility-tree checks cover skip links, dialogs, CRM tabs, form validation and field focus, kiosk controls, contextual archive names, and inquiry-step announcements.
- The source's signed-in screens require an unavailable backend, so full route-by-route source comparison is not possible. Real spoken output was not verified because a screen reader was not available. The fixed-width kiosk still requires horizontal panning in portrait.

## Production release checks

- Recheck the announced Next.js update and apply any required framework or upstream dependency fix. At 2026-10-14T09:13:49+08:00, the official blog still listed the update as upcoming.
- Review the final public tree, asset attributions, production environment variables, and hosted source commit.
- Keep preview deployments protected. After the security gate clears and the verified commit is merged, scope Vercel SSO protection to previews so production can be public, then confirm anonymous access to the production URL.
- Verify deployed sign-in, synthetic CRUD flows, same-origin network activity, and per-tab isolation.

## Known limits

The mock service follows the UI-facing API shapes for included workflows, but it has no server-side persistence, cross-tab synchronization, or complete backend validation and transaction behavior. Supported app writes normalize visitor values before storage; deliberate DevTools/runtime tampering remains possible. Browser `sessionStorage` can be copied when a tab is duplicated or opened with an opener, so current tests verify fresh-tab isolation, not every browser duplication behavior.
