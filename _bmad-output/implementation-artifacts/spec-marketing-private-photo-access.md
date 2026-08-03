---
title: 'Serve private marketing inventaris photos'
type: 'bugfix'
created: '2026-08-03'
status: 'done'
baseline_commit: 'ac4f9ca01bd53359e3142a9ed5fb00c8b8788fd3'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Photo upload succeeds and DB rows are created, but the gallery shows broken images because the browser loads `S3_PUBLIC_URL/...` and Hetzner returns **403** (bucket must stay private).

**Approach:** Stop using the public object URL in the UI. Authenticated marketing users load photos through a same-origin API that streams the object from S3 with server credentials (`GetObject`), keyed by photo/`key`.

## Boundaries & Constraints

**Always:**
- Bucket remains non-public; do not set public-read ACL or open bucket policy for this fix.
- Only `isMarketing()` (via `requireMarketing`) may fetch photo bytes.
- Gallery `<img src>` uses same-origin proxy URLs (session cookie works); never raw `S3_PUBLIC_URL` for display.
- Existing uploaded objects (keys already in DB) must become viewable without re-upload.
- Upload/delete S3 side stays as today; keep storing `key` as source of truth.
- Errors stay `{ message }` JSON on API; image route returns proper HTTP status (401/403/404/502).

**Ask First:**
- Switching to time-limited presigned S3 URLs instead of an authenticated proxy.
- Making the bucket or objects publicly readable.

**Never:**
- Exposing photos to non-marketing users.
- Changing BookAVan / inventaris CRUD unrelated to photo display.
- Requiring users to re-upload existing photos.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| View gallery | Marketing session + photos with valid `key` | Main + thumbs load via proxy | N/A |
| Upload then view | New upload succeeds | Response URLs are proxy; images render | Upload failure unchanged |
| Non-marketing | GET proxy URL | 403 | Forbidden message or empty |
| Unauthenticated | GET proxy URL | 401 | Unauthorized |
| Missing photo/key | Unknown id or wrong item | 404 | Not found |
| S3 GetObject fails | Valid DB row, S3 error | 502 | Logged; no crash |
| Legacy public `url` in DB | Old rows still have public URL string | Display ignores it; uses `key` + proxy | N/A |

</frozen-after-approval>

## Code Map

- `lib/storage.ts` -- Add `getObject` (stream/buffer + contentType); keep upload/delete
- `lib/marketing/photos.ts` -- Serialize display URL as proxy path from photo id/item id; upload response same
- `lib/marketing/items.ts` -- `getItem` photo payload uses proxy URLs
- `app/api/marketing/items/[id]/photos/[photoId]/file/route.ts` -- NEW authenticated GET stream
- `app/api/marketing/items/[id]/photos/route.ts` -- List/upload return proxy URLs
- `components/marketing/PhotoGallery.tsx` -- Consume API URLs (likely no change if API shape keeps `url`)
- `app/marketing/items/[id]/page.tsx` -- Ensure refreshed photo list uses new URLs
- `.env.example` -- Note `S3_PUBLIC_URL` is optional/legacy for inventaris display (upload still needs S3_* creds)

## Tasks & Acceptance

**Execution:**
- [x] `lib/storage.ts` -- Add private object fetch (`GetObject`) with timeout/error mapping -- server can read bytes without public ACL
- [x] `app/api/marketing/items/[id]/photos/[photoId]/file/route.ts` -- Marketing-guarded GET that streams the object for that item's photo -- same-origin `<img>` works
- [x] `lib/marketing/photos.ts` + `lib/marketing/items.ts` -- Build `url` as `/api/marketing/items/{itemId}/photos/{photoId}/file` (from `key`/ids); stop returning public S3 URLs for display
- [x] Wire list/upload/detail responses through that serializer; keep gallery using `photo.url`
- [x] `.env.example` -- Clarify private-bucket + proxy display; `S3_PUBLIC_URL` no longer required for viewing
- [x] Smoke: upload + reload gallery; hit proxy unauthenticated → 401

**Acceptance Criteria:**
- Given a marketing user and an existing photo `key`, when the item gallery loads, then main image and thumbnails render (no broken icons).
- Given a successful upload, when the success toast shows, then the new photo is visible without refresh issues beyond normal reload.
- Given a non-marketing or logged-out client, when they request the proxy URL, then they receive 403 or 401 and no image bytes.
- Given the bucket stays private, when the old `S3_PUBLIC_URL/...` is opened directly, then it may still 403 — that is expected and not used by the UI.

## Design Notes

Prefer proxy over presigned URLs so copied image links expire with the session and never grant anonymous S3 access. Example display URL:

```
/api/marketing/items/{itemId}/photos/{photoId}/file
```

Validate `photo.itemId === itemId` before streaming. Optionally set `Cache-Control: private, max-age=300`.

`S3_PUBLIC_URL` / `publicUrlForKey` can remain for upload bookkeeping or be left unused for display; do not require a migration of existing `url` columns if APIs regenerate display URLs from ids + `key`.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no errors

**Manual checks:**
- Open inventaris item with photos as marketing user → images visible.
- Open proxy URL in private/incognito window → 401/403, no image.
- Confirm direct Hetzner object URL still 403 (bucket private).

## Suggested Review Order

**Proxy entry (auth + stream)**

- Marketing-gated GET streams S3 bytes for same-origin `<img>`.
  [`file/route.ts:8`](../../app/api/marketing/items/[id]/photos/[photoId]/file/route.ts#L8)

- Session allowlist reused; non-marketing never sees bytes.
  [`file/route.ts:10`](../../app/api/marketing/items/[id]/photos/[photoId]/file/route.ts#L10)

- `nosniff` + private short cache on binary response.
  [`file/route.ts:30`](../../app/api/marketing/items/[id]/photos/[photoId]/file/route.ts#L30)

**Private S3 read**

- `GetObject` with prefix allowlist, size cap, 404 mapping.
  [`storage.ts:134`](../../lib/storage.ts#L134)

- `S3_PUBLIC_URL` optional; unused for gallery display.
  [`storage.ts:46`](../../lib/storage.ts#L46)

**Display URL wiring**

- Single helper for proxy paths (avoids items/photos drift).
  [`photo-url.ts:2`](../../lib/marketing/photo-url.ts#L2)

- List/upload/primary serialize proxy `url`, not public S3.
  [`photos.ts:47`](../../lib/marketing/photos.ts#L47)

- Item detail photos use the same helper.
  [`items.ts:218`](../../lib/marketing/items.ts#L218)

**Config**

- Env notes: private bucket + optional public URL.
  [`.env.example:35`](../../.env.example#L35)
