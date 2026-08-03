# Story 2.2: Items CRUD API

Status: done

## Story

As a marketing user,
I want to create, read, update, and delete inventory items via API,
so that inventaris data is the source of truth.

## Acceptance Criteria

1. POST/GET/PUT/DELETE `/api/marketing/items` (+ `[id]`)
2. Fields: name, entity, category, location, total, available, minStock, notes
3. List supports entity/category filters and text search
4. Zod validation; non-marketing → 403

## Tasks / Subtasks

- [x] Zod schemas in `lib/validators/marketing.ts`
- [x] Items service + routes
- [x] Protect bakwagen delete + open-loan delete

## Dev Agent Record

### File List

- `lib/validators/marketing.ts`
- `lib/marketing/items.ts`
- `app/api/marketing/items/route.ts`
- `app/api/marketing/items/[id]/route.ts`
