# Project scope

## Goal

Deliver a public-ready Aster CRM portfolio demo that preserves the existing CRM screens and workflows while replacing the organization identity, colors, business data, and runtime service layer with fictional equivalents.

The project owner confirmed permission to redistribute the copied application and design materials. The source repository remains a separate read-only reference; the target has an independent Git history. The current release candidate keeps business edits in the browser tab and displays a warning against entering real or confidential data. Production remains disabled while the October 14 Next.js security update is pending; the whole-worktree source scan found no reportable issues. See [release readiness](RELEASE_READINESS.md).

## Included

- All 32 application routes from the reference frontend, including customer, company, product, opportunity, dashboard, settings, audit, and front-desk screens.
- A same-origin API adapter with session-scoped demo state, simulated sign-in, editable CRUD workflows, client-side demo role gates, dashboard aggregation, audit entries, and kiosk actions.
- Create and edit values are preserved in the current tab's `sessionStorage`; unsupported fields are dropped, relationships are validated, and unsafe website schemes are rejected. A persistent warning tells visitors not to enter real or confidential data.
- Six fictional roles: Administrator, Manager, Sales, Finance, Operations, and Triage.
- Aster Advisory branding, a centralized blue/indigo palette, new logo and icon, and synthetic USD data.
- Type, lint, local boundary, unit/integration, build, and browser smoke-test commands.

## Excluded

- Production API, database, authentication provider, webhooks, analytics, external integrations, or persistent visitor data.
- Private source history, production configuration, environment values, original seeds, customer records, internal handoff material, and backend/database files.
- New CRM workflows or a replacement component library.

## Acceptance status

The application builds locally and the simulator is covered by automated tests. The current candidate passes typecheck, lint, boundary checks, 24 unit tests, 23 Playwright tests, and Gitleaks. The whole-worktree Codex Security scan completed with zero reportable findings. The preview remains protected and production is not publicly accessible. The October 14 Next.js security update and Vercel production settings remain release gates. Review release readiness and deployment notes for the remaining gates.
