# Story 1.3: Cancel reservation API

Status: done

## Story

As an authenticated employee (owner) or marketing/admin user,
I want to cancel an active bakwagen reservation,
so that the time slot becomes available again for others.

## Acceptance Criteria

1. Cancel via `/api/bookavan/reservations/[id]/cancel` sets status `CANCELLED`
2. Period no longer counts in overlap/availability
3. Non-owner non-marketing non-admin → `409` with clear message
4. Already cancelled → clear error

## Tasks / Subtasks

- [x] Cancel service with owner | marketing | admin auth
- [x] POST cancel route
- [x] Soft cancel only (no hard delete)

## Dev Notes

- Architecture specifies 409 for unauthorized cancel

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Completion Notes List

- Soft cancel to `CANCELLED`; unauthorized cancel returns 409.

### File List

- `lib/bookavan/reservations.ts`
- `app/api/bookavan/reservations/[id]/cancel/route.ts`
