# ACRev360 Frontend — Session Handoff

A running log of what this repo is, how it got built, and which way specific calls were
made — written so a fresh chat session can pick this project up without re-deriving any
of it. This repo has no PRD/TDD of its own yet; the closest thing to a design doc is
[`docs/V2_FRONTEND.md`](../../Test%20prod/docs/V2_FRONTEND.md) and
[`docs/V2_ARCHITECTURE.md`](../../Test%20prod/docs/V2_ARCHITECTURE.md), which live in the
**old** `Test prod` / `LGRCS` repo (sibling directory, `C:\Users\Star2knb\Documents\Test
prod`) — not this one. Read those two first for the *why* behind the stack choices; this
file is for what happened building on top of them.

**Newer changes (2026-08-20 onward, spanning both this repo and the backend) are logged
in one place at
[`../../ACRev360-backend-latest/docs/CHANGELOG.md`](../../ACRev360-backend-latest/docs/CHANGELOG.md)
instead of here** — read that file before starting any new request, then come back to
this one for the earlier scaffold-and-audit history below.

**If you're a new session reading this:** the plan this build followed is saved at
`C:\Users\Star2knb\.claude\plans\smooth-cooking-nautilus.md` (approved, executed in full
through live verification, including the write path and a real test suite). This file
supplements it with what was actually discovered while executing — don't re-plan from
scratch.

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
overrides in §4 came from.

## 2. Repo layout

Standalone repo at `C:\Users\Star2knb\Documents\ACRev360-frontend`. No GitHub remote yet
— the user will create that themselves, same as every push decision in the old repo.
Eight commits so far (`git log --oneline` for the full list): the initial full-app
scaffold, this handoff doc, the refresh-token-rotation fix, the Vitest suites, two more
real bugs found via E2E testing, the Playwright suite itself, a handoff update, and
pointing the dev proxy at the local backend (§3). Working tree is clean as of the last
check.

**Sibling repo, also now local:** `C:\Users\Star2knb\Documents\ACRev360-backend` — a
clone of `Scaper20/ACRev360-backend`, runnable via Docker Compose. See §3.

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
schema changes; it hits `https://acrev360-backend.onrender.com/api/schema/` directly
regardless of which backend the dev server itself is pointed at (§3) — the *schema*
always comes from live, only actual requests get redirected locally.

`npx tsc -b` from `apps/portal` is clean across all three packages as of the last check
this session — zero errors. `npm run test --workspaces` (31 Vitest tests) and
`npx playwright test` (4 E2E specs) are both clean too — see §10.

## 3. The backend now runs locally too, via Docker — and a real RLS bug turned up setting it up

Cloned `Scaper20/ACRev360-backend` to `C:\Users\Star2knb\Documents\ACRev360-backend` at
the user's request, specifically so testing (manual and the Playwright suite) has a
disposable local database instead of permanently polluting the one live council dataset
on Render (see §8's own note about this exact problem). The backend repo ships its own
`docs/GETTING_STARTED.md` with two setup paths (local venv or Docker); used Docker since
this machine had neither a native Postgres nor Docker installed yet — Docker Desktop was
installed mid-session for this.

**Setup, in order:**
```bash
cd C:\Users\Star2knb\Documents\ACRev360-backend
cp .env.example .env    # then fill in a real SECRET_KEY, ALLOWED_HOSTS, a real Fernet key
docker compose up -d --build
docker compose exec web python manage.py seed_kuje --admin-password acrev360-dev-2026
```
Reachable at `http://127.0.0.1:8000` — same paths as the live one (`/api/v1/health`,
`/api/docs/`, `/api/schema/`, etc.). Seeded login: `admin` / `acrev360-dev-2026`.

**Two Windows-specific snags, both just PATH issues, not real problems:** this session's
shell had a stale `PATH` from before Docker Desktop's install (`docker` and
`docker-credential-desktop.exe` both unresolvable) — fixed per-command by prepending
`C:\Program Files\Docker\Docker\resources\bin` to `$env:Path`. Not written into any
config; a fresh terminal opened after install wouldn't hit this at all.

