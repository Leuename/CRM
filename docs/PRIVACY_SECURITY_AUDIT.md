# Privacy and security audit

## Runtime boundary

- `apps/web/lib/api.ts` routes business requests to the local simulator.
- `apps/web/lib/demo-fetch.ts` does not call native `fetch` or an external API.
- The Next config has no backend rewrite or API target.
- No database, Supabase, or PostgreSQL package is declared for the web app.
- The response security headers include a same-origin CSP, `script-src-attr 'none'`, frame denial, MIME sniffing protection, and referrer policy. Inline scripts remain allowed for the static Next.js bootstrap output.
- Demo state is stored in session storage per browser tab and is cleared by logout. It does not synchronize between tabs.
- Login and role checks are client-side simulation. The persistent app warning says not to enter real customer, employee, personal, or confidential data. Supported create and edit requests preserve values as entered in the browser tab's `sessionStorage`; no business request is sent to a CRM service or database.
- Simulated roles do not provide real authorization: visitors can inspect or alter client-side state. Do not use this app for real CRM records or treat its role picker as an access-control boundary.

## Data review

The seed uses fictional identities and organizations, `.example` email domains, a reserved fictional phone-number range, and invented business values. User-entered names, contact details, notes, dates, amounts, and activities remain editable and are stored as entered in tab-local storage; audit snapshots, history, and kiosk responses are local simulator output. The warning tells visitors to use demo data only, since entered values are not guaranteed to be fictional. The v1 tab key is removed on upgrade. This client-only design does not prevent deliberate DevTools or runtime tampering, so the app must remain a demo and its simulated roles must not be treated as access control. Source backend files, SQL, real seeds, environment files, secrets, private history, and private source handoff material are excluded.

## Automated checks

`npm run check:demo` scans frontend and design-system source/configuration for production service variables and hostnames, non-example external domains, and native network transports. It also checks declared backend client dependencies. Four negative/allowlist tests verify that the guard rejects direct frontend network calls, backend configuration, and backend dependencies while permitting the browser simulator and reserved `.example` domains. This remains a focused boundary guard, not a general-purpose secret scanner.

Gitleaks reported zero findings when run at the repository root after the editable-CRUD, warning, and documentation updates on 2026-10-14. Generated `.next` caches, installed dependencies, and test reports are ignored and are not part of the public source tree.

A source and documentation search for the remaining original-business schema names returned no matches after neutral service terminology was applied.

The latest `npm audit --omit=dev --audit-level=low` reported zero production vulnerabilities. The full development dependency tree reports five High findings through the Next ESLint configuration's transitive `braces@3.0.3` dependency. The advisory lists no patched version; npm's forced fix would downgrade `eslint-config-next` incompatibly, so it was not applied. Recheck before publication. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

As of 2026-10-14T05:09:47Z, the official Next.js blog still lists its October 14 security update as upcoming; affected packages, versions, and upgrade instructions remain pending. The locked Next.js 16.4.0 cannot yet be checked against those unpublished ranges. Hold production launch until the official guidance is published, map it to the lockfile, apply any required upgrade, and rerun release checks. See the [official announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [advisory index](https://github.com/vercel/next.js/security/advisories).

## Release checks still needed

- The announced Next.js update is pending; map its advisories to the lockfile and apply any required fix.
- The Codex Security Standard scan completed at 2026-10-14T05:10Z against the 194-file non-generated worktree snapshot, including the 19 modified files; it reported zero findings across nine reviewed surfaces. Provider settings and hosted Production traffic are outside the source scan and remain deployment checks.
- After those gates clear, rerun typecheck, lint, boundary tests, unit tests, build, Playwright, Gitleaks, and production/full dependency audits on the exact release SHA.
- Inspect the deployed browser requests, headers, and warning; verify anonymous sign-in, editable CRUD, and fresh-tab isolation.
- Review the final public tree, asset attributions, Vercel root/shared-source settings, and hosted source commit.
