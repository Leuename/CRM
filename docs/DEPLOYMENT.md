# Deployment

## Candidate configuration

Deploy the Next.js application from `apps/web` on a Next-compatible Node host. Use the production build/start scripts:

```powershell
npm ci
npm run build
npm run start
```

No backend URL, database, authentication provider, or other production secret is required. Do not add external business integrations or server-side persistence to this demo. Seed records are fictional. Editable records stay in the current tab's `sessionStorage` as entered; the sign-in, CRM, and kiosk screens warn visitors not to enter real or confidential data.

On Vercel, set the Root Directory to `apps/web` and enable **Include source files outside of the Root Directory in the Build Step**, because this app imports the sibling `design-system` package. Vercel documents this setting in its [monorepo shared-source guidance](https://vercel.com/docs/monorepos/monorepo-faq). Confirm the setting in project settings and with a fresh build before relying on it.

## Before publishing

1. Re-run typecheck, lint, boundary checks, boundary-guard tests, unit tests, build, Playwright, and both production and full dependency audits.
2. Run a dedicated secret scan and inspect the exact staged files.
3. Test representative desktop and mobile screens and verify all browser requests are same-origin.
4. Confirm the host's Node version satisfies the installed Next.js package engine requirement.
5. After publishing the updated source, verify the deployed URL, sign-in roles, CRUD flows, and per-tab isolation.
6. Keep the demo-only warning visible on sign-in, CRM, and kiosk screens, including lookup pages. Confirm saved edits remain tab-local and kiosk submissions are not sent to a CRM service or followed up.

As of 2026-10-14T05:09:47Z, the official Next.js blog still listed its October 14 update as upcoming. Affected ranges and upgrade instructions are to be published with the advisories, so the locked Next.js 16.4.0 cannot yet be checked against them. Hold production launch until the guidance is published, apply any required update, and rerun release checks: [Next.js announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [Next.js advisories](https://github.com/vercel/next.js/security/advisories).

The Vercel project was last checked at 2026-10-14T05:04Z. It reports `live=false`, a READY protected Preview (`target=null`) at commit `b64e94103bc856fec79140bdb1b65843ab958afa`, and SSO protection on all deployments. The current worktree has 19 modified files that are not in that deployment. No anonymous Production deployment has been verified, and the project API did not expose the Root Directory or shared-source build setting. Keep previews protected. After the candidate clears release gates, deploy the verified commit to Production, limit SSO protection to Preview, and verify anonymous access and demo flows at the production URL. See [Vercel deployment protection](https://vercel.com/docs/deployment-protection).

## Dependency audit (checked 2026-10-14)

`npm audit --omit=dev --audit-level=low` reports no production dependency vulnerabilities. The full audit reports five High findings in the development-only ESLint dependency chain ending in `braces@3.0.3`. The advisory lists no patched version, and npm's forced fix proposes an incompatible ESLint config downgrade. Recheck this chain before publishing: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