**The real finding: `docker compose up`'s Postgres role silently bypassed Row-Level
Security.** The compose file's `POSTGRES_USER: acrev360` becomes that role's cluster
*bootstrap superuser* — the official `postgres` Docker image's own init behavior, not a
misconfiguration — and Postgres superusers bypass RLS entirely, regardless of
`FORCE ROW LEVEL SECURITY` (which every tenant-scoped table already correctly has — see
the backend's own `apps/common/db.py`, which explicitly documents *why* FORCE is there:
to stop the separate table-*owner* bypass. FORCE cannot touch the superuser bypass; only
not-being-a-superuser can). Confirmed by running the backend's own pytest suite fresh:
**all 4 tenancy/RLS tests failed** — cross-council rows were visible with no council
filter at all, and a write RLS's `WITH CHECK` should have rejected succeeded instead of
raising `ProgrammingError`. This is a real gap in the *local Docker setup specifically*,
not a flaw in the RLS policies/migrations themselves, which are correct (all 4 tests pass
once the role is fixed — see below).

Tried demoting `acrev360` directly (`ALTER ROLE acrev360 NOSUPERUSER`) — Postgres refuses
unconditionally: *"The bootstrap superuser must have the SUPERUSER attribute."* Not
fixable in place, by design, no matter which role issues the command. **Fixed instead**
by creating a separate, ordinary role and repointing the app at it:
```sql
CREATE ROLE appuser WITH LOGIN PASSWORD 'acrev360' CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE acrev360 TO appuser;
GRANT USAGE, CREATE ON SCHEMA public TO appuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO appuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO appuser;
ALTER DEFAULT PRIVILEGES FOR ROLE acrev360 IN SCHEMA public GRANT ALL ON TABLES TO appuser;
ALTER DEFAULT PRIVILEGES FOR ROLE acrev360 IN SCHEMA public GRANT ALL ON SEQUENCES TO appuser;
```
(`CREATEDB` is only so `pytest-django` can create/drop its own `test_acrev360` database —
unrelated to RLS, doesn't reopen the bypass.) `docker-compose.yml`'s `DATABASE_URL` for
`web`/`celery-worker`/`celery-beat` now points at `appuser`, not `acrev360`. Committed
locally in the backend repo (`ea7d6bd`, not pushed — no fork/push access to Scaper20's
repo, and this is their repo, not something to push into unprompted). **Worth relaying to
Scaper20 directly**: anyone else following their own README's Docker path would hit this
identically — it's not specific to this machine.

Verified after the fix: all 10 backend tests pass (was 6 passed / 4 failed, all 4
failures the tenancy suite), health check/login/docs all still work, seeded data
(1 council, 9 wards, 32 revenue items) survived the container recreation needed to pick
up the new `DATABASE_URL`.

**Frontend now points here by default.** `apps/portal/vite.config.ts`'s dev-server proxy
target changed from the live Render URL to `http://localhost:8000` (commit `4a0c747`).
Verified end-to-end: logged in via the running dev server against the local backend,
dashboard rendered cleanly with genuinely empty freshly-seeded data, zero console errors.
To point back at live: change the `target` in both the `server.proxy` and
`preview.proxy` blocks back to `https://acrev360-backend.onrender.com` — commented
in-file.

**Day-to-day commands** (from `C:\Users\Star2knb\Documents\ACRev360-backend`, with
Docker's bin dir on PATH if a fresh shell doesn't have it already):
```bash
docker compose up -d          # start (data persists in the postgres_data volume)
docker compose down           # stop, keep data
docker compose down -v        # stop AND wipe the database — data loss, confirm first
docker compose logs -f web    # tail the app server
docker compose exec web python manage.py shell
docker compose exec postgres psql -U appuser -d acrev360   # NOT -U acrev360 — see above
```
**If the volume ever gets wiped and recreated from scratch, the `appuser` role fix above
needs to be redone** — it's a database-level role, not part of any migration, and doesn't
survive a fresh `postgres_data` volume. `seed_kuje` also needs a re-run in that case.

## 4. The live backend's contract doesn't fully match its own OpenAPI schema

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

## 5. Auth and CORS — the first two bugs live testing caught

Everything up to this point had only been verified by `tsc -b` passing — real proof
came from logging into the live backend with real admin credentials
(`admin` / `acrev360admin`, provided by the user for this specific deployment) and
watching the console. Two real bugs surfaced early, both fixed:

**CORS.** `POST /api/v1/auth/login` from `http://localhost:5173` was blocked outright —
the live backend's `CORS_ALLOWED_ORIGINS` doesn't list any frontend origin yet (matches
a `sync: false` comment in the backend's own `render.yaml`, waiting on a deployed Vercel
URL that doesn't exist yet). **Fixed locally only**, via a Vite dev-server proxy
(`apps/portal/vite.config.ts`) that makes `/api/*` requests same-origin from the
browser's point of view. (This proxy now defaults to the local Docker backend instead —
see §3 — but the CORS gap on the live Render deployment described here is unaffected
either way.)

**This does not fix the real gap.** Once this frontend is deployed to Vercel, Render's
`CORS_ALLOWED_ORIGINS` needs the actual deployed origin added, or every production
request will fail the same way. Flag this to whoever owns the Render deployment before
or immediately after the first deploy — it's called out in code comments in both
`vite.config.ts` and `packages/api/src/client.ts`, but nothing enforces it automatically.

**React render-phase violation.** `LoginPage` called `navigate()` directly in its render
body when `user` was already truthy (post-login, or resuming an existing session) —
threw a real console error, "Cannot update a component while rendering a different
component." Fixed by moving the redirect into a `useEffect`
(`apps/portal/src/routes/LoginPage.tsx:19-23`). Worth remembering as a pattern: any
component that reads auth state and might immediately want to redirect must do it in an
effect, never inline in the render body.

**Render free-tier cold start:** the *live* backend sleeps after idling and takes ~40s to
wake on the first request. Not a bug — expect it, don't debug it as one. Doesn't apply to
the local Docker backend (§3), which is always warm.

## 6. The refresh-token rotation bug, and a second, subtler race behind it

Found live, not by inspection: the backend rotates the refresh token on *every* use (the
generated schema's `TokenRefresh` response type has both `access` and `refresh`, not
just at login) and blacklists the one just spent. The refresh-on-401 middleware
(`packages/api/src/client.ts`) originally only captured the new `access` token and threw
away the rotated `refresh`, so every session survived exactly one silent refresh and then
died on the next one — reproduced live as a 401 on the second consecutive
`/auth/refresh` call. **Fixed** by calling `authStore.setTokens(access, refresh)` instead
of `setAccessToken(access)` alone. Verified live: four consecutive refreshes across three
reloads, all 200 OK. There's a Vitest regression test for this exact scenario
(`packages/api/src/client.test.ts`, mocks `fetch` to prove the rotated token is
persisted).

**Stress-testing that fix surfaced a second, real bug**, not just a rename: React
(StrictMode, or just two things needing auth at once) can fire two requests that both
401 independently — not simultaneously, but close enough in wall-clock time that the
*first* one's refresh can fully complete (rotating the token) before the *second* one's
401 is even handled. The second one then starts its own refresh using the
now-already-superseded token, which the backend correctly rejects. The bug: that
rejection unconditionally called `authStore.clear()` — signing out a session the first
request had *just* successfully re-established a moment earlier. **Fixed** two ways in
`refreshAccessToken()`/the middleware: (1) a fast path — if the access token in memory
has already changed since this specific request was sent, just retry with the current
one instead of starting a redundant refresh at all; (2) a guard on the failure path — a
failed refresh only clears the session if the refresh token it personally attempted is
*still* the one on record; if it's since changed, a sibling request already won the race
and this failure is stale, not authoritative. Also has a Vitest regression test.

## 7. Two accessibility bugs found by writing tests, not by looking

Both surfaced because `getByRole`/`getByLabel` in the new Playwright specs (§10) couldn't
find elements that were plainly visible on screen — the tests weren't wrong, the markup
was.

**Nav links had no `href` at all.** `AppShell`'s sidebar (`packages/ui/src/components/AppShell.tsx`)
rendered `<a onClick={...}>` with nothing else — an anchor with no `href` gets **no
implicit ARIA link role** at all, so screen readers never announced it as a link, and
none of the native anchor behaviors worked (open-in-new-tab, copy-link-address, hover
preview, all silently dead). `ProtectedLayout.tsx` already had the real path
(`item.to`) sitting right there and just never passed it through. **Fixed**: `AppShell`
now renders a real `href` and only intercepts plain left-clicks for client-side routing
— modifier-clicks (ctrl/cmd/shift/middle-click) fall through to native browser behavior,
matching how react-router's own `Link` works.

**`Field` labels had no programmatic association with their input**, unless the caller
manually wired `htmlFor`/`id` together. Grepped for it: 40 call sites across 11 files,
and only `LoginPage` (2 of them) did this correctly. The other 38 looked completely
normal — label right next to its field — but had zero `for`/`id` link, meaning a screen
reader had no idea which label belonged to which input anywhere else in the app.
**Fixed at the component level, not per call site** (`packages/ui/src/components/Field.tsx`):
`Field` now generates an id via `useId()` and clones its child element to inject a
matching `id` automatically, unless the child already has one. `htmlFor` is still
accepted to pin a specific id when needed. This makes the bug structurally impossible to
reintroduce at a new call site, rather than relying on every future screen remembering to
wire it up by hand.

## 8. Write-path live verification — done

Deferred earlier in the session pending explicit user sign-off (there's no delete/cancel
endpoint for payers or bills, so any test write against the *live* backend is permanent
— this was the whole reason §3's local backend exists now, so future write-path testing
doesn't have this constraint at all). Sign-off given, then exercised twice against live:
once manually through the browser, once via the `revenue-cycle.spec.ts` Playwright spec
(§10; running that spec live several more times while debugging its selectors added a
few more test records — same durability tradeoff, not a new decision, and all before the
local backend existed).

Manual pass created payer `IND-0000002` ("ZZ-TEST Write Path Verification"), issued bill
`KAC/2026/000003` from its draft assessment, recorded a full ₦5,000 payment via POS, and
confirmed: bill transitioned to `PAID` with `₦0` balance, the Record Payment section
correctly disappeared once paid (same terminal-status gate that blocks paying a
`SUPERSEDED`/`CANCELLED` bill), and a receipt (`RCT-00000003`) was auto-generated
server-side. No bugs found in this flow beyond the ones already covered in §6–§7.

**Going forward, prefer the local backend (§3) for any further write-path testing** —
it's disposable (`docker compose down -v` and reseed for a clean slate) where the live
one isn't.

## 9. Design system: ported, not redesigned — with two deliberate fixes

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
  original click-only rows never had. **Note for anyone writing more Playwright specs:**
  this means bill/payer/etc. table rows expose `role="button"`, not the native `"row"`
  role — `getByRole('row', ...)` will not find them; use `getByRole('button', ...)`.

## 10. Testing: Vitest (31 tests) + Playwright (4 specs) — and one unresolved flake

**Vitest**, one config per package (`vitest.config.ts` in each of `packages/ui`,
`packages/api`, `apps/portal`):
- `packages/ui` (jsdom): `Button`, `ClickableRow` (mouse + Enter/Space + that it's
  never missing its trailing chevron), `GroupedChecklist` (group ordering respects
  `groupOrder` not alphabetical, filtering, selection state).
- `packages/api` (node, with `define` pinning `import.meta.env.VITE_API_BASE_URL` to an
  absolute test URL — Node's `fetch`/`Request` reject relative URLs that a real browser
  would resolve against `window.location` for free): `errorMessage()`'s two response-shape
  branches, `authStore`'s token/listener behavior, and the two refresh-middleware
  regression tests from §6 (mocks `fetch` directly to prove token persistence and the
  clobber-guard both work).
- `apps/portal` (jsdom): `sha256Hex` against known SHA-256 test vectors.

Run via `npm run test --workspaces --if-present` from the repo root.

**Playwright** (`apps/portal/e2e/`, config at `apps/portal/playwright.config.ts`, run via
`npx playwright test` from `apps/portal` or `npm run e2e`). Targets a real backend
through the dev-server proxy, not mocks — the local one by default now (§3). Needs
`npx playwright install chromium` once per machine, and the local backend running
(`docker compose up -d` in the backend repo) since there's no `webServer` entry for it in
`playwright.config.ts`.
- `login.spec.ts`: bad-credentials rejection (safe, repeatable, no data created),
  successful login with role-driven nav, and session-survives-multiple-reloads (the §6
  regression, at the UI level).
- `revenue-cycle.spec.ts`: the full write path from §8, automated, with
  timestamp-unique test data so repeat runs don't collide with the app's own
  duplicate-phone detection. Now safe to run repeatedly against the local backend without
  the durability concern §8 describes for live.

**The one thing left genuinely unresolved:** reloading the page a *second* time within
milliseconds of a first reload that just did a background token refresh
intermittently lost the just-rotated `sessionStorage` token — reproduced repeatedly (3/3,
then more) with tight back-to-back `page.reload()` calls in a standalone script, but:
- Every `authStore.clear()` call site (there are exactly two, both instrumented directly)
  and `AuthContext`'s own separate `.catch(() => authStore.clear())` were logged and
  **never fired** during a failing run.
- The token was proven stable under 2+ seconds of tight polling with no second reload.
- A 300ms settle delay between reloads did *not* reliably fix it (4/5 still failed) —
  ruling out a simple storage-write-hasn't-flushed-yet theory.
- Never reproduced under any realistic timing, including extensive manual testing earlier
  in this session and a 1-second delay in the actual spec (see below).

In other words: every code path that's *supposed* to clear the session was proven not to
be the cause, and the failure needs a reload immediately (within ~1s) after another
reload's own background refresh — not a pattern any real user triggers by clicking a
browser's refresh button twice. Best working theory was a Vite dev-server/browser
storage-commit-vs-navigation race specific to this tight timing (found against the *live*
backend, before §3's local one existed) — not confirmed, only narrowed down by
elimination. `login.spec.ts`'s reload test now waits ~1s between reloads — documented in
a comment there — which has been reliable across every run since (7+ consecutive clean
passes against live; not yet specifically re-tested against the local backend). If this
resurfaces: don't re-add the `authStore.clear()` instrumentation from scratch, it's
exactly what already proved inconclusive; try the production-build (`vite preview`)
angle further, or capture a full CDP/network trace across the exact failing window
instead.

## 11. Client-side hashing for `nin_bvn_hash` — a deliberate mitigation, not a confirmed design

`PayerFormModal.tsx` hashes NIN/BVN with `crypto.subtle.digest` (SHA-256,
`apps/portal/src/lib/hash.ts`) before sending it, for INDIVIDUAL payers only. This was a
judgment call, not a spec requirement: I read the backend's actual
`apps/registry/services.py` and `models.py` and found **zero server-side hashing logic**
for a field literally named `nin_bvn_hash` — meaning the backend's own field name implies
it expects an already-hashed value, but nothing enforces that contract. Sending it hashed
client-side is my mitigation for a field that otherwise reads as if it should never
receive plaintext PII. **Not yet confirmed with whoever owns the backend** that this is
the intended design — flag it to them before this goes to real production data. Now that
the backend runs locally too (§3), this is directly checkable by reading that source
again rather than only recalling it — worth doing before raising it.

## 12. Council onboarding is a one-shot form, not a wizard, because the backend can't do more yet

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

## 13. Feature gap audit: what the old prototype had that this build doesn't (yet)

Cross-referenced the old `Test prod` app's actual UI (`frontend/app.js`, its PRD/APP_FLOW
docs) against every route file here, then checked the new backend's generated schema to
sort findings into two buckets:

**Closeable now — the new backend already has the endpoint, nobody's built the UI yet:**
1. **Printable documents** (Demand Notice / Demand Bill) — the backend's own docstring on
   `GET /api/v1/bills/{bill_ref}` says it's public *specifically* to power these two print
   pages. Zero print code exists here; the ported `DocViewer` component sits unused.
2. **Consultant portfolio management** (assign/revoke which revenue items a consultant
   handles) — backend has full CRUD (`GET/POST /consultants/{id}/portfolio`,
   `POST .../end`), `ConsultantsPage` has no UI for it at all.
3. **Agent activity view** (daily returns: visits/bills issued/collected) — backend has
   `GET /agents/{id}/activity`, `AgentsPage` rows aren't even clickable.
4. **Arrears consolidation on the fast path** — `NewBillModal` has this working
   correctly; `PayerDetailModal`'s faster "Issue Harmonized Bill" button hardcodes
   `roll_arrears: false` with no way to opt in from there.
5. **Public, unauthenticated receipt verification** — backend has
   `/api/v1/verify/{qr_token}`; every route here except `/login` requires auth.

**Backend-gated — already known, matches §12/standing-decisions scope notes:** custom
Reports builder (no `/reports` endpoint at all), the mobile field-agent app (no
worklist/offline-sync endpoints), cross-council switcher (no `GET /councils` list).

None of this has been started — the user asked to find the gaps first, building was
paused for the local-backend setup in §3 instead. Picking this up: the five "closeable"
items are all pure frontend work now that a local backend exists to test against freely.

## 14. Standing decisions worth not re-litigating

- **The dev-server proxy defaults to the local Docker backend (§3), not live Render.**
  This was an explicit ask, not a default I chose — don't quietly revert it back to
  live without being asked to.
- **TypeScript is pinned to `~5.9.3`** across all three packages/apps deliberately —
  Vite's default scaffold pulls a newer TS that `openapi-typescript@^7.5.0` doesn't
  support as a peer dep. Don't let a future `npm install`/upgrade silently drift this
  without checking the peer-dep constraint again.
- **Access token lives in memory only; refresh token in `sessionStorage`**
  (`packages/api/src/auth-store.ts`), matching the old portal's own pattern. This was
  picked as a reasonable default, not a hard requirement — easy to swap later
  (memory-only refresh = safer but logs out on reload; httpOnly cookie = needs backend
  changes). Don't treat it as locked in if a real security review wants something
  stronger.
- **Scope for this pass mirrors what the backend actually supports** — see §13 for the
  full, verified list of what that excludes and why. Don't scaffold UI for endpoints
  that don't exist yet.
- **Any generated-type field that has a schema-level `default:` may still be required by
  the generated TypeScript type** (`roll_arrears`, for one) — pass it explicitly rather
  than assuming the default covers you. This bit multiple call sites during the build;
  it'll bite again on any new endpoint call written without checking the actual
  generated type first.
- **Never leave a loose `as never`/`as unknown` cast** when a real
  `components['schemas'][...]` type is one import away — this was cleaned up everywhere
  it crept in under time pressure (`PayerFormModal`, `BillDetailModal`,
  `ConsultantsPage`, `SettlementsPage`) and should stay clean.
- **Fix shared components, not call sites, when the bug is structural.** Both §7 bugs
  could have been patched at each individual usage; instead `AppShell`/`Field` were fixed
  once so the whole class of bug can't recur at a 39th call site nobody thought to check.
  Prefer this shape of fix again when a defect is "every caller forgot the same thing."
- **On the local backend specifically: never connect as the `acrev360` Postgres role.**
  It's the cluster's bootstrap superuser and bypasses RLS entirely — see §3. Always use
  `appuser`, and re-create that role if the `postgres_data` volume is ever wiped.

## 15. Not yet done

- **The five closeable feature gaps from §13** — print documents, consultant portfolio
  UI, agent activity view, arrears consolidation on the fast path, public receipt
  verification. Found, not yet built.
- **Deploy prep** — no Vercel config, no `VITE_API_BASE_URL` env var set anywhere yet.
  Once deployed, Render's `CORS_ALLOWED_ORIGINS` needs the real Vercel origin (§5) —
  unrelated to and doesn't block the local-backend work in §3.
- **The tight-reload flake in §10** — narrowed down by elimination, not root-caused, and
  found only against the live backend. Not believed to affect real usage.
- **`nin_bvn_hash` server-side design** (§11) — my client-side hash is a mitigation I
  chose, not a confirmed-correct contract. Needs a conversation with whoever owns the
  backend.
- **The RLS-bypass fix (§3) should be relayed to Scaper20** — it's a real gap in their
  own docker-compose.yml setup path, not fixable from this side beyond the local
  workaround already applied and committed (locally only, no push access).
- **GitHub remote** — none created yet for this repo; user said they'd do it themselves.
- **`docs/V2_ARCHITECTURE.md` / `docs/V2_FRONTEND.md` in the old `Test prod` repo** were
  written but never committed/pushed there — still open, unconfirmed with the user
  whether that repo needs them committed at all now that the real build has moved to
  this one.
- **More E2E coverage** — only login and one full revenue-cycle path are covered.
  Reconciliation, settlements, debt/enforcement, channels, and council onboarding have no
  E2E specs yet.
