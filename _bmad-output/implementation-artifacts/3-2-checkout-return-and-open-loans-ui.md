# Story 3.2: Checkout, return, and open loans UI

Status: done

## Story

As a marketing user,
I want checkout/return dialogs and an open-loans panel,
so that day-to-day lending is tracked in the UI.

## Acceptance Criteria

1. Modals for borrower, event, quantity, due date / permanent
2. Open loans panel with due dates and overdue (non-color-only)
3. KPIs refresh after actions
4. Checkout blocked when none available

## Dev Agent Record

### File List

- `components/marketing/CheckoutModal.tsx`
- `components/marketing/ReturnModal.tsx`
- `components/marketing/OpenLoansPanel.tsx`
- `app/marketing/items/[id]/page.tsx`
- `app/marketing/page.tsx`
- `lib/translations.ts`
