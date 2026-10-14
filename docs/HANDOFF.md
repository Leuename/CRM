# Handoff

## Demo summary

Aster CRM is a demo portfolio app with fictional seed data. Sign-in and role checks are simulated. Editable create, update, and kiosk workflows keep supported values in the current browser tab's `sessionStorage`; business mutations are not sent to a CRM service or database. Visitors see a clear warning on sign-in, CRM, and kiosk pages: **do not enter real customer, employee, personal, or confidential data**. The values a visitor enters are not guaranteed to be fictional.

## Verified locally on October 14, 2026

- TypeScript, ESLint, and the demo-boundary check passed; the guard scanned 168 frontend and design-system source/config files. All 4 boundary-guard tests passed.
- All 24 unit tests across 6 files passed. They cover fictional seed relationships, opportunity price/discount/VAT arithmetic, editable values, allowed mutation fields, audit/history safety, and legacy-state reset.
- All 23 Playwright tests passed against a fresh production build on isolated port 6971. Coverage includes the single demo sign-in button and dummy credentials, warning visibility, CRUD save/reload, kiosk edits, fresh-tab isolation, URL safety, route coverage, keyboard and accessibility behavior, and same-origin requests. Port 6969 is the local demo port.
- The optimized build generated all 32 routes. A desktop/phone route sweep returned HTTP 200 with no page errors, off-origin requests, or document-width overflow.
- Gitleaks found no secrets in the public source tree. Seed and source comment review found no remaining original-customer examples after the masked phone/email comments were replaced with fictional values.
- `npm audit --omit=dev --audit-level=low` reported zero production dependency vulnerabilities. The full dependency tree reports five High findings in the development-only Next ESLint chain through `braces@3.0.3`; the advisory has no patched release, and npm's forced fix downgrades the ESLint configuration incompatibly.
- Route parity and request-template checks cover all 32 app routes and all 49 frontend API request templates. Source comparison, desktop/mobile, Lighthouse, and accessibility evidence is summarized in [release readiness](RELEASE_READINESS.md) and [test plan](TEST_PLAN.md).

## Public release status

At 2026-10-14T05:09:47Z, the official Next.js announcement still listed the October 14 update as upcoming. Affected packages and version ranges had not yet been published, so they could not be compared with the locked Next.js 16.4.0. See the [announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [advisory index](https://github.com/vercel/next.js/security/advisories).

Vercel was checked at 2026-10-14T05:04Z: `live=false`; latest deployment READY as a protected Preview (`target=null`) at commit `b64e94103bc856fec79140bdb1b65843ab958afa`; SSO protection covers all deployments. The current worktree has 19 modified files that are not included in that deployment. No anonymous Production deployment is verified, and the project API did not expose the Root Directory or shared-source build setting.

The Codex Security Standard scan completed at 2026-10-14T05:10Z against the 194-file non-generated worktree snapshot, including the 19 modified files. It reported zero findings across nine reviewed surfaces. The scan excludes provider settings and hosted Production traffic. Keep preview protection enabled until the Next.js advisory gate clears; then publish, scope SSO to previews, and verify anonymous sign-in, editable CRUD, tab-local storage, and browser network behavior.

See [release readiness](RELEASE_READINESS.md), [test plan](TEST_PLAN.md), [privacy and security audit](PRIVACY_SECURITY_AUDIT.md), and [attributions](../ATTRIBUTIONS.md) for detail.
