# Story 2.3: Inventaris dashboard with KPIs and filters

Status: done

## Story

As a marketing user,
I want a dashboard with KPIs, filters, and an item grid,
so that I can find materials and see stock health at a glance.

## Acceptance Criteria

1. KPIs: total, available, loaned, reorder-needed
2. Filter by entity/category, search, browse grid
3. Reorder when available ≤ minStock
4. marketing.* i18n nl/fr/en; SPOQ/Ticketdesk hybrid; tablet-usable
5. Status cues not color-only

## Dev Agent Record

### File List

- `app/marketing/page.tsx`
- `components/marketing/KpiBar.tsx`
- `components/marketing/ItemFilters.tsx`
- `components/marketing/ItemGrid.tsx`
- `lib/translations.ts`
