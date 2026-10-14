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

At 2026-10-14T05:37:31Z, the official Next.js blog still listed its October 14 Pacific update as upcoming. Affected ranges and upgrade instructions are to be published with the advisories, so the locked Next.js 16.4.0 cannot yet be checked against them. `npm view next@latest version` still returned `16.4.0`, and `npm audit --omit=dev --audit-level=low` reported zero known production dependency vulnerabilities. Hold production launch until the guidance is published, apply the official update if affected, and rerun release checks: [Next.js announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [Next.js advisories](https://github.com/vercel/next.js/security/advisories).

At 2026-10-14T05:37:31Z, the Vercel project reported `live=false`; commit `809278ad338f4090d273ee5cfbb05fe321fee6c4` was READY as a protected Preview (`target=null`) at [crm-jcbv06uct-grade-fit-s-projects.vercel.app](https://crm-jcbv06uct-grade-fit-s-projects.vercel.app), with SSO protection on all deployments. Anonymous `/login` returned HTTP 302 to SSO at 05:25:45Z. A protected-deployment fetch through the Vercel connector returned HTTP 200 at 05:38:36Z with CSP, HSTS, frame, content-type, referrer, and permissions headers; Preview also returned `X-Robots-Tag: noindex`. A Production-target lookup at 05:40:15Z found one deployment, in CANCELED state; no READY Production deployment was listed. The project API did not expose the Root Directory or shared-source setting; the successful Preview build confirms the sibling design-system source is available. Keep previews protected. After the candidate clears release gates, deploy the verified commit to Production, limit SSO protection to Preview, and verify anonymous access and demo flows at the production URL. See [Vercel deployment protection](https://vercel.com/docs/deployment-protection).

## Dependency audit (checked 2026-10-14)

`npm audit --omit=dev --audit-level=low` reports no production dependency vulnerabilities. The full audit reports five High findings in the development-only ESLint dependency chain ending in `braces@3.0.3`. The advisory lists no patched version, and npm's forced fix proposes an incompatible ESLint config downgrade. Recheck this chain before publishing: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
