# Project scope

## Goal

Deliver a public-ready Aster CRM portfolio demo that preserves the existing CRM screens and workflows while replacing the organization identity, colors, business data, and runtime service layer with fictional equivalents.

The project owner confirmed permission to redistribute the copied application and design materials. The source repository remains a separate read-only reference; the target has an independent Git history. The local release worktree is on `codex/demo-boundary-and-seed`, based on commit `79e87a233ee029d885338e71dde341832e2eabb3`; the latest Vercel preview represents that earlier commit from the GitHub branch `feat/portfolio-demo`.

## Included

- All 32 application routes from the reference frontend, including customer, company, product, opportunity, dashboard, settings, audit, and front-desk screens.
- A same-origin API adapter with session-scoped synthetic state, simulated sign-in, CRUD workflows, authorization, dashboard aggregation, audit entries, and kiosk actions.
- Create and edit inputs are normalized to fictional presets at the mock API boundary; pre-v2 tab state is discarded on upgrade.
- Six fictional roles: Administrator, Manager, Sales, Finance, Operations, and Triage.
- Aster Advisory branding, a centralized blue/indigo palette, new logo and icon, and synthetic USD data.
- Type, lint, local boundary, unit/integration, build, and browser smoke-test commands.

## Excluded

- Production API, database, authentication provider, webhooks, analytics, external integrations, or persistent visitor data.
- Private source history, production configuration, environment values, original seeds, customer records, internal handoff material, and backend/database files.
- New CRM workflows or a replacement component library.

## Acceptance status

The application builds locally and the simulator is covered by automated tests. As of 2026-10-14T08:35:48+08:00 (Manila), the working tree passes typecheck, lint, 24 unit tests and 4 boundary tests, a production build, and 23 Playwright tests. Vercel’s READY preview still represents the earlier base commit; live=false and SSO protects all deployments. There is no publicly accessible production deployment yet. The October 14 Next.js security update remains a release gate. Review release readiness and deployment notes for the remaining gate.
