# ACRev360 API Reference

Base URL (local): `http://127.0.0.1:8000`
Authentication: `Authorization: Bearer <token>` from `/api/auth/login`, except where marked **Public**.
Errors always come back as `{"error": "..."}` — see [Error format](#error-format) at the bottom.

---

## Authentication

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Exchange credentials for a bearer token |
| POST | `/api/auth/logout` | Any | Invalidate the token |
| GET | `/api/auth/me` | Any | Current user and access level |

```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"acrev360-2026"}'
```

Sessions are an in-memory token → user map with no expiry (see [TDD.md](TDD.md#8-production-readiness-gaps)) — a server restart logs everyone out.

---

## Dashboard

| Method | Path | Access |
|---|---|---|
| GET | `/api/dashboard/summary` | Any (scoped to the caller's portfolio) |
| GET | `/api/dashboard/global` | Council admin, global view |

`billed` on both endpoints is `total_amount - arrears_amount` — a bill's arrears segment (rolled forward from a consolidated payer's prior bills, see [Assessment & billing](#assessment--billing)) isn't counted as *new* billing, since it was already billed once on the bill it was rolled up from.

---

## Custom reports

A small report builder: pick a dataset, pick which fields to include, optionally filter, get rows back. Backs the **Reports** page in the web portal.

| Method | Path | Access |
|---|---|---|
| GET | `/api/reports/meta` | Admin, consultant |
| GET | `/api/reports` | Admin, consultant |

`/api/reports/meta` returns the dataset catalog — no params:

```json
{
  "datasets": [
    { "key": "bills", "label": "Bills",
      "fields": [{"key": "bill_ref", "label": "Bill Ref"}, ...],
      "default_fields": ["bill_ref", "full_name", "total_amount", "balance", "status", "due_date"],
      "has_status": true }
  ],
  "bill_statuses": ["ISSUED", "PART_PAID", "PAID", "OVERDUE", "CANCELLED", "SUPERSEDED"]
}
```

Datasets: `payers`, `bills`, `payments`, `debt`. Each dataset's `fields` list is a fixed
whitelist — `/api/reports` only ever selects columns from that list, so field choice can't be
used for SQL injection.

```bash
curl 'http://127.0.0.1:8000/api/reports?dataset=bills&fields=bill_ref,full_name,balance,status&status=OVERDUE&q=zenith' \
  -H 'Authorization: Bearer <token>'
```

| Query param | Meaning |
|---|---|
| `dataset` | required — one of the keys from `/api/reports/meta` |
| `fields` | comma-separated field keys; falls back to the dataset's `default_fields` if omitted or all invalid |
| `q` | free-text filter — matched per-dataset (e.g. bills: `bill_ref`, payer name, payer ref) |
| `status` | bills only — one of `bill_statuses` |

A `CONSULTANT` caller only ever gets rows from their own portfolio, same as every other list endpoint. Results cap at 1000 rows.

---

## Enumeration & registry

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/payers?q=` | Any | Search by name, reference or phone — live-filters as you type in the portal |
| POST | `/api/payers` | Admin, consultant, agent | Returns **409** with `duplicate_of` when the phone already exists; resend with `"force": true` to override |
| GET | `/api/payers/{id}` | Any | Payer with assets and bills |
| GET | `/api/payers/{id}/draft-assessments` | Any | Revenue items enumerated but not yet billed |
| POST | `/api/assets` | Admin, consultant, agent | Attach premises, shop, kiosk or signage |

```json
POST /api/payers
{
  "full_name": "Royal Motors",
  "payer_type": "BUSINESS",
  "business_size": "MEDIUM",
  "phone": "08031234567",
  "tin": "N-12345678",
  "ward_id": 3,
  "address": "12 Central Area Rd",
  "revenue_item_ids": [4, 11]
}
```

`payer_type` is one of `INDIVIDUAL`, `BUSINESS`, `GOVERNMENT`, `NGO` — individuals get `nin_bvn`
instead of `tin`, and a distinct `IND-xxxxxxx` reference format instead of `C-xxxxxxx`.
`business_size` (`MICRO`/`SMALL`/`MEDIUM`/`LARGE`) is only meaningful for non-individual payers
and is silently ignored/nulled for `INDIVIDUAL`. `revenue_item_ids` (optional) records each as a
`DRAFT` assessment at today's rate — the response's `draft_assessments_created` counts them.

This same creation logic backs the offline mobile sync path (`entity_type: "PAYER"` records in
[`POST /api/mobile/sync`](#mobile-field-agent)) — a payer captured offline is created for real on
sync, not just logged.

`POST /api/assets`:

```json
{ "payer_id": 42, "asset_type": "SHOP", "description": "Corner unit, Market Rd",
  "ward_id": 3, "geo_lat": 8.879, "geo_lng": 7.226 }
```

---

## Chart of revenue

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/revenue-items` | Any | Includes `category_name` and the current approved `current_rate`/`rate_id` |
| POST | `/api/revenue-items/{id}/rate` | Council admin only | Change what an item costs |
| GET | `/api/revenue-categories` | Any | Rates, Licences and Permits, Fees and Charges, Registration and Professional Fees, Levies |
| GET | `/api/wards` | Any | |

```json
POST /api/revenue-items/12/rate
{ "rate_amount": 25000 }
```

Changing a rate never overwrites history: it closes the current `rate_schedule` row
(`effective_to = today`) and opens a new one, so past assessments still cite the exact rate they
were priced at.

---

## Assessment & billing

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/bills?status=` | Any (portfolio-scoped) | List/filter |
| POST | `/api/bills` | Admin, consultant, agent | Assess + bill in one call |
| GET | `/api/bills/{bill_id}/detail` | Any | Authenticated detail — powers the bill editor modal |
| POST | `/api/bills/{bill_id}/lines` | Council admin only | Add a line to an issued bill |
| PUT | `/api/bills/{bill_id}/lines/{line_id}` | Council admin only | Override a line's quantity/amount |
| DELETE | `/api/bills/{bill_id}/lines/{line_id}` | Council admin only | Remove a line (refuses to strip the last one) |
| GET | `/api/bills/{bill_ref}` | **Public** | Citizen bill lookup, by reference (not id) |

```json
POST /api/bills
{
  "payer_id": 42,
  "due_date": "2026-08-31",
  "lines": [
    { "revenue_item_id": 3, "quantity": 1 },
    { "revenue_item_id": 8, "quantity": 2 }
  ],
  "bill_all_drafts": false,
  "roll_arrears": false
}
```

Three ways to build a bill, combinable:
- `lines`: hand-picked `{revenue_item_id, quantity}` pairs, priced at the current rate.
- `bill_all_drafts: true`: rolls every `DRAFT` assessment already enumerated for the payer into
  this bill ("Issue Harmonized Bill").
- `roll_arrears: true`: sums the payer's other still-open bills (`ISSUED`/`PART_PAID`/`OVERDUE`)
  into an `arrears_amount` segment on this bill, then flips those bills to `SUPERSEDED`
  (`superseded_by` points at this bill) and closes any open `debt_case` on them. A bill built with
  only `roll_arrears` and no lines/drafts is a valid pure consolidation. The response includes
  `arrears_amount` and `superseded_count`.

**A `SUPERSEDED` bill can never take a payment again** — its balance already lives on the bill
that superseded it. `POST /api/payments` (below) rejects it with a message naming the bill to
collect against instead; this is enforced once, in `post_payment()`, so every payment path
(portal, mobile, USSD, webhooks, OTC settlement) is covered.

`GET /api/bills/{bill_id}/detail` — the authenticated editor view (distinct from the public
lookup below): full `bill.*` (including `arrears_amount`) plus `full_name`, `payer_ref`,
`balance`, and `lines[]`.

`GET /api/bills/{bill_ref}` (note the `bill_ref` itself contains slashes, e.g.
`KAC/2026/000123` — the route uses Flask's `path` converter so it matches literally) returns the
payer's name, ref, phone, address and ward alongside the bill, its lines, `arrears_amount`
(rolled-in arrears already inside `balance`), and `prior_arrears` (other *still-open* bills not
rolled in — legacy path, always `0` once a consolidation exists, since superseded bills are
excluded). This is what powers [`frontend/demand-notice.html`](../frontend/demand-notice.html)
and [`frontend/demand-bill.html`](../frontend/demand-bill.html), standalone printable pages
reachable at `/frontend/demand-notice.html?bill={bill_ref}` (Harmonised Demand Notice) and
`/frontend/demand-bill.html?bill={bill_ref}` (itemised Demand Bill), matching KAC's real
distributed formats (see [reference documents](reference/)).

Bill status machine: `ISSUED → PART_PAID → PAID`, or `→ OVERDUE` past `due_date`, or
`→ CANCELLED`, or `→ SUPERSEDED` (consolidated into a newer bill).

---

## Payments & receipting

| Method | Path | Access |
|---|---|---|
| GET | `/api/payments` | Any (portfolio-scoped) |
| POST | `/api/payments` | Admin, consultant, agent |
| GET | `/api/receipts` | Any |
| GET | `/api/verify/{qr_token}` | **Public** — QR / SMS receipt verification |

```json
POST /api/payments
{ "bill_id": 151, "amount": 25000, "channel_code": "OTC", "bank_txn_ref": "TELLER-00931" }
```

`channel_code` is one of `POS`, `OTC`, `IB_MB`, `USSD`, `FIRSTMONIE` (defaults to `POS`). This is
the same shared `post_payment()` path every channel funnels through — it updates the bill's
`amount_paid`/`status`, issues a receipt with a QR verification token, and closes any open
`debt_case` if the bill is now fully paid. Rejects `CANCELLED` and `SUPERSEDED` bills (see
[Assessment & billing](#assessment--billing)).

---

## e-Channel integration

### Channel catalogue

| Method | Path | Access |
|---|---|---|
| GET | `/api/channels` | **Public** — codes, modes and required fields |

### Webhook — all real-time channels

```
POST /api/channels/{CODE}/webhook
Header: X-ACRev360-Signature: <HMAC-SHA256 hex of the raw body>
```

`{CODE}` is one of `POS`, `OTC`, `IB_MB`, `USSD`, `FIRSTMONIE`.

**Required fields per channel**

| Channel | Required fields |
|---|---|
| `POS` | `terminalId`, `rrn`, `amount`, `billRef` — set `amountInKobo: true` if the amount is in kobo |
| `OTC` | `tellerRef`, `branchCode`, `amount`, `billRef` |
| `IB_MB` | `sessionId`, `amount`, `billRef` |
| `USSD` | `ussdRef`, `msisdn`, `amount`, `billRef` |
| `FIRSTMONIE` | `agentTxnRef`, `agentId`, `amount`, `billRef` |

**Responses**

| HTTP | `status` | Meaning |
|---|---|---|
| 201 | `posted` | Payment applied, receipt issued; response carries `paymentRef`, `receiptRef`, `verifyToken` |
| 200 | `duplicate` | Reference already received — no double-post |
| 202 | `accepted_unmatched` | Credit recorded, no bill matches; held in the exception queue |
| 400 | `rejected` | Validation failed (including a `SUPERSEDED`/`CANCELLED` target bill); `error` explains what |
| 401 | — | Signature verification failed (when strict mode is on) |

```bash
curl -X POST http://127.0.0.1:8000/api/channels/POS/webhook \
  -H 'Content-Type: application/json' \
  -d '{"terminalId":"20481123","rrn":"RRN12345","amount":25000,"billRef":"KAC/2026/000001"}'
```

### Teller settlement file

```
POST /api/channels/OTC/settlement
Body: JSON array of settlement rows
```

Returns `posted`, `duplicates_skipped`, and an itemised `exceptions` array. Safe to re-send —
already-received references are skipped, not re-posted.

### USSD session callback

```
POST /api/channels/USSD/session
{ "text": "1*KAC/2026/000001*5000", "msisdn": "08031234567" }
```

Replies `CON …` to continue the session or `END …` to close it. Menu: 1 pay a bill,
2 check balance, 3 verify a receipt.

---

## Reconciliation & settlement

| Method | Path | Access |
|---|---|---|
| GET | `/api/reconciliation` | Admin, consultant |
| POST | `/api/reconciliation/run` | Admin — body `{"date":"YYYY-MM-DD"}` |
| GET | `/api/settlements` | Admin, consultant (own only) |
| POST | `/api/settlements/compute` | Admin — body `{"period_start","period_end"}` |

---

## Debt & enforcement

| Method | Path | Access |
|---|---|---|
| GET | `/api/debt` | Admin, consultant |
| POST | `/api/debt/refresh` | Admin — re-ages overdue bills and opens cases |
| POST | `/api/debt/{id}/escalate` | Admin — advances the enforcement stage |

Enforcement ladder: `NONE → FIRST_NOTICE → FINAL_NOTICE → ENFORCEMENT → LEGAL → CLOSED`.
A case closes automatically when its bill is settled in full — or when its bill is superseded by
an arrears consolidation (the debt moves to the new consolidated bill).

---

## Oversight

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/api/consultants` | Admin, global view | |
| POST | `/api/consultants` | Council admin only | Onboard a new sub-consultant |
| POST | `/api/consultants/{id}/status` | Council admin only | `PENDING`/`ACTIVE`/`SUSPENDED`/`EXITED` |
| GET | `/api/consultants/{id}/portfolio` | Admin, or that consultant | Revenue items (and optional ward) this consultant may handle |
| POST | `/api/consultants/{id}/portfolio` | Council admin only | Assign a revenue item to a consultant's portfolio |
| POST | `/api/consultants/{id}/portfolio/{portfolio_id}/end` | Council admin only | Revoke (sets `effective_to`, keeps history) |
| GET | `/api/agents` | Admin, consultant (own only) | |
| POST | `/api/agents` | Admin, consultant | Onboard a field agent — a consultant's own team only; admin can onboard for any consultant or council-direct |
| GET | `/api/agents/{id}/activity` | Admin, or that agent's consultant | Daily returns + recent payments |
| GET | `/api/terminals` | Admin, consultant | POS fleet |
| GET | `/api/audit` | Council admin only | Last 300 audit events |

```json
POST /api/consultants
{ "consultant_name": "Northgate Revenue Services Ltd", "contract_ref": "KAC/RC/2026/011", "commission_rate": 30 }
```

```json
POST /api/consultants/3/portfolio
{ "revenue_item_id": 12, "ward_id": 5 }
```

```json
POST /api/agents
{ "full_name": "New Agent", "username": "agent13", "phone": "08030000000",
  "assigned_ward_id": 5, "password": "acrev360-2026" }
```

`password` defaults to `acrev360-2026` if omitted (the shared demo password — see the top-level
[README](../README.md#note-on-data)).

---

## Mobile field agent

| Method | Path | Access |
|---|---|---|
| GET | `/api/mobile/worklist` | Agent — assigned ward, outstanding balances, today's tally |
| POST | `/api/mobile/sync` | Agent — replay the offline queue |

```json
POST /api/mobile/sync
{
  "records": [
    { "client_id": "c1",
      "entity_type": "PAYMENT",
      "device_created_at": "2026-07-28T09:00:00",
      "payload": { "bill_id": 11, "amount": 3500, "channel_code": "POS",
                   "geo": { "lat": 9.05, "lng": 7.49 } } },
    { "client_id": "p1",
      "entity_type": "PAYER",
      "device_created_at": "2026-07-28T09:05:00",
      "payload": { "full_name": "New Shop", "payer_type": "BUSINESS",
                   "business_size": "SMALL", "ward_id": 5, "force": true } }
  ]
}
```

Each record is logged to `sync_queue` (a durable log, kept regardless of outcome) and then
actually replayed: `PAYMENT` records post through the same `post_payment()` every channel uses;
`PAYER` records create the payer through the same logic `POST /api/payers` uses. Returns
`accepted` (client IDs to clear from the local queue) and `conflicts` (client ID + reason for
anything that failed — e.g. a bill that's since become `SUPERSEDED`).

---

## Health check

| Method | Path | Access |
|---|---|---|
| GET | `/api/health` | Public |

```json
{ "status": "ok", "service": "ACRev360 API", "council": "KAC", "time": "2026-08-14T16:00:00.000000" }
```

For uptime checks, not an API status page.

---

## Error format

```json
{ "error": "Plain-language description of what went wrong" }
```

Some errors carry extra structured detail alongside `error` — e.g. `duplicate_of` on a 409 payer
conflict.

| Code | Meaning |
|---|---|
| 400 | The request was malformed or failed validation |
| 401 | No valid token, or signature verification failed |
| 403 | The caller's role does not permit this action |
| 404 | The record does not exist |
| 409 | Conflict — a suspected duplicate payer, or a username already taken |
