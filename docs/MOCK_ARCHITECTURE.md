# Mock architecture

```text
Existing screens and hooks
        ↓
apps/web/lib/api.ts
        ↓
apps/web/lib/demo-fetch.ts
        ↓
sessionStorage state ← apps/web/lib/demo-data.ts
```

## Request handling

Every API wrapper calls `demoFetch`. The adapter parses the same-origin URL, dispatches to a local route handler, and returns a `Response` with the expected JSON envelope. It never delegates to browser `fetch`, creates no API server, and contains no production rewrite or API URL setting.

## State lifecycle

- Seed data is deterministic and created on first request in a tab.
- Sign-in stores the selected fictional user in that tab's state.
- Mutations update that state and append synthetic activity or audit rows as appropriate.
- Navigation and reload retain changes in that tab.
- Logout removes the state. The next sign-in starts from seed.
- Separate browser tabs and visitors use separate session storage areas; no shared server store exists.

## Role behavior

The handler enforces route capabilities, owner/creator scoping, Operations PII masking, revenue masking, Admin-only configuration, and kiosk-specific actions. The matching rules are summarized in [API_CONTRACT_MATRIX.md](API_CONTRACT_MATRIX.md).

## Hosting

The Next.js app can run on a Next-compatible Node host. Business data and actions remain in the visitor's browser; the app does not need a CRM backend, database, or production environment variables. Static assets are served by the app itself.
