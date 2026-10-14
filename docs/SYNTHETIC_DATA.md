# Demo data and editable records

All records included with the demo are fictional and generated in `apps/web/lib/demo-data.ts`. They were not derived by renaming or reshaping customer records.

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

Seeded records are linked across companies, contacts, products, opportunities, stages, owners, lead sources, and activities. Example-domain email addresses, fictional identities and businesses, reserved fictional phone numbers, invented addresses, synthetic USD amounts, and fictional timelines are used throughout.

Each seeded activity refers to its opportunity's primary contact and the same company as that opportunity; a unit test checks these links.

The six accounts and common password `demo` are documented in the root README. These credentials are intentionally public demo values and must never be reused for real accounts.

Create, edit, and inquiry workflows preserve supported values as entered. The persistent notice says: **Demo only. Do not enter real customer, employee, personal, or confidential data.** Changes are stored in the current browser tab's `sessionStorage`; they are not sent to a CRM service, database, or shared visitor store. Values clear when the visitor signs out or closes the tab. A user's edited values are not guaranteed to be fictional, so visitors must use sample data only.

The simulator keeps allowlisted fields, validates relationships, and allows company websites only with safe `http` or `https` URLs. These measures keep the mock API shape predictable; they are not a production security boundary. Simulated roles can be inspected or altered in browser tools. Do not use the demo for real records or rely on it for access control.

The state key moved from `aster-crm-demo-v1` to `aster-crm-demo-v2`; on first use the app removes the old tab-local key before loading the synthetic seed. Browser `sessionStorage` is isolated across fresh tabs, but browsers may copy it when a tab is duplicated or opened with an opener.
