---
title: 'Hide BookAVan and Marketing home tiles'
type: 'chore'
created: '2026-08-03'
status: 'done'
route: 'one-shot'
context: []
---

# Hide BookAVan and Marketing home tiles

## Intent

**Problem:** BookAVan and Marketing Inventaris were advertised as home-page tiles; they should only be reachable by URL (marketing still via header Inventaris for allowlisted users).

**Approach:** Remove the two home cards from `app/page.tsx` and drop unused home-card i18n keys; leave routes and marketing header nav intact. Availability calendar deferred separately.

## Suggested Review Order

- Home grid no longer links to `/bookavan` or `/marketing`
  [`page.tsx:142`](../../app/page.tsx#L142)

- Marketing header Inventaris link kept for allowlisted users
  [`page.tsx:99`](../../app/page.tsx#L99)

- Unused home-card translation keys removed (nl/fr/en)
  [`translations.ts:10`](../../lib/translations.ts#L10)

- Calendar follow-up parked for next quick-dev
  [`deferred-work.md`](./deferred-work.md)
