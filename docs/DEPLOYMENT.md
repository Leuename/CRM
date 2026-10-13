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

1. Re-run typecheck, lint, boundary checks, unit tests, build, Playwright, and both production and full dependency audits.
2. Run a dedicated secret scan and inspect the exact staged files.
3. Test representative desktop and mobile screens and verify all browser requests are same-origin.
4. Confirm the host's Node version satisfies the installed Next.js package engine requirement.
5. After publishing the updated source, verify the deployed URL, sign-in roles, CRUD flows, and per-tab isolation.
6. Keep the demo-only warning visible on CRM and kiosk screens, including lookup pages. Never enter real
   customer data; kiosk submissions are simulated and do not trigger follow-up.

As of `2026-10-14T00:11:12+08:00`, the official Next.js security update scheduled for October 14 had not yet appeared in the release sources checked. Affected versions and upgrade instructions remain pending. Hold production launch until the official guidance is published, apply any required upgrade, and rerun the release checks: [Next.js announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026).

As of `2026-10-14T00:11:12+08:00`, the current hosted candidate is a ready preview protected by Vercel SSO; anonymous requests redirect to SSO. Its branch build uses `apps/web` and includes the sibling `design-system`. Production is not live, and this feature-branch run does not deploy or promote to production. Keep previews protected and do not share preview or branch aliases as the public demo URL. After production release, verify anonymous visitor access and the demo flows at its public URL; a local build check does not prove the hosted deployment works. See [Vercel deployment protection](https://vercel.com/docs/deployment-protection).

## Dependency audit (captured `2026-10-13T14:43Z`)

As of `2026-10-13T14:43Z`, `npm audit --omit=dev --audit-level=low` reports no production dependency vulnerabilities. The full audit reports five High findings in the build-time ESLint dependency chain ending in `braces@3.0.3`. The advisory lists no patched version, and npm's forced fix proposes an incompatible ESLint config downgrade. Recheck this chain before publishing: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
