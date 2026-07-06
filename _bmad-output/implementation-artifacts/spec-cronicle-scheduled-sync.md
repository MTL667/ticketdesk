---
title: 'Cronicle scheduled sync with user-facing sync freshness'
type: 'feature'
created: '2026-07-06'
status: 'done'
baseline_commit: '86ada82cffa53938669f5f645e08a7741cdf2f1b'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ticket sync relies on auto-triggering when a user loads the ticket list (if data >1h stale). This is unreliable — users see stale data and report missing tickets because sync hasn't run yet. There is no scheduled background sync.

**Approach:** Add a `CRON_SECRET`-protected HTTP endpoint that Cronicle (running in the same Easypanel environment) calls every 10 minutes to trigger sync. Remove the auto-sync-on-page-load logic. Show the last sync completion time prominently on the ticket overview with an info banner explaining that newly created tickets may take up to 10 minutes to appear.

## Boundaries & Constraints

**Always:**
- Cronicle endpoint authenticates via `CRON_SECRET` env var (Bearer token in Authorization header)
- Keep the admin manual sync button as an override
- Return proper HTTP status codes so Cronicle can monitor success/failure
- The info banner about sync delay is visible to all users, not just admins
- Use existing `syncTicketsFromClickUp()` from `lib/sync.ts` — do not duplicate sync logic
- All new UI text must have nl/fr/en translations

**Ask First:**
- Any changes to the Prisma schema

**Never:**
- Remove the existing admin sync button
- Add Cronicle configuration to the codebase (Cronicle is configured via its own UI)
- Bypass `lib/sync.ts` wrapper functions

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cronicle calls cron endpoint | `POST /api/sync/cron` with valid `Authorization: Bearer {CRON_SECRET}` | Sync starts, returns 200 `{ status: "started" }` | N/A |
| Invalid or missing CRON_SECRET | `POST /api/sync/cron` without auth or wrong token | Returns 401 `{ message: "Unauthorized" }` | N/A |
| Sync already running | Cronicle calls while sync is in progress | Returns 409 `{ message: "Sync already in progress" }` | Cronicle sees non-200, retries next cycle |
| CRON_SECRET not configured | Env var missing or empty | Returns 500 `{ message: "CRON_SECRET not configured" }` | N/A |
| User loads tickets | Page load after sync completed 3 min ago | Shows "Gesynchroniseerd: 3 min geleden" + info banner | N/A |
| User loads tickets, never synced | No SyncLog exists | Shows info banner, no sync time displayed | N/A |

</frozen-after-approval>

## Code Map

- `app/api/sync/cron/route.ts` -- New: Cronicle-facing sync trigger endpoint with CRON_SECRET auth.
- `middleware.ts` -- Exempt `/api/sync/cron` from NextAuth middleware (same pattern as webhooks).
- `app/api/tickets/route.ts` -- Remove auto-sync-on-page-load logic (lines 35–45).
- `app/tickets/page.tsx` -- Add info banner about sync delay for all users; enhance sync time display.
- `lib/translations.ts` -- Add translation keys for sync delay info banner.
- `.env.example` -- Add `CRON_SECRET` entry.

## Tasks & Acceptance

**Execution:**
- [x] `app/api/sync/cron/route.ts` -- Create POST handler: validate `CRON_SECRET` from env against `Authorization: Bearer` header, check `isSyncRunning()`, fire-and-forget `syncTicketsFromClickUp()`, return appropriate status codes (200/401/409/500).
- [x] `app/api/tickets/route.ts` -- Remove the auto-sync block (lines 35–45: `ONE_HOUR` constant, `shouldAutoSync` check, background sync trigger). Keep `getLastSyncStatus()` call for metadata.
- [x] `app/tickets/page.tsx` -- Add a subtle info banner below the header (visible to all users) explaining sync runs every 10 minutes and newly created tickets may not appear immediately. Use translated text.
- [x] `lib/translations.ts` -- Add keys: `syncDelayInfo` (the info banner text) in nl/fr/en.
- [x] `.env.example` -- Add `CRON_SECRET=your_cron_secret_here` entry.

**Acceptance Criteria:**
- Given Cronicle sends `POST /api/sync/cron` with a valid Bearer token matching `CRON_SECRET`, when no sync is running, then sync starts and returns 200.
- Given an invalid or missing Bearer token, when `POST /api/sync/cron` is called, then it returns 401.
- Given a user loads the `/tickets` page, when the page renders, then the last sync time is shown and an info banner explains sync runs every 10 minutes.
- Given the auto-sync-on-page-load logic is removed, when a user loads `/api/tickets`, then no sync is triggered regardless of data age.
- Given the admin clicks the manual sync button, when the sync completes, then it works exactly as before.

## Design Notes

**Cronicle configuration (out of scope but documented):** In the Cronicle UI, create a new event with Plugin "HTTP Request", URL `https://<servicedesk-url>/api/sync/cron`, Method POST, Header `Authorization: Bearer <secret>`. Schedule: every 10 minutes. The endpoint is fire-and-forget — Cronicle monitors HTTP status for alerting.

**Why not await sync in the cron endpoint:** Sync takes ~16 minutes for large lists. Cronicle would time out. The endpoint returns 200 immediately after starting; Cronicle can call `GET /api/sync` separately if monitoring is needed.

## Verification

**Commands:**
- `npx next build` -- expected: build succeeds with no TypeScript errors
- `npx next lint` -- expected: no new lint errors

**Manual checks:**
- `curl -X POST -H "Authorization: Bearer test" http://localhost:3000/api/sync/cron` with matching CRON_SECRET → 200
- Same curl with wrong secret → 401
- Load `/tickets` — info banner visible, last sync time shown, no auto-sync triggered
- Admin sync button still works

## Suggested Review Order

**Cron sync endpoint + auth**

- CRON_SECRET Bearer auth with timing-safe comparison; fire-and-forget sync start
  [`route.ts:5`](../../app/api/sync/cron/route.ts#L5)

- Middleware exemption so Cronicle bypasses NextAuth (same pattern as webhooks)
  [`middleware.ts:11`](../../middleware.ts#L11)

**Auto-sync removal**

- Removed hourly auto-sync from ticket list API; only `getLastSyncStatus()` remains
  [`route.ts:4`](../../app/api/tickets/route.ts#L4)

**User-facing sync info**

- Info banner explaining 10-minute sync interval to all users
  [`page.tsx:351`](../../app/tickets/page.tsx#L351)

- Translation keys in nl/fr/en for sync delay message
  [`translations.ts:121`](../../lib/translations.ts#L121)

**Config**

- CRON_SECRET added to env example
  [`.env.example:15`](../../.env.example#L15)
