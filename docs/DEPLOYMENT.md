# Deployment

## Candidate configuration

Deploy the Next.js application from `apps/web` on a Next-compatible Node host. Use the production build/start scripts:

```powershell
npm ci
npm run build
npm run start
```

No backend URL, database, authentication provider, or other production secret is required. Do not add external business integrations or server-side persistence to this demo. The browser simulator and synthetic store are the data plane.

## Before publishing

1. Re-run typecheck, lint, boundary checks, unit tests, build, Playwright, and both production and full dependency audits.
2. Run a dedicated secret scan and inspect the exact staged files.
3. Test representative desktop and mobile screens and verify all browser requests are same-origin.
4. Confirm the host's Node version satisfies the installed Next.js package engine requirement.
5. Verify the deployed URL, sign-in roles, CRUD flows, and per-tab isolation.
6. Keep the demo-only warning visible on CRM and kiosk screens, including lookup pages. Never enter real
   customer data; kiosk submissions are simulated and do not trigger follow-up.

As of `2026-10-13`, Next.js had announced an out-of-band security update planned for October 14, 2026, covering two Critical and one High severity upstream vulnerabilities. Wait for the published advisories, apply the recommended release, and rerun the release checks before deployment: [Next.js announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026).

The project is not deployed yet. Configure hosting and choose the public demo URL after the security update is applied.

## Current dependency review

As of `2026-10-13`, `npm audit --omit=dev --audit-level=low` reports no production dependency vulnerabilities. The full audit reports five High findings in the build-time ESLint dependency chain ending in `braces@3.0.3`; the automatic fix proposes an incompatible ESLint config downgrade. Recheck this chain for a compatible fix before publishing: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
