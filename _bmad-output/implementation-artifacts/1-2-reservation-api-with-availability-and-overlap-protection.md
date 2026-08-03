# Story 1.2: Reservation API with availability and overlap protection

Status: done

## Story

As an authenticated employee,
I want to create and list bakwagen reservations via API with overlap protection,
so that double-booking is impossible and planning data is reliable.

## Acceptance Criteria

1. `POST /api/bookavan/reservations` creates `Loan` type `RESERVATION` / status `ACTIVE` with claim fields persisted
2. Creation uses transaction + `FOR UPDATE` on bakwagen Item; overlap → `409` `{ message }`
3. `GET /api/bookavan/reservations` returns period, driver, department, destination, reason, status
4. `GET /api/bookavan/availability?from=&to=` indicates whether period is free
5. Unauthenticated → `401`; invalid Zod payload → `400`

## Tasks / Subtasks

- [x] Zod validators in `lib/validators/bookavan.ts`
- [x] Overlap helpers + reservation service
- [x] GET/POST reservations route
- [x] GET availability route
- [x] GET entities helper route for form dropdown

## Dev Notes

- Exclude `CANCELLED` from overlap
- Error envelope: `{ message }` + status

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Completion Notes List

- Reservation create runs in `$transaction` with `SELECT … FOR UPDATE` on bakwagen Item.
- Availability also returns vehicle status / active / next for UI.

### File List

- `lib/validators/bookavan.ts`
- `lib/bookavan/bakwagen.ts`
- `lib/bookavan/overlap.ts`
- `lib/bookavan/reservations.ts`
- `app/api/bookavan/reservations/route.ts`
- `app/api/bookavan/availability/route.ts`
- `app/api/bookavan/entities/route.ts`
