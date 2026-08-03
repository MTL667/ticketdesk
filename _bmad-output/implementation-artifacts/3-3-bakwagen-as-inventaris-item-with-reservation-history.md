# Story 3.3: Bakwagen as inventaris item with reservation history

Status: done

## Story

As a marketing user,
I want the bakwagen visible as an inventaris item with BookAVan reservations in its history,
so that vehicle usage and material loans share one traceability model.

## Acceptance Criteria

1. Bakwagen listed/filterable like other items (seeded Item slug `bakwagen`)
2. Lending/reservation history includes BookAVan RESERVATION loans
3. No duplicate bakwagen administration — checkout disabled; reserve via BookAVan

## Dev Agent Record

### Completion Notes List

- `isBakwagen` badge on grid/detail; bridge help text; history already reads all Loan types for the item.

### File List

- `lib/marketing/items.ts`
- `components/marketing/ItemGrid.tsx`
- `app/marketing/items/[id]/page.tsx`
