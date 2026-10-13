# Release readiness

## Current status

The Aster CRM demo is a client-side simulator with fictional seed data. Sign-in, roles, and changes are simulated; data stays in the current browser tab. This project is not suitable for real customer data or production CRM use.

**The demo is already publicly reachable. Hold the current workspace revision for the security and release gates before promotion.** The sample catalog and login artwork use a fictional advisory firm, and source-specific identifiers have been removed. The public Vercel deployment serves an earlier snapshot; the local HEAD has uncommitted changes. Next.js has a security update scheduled for October 14, 2026; review and apply the published guidance before promoting the current revision.

The following local checks passed on October 13, 2026:

- TypeScript, ESLint, and the demo-boundary scan (160 application and design-system source/config files).
- 13 unit tests, including dashboard stage filtering, creation/close-period semantics, dense revenue windows, null-source drilldown, and blue legacy-stage color behavior.
- Optimized Next.js build with all 32 routes generated.
- 17 Playwright tests passed against a fresh isolated production build on port 6975, including all CRM list/detail/create/edit and settings routes, legacy redirects, sign-in validation announcements, kiosk routes, same-origin requests, URL safety, per-tab isolation, the phone-width Opportunities create action, the phone-width kiosk edit dialog and save flow, pagination visibility, page navigation, and disabled boundary states, plus kiosk calendar arrow/Home/End keyboard navigation and tab-panel labeling, kiosk service description keyboard behavior, skip-link and landmark checks, dashboard inquiry labels, the individual-contact heading, and the tablet login brand panel.
- Production dependency audit: 0 advisories.
- Route parity audit: source and demo have the same 32 page paths; all 49 frontend API request templates map to the in-browser simulator.
- A local production-build screenshot sweep captured the 31 login, CRM, and kiosk paths other than `/` at 1440×900 and 390×844 (62 screenshots). Every page returned HTTP 200 with no page errors, off-origin requests, or document-width overflow; Playwright separately verifies the root redirect. Full comparison with the source UI remains open.
- Mobile Lighthouse after the logo-link fix: sign-in and dashboard each scored 100 for accessibility, best practices, SEO, and agentic browsing, with no failed audits.
- Candidate commit Gitleaks scan: 0 leaks across 1.26 MB; repeat after the pending framework security update and before publishing.
- Current source-only Gitleaks scan: 0 leaks across 1.03 MB with generated `.next` output and installed `node_modules` excluded. A broad scan reported 16 generic API-key matches, all in the Git-ignored `.next` build output; redacted review identified generated Next.js preview and server-action metadata, not source files.

The full dependency audit reports 5 High findings in the build-time ESLint dependency chain ending in `braces@3.0.3`. Its automatic fix proposes an incompatible ESLint configuration downgrade. Recheck for a compatible fix before release; see [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

The manual browser pass covered 1440×900, 1024×768, 768×1024, and 390×844, with no browser errors or off-origin requests in the checked flows. A source-to-demo comparison of login and dashboard at 1440×900, 1024×768, and 390×844 found matching navigation width, KPI layout, and chart structure; the demo notice and blue palette explain the visible shifts. Full route-by-route comparison remains open. Keyboard checks confirmed the demo login order, Filters dialog focus entry and Escape return, phone-width pagination, kiosk skip-link navigation, kiosk service description behavior, and calendar tab navigation. Targeted Playwright accessibility-tree checks cover kiosk landmarks and one h1 per route, the calendar tab-panel relationship, dashboard inquiry labels, the individual-contact heading, and readable tablet login branding. The Opportunities create action, Products pagination, and kiosk customer edit dialog now fit at phone width; pagination disables arrow controls at either end. The kiosk keeps its fixed 1024px layout and requires horizontal panning in portrait. Manual screen-reader review remains open.

The public [Vercel demo](https://crm-iota-ashy-10.vercel.app/login) was checked anonymously on October 13, 2026: `/login` returned HTTP 200, and a browser smoke test confirmed that the single demo sign-in opened the dashboard with the demo-only notice and no console errors. The deployment is from snapshot SHA `09b17475ab6b0596561a7ae25f9464808d81de14`, not local HEAD `f7d86ddf0262a8a4702b3f93b4d01a4c69d93d59`. The assigned project domain is public; other deployment aliases require Vercel SSO. Vercel's project API reports `live:false` despite the ready production-target deployment and public HTTP response, so recheck the project status in Vercel before promotion and leave access settings unchanged.

The local preview on port 6969 is stale: `/login` returns HTTP 200, but the dashboard JavaScript chunk returns HTTP 500. Restart it from the latest production build and recheck the sign-in flow before using that preview.

## Public-release gates

- Review and apply the Next.js security update planned for October 14, 2026, then rerun dependency audits and all release checks. See [the official announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [deployment notes](DEPLOYMENT.md).
- Recheck the current full dependency audit; its five High findings are in the build-time ESLint chain, and the advisory has no compatible patched version in the current lockfile.
- Inspect the final staged asset list and keep it aligned with [the documented attributions](../ATTRIBUTIONS.md).
- Complete route-by-route visual comparison and manual screen-reader accessibility review; the current keyboard pass and Lighthouse results do not replace those checks.
- Publish the current verified source to the existing Vercel project after the security and accessibility gates, then verify the deployed SHA, browser requests, sign-in flow, CRUD paths, and per-tab isolation.

## Known limits

The mock service follows the UI-facing API shapes for the included workflows, but it does not provide server-side persistence, cross-tab synchronization, complete backend validation or transaction behavior, or full visual regression coverage. The kiosk keeps its 1024px touch layout and scrolls horizontally on narrower screens. Seed data is fictional. Visitors can still type real details, so the demo warning must stay visible on the CRM and kiosk screens.
