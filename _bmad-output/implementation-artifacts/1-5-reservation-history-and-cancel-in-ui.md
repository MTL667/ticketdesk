# Story 1.5: Reservation history and cancel in UI

Status: done

## Story

As an authenticated employee,
I want to see reservation history and cancel my booking from the UI,
so that planning is visible and I can free a slot when plans change.

## Acceptance Criteria

1. History shows period, driver, department, destination, reason, status
2. Eligible active reservations can be cancelled; UI refreshes
3. Status not color-only
4. Forms/dialogs meet label and keyboard basics

## Tasks / Subtasks

- [x] ReservationHistory table component
- [x] Cancel action wired to API + refetch
- [x] Status text + icon cues
- [x] Marketing/admin check for force-cancel affordance in UI

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Completion Notes List

- History table on `/bookavan` with cancel + refetch of list and vehicle status.
- Minimal `GET /api/marketing/check` added so marketing users see cancel for others.

### File List

- `components/bookavan/ReservationHistory.tsx`
- `app/bookavan/page.tsx`
- `app/api/marketing/check/route.ts`
