# UX fidelity checklist

The reference application is the layout and interaction baseline. Changes are limited to fictional branding, palette, icons, examples, and values needed to remove identifying material.

## Preserved route groups

- [x] Login and role-based landing routes.
- [x] Dashboard, pipeline, opportunity list/detail/edit/create.
- [x] Individual and company list/detail/edit/create.
- [x] Product list/detail/edit/create.
- [x] General, activity, audit, and pipeline settings.
- [x] Operations kiosk, customer lookup/detail, inquiries, new inquiry, and visits.
- [x] Root redirects and legacy path redirects.

## Interaction coverage

- [x] Sign in, sign out, and session-scoped state.
- [x] Customer create, edit, archive, restore, search, filtering, and paging.
- [x] Opportunity creation, editing, stage changes, history, and live dashboard recalculation.
- [x] Kiosk inquiry creation, customer lookup, PII reveal audit, and narrow customer correction.
- [x] Role capability and ownership checks in the mock API.
- [x] Existing component library and design system retained.
- [x] Keyboard checks for demo login, Filters dialog focus return, and phone-width pagination.
- [x] Targeted accessibility checks for kiosk skip navigation, main landmarks and one h1 per route, dashboard inquiry labels, and individual-contact heading.
- [x] Login brand panel retains readable copy at 1024px and hides at 390px.
- [ ] Manual screen-reader review.
- [ ] Full source-to-demo visual comparison across desktop and mobile breakpoints.
- [x] Capture all 31 login, CRM, and kiosk paths other than `/` at 1440×900 and 390×844 (62 screenshots); every page returned HTTP 200 with no page errors, off-origin requests, or document-width overflow. Playwright separately verifies the root redirect.
- [ ] Compare every captured route and animation timing against the reference application.

## Browser smoke coverage

Playwright covers the demo sign-in, all CRM list/detail/create/edit and settings routes, legacy redirects, Operations kiosk routes and customer editing, Sales create/search and unsafe website URLs, same-origin requests, and per-tab isolation. This route smoke suite does not replace full visual regression or accessibility review.

A source comparison confirmed exactly 32 page paths in both trees and matched all 49 frontend API request templates to simulator handlers. Dashboard filters now follow the source API’s stage, creation-date, close-date, snapshot, and null-source behavior.

The latest browser pass also checked representative CRM flows at 1440×900, 1024×768, 768×1024, and 390×844. The Opportunities create action, Products pagination, and kiosk customer edit dialog fit at 390px; pagination announces its current page, gives arrow controls accessible names, and disables arrows at either end. The fixed-width kiosk requires horizontal panning in portrait. Route screenshots are captured; full reference comparison and manual screen-reader review remain open.
