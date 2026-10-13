# Privacy and security audit

## Runtime boundary

- `apps/web/lib/api.ts` routes business requests to the local simulator.
- `apps/web/lib/demo-fetch.ts` does not call native `fetch` or an external API.
- The Next config has no backend rewrite or API target.
- No database, Supabase, or PostgreSQL package is declared for the web app.
- The response security headers include a same-origin CSP, `script-src-attr 'none'`, frame denial, MIME sniffing protection, and referrer policy. Inline scripts remain allowed for the static Next.js bootstrap output.
- Demo state is stored in session storage per browser tab and is cleared by logout. It does not synchronize between tabs.
- Login and role checks are client-side simulation, suitable only for this clearly labeled synthetic demo. Visitor-entered values stay in that tab's session storage until logout or the tab closes; they are not sent to a server.
- Simulated roles do not provide real authorization: visitors can inspect or alter client-side state. Do not use this app for real CRM records or treat its role picker as an access-control boundary.

## Data review

The seed uses fictional identities and organizations, `.example` email domains, a reserved fictional phone-number range, and invented business values. Visitor-entered values are arbitrary and may be real; CRM and kiosk screens, including lookup pages, warn users not to enter real customer details. Source backend files, SQL, real seeds, environment files, secrets, private history, and private source handoff material are excluded.

## Automated checks

`npm run check:demo` scans frontend source/configuration for selected production service variables and hostnames, non-example external domains, native fetch in the UI API module, and database client dependencies. It passed on the current code. This is a focused guard, not a general-purpose secret scanner.

Gitleaks passed on the candidate commit on `2026-10-13`: 0 leaks found across approximately 1.26 MB. The current tracked diff scan covered approximately 21.84 KB and found no leaks; the three new source files were scanned separately (about 4.99 KB total) and had no findings. A broad working-tree scan found 16 generic-key pattern matches, all in Git-ignored `.next` output; redacted path review identified generated Next.js preview and server-action metadata, not source files. Rerun Gitleaks over the exact final staged tree after the framework security update and immediately before publishing.

A source and documentation search for the remaining original-business schema names returned no matches after neutral service terminology was applied.

On `2026-10-13`, `npm audit --omit=dev --audit-level=low` reported 0 production vulnerabilities. The full development dependency tree reports 5 High findings through the Next ESLint configuration's transitive `braces` dependency. npm's automatic fix would downgrade `eslint-config-next` to an incompatible major version, so it was not applied. Recheck for a compatible fix before publication. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

As of `2026-10-13`, the Next.js team had announced an out-of-band security update planned for October 14, 2026, covering two Critical and one High severity upstream vulnerabilities. The release and remediation guidance are not yet published. Review the official update and apply its recommendation before deploying. [Official Next.js announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026).

## Release checks still needed

- Re-run a dedicated secret scan after the pending framework security update and inspect the exact staged tree before publishing.
- Inspect browser requests against the deployed build and confirm all business operations stay same-origin.
- Re-run current production and full dependency audits immediately before public release.
- Use the existing Vercel project, then verify the updated published URL and public flows.
- Review the final staged file list, including design assets and licenses.
