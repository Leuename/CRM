# Release readiness

## Current status

The Aster CRM demo is a client-side simulator with fictional seed data. Sign-in, roles, and business changes are simulated; data stays in the current browser tab. It is not suitable for real customer data or production CRM use.

**Local application checks pass, but the public launch is waiting on the Next.js security update announced for October 14.** As of `2026-10-14T07:39:59+08:00` (Manila), Next.js still describes the update as upcoming; affected ranges and upgrade instructions are not available. The candidate uses Next.js 16.4.0. Vercel reports `live=false`; the latest preview is READY, and SSO protects all deployments. There is no live production deployment or public production URL. PR #1 remains open, its preview is READY, and both Vercel checks passed. Recheck the official guidance, map its affected ranges to the candidate, apply any required update, then rerun the release suite before launch. See the [official announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [Next.js advisories](https://github.com/vercel/next.js/security/advisories).

## Latest local verification

The current working tree passed these checks on October 14, 2026:

- TypeScript, ESLint, and the production-boundary guard. The guard scanned 166 frontend and design-system source/config files.
- All 4 production-boundary guard tests and 14 unit tests.
- A fresh optimized Next.js build generated all 32 application routes.
- All 23 Playwright tests passed serially against that production build on isolated port 6971. The suite includes demo sign-in autofill and dashboard navigation, route coverage, keyboard behavior, form validation, kiosk flows, phone-width controls, same-origin requests, safe URLs, and per-tab isolation. Port 6969 remains the local demo port.
- `npm audit --omit=dev`: zero production dependency findings.
- Prettier check passed for the files changed in this release. The repository-wide `npm run format:check` still flags files outside this release patch; unrelated files were not reformatted.
- Gitleaks scanned the current public tree (about 1.52 MB), excluding generated `.next`, installed dependencies, and test reports; zero leaks were found.

The full `npm audit` reports five High findings through `braces@3.0.3` in the development-only Next.js ESLint dependency chain. No patched `braces` version is published, and `npm audit fix --force` proposes an incompatible downgrade of `eslint-config-next`. `braces` is absent from the production dependency audit. The latest captured audit is `2026-10-13T23:28Z`; recheck this before the release. See [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

## Visual and accessibility evidence

- The login and dashboard were compared with the source at 1440×900, 1024×768, and 390×844. Navigation width, KPI layout, and chart structure match; the blue theme and demo notices account for intentional differences.
- A local production-build sweep captured all 32 routes at desktop and phone widths. All pages returned HTTP 200 with no page errors, off-origin requests, or document-width overflow. Playwright separately verifies the root redirect.
- The opportunity pipeline now fits all eight cards in the 1670×941 reference view, and the safety notice uses less vertical space. The formerly teal Qualified accent and its card tint are blue; a production-browser screenshot confirmed the rendered accent is `rgb(45, 112, 200)` with no page errors. The opportunity detail and create pages expose one H1, with their page titles as H2.
- Mobile Lighthouse for sign-in and dashboard scored 100 in accessibility, best practices, SEO, and agentic browsing. Keyboard and accessibility-tree checks cover skip links, dialogs, CRM tabs, form validation and field focus, kiosk controls, contextual archive names, and inquiry-step announcements.
- The source's signed-in screens require an unavailable backend, so full route-by-route source comparison is not possible. Real spoken output was not verified because a screen reader was not available. The fixed-width kiosk still requires horizontal panning in portrait.

## Production release checks

- Recheck the announced Next.js update and apply any required framework or upstream dependency fix.
- Review the final public tree, asset attributions, production environment variables, and hosted source commit.
- Keep preview deployments protected. Make the production deployment public only after the verified commit is merged, then confirm anonymous access to the demo URL.
- Verify deployed sign-in, synthetic CRUD flows, same-origin network activity, and per-tab isolation.

## Known limits

The mock service follows the UI-facing API shapes for included workflows, but it has no server-side persistence, cross-tab synchronization, or complete backend validation and transaction behavior. Visitors can type arbitrary text; persistent notices on CRM and kiosk screens tell them not to enter real customer details.
