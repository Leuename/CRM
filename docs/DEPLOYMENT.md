# Deployment

## Candidate configuration

Deploy the Next.js application from `apps/web` on a Next-compatible Node host. Use the production build/start scripts:

```powershell
npm ci
npm run build
npm run start
```

No backend URL, database, authentication provider, or other production secret is required. Do not add external business integrations or server-side persistence to this demo. The browser simulator and synthetic store are the data plane.

For the existing Vercel project, set the Root Directory to `apps/web` and enable **Include source files outside of the Root Directory in the Build Step**, because this app imports the sibling `design-system` package. Vercel documents this setting in its [monorepo shared-source guidance](https://vercel.com/docs/monorepos/monorepo-faq). The current project's saved Root Directory was not returned by the available project API, so verify it in project settings before the production build.

## Before publishing

1. Re-run typecheck, lint, boundary checks, unit tests, build, Playwright, and both production and full dependency audits.
2. Run a dedicated secret scan and inspect the exact staged files.
3. Test representative desktop and mobile screens and verify all browser requests are same-origin.
4. Confirm the host's Node version satisfies the installed Next.js package engine requirement.
5. After publishing the updated source, verify the deployed URL, sign-in roles, CRUD flows, and per-tab isolation.
6. Keep the demo-only warning visible on CRM and kiosk screens, including lookup pages. Never enter real
   customer data; kiosk submissions are simulated and do not trigger follow-up.

As of `2026-10-13`, Next.js had announced an out-of-band security update planned for October 14, 2026, covering two Critical and one High severity upstream vulnerabilities. The affected versions and upgrade instructions are not published yet. Review the advisories, apply the recommended release, and rerun the release checks before deployment: [Next.js announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026).

Vercel was rechecked at `2026-10-13T15:03Z`. Project `crm` (`prj_LAZLvTMdK6pijBQPRgzCcNmOLBu5`) reports `live:false` and SSO protection for all deployments. Its latest deployment remains `READY` but has `target:null`; it is the older Git preview from branch `deploy/snapshot-20261013-2206`, SHA `94535d52ee3e7d9b51dd5547750bf5a2735fc829`. The alias `crm-demo-leuename.vercel.app` is associated with that preview branch, and anonymous requests were previously redirected to Vercel SSO. The old production attempt used SHA `f40fb9e98a323642bfe97f99eb4210dfe09c3ebe`; available logs stop during dependency installation without a cancellation reason. The project's saved root directory is not returned by the project API. A settings update to `rootDirectory: apps/web` and `sourceFilesOutsideRootDirectory: true` returned successfully, but the read endpoint does not expose those fields; a fresh candidate build must confirm the setting. The app imports the sibling `design-system`, so the build must include both directories. This checkout has no `.vercel/project.json` link. The local Vercel CLI cannot list this team (`You do not have access to the specified account`); project and domain reads through the Vercel connector work. Do not share an existing alias as the public demo URL. For release, deploy the verified source to production, scope SSO to previews, attach the public project domain to the production deployment, and verify anonymous access and demo flows. See [Vercel deployment protection](https://vercel.com/docs/deployment-protection). The earlier local HTTP 200 and sign-in check applied to a local build, not the deployed snapshot.

## Current dependency review

As of `2026-10-13T14:43Z`, `npm audit --omit=dev --audit-level=low` reports no production dependency vulnerabilities. The full audit reports five High findings in the build-time ESLint dependency chain ending in `braces@3.0.3`. The advisory lists no patched version, and npm's forced fix proposes an incompatible ESLint config downgrade. Recheck this chain before publishing: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
