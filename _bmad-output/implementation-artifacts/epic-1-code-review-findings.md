# Epic 1 Code Review Findings

Date: 2026-08-03
Review mode: full
Sources: Blind Hunter, Edge Case Hunter, Acceptance Auditor
Status: patches applied

## Review Findings

### decision-needed (resolved → patch)

- [x] [Review][Decision] Past start times — **reject** `startAt` before now (5 min grace)
- [x] [Review][Decision] Lifecycle after `endAt` — **auto-free**: overlap/availability ignore loans with `endAt <= now` (plus `CANCELLED`)
- [x] [Review][Decision] Cancel after start — **block** after `startAt`; marketing/admin may override
- [x] [Review][Decision] Timezone — **Europe/Brussels** canonical booking timezone

### patch

- [x] [Review][Patch] Reject past `startAt` (5 min grace) in Zod/server [`lib/validators/bookavan.ts`]
- [x] [Review][Patch] Overlap/availability ignore ended loans (`endAt <= now`) [`lib/bookavan/overlap.ts`, `lib/bookavan/reservations.ts`]
- [x] [Review][Patch] Block cancel after `startAt` unless marketing/admin [`lib/bookavan/reservations.ts`]
- [x] [Review][Patch] Parse/normalize datetimes as Europe/Brussels; show timezone in UI [`lib/bookavan/datetime.ts`, UI]
- [x] [Review][Patch] Malformed JSON on POST reservations returns 400 [`app/api/bookavan/reservations/route.ts`]
- [x] [Review][Patch] Concurrent cancel race via conditional `updateMany` [`lib/bookavan/reservations.ts`]
- [x] [Review][Patch] Seed upsert no longer overwrites bakwagen `available` [`prisma/seed.ts`]
- [x] [Review][Patch] Seed fails if Marketing entity missing [`prisma/seed.ts`]
- [x] [Review][Patch] Submit disabled when availability reports conflict [`components/bookavan/ReservationForm.tsx`]
- [x] [Review][Patch] Availability checks debounced + abortable [`app/bookavan/page.tsx` / form]
- [x] [Review][Patch] Form cleared after successful create [`components/bookavan/ReservationForm.tsx`]
- [x] [Review][Patch] Client-side Zod validation [`components/bookavan/ReservationForm.tsx`]
- [x] [Review][Patch] Invalid calendar dates rejected [`lib/bookavan/datetime.ts`, validators]
- [x] [Review][Patch] Availability conflicts return minimal metadata only [`lib/bookavan/reservations.ts`]

### defer

- [x] [Review][Defer] No DB check constraints for inventory qty invariants [`prisma/schema.prisma`] — deferred, Epic 2/3 scope
- [x] [Review][Defer] No automated tests for overlap/cancel/auth/timezone — deferred, not required by Epic 1 ACs

## Dismissed (noise / by design)

- Reservation history visible to all authenticated users — required by FR11
- No Prisma migration folder — project deploys via `prisma db push` in `start.sh`
- Claim terms version/content not persisted — AC only requires `claimAcceptedAt` + `claimAcceptedBy`
- `package-lock.json` “missing” — false positive; lockfile was updated but excluded from scoped review diff
- Marketing check returns 200 without session — mirrors existing `/api/admin/check` pattern
- Overlap excludes only `CANCELLED` (not limited to `ACTIVE`) — matches architecture wording; ended loans now excluded via `endAt > now`
