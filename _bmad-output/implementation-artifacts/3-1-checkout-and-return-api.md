# Story 3.1: Checkout and return API

Status: done

## Story

As a marketing user,
I want APIs to check out and return inventory loans,
so that stock quantities stay accurate.

## Acceptance Criteria

1. POST `/api/marketing/loans` creates INVENTORY loan and decreases available
2. Checkout above available → rejected
3. Return via `/api/marketing/loans/[id]/return` supports full/partial qty
4. Open loans listable; overdue detectable when dueDate passed
5. Non-marketing → 403

## Dev Agent Record

### File List

- `lib/validators/marketing.ts`
- `lib/marketing/loans.ts`
- `app/api/marketing/loans/route.ts`
- `app/api/marketing/loans/[id]/return/route.ts`
