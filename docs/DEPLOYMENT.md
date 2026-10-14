# Deployment

## Candidate configuration

Deploy the Next.js application from `apps/web` on a Next-compatible Node host. Use the production build/start scripts:

```powershell
npm ci
npm run build
npm run start
```

No backend URL, database, authentication provider, or other production secret is required. Do not add external business integrations or server-side persistence to this demo. The browser simulator and synthetic store are the data plane.

On Vercel, set the Root Directory to `apps/web` and enable **Include source files outside of the Root Directory in the Build Step**, because this app imports the sibling `design-system` package. Vercel documents this setting in its [monorepo shared-source guidance](https://vercel.com/docs/monorepos/monorepo-faq). Confirm the setting in project settings and with a fresh build before relying on it.

## Before publishing

1. Re-run typecheck, lint, boundary checks, boundary-guard tests, unit tests, build, Playwright, and both production and full dependency audits.
2. Run a dedicated secret scan and inspect the exact staged files.
3. Test representative desktop and mobile screens and verify all browser requests are same-origin.
4. Confirm the host's Node version satisfies the installed Next.js package engine requirement.
5. After publishing the updated source, verify the deployed URL, sign-in roles, CRUD flows, and per-tab isolation.
6. Keep the demo-only warning visible on sign-in, CRM, and kiosk screens, including lookup pages.
   Saved edits become fictional sample values; kiosk submissions are simulated and do not trigger
   follow-up.

As of 2026-10-14T08:40:13+08:00 (Manila), the official Next.js notice still describes the October 14 out-of-band update as planned. It covers two Critical and one High upstream dependency vulnerabilities, but affected ranges and upgrade instructions are not published yet. The advisory index’s newest publication is dated September 30. Hold production launch until the official guidance is published, map its affected ranges to the locked Next.js 16.4.0 and upstream dependencies, apply any required upgrade, and rerun release checks: [Next.js announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [Next.js advisories](https://github.com/vercel/next.js/security/advisories).

As of 2026-10-14T08:40:13+08:00 (Manila), the Vercel project reports live=false, a READY preview for base commit 79e87a233ee029d885338e71dde341832e2eabb3, and SSO protection enabled for all deployments. Anonymous requests to the preview require SSO. Production is not live, and the local working changes have not been deployed. Keep previews protected and do not share preview or branch aliases as the public demo URL. After the candidate clears release gates and is merged, scope protection to previews, deploy production, and verify anonymous access and demo flows at the production URL. See [Vercel deployment protection](https://vercel.com/docs/deployment-protection).

## Dependency audit (checked 2026-10-14T08:18:52+08:00 Manila)

`npm audit --omit=dev --audit-level=low` reports no production dependency vulnerabilities. The full audit reports five High findings in the development-only ESLint dependency chain ending in `braces@3.0.3`. The advisory lists no patched version, and npm's forced fix proposes an incompatible ESLint config downgrade. Recheck this chain before publishing: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
