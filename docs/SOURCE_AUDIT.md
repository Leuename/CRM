# Source audit

## Method

The existing private application was inspected from a separate read-only checkout. The target began with no commits and contains a new repository history. Only the frontend routes, their needed UI components and styles, and the design-system materials needed to reproduce the screens were selectively brought into this target. The source checkout was not edited.

The owner explicitly confirmed redistribution permission. Included third-party design material is credited in [ATTRIBUTIONS.md](../ATTRIBUTIONS.md).

## Frontend inventory

The build enumerates 32 application routes. They cover login; dashboard; individual customers and companies; products; sales opportunities and pipeline; settings for general configuration, pipeline, and activity; audit; and the Operations kiosk for inquiries, customer lookup, and visits.

The UI uses Next.js App Router, React, TypeScript, and the included design system. API access is centralized in `apps/web/lib/api.ts`, so the simulator replaces the transport at that boundary.

## Materials excluded

- Backend service source, SQL migrations, database schemas and seed data.
- Supabase configuration, production environment files, deployment secrets, and service URLs.
- Private repository history, screenshots, archives, internal reports, and the source handoff.
- Original customer, employee, company, opportunity, and transaction records.

## Rebrand and cleanup

The app is named Aster CRM and uses the fictional advisory firm Aster Advisory. Brand marks, favicon, palette, login illustration, metadata, currency, and demo catalog were replaced or adapted. A follow-up public-source sweep replaced remaining source-specific seed/placeholder text with Aster demo copy and replaced customer-shaped masked phone/email examples in source comments with fictional examples. The included frontend was scrubbed of source-specific identifiers and operating details. The UI structure and route hierarchy remain in place.

## Audit limits

This is a targeted public-release audit of the selected frontend, not a legal opinion or a full review of the private source repository. Before release, review the final staged files and inspect the deployed browser's requests.
