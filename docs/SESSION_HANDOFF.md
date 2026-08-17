# ACRev360 Frontend — Session Handoff

A running log of what this repo is, how it got built, and which way specific calls were
made — written so a fresh chat session can pick this project up without re-deriving any
of it. This repo has no PRD/TDD of its own yet; the closest thing to a design doc is
[`docs/V2_FRONTEND.md`](../../Test%20prod/docs/V2_FRONTEND.md) and
[`docs/V2_ARCHITECTURE.md`](../../Test%20prod/docs/V2_ARCHITECTURE.md), which live in the
**old** `Test prod` / `LGRCS` repo (sibling directory, `C:\Users\Star2knb\Documents\Test
prod`) — not this one. Read those two first for the *why* behind the stack choices; this
file is for what happened building on top of them.

**If you're a new session reading this:** the plan this build followed is saved at
`C:\Users\Star2knb\.claude\plans\smooth-cooking-nautilus.md` (approved, executed in full
through live verification). This file supplements it with what was actually discovered
while executing — don't re-plan from scratch.

---

## 1. Where this project came from

The user is redesigning a single-council revenue-collection prototype (RevAc, the old
`Test prod` repo) into **ACRev360** — a multi-tenant platform for FCT Area Councils,
starting with Kuje, with the eventual goal of covering every Abuja area council. That
redesign was explicitly scoped as **a fresh rewrite starting with the backend** — I was
asked only for an architecture recommendation first (`V2_ARCHITECTURE.md`), then a
companion frontend architecture doc (`V2_FRONTEND.md`), with an explicit "I don't want
you building anything yet" at that stage.

