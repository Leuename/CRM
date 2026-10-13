# Handoff

## Demo summary

Aster CRM is a portfolio demo for fictional Aster Advisory. Sign-in and roles are simulated. Business data uses a browser-only mock service with fictional seed records. Changes stay in the current tab and reset on logout; there is no production CRM service, database, or shared visitor storage.

This is a demo only. Visitors can type arbitrary text, so persistent notices on the CRM and kiosk screens ask them not to enter real customer details.

## Verified locally on October 14, 2026 (Manila time)

- TypeScript, ESLint, and the demo-boundary check passed; 161 app and design-system source/config files were scanned.
- All 13 unit tests passed. A clean production build generated all 32 application routes.
- All 23 Playwright browser tests passed serially against that production build on isolated port 6971. The standard test command leaves the local demo on port 6969 alone.
- The production dependency audit found zero vulnerabilities. The full audit still reports five High findings in the development-only ESLint chain through `braces@3.0.3`; no patched release exists, and the suggested forced fix downgrades the ESLint configuration incompatibly.
- Route parity checks found the same 32 page paths as the source and all 49 frontend API request templates mapped to the in-browser simulator.
- Desktop and phone viewport sweeps returned HTTP 200 without page errors, off-origin requests, or document-width overflow. The login and dashboard were compared with the source at 1440×900, 1024×768, and 390×844. Signed-in source views need an unavailable API backend, so a complete route-by-route comparison is not available.
- The pipeline and opportunity form were visually checked after the layout update. The Qualified stage accent is blue, and the opportunity pages now have a single H1. The missing-contact validation announces its error and focuses the invalid select; E2E checks cover that behavior and keyboard order through product-line fields.
- Mobile Lighthouse for sign-in and dashboard scored 100 in accessibility, best practices, SEO, and agentic browsing. Keyboard and accessibility-tree checks cover CRM tabs, dialog focus, skip links, inquiry announcements, and kiosk controls. Spoken screen-reader output was not verified because a screen reader was unavailable.
- Gitleaks scanned 190 current public-tree source and documentation files (1.23 MB) and found zero leaks; generated `.next` output and installed dependencies were excluded.

## Public release status

As of `2026-10-14T07:14:19+08:00` (Manila), Next.js still describes its October 14 security update as upcoming. The announcement describes two Critical and one High upstream dependency vulnerabilities, but affected ranges and upgrade instructions are not yet published. Check the official [announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [advisories](https://github.com/vercel/next.js/security/advisories), map the update to the candidate's Next.js 16.4.0, and apply any required fix before launch.

Vercel reports `live=false`; its latest READY preview uses commit `cc618274afbe4561ef3211452509524fbabdadec`, PR #1 is open with green Vercel checks, and SSO protection covers all deployments. The release worktree is clean at that candidate commit. Production is not live and has no public production URL. Keep previews protected, then publish only after the security update is evaluated and confirm public sign-in, synthetic CRUD flows, same-origin network behavior, and per-tab isolation.

See [release readiness](RELEASE_READINESS.md), [test plan](TEST_PLAN.md), and [attributions](../ATTRIBUTIONS.md) for detail.
