# Story 4.2: Photo upload API

Status: done

## Story

As a marketing user,
I want to upload multiple photos for an item via API,
so that visual references are attached to inventaris records.

## Acceptance Criteria

1. `POST /api/marketing/items/[id]/photos` with one or more files creates `ItemPhoto` rows (key + url)
2. `GET` lists photos for the item
3. Non-marketing → 403; unauthenticated → 401
4. Per-file failures return clear errors / partial results without blocking other successful uploads (NFR3)
5. Route uses `lib/storage` only (no raw S3 client)

## Tasks / Subtasks

- [x] `lib/marketing/photos.ts` — list, uploadMany, setPrimary helpers + serializePhoto
- [x] `GET` + `POST` `app/api/marketing/items/[id]/photos/route.ts`
- [x] Primary selection API `PATCH .../photos/[photoId]`
- [x] Include photos on `getItem` detail response
- [x] Validate image MIME + size limits; first photo primary if none
- [x] Typecheck pass

## Dev Agent Record

### Completion Notes List

- Multipart field `files` (also accepts `file`)
- Partial success: `{ photos, errors }`; all-fail → 400 with message
- Orphan S3 cleanup + multi-primary repair after concurrent uploads

### File List

- `lib/marketing/photos.ts`
- `lib/marketing/items.ts`
- `app/api/marketing/items/[id]/photos/route.ts`
- `app/api/marketing/items/[id]/photos/[photoId]/route.ts`

## Change Log

- 2026-08-03: Implemented photo upload/list/primary APIs
