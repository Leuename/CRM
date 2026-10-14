# Test plan

## Automated checks

| Command                       | Purpose                                                                     | Current result                                                                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`           | TypeScript validation                                                       | Passed                                                                                                                                                                           |
| `npm run lint`                | ESLint                                                                      | Passed                                                                                                                                                                           |
| `npm run check:demo`          | Guard against production service connections and non-example external hosts | Passed; 168 frontend and design-system source/config files scanned                                                                                                               |
| `npm run test:boundary-guard` | Negative and allowlist checks for the demo boundary guard                   | Passed; 4 checks                                                                                                                                                                 |
| `npm run test:unit`           | Mock API and dashboard behavior                                             | Passed; 24 tests across 6 files                                                                                                                                                  |
| `npm run build`               | Optimized Next.js build and route generation                                | Passed; all 32 application routes generated                                                                                                                                      |
| `npm run e2e`                 | Production-build Playwright suite                                           | Passed; 23 tests, serially on isolated port 6971                                                                                                                                 |
| `npm audit --omit=dev`        | Production dependency audit                                                 | Passed; zero vulnerabilities                                                                                                                                                     |
| `npm audit`                   | Full dependency audit                                                       | Five High findings in the development-only ESLint chain through `braces@3.0.3`; no patched release is available, and the forced fix downgrades `eslint-config-next` incompatibly |
| Scoped `prettier --check`     | Formatting of changed source and documentation                              | Passed                                                                                                                                                                           |
| `npm run format:check`        | Repository-wide formatting                                                  | Reports existing files outside this release patch; no repository-wide reformat was applied                                                                                       |

The Playwright configuration defaults to port 6971 and accepts a numeric `E2E_PORT` override. It does not reuse an existing server, so browser tests do not disrupt the demo server on port 6969.

## Browser coverage

The 23-test suite covers demo credential autofill and sign-in, warning visibility on sign-in/CRM/kiosk screens, route smoke checks, browser request origin, URL safety, editable CRM and kiosk values, persistence after reload, fresh-tab isolation, keyboard navigation, opportunity contact validation and focus, product-line field order, pagination, phone-width controls, and CRM accessibility semantics. The unit suite verifies every seeded activity references its opportunity’s primary contact and company, user-entered values persist in the tab store, unknown mutation fields are dropped, audit/history entries stay local, and legacy tab state is discarded. A separate production-browser screenshot check confirmed the Qualified pipeline accent renders blue at desktop width with no page errors.

Manual visual checks covered 1440×900, 1024×768, 768×1024, and 390×844. A route screenshot sweep captured all 32 routes against a local production build at desktop and phone widths. All returned HTTP 200 with no page errors, off-origin requests, or document-width overflow. The kiosk retains a 1024px touch layout and requires horizontal panning in portrait.

The login and dashboard were compared with the source UI at desktop, tablet, and phone widths. The source's signed-in screens require an unavailable backend, so complete source-to-demo visual comparison is not possible. Real spoken screen-reader output was not verified because a screen reader was unavailable. Mobile Lighthouse for sign-in and dashboard scored 100 in accessibility, best practices, SEO, and agentic browsing.

## Mock API coverage

Unit and browser tests cover session reset; contact creation and archive; opportunity stage and creation flows; dashboard periods, filtering, and drilldowns; Operations PII masking; Triage ownership limits; invalid login; demo-only notices; and isolation between browser tabs. All 49 frontend API request templates map to the in-browser simulator.
