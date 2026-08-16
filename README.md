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

## What's here vs. what's next

This is the **thin scaffold**: auth (login → JWT → protected routes) and one
real end-to-end round trip (the dashboard, pulling live data from
`/api/v1/dashboard/summary`). It proves the plumbing — typed client, design
tokens, auth flow — works before the full screen build starts.

**Not yet built** (follow-on phase): Payer Registry, Assessment & Billing,
Payments, e-Receipts, Reconciliation, Commission Settlements, Debt Management,
Revenue Items, Sub-Consultants, Field Agents, Audit Log — see
[docs/APP_FLOW.md](docs/APP_FLOW.md) for the full navigation map this SPA will
eventually implement.

## Repository layout

```
src/
  api/         generated schema.ts + the typed fetch client (client.ts)
  auth/        token storage, auth context, protected-route wrapper
  components/  shared UI (Button, StatCard, AppShell) + ui.css
  pages/       route-level pages (LoginPage, DashboardPage today)
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
