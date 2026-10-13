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
6. Keep the demo-only warning visible on CRM and kiosk screens, including lookup pages. Never enter real
   customer data; kiosk submissions are simulated and do not trigger follow-up.

As of `2026-10-14T07:28:20+08:00` (Manila), Next.js still describes its October 14 out-of-band update as upcoming. The announcement says it will cover two Critical and one High upstream dependency vulnerabilities, but the affected ranges and upgrade instructions are not published yet. The advisory list currently shows entries through September 30. Hold production launch until the official guidance is published, map it to the candidate's Next.js 16.4.0 and upstream dependencies, apply any required upgrade, and rerun the release checks: [Next.js announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [Next.js advisories](https://github.com/vercel/next.js/security/advisories).

As of `2026-10-14T07:28:20+08:00` (Manila), Vercel reports `live=false`, no production environment variables, and a READY preview. SSO protection is enabled for all deployments, so anonymous requests redirect to SSO. Production is not live. Keep previews protected and do not share preview or branch aliases as the public demo URL. After the official security guidance is applied and the verified candidate is ready to launch, make production public and verify anonymous visitor access and the demo flows at its public URL; a local build check does not prove the hosted deployment works. See [Vercel deployment protection](https://vercel.com/docs/deployment-protection).

## Dependency audit (captured `2026-10-13T23:28Z`)

As of `2026-10-13T23:28Z`, `npm audit --omit=dev --audit-level=low` reports no production dependency vulnerabilities. The full audit reports five High findings in the build-time ESLint dependency chain ending in `braces@3.0.3`. The advisory lists no patched version, and npm's forced fix proposes an incompatible ESLint config downgrade. Recheck this chain before publishing: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
