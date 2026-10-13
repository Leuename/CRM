# Project scope

## Goal

Deliver a public-ready Aster CRM portfolio demo that preserves the existing CRM screens and workflows while replacing the organization identity, colors, business data, and runtime service layer with fictional equivalents.

The project owner confirmed permission to redistribute the copied application and design materials. The source repository remains a separate read-only reference; the target has an independent Git history and the local development branch is `feat/portfolio-demo`.

## Included

- All 32 application routes from the reference frontend, including customer, company, product, opportunity, dashboard, settings, audit, and front-desk screens.
- A same-origin API adapter with session-scoped synthetic state, simulated sign-in, CRUD workflows, authorization, dashboard aggregation, audit entries, and kiosk actions.
- Six fictional roles: Administrator, Manager, Sales, Finance, Operations, and Triage.
- Aster Advisory branding, a centralized blue/indigo palette, new logo and icon, and synthetic USD data.
- Type, lint, local boundary, unit/integration, build, and browser smoke-test commands.

## Excluded

- Production API, database, authentication provider, webhooks, analytics, external integrations, or persistent visitor data.
- Private source history, production configuration, environment values, original seeds, customer records, internal handoff material, and backend/database files.
- New CRM workflows or a replacement component library.

## Acceptance status

The application builds locally and the simulator is covered by automated tests. The existing public deployment is an earlier snapshot; publishing the updated source and inspecting its deployed network behavior are still release steps. See [release readiness](RELEASE_READINESS.md) and [deployment notes](DEPLOYMENT.md).
