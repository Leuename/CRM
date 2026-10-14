# Synthetic data

All seeded business records are generated in `apps/web/lib/demo-data.ts`; none were derived by renaming or reshaping customer records. The mock API replaces visitor-entered business values with fictional presets before storing or returning a record.

| Entity                    |                     Seed amount |
| ------------------------- | ------------------------------: |
| Users / roles             |                               6 |
| Companies                 |                              16 |
| Individual contacts       |      30 (29 active, 1 archived) |
| Products and services     |                              15 |
| Pipeline stages           |                               8 |
| Opportunities             |                              28 |
| Activities                |                              42 |
| Audit events and consents | 0 initially; created by actions |

Records are linked across companies, contacts, products, opportunities, stages, owners, lead sources, and activities. Example-domain email addresses, fictional identities and businesses, reserved 202 phone ranges, invented addresses, synthetic USD amounts, and fictional timelines are used throughout.

Each seeded activity refers to its opportunity's primary contact and the same company as that opportunity; a unit test checks these links.

The six accounts and common password `demo` are documented in the root README. These credentials are intentionally public demo values and must never be reused for real accounts.

Create and edit forms keep their normal workflows, but submitted names, contact details, notes, dates, free text, and non-preset numeric values are converted to fictional sample values at the mock API boundary. Only selected relationships and finite categorical choices are retained. Non-example external company websites are cleared; invalid URL schemes are rejected. CRM, sign-in, and kiosk notices explain that saved values become fictional samples.

The state key moved from `aster-crm-demo-v1` to `aster-crm-demo-v2`. On the next API request, the app removes the old tab-local state and starts from the synthetic seed so values entered with the earlier demo build cannot reappear. Deliberate DevTools edits can still alter a client-only simulator; the UI and role checks are not a security boundary.

State is stored per browser tab and resets on logout. Tabs do not share edits, and there is no persistent server-side dataset.
