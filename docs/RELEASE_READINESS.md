# Release readiness

## Current status

The Aster CRM demo is a client-side simulator with fictional seed data. Sign-in, roles, and changes are simulated; data stays in the current browser tab. This project is not suitable for real customer data or production CRM use.

**Not ready for public deployment yet.** The sample catalog and login artwork now use a fictional advisory firm, and source-specific identifiers have been removed. Next.js has a security update scheduled for October 14, 2026; review and apply the published guidance before launch.

The following local checks passed on October 13, 2026:

- TypeScript, ESLint, and the demo-boundary scan (157 application and design-system source/config files).
- 12 unit tests, including dashboard stage filtering, creation/close-period semantics, dense revenue windows, and the null-source drilldown.
- Optimized Next.js build with all 32 routes generated.
- 12 Playwright tests passed against the current local production build, including all CRM list/detail/create/edit and settings routes, legacy redirects, sign-in validation announcements, kiosk routes, same-origin requests, URL safety, per-tab isolation, the phone-width Opportunities create action, the phone-width kiosk edit dialog and save flow, and pagination visibility, page navigation, and disabled boundary states.
- Production dependency audit: 0 advisories.
- Route parity audit: source and demo have the same 32 page paths; all 49 frontend API request templates map to the in-browser simulator.
- A local production-build screenshot sweep captured the 31 login, CRM, and kiosk paths other than `/` at 1440×900 and 390×844 (62 screenshots). Every page returned HTTP 200 with no page errors, off-origin requests, or document-width overflow; Playwright separately verifies the root redirect. Full comparison with the source UI remains open.
- Mobile Lighthouse after the logo-link fix: sign-in and dashboard each scored 100 for accessibility, best practices, SEO, and agentic browsing, with no failed audits.
- Candidate commit Gitleaks scan: 0 leaks across 1.26 MB; repeat after the pending framework security update and before publishing.

The full dependency audit reports 5 High findings in the build-time ESLint dependency chain ending in `braces@3.0.3`. Its automatic fix proposes an incompatible ESLint configuration downgrade. Recheck for a compatible fix before release; see [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

The manual browser pass covered 1440×900, 1024×768, 768×1024, and 390×844, with no browser errors or off-origin requests in the checked flows. Keyboard checks confirmed the demo login order, Filters dialog focus entry and Escape return, and phone-width pagination. The Opportunities create action, Products pagination, and kiosk customer edit dialog now fit at phone width; pagination disables arrow controls at either end. The kiosk keeps its fixed 1024px layout and requires horizontal panning in portrait.

## Public-release gates

- Review and apply the Next.js security update planned for October 14, 2026, then rerun dependency audits and all release checks. See [the official announcement](https://nextjs.org/blog/upcoming-nextjs-security-update-october-2026) and [deployment notes](DEPLOYMENT.md).
- Recheck the current full dependency audit; its five High findings are in the build-time ESLint chain, and the advisory has no compatible patched version in the current lockfile.
- Inspect the final staged asset list and keep it aligned with [the documented attributions](../ATTRIBUTIONS.md).
- Complete route-by-route visual comparison and manual screen-reader accessibility review; the current keyboard pass and Lighthouse results do not replace those checks.
- Create a commit and configure hosting; no hosting project or public deployment has been verified.
- After deployment, inspect browser requests and verify public sign-in and demo flows.

## Known limits

The mock service follows the UI-facing API shapes for the included workflows, but it does not provide server-side persistence, cross-tab synchronization, complete backend validation or transaction behavior, or full visual regression coverage. The kiosk keeps its 1024px touch layout and scrolls horizontally on narrower screens. Seed data is fictional. Visitors can still type real details, so the demo warning must stay visible on the CRM and kiosk screens.
