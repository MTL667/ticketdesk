# Story 2.5: Create and edit items in UI

Status: done

## Story

As a marketing user,
I want dialogs to add and edit items,
so that I can maintain inventaris without leaving the app.

## Acceptance Criteria

1. Create/edit via modal with labeled required fields + Zod validation
2. Successful save refreshes list/detail
3. Delete with confirmation

## Dev Agent Record

### File List

- `components/marketing/ItemFormModal.tsx`
- `app/marketing/page.tsx`
- `app/marketing/items/[id]/page.tsx`
