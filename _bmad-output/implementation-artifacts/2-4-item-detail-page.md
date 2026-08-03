# Story 2.4: Item detail page

Status: done

## Story

As a marketing user,
I want an item detail page with specs and lending history,
so that I can inspect one asset before lending or editing.

## Acceptance Criteria

1. `/marketing/items/[id]` shows specs + lending history
2. Navigate back to dashboard
3. Edit entry point present
4. Non-marketing cannot access

## Dev Agent Record

### File List

- `app/marketing/items/[id]/page.tsx`
- `components/marketing/LendingHistoryPanel.tsx`
