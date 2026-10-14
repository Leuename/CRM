# Handoff

## Demo summary

Aster CRM is a portfolio demo for fictional Aster Advisory. Sign-in and roles are simulated. Business data uses a browser-only mock service with fictional seed records. Changes stay in the current tab and reset on logout; there is no production CRM service, database, or shared visitor storage.

This is a demo only. Saved edits become fictional sample values before the local mock service stores or returns them. Notices on sign-in, CRM, and kiosk screens tell visitors not to enter real customer details and explain the conversion.

## Verified locally on October 14, 2026 (Manila time)

- TypeScript, ESLint, and the demo-boundary check passed; 168 frontend and design-system source/config files were scanned. All 4 boundary-guard tests passed.
- All 24 unit tests across 6 files passed. They verify synthetic seed relationships and opportunity price, discount, VAT, total arithmetic, input normalization, audit/history safety, and legacy-state reset. A clean production build generated all 32 application routes.
- All 23 Playwright browser tests passed serially against that production build on isolated port 6971. The standard test command leaves the local demo on port 6969 alone.
- Seeded activities link to their opportunity's primary contact and company; the unit suite verifies those references.
- The production dependency audit at 2026-10-14T00:42Z found zero vulnerabilities. The full audit reports five High findings in the development-only ESLint chain through braces@3.0.3; the forced fix downgrades the ESLint configuration incompatibly.
- Route parity checks found the same 32 page paths as the source and all 49 frontend API request templates mapped to the in-browser simulator.
- Desktop and phone viewport sweeps returned HTTP 200 without page errors, off-origin requests, or document-width overflow. The login and dashboard were compared with the source at 1440×900, 1024×768, and 390×844. Signed-in source views need an unavailable API backend, so a complete route-by-route comparison is not available.
- The pipeline and opportunity form were visually checked after the layout update. The Qualified stage accent is blue, and the opportunity pages now have a single H1. The missing-contact validation announces its error and focuses the invalid select; E2E checks cover that behavior and keyboard order through product-line fields.
- Mobile Lighthouse for sign-in and dashboard scored 100 in accessibility, best practices, SEO, and agentic browsing. Keyboard and accessibility-tree checks cover CRM tabs, dialog focus, skip links, inquiry announcements, and kiosk controls. Spoken screen-reader output was not verified because a screen reader was unavailable.
- Gitleaks scanned all 192 tracked public files at the base candidate commit with zero findings. On 2026-10-14 at 09:15 Manila time, it also scanned each of the 20 modified source and status-document files in this follow-up; all were clean. Generated .next, installed dependencies, and test reports were excluded.

## Public release status

As of 2026-10-14T09:13:49+08:00 (Manila), the Next.js blog still lists its October 14 security update as upcoming. It addresses three upstream vulnerabilities, two Critical and one High; affected ranges and upgrade instructions are not yet published. Check the official Next.js blog and advisories, map the update to the candidate’s Next.js 16.4.0 and upstream dependencies, and apply any required fix before launch.

As of 2026-10-14T09:13:49+08:00 (Manila), Vercel reports live=false and SSO protection for all deployments. PR #1 is open with commit 4382e3740f98cd1c2d19a9ebc9f5db71fdffeb12; both Vercel checks passed, and the commit has a READY preview at https://crm-9nwzjjo0n-grade-fit-s-projects.vercel.app. It is a protected preview, not a public production deployment. Keep previews protected, clear the announced security gate, then publish and verify anonymous sign-in, synthetic CRUD flows, same-origin network behavior, and per-tab isolation.

See [release readiness](RELEASE_READINESS.md), [test plan](TEST_PLAN.md), and [attributions](../ATTRIBUTIONS.md) for detail.
