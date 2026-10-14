# Privacy and security audit

## Runtime boundary

- `apps/web/lib/api.ts` routes business requests to the local simulator.
- `apps/web/lib/demo-fetch.ts` does not call native `fetch` or an external API.
- The Next config has no backend rewrite or API target.
- No database, Supabase, or PostgreSQL package is declared for the web app.
- The response security headers include a same-origin CSP, `script-src-attr 'none'`, frame denial, MIME sniffing protection, and referrer policy. Inline scripts remain allowed for the static Next.js bootstrap output.
- Demo state is stored in session storage per browser tab and is cleared by logout. It does not synchronize between tabs.
- Login and role checks are client-side simulation, suitable only for this clearly labeled synthetic demo. Supported create and edit requests convert free-form input to fictional presets before values enter tab storage or API responses; no business request is sent to a server.
- Simulated roles do not provide real authorization: visitors can inspect or alter client-side state. Do not use this app for real CRM records or treat its role picker as an access-control boundary.

## Data review

The seed uses fictional identities and organizations, `.example` email domains, a reserved fictional phone-number range, and invented business values. Names, contact details, notes, dates, amounts, activities, and other editable values are normalized before supported writes; mutation responses, audit snapshots, history, and kiosk results therefore contain the normalized values. The v1 tab key is removed on upgrade. This client-only rule does not prevent deliberate DevTools or runtime tampering, so the app must remain a synthetic demo and its simulated roles must not be treated as access control. Source backend files, SQL, real seeds, environment files, secrets, private history, and private source handoff material are excluded.

## Automated checks

`npm run check:demo` scans frontend and design-system source/configuration for production service variables and hostnames, non-example external domains, and native network transports. It also checks declared backend client dependencies. Four negative/allowlist tests verify that the guard rejects direct frontend network calls, backend configuration, and backend dependencies while permitting the browser simulator and reserved `.example` domains. This remains a focused boundary guard, not a general-purpose secret scanner.

Gitleaks scanned all 192 tracked public files at base commit 79e87a233ee029d885338e71dde341832e2eabb3 with zero findings. On 2026-10-14 at 09:15 Manila time, it also scanned each of the 20 modified source and status-document files in this follow-up; all were clean. A broader workspace scan reported generic key patterns only in generated `.next` cache and manifest files, which are not tracked for publication. Installed dependencies and test reports were outside the public-source scan.

A source and documentation search for the remaining original-business schema names returned no matches after neutral service terminology was applied.

At 2026-10-14T00:42Z, `npm audit --omit=dev --audit-level=low` reported 0 production vulnerabilities. The full development dependency tree reports 5 High findings through the Next ESLint configuration’s transitive braces dependency. npm’s forced fix would downgrade eslint-config-next incompatibly, so it was not applied. Recheck for a compatible fix before publication. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

As of 2026-10-14T09:13:49+08:00 (Manila), the official Next.js blog still lists its October 14 security update as upcoming; the upstream package names, affected versions, and upgrade instructions remain pending. The ranges checked for several September issues end at 16.3.8, so Next.js 16.4.0 is outside those ranges. The pending upstream advisories still cannot be compared with the lockfile. Hold production launch until the official guidance is published, map it to the locked framework and upstream dependencies, apply any required upgrade, and rerun release checks. See the [official Next.js blog](https://nextjs.org/blog) and [advisory index](https://github.com/vercel/next.js/security/advisories).

## Release checks still needed

- Re-run a dedicated secret scan after the pending framework security update and inspect the exact staged tree before publishing.
- The full npm audit reports five High findings in the development-only Next.js ESLint chain (`braces@3.0.3`); `npm audit --omit=dev --audit-level=low` reports zero production findings. The announced upstream update remains pending, so compare its advisories with the locked dependency tree before launch.
- Inspect browser requests against the deployed build and confirm all business operations stay same-origin.
- Re-run current production and full dependency audits immediately before public release.
- Use the existing Vercel project, then verify the updated published URL and public flows.
- Review the final staged file list, including design assets and licenses.
