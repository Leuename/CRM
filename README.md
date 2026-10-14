# Aster CRM Demo

Aster CRM is a fictional, browser-based portfolio demo for CRM workflows. It keeps the source application's 32 user-facing routes and uses a local simulator with fictional records. It does not need a CRM server or database.

Demo use only: do not enter real customer information. Sign-in, roles, and changes are simulated. Changes stay in the current browser tab, are cleared when you sign out or close it, and are not sent to a real CRM.

## Run locally

```powershell
cd apps/web
npm ci
npm run dev
```

Open `http://localhost:6969`. All six demo accounts use the password `demo`:

| Account                 | Role                  |
| ----------------------- | --------------------- |
| `admin@aster.example`   | Administrator         |
| `manager@aster.example` | Manager               |
| `sales@aster.example`   | Sales                 |
| `finance@aster.example` | Finance               |
| `desk@aster.example`    | Operations front desk |
| `triage@aster.example`  | Intake / triage       |

Each browser tab keeps its own session state in `sessionStorage`. Changes persist while navigating and refreshing that tab. Logging out clears the session and restores the seed on the next sign-in.

## Checks

```powershell
npm run typecheck
npm run lint
npm run test:check
npm run build
npm run e2e
npm audit --omit=dev
```

See [release readiness](docs/RELEASE_READINESS.md) for current verification status and known limits, [deployment notes](docs/DEPLOYMENT.md) for release steps, and [attributions](ATTRIBUTIONS.md) for design asset credits.
