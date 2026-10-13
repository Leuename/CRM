# Synthetic data

All seeded business records are generated in `apps/web/lib/demo-data.ts`; none were derived by renaming or reshaping customer records. Visitors can still type arbitrary values, including real details, into the local demo.

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

The six accounts and common password `demo` are documented in the root README. These credentials are intentionally public demo values and must never be reused for real accounts.

These are synthetic seed values only. Values a visitor types into forms are arbitrary and can be real; the app cannot enforce that visitors use fictional input. Warnings on CRM and kiosk screens, including lookup pages, tell visitors not to enter real customer details.

State is stored per browser tab and resets on logout. Tabs do not share edits, and there is no persistent server-side dataset.
