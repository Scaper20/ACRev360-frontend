# ACRev360 Frontend

React + TypeScript + Vite SPA for ACRev360's web portal, per
[docs/V2_ARCHITECTURE.md](docs/V2_ARCHITECTURE.md). Talks to the
[backend](../ACRev360-backend) over its versioned REST API — see
[docs/API_REFERENCE.md](docs/API_REFERENCE.md).

## Local development

```bash
npm install
cp .env.example .env      # VITE_API_BASE_URL — defaults to the local backend
npm run dev
```

Requires the backend running (locally via venv or Docker — see
`../ACRev360-backend/docs/GETTING_STARTED.md`) at the URL in `.env`. Reachable at
`http://localhost:5173`.

Seeded admin login (once the backend's `seed_kuje` command has run): whatever
username/password you seeded it with.

## Typed API client

`src/api/schema.ts` is generated from the backend's live OpenAPI schema — not
hand-written, so it can't drift from the actual API shape:

```bash
npm run generate:api   # requires the backend running; regenerate after any API change
```

`src/api/client.ts` wraps `openapi-fetch` with the generated types, attaches the
`Authorization: Bearer` header from the current session, and retries once
through `/api/v1/auth/refresh` on a 401 before giving up.

## Stack

- **Vite + React 19 + TypeScript** (strict), `oxlint` for linting.
- **`react-router-dom`** for routing.
- **`@tanstack/react-query`** for server-state (caching, loading/error states) —
  the pattern every future screen keeps using, not scaffold-only.
- **`openapi-typescript` + `openapi-fetch`** for the typed API client above.
- **Design tokens** (`src/styles/tokens.css`) ported directly from
  [docs/DESIGN_BRIEF.md](docs/DESIGN_BRIEF.md) — the green/brass/teal palette,
  Fraunces/Public Sans/IBM Plex Mono type roles, radius/shadow scale. Component
  classes in `src/components/ui.css` follow the same brief (pill primary
  buttons, stat-tile corner-dot accents, etc.) — read that doc before adding a
  new color or component pattern rather than improvising one.

## What's built

Auth (login → JWT → protected routes) plus the full role-based navigation map
from [docs/APP_FLOW.md](docs/APP_FLOW.md) §2 — every screen a `COUNCIL_ADMIN`,
`CONSULTANT`, or `GLOBAL_VIEW` user can reach from the sidebar, each a real
round trip against the live API, not a placeholder:

- **Dashboard** / **Global Performance** — live figures from
  `/api/v1/dashboard/summary` and `/global`.
- **Payer Registry** — search, register (individual/business, with the
  business-size/TIN vs. NIN-BVN split APP_FLOW.md describes), and a detail
  view showing draft assessments with a one-click "Issue Harmonized Bill".
- **Assessment & e-Billing** — issue a bill by hand-picked lines, by rolling up
  every draft assessment, or as a pure arrears consolidation (or any
  combination); admin-only line add/edit/delete on an issued bill.
- **Payments** — collect a payment against a bill found via live search
  (`Typeahead`, not a raw ID field, per APP_FLOW.md §6b).
- **e-Receipts**, **Revenue Items** (with admin rate-change), **Reconciliation**
  (run + view exceptions), **Commission Settlements** (compute + advance
  status), **Debt Management** (refresh ageing + escalate), **Sub-Consultants**
  (onboard, status, portfolio assign/revoke), **Field Agents** (onboard +
  activity), **POS Terminal Fleet**, **Audit Log**.

List pages follow the click-through pattern from APP_FLOW.md §3 (`DataTable` +
`Modal`) rather than button-per-row.

**Not yet built**: the mobile field-agent PWA and the custom report builder —
both V2_ARCHITECTURE.md §11 phase 4, deferred on the backend too. Print
views (Demand Notice / Demand Bill) are also not built yet.

## Repository layout

```
src/
  api/         generated schema.ts + the typed fetch client (client.ts)
  auth/        token storage, auth context, protected-route wrapper
  components/  shared UI — Button, Modal, DataTable, Typeahead, Sidebar,
                 AppShell, StatCard, StatusTag, PageHeader — + ui.css and the
                 per-role navSections.ts nav map
  pages/       one file per route (PayersPage, BillsPage, PaymentsPage, …)
  styles/      design tokens (tokens.css)
scripts/       generate-api-types.mjs
docs/          product & design documentation (see below)
```

## Documentation

- [docs/DESIGN_BRIEF.md](docs/DESIGN_BRIEF.md) — the visual/interaction system this UI implements
- [docs/APP_FLOW.md](docs/APP_FLOW.md) — full navigation map, screen by screen, per role
- [docs/PRD.md](docs/PRD.md) — what the product is and why
- [docs/V2_ARCHITECTURE.md](docs/V2_ARCHITECTURE.md) — target architecture (backend-focused, but sets the frontend's constraints: SPA against a versioned REST API, JWT auth)
- [docs/API_REFERENCE.md](docs/API_REFERENCE.md) — pointer to the backend's generated API docs