The user then revealed someone else had already built the real backend from that
architecture: [`Scaper20/ACRev360-backend`](https://github.com/Scaper20/ACRev360-backend),
deployed live at `https://acrev360-backend.onrender.com`. The ask became: **build a
frontend that plugs into this real backend's real API** — no demo/seed-data
affordances, name the project ACRev360. This repo is that frontend.

I cloned the backend and verified its actual contract directly against source — not just
the OpenAPI schema — before writing a line of frontend code. That's where the six
overrides in §3 came from.

## 2. Repo layout

New standalone repo at `C:\Users\Star2knb\Documents\ACRev360-frontend`, `git init`'d,
**one commit so far** (`4fd5172`, everything in one shot — this wasn't built with
incremental commits the way the old repo was, since it didn't exist as a working app
until the whole first pass was done). No GitHub remote yet — the user will create that
themselves, same as every push decision in the old repo.

npm workspaces monorepo:

```
apps/
  portal/     React 19 + TypeScript ~5.9.3 + Vite 8 — the only app built out this pass
packages/
  api/        @acrev360/api — openapi-typescript output + typed fetch client + 6 overrides + msw mocks
  ui/         @acrev360/ui  — ported design system (tokens + 13 components)
  config/     @acrev360/config — shared tsconfig/oxlint/prettier
```

`packages/api/src/generated/schema.ts` (3363 lines, from `npm run codegen`) **is
committed on purpose**, not gitignored — the repo needs to build without live network
access to the backend. Re-run `npm run codegen` (in `packages/api`) if the backend's
schema changes; it hits `https://acrev360-backend.onrender.com/api/schema/` directly.

`npx tsc -b` from `apps/portal` is clean across all three packages as of the last check
this session — zero errors.

## 3. The live backend's contract doesn't fully match its own OpenAPI schema

Verified by reading the actual backend source (`apps/*/serializers.py`, `views.py`) in
the cloned repo, not just trusting the generated schema. Six places diverge; every one
of them is hand-corrected in [`packages/api/src/overrides.ts`](../packages/api/src/overrides.ts)
with a comment citing the specific mismatch:

1. `POST /api/v1/payments` → `201` is really a full `Payment` object, not the documented
   `PostPayment` request-echo shape.
2. `POST /api/v1/api-clients` → `201` has two fields spliced in outside any serializer
   (`secret`, `_secret_warning`) — the only time the plaintext webhook secret is ever
   returned. Miss this override and the secret is unrecoverable after creation.
3. `POST /api/v1/channels/{code}/webhook` → real responses are 200/201/202/400/401
   depending on outcome, not the one documented code. Callers must branch on
   `response.status`.
4. `POST /api/v1/channels/USSD/session` → `Content-Type` is really `text/plain` (a raw
   `"CON ..."`/`"END ..."` string), not JSON. Never call `.json()` on it.
5. `POST /api/v1/settlements/compute` → `201` is a bare `CommissionSettlement[]` array,
   not the paginated envelope the schema claims.
6. `AddLineRequest` and `BillLineEntryRequest` are field-for-field identical — collapsed
   into one `BillLineEntry` type.

**If the backend gets updated and re-schema'd, re-verify these six by hand** —
`openapi-typescript` will regenerate from whatever the schema *claims*, which is exactly
what was wrong the first time.

**Recurring smaller gotcha, not worth a numbered override but worth knowing:** several
path parameters are typed `string` in the generated schema (DRF regex-pattern URL
converters) even though they're semantically numeric IDs — `/bills/{id}/detail`,
`/bills/{id}/lines`, `/payers/{id}`, `/revenue-items/{id}/rate`, among others (but not
consistently — e.g. a bill's `line_id` came through typed differently than its `id` on
the same route). Always check the generated type per call site and wrap with `String(x)`
where required; don't assume consistency across similar-looking endpoints.

## 4. Auth and CORS — the two bugs live testing actually caught

Everything up to this point had only been verified by `tsc -b` passing — real proof
came from logging into the live backend with real admin credentials
(`admin` / `acrev360admin`, provided by the user for this specific deployment) and
watching the console. Two real bugs surfaced, both fixed:

**CORS.** `POST /api/v1/auth/login` from `http://localhost:5173` was blocked outright —
the live backend's `CORS_ALLOWED_ORIGINS` doesn't list any frontend origin yet (matches
a `sync: false` comment in the backend's own `render.yaml`, waiting on a deployed Vercel
URL that doesn't exist yet). **Fixed locally only**, via a Vite dev-server proxy
(`apps/portal/vite.config.ts`) that makes `/api/*` requests same-origin from the
browser's point of view:

```ts
server: {
  proxy: {
    '/api': { target: 'https://acrev360-backend.onrender.com', changeOrigin: true, secure: true },
  },
},
```

**This does not fix the real gap.** Once this frontend is deployed to Vercel, Render's
`CORS_ALLOWED_ORIGINS` needs the actual deployed origin added, or every production
request will fail the same way. Flag this to whoever owns the Render deployment before
or immediately after the first deploy — it's called out in code comments in both
`vite.config.ts` and `packages/api/src/client.ts`, but nothing enforces it automatically.

**React render-phase violation.** `LoginPage` called `navigate()` directly in its render
body when `user` was already truthy (post-login, or resuming an existing session) —
threw a real console error, "Cannot update a component while rendering a different
component," confirmed live. Fixed by moving the redirect into a `useEffect`
(`apps/portal/src/routes/LoginPage.tsx:19-23`); confirmed clean (zero console errors) in
a fresh browser tab afterward. Worth remembering as a pattern: any component that reads
auth state and might immediately want to redirect must do it in an effect, never inline
in the render body.

**Session read-path verified live, confirmed working with zero console errors after both
fixes:** login, session persistence across reload, role-driven nav, dashboard, payer
registry (list + detail), bills (list + detail with correct `SUPERSEDED`/`CANCELLED`
payment-gating). **Write-path (create a real payer/bill/payment) was deliberately not
tested** — see §8.

**Render free-tier cold start:** the backend sleeps after idling and takes ~40s to wake
on the first request. Not a bug — expect it, don't debug it as one.

## 5. Design system: ported, not redesigned — with two deliberate fixes

Source of truth was `frontend/styles.css` in the old repo (the warm-palette version —
confirmed the mobile app never got that migration, so it was explicitly *not* used as a
reference). Full token set, all 13 core components, ported into `packages/ui`. Two
intentional deviations from a pure port, both improvements over what the original code
actually did (not just what its design brief claimed):

- `font-variant-numeric: tabular-nums` actually added to the mono/numeric style
  (`packages/ui/src/base.css`) — the old design brief claimed this was already the
  behavior; the old CSS never actually set it.
- `ClickableRow` (`packages/ui/src/components/Table.tsx`) got real keyboard
  accessibility — `role="button" tabIndex={0}` plus Enter/Space handling — which the
  original click-only rows never had.

## 6. Client-side hashing for `nin_bvn_hash` — a deliberate mitigation, not a confirmed design

`PayerFormModal.tsx` hashes NIN/BVN with `crypto.subtle.digest` (SHA-256,
`apps/portal/src/lib/hash.ts`) before sending it, for INDIVIDUAL payers only. This was a
judgment call, not a spec requirement: I read the backend's actual
`apps/registry/services.py` and `models.py` and found **zero server-side hashing logic**
for a field literally named `nin_bvn_hash` — meaning the backend's own field name implies
it expects an already-hashed value, but nothing enforces that contract. Sending it hashed
client-side is my mitigation for a field that otherwise reads as if it should never
receive plaintext PII. **Not yet confirmed with whoever owns the backend** that this is
the intended design — flag it to them before this goes to real production data.

## 7. Council onboarding is a one-shot form, not a wizard, because the backend can't do more yet

`OnboardCouncilPage.tsx` posts once to `POST /councils/onboard` and that's the entire
surface — there is no `GET /councils` list, no council-config read/write after creation,
and the `CouncilGrant` model the architecture doc envisioned has zero backend endpoints
right now. This means once a council is onboarded through this screen, there's currently
no way to view or revisit it from the frontend at all. This is a backend gap, not
something papered over here — worth raising with whoever builds out backend phase 4
before promising a fuller onboarding experience.

Also: this screen is deliberately **not** in `nav.ts` for any role — it's gated on
Django's `is_superuser`/`is_staff`, which `/auth/me`'s response doesn't expose in any
form, so no `access_level`-based nav logic can safely show/hide it. It lives at a bare
route (`/platform/onboard-council`); the backend's own 403 is the actual access gate for
anyone who lands there without permission.

## 8. Deliberately not tested: any write path against the live backend

Creating a real payer, bill, or payment against `https://acrev360-backend.onrender.com`
was never executed this session. I flagged this myself before the user even raised it:
**there is no delete or cancel endpoint for payers/bills in this backend build** — a test
write would be permanent, polluting the one live dataset that exists. The user agreed in
principle to test writes ("sure you could do that, but...") and then explicitly
reprioritized this handoff document ahead of it due to context running low. **This is
still open, not abandoned** — see §10.

If picking this up: either get a disposable/staging council to write against, or accept
that any write-path test creates real, permanent data on the one live council that
exists, and get the user's explicit sign-off on that before running it.

## 9. Standing decisions worth not re-litigating

- **This frontend targets the real live backend directly, not mocks**, as the primary
  verification method. `msw` (`packages/api/src/mocks/`) exists only as a secondary,
  light layer for fast isolated component work — it is not the main integration story
  and only health/login/me are mocked. Don't invert this without a reason.
- **TypeScript is pinned to `~5.9.3`** across all three packages/apps deliberately —
  Vite's default scaffold pulls a newer TS that `openapi-typescript@^7.5.0` doesn't
  support as a peer dep. Don't let a future `npm install`/upgrade silently drift this
  without checking the peer-dep constraint again.
- **Access token lives in memory only; refresh token in `sessionStorage`**
  (`packages/api/src/auth-store.ts`), matching the old portal's own pattern. This was
  picked as a reasonable default, not a hard requirement — noted in the build plan as
  easy to swap later (memory-only refresh = safer but logs out on reload; httpOnly
  cookie = needs backend changes). Don't treat it as locked in if a real security review
  wants something stronger.
- **Scope for this pass mirrors what the backend actually supports** — no field-agent
  mobile/offline screens (no worklist or sync endpoints exist), no custom report builder
  (no `/reports` endpoint, only the two fixed `dashboard/*` ones), no cross-council
  switcher. Don't scaffold UI for endpoints that don't exist yet; wait for backend phase
  4.
- **Any generated-type field that has a schema-level `default:` may still be required by
  the generated TypeScript type** (`roll_arrears`, for one) — pass it explicitly rather
  than assuming the default covers you. This bit multiple call sites during the build;
  it'll bite again on any new endpoint call written without checking the actual
  generated type first.
- **Never leave a loose `as never`/`as unknown` cast** when a real
  `components['schemas'][...]` type is one import away — this was cleaned up everywhere
  it crept in under time pressure (`PayerFormModal`, `BillDetailModal`,
  `ConsultantsPage`, `SettlementsPage`) and should stay clean.

## 10. Not yet done

- **Write-path live verification** (§8) — deliberately paused, needs explicit user
  sign-off given no delete/cancel endpoints exist on the live data.
- **Vitest component tests and Playwright E2E specs** — both are wired into
  `package.json` scripts (`npm run test`, `npm run e2e`) and dependencies are installed,
  but **zero test files exist yet**. This was step in the original plan and never
  started.
- **Deploy prep** — no Vercel config, no `VITE_API_BASE_URL` env var set anywhere yet.
  The dev-only CORS proxy (§4) does not apply to a production build; without
  `VITE_API_BASE_URL` set at build time the client falls back to hitting
  `https://acrev360-backend.onrender.com` directly, which will fail CORS in production
  until that backend's `CORS_ALLOWED_ORIGINS` is updated with the real deployed origin.
  Both sides of that need to happen together.
- **`nin_bvn_hash` server-side design** (§6) — my client-side hash is a mitigation I
  chose, not a confirmed-correct contract. Needs a conversation with whoever owns the
  backend.
- **GitHub remote** — none created yet for this repo; user said they'd do it themselves.
- **`docs/V2_ARCHITECTURE.md` / `docs/V2_FRONTEND.md` in the old `Test prod` repo** were
  written but never committed/pushed there — still open, unconfirmed with the user
  whether that repo needs them committed at all now that the real build has moved to
  this one.
