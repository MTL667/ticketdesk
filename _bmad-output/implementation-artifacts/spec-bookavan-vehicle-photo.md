---
title: 'Show bakwagen primary photo on BookAVan hero'
type: 'feature'
created: '2026-08-05'
status: 'done'
baseline_commit: '8662afdcd652d51ce5122ec7967cbce6db9259a1'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The bakwagen photo lives on the Marketing Inventaris item, but BookAVan shows no vehicle image, so users cannot visually confirm what they are booking.

**Approach:** Show the bakwagen **primary** inventaris photo as a hero under the BookAVan page title; any authenticated user can load it via a BookAVan-scoped image API (not the marketing-only proxy).

## Boundaries & Constraints

**Always:**
- Placement: hero under the BookAVan heading/intro (option B), before the calendar.
- Only the **primary** bakwagen photo (fallback: first photo by sort order if none marked primary).
- Any logged-in user (same auth as other `/api/bookavan/*` routes) may view this image — no marketing allowlist.
- Resolve vehicle only via bakwagen item (`slug: bakwagen`); never accept arbitrary item/photo ids from the client.
- Stream private S3 object with server credentials; do not require a public bucket.
- If no photo exists: hide the image area (no broken icon); page otherwise works.
- i18n nl/fr/en for any new visible strings (alt text / empty not required if decorative).

**Ask First:**
- Showing non-primary photos or a full gallery on BookAVan.
- Exposing inventaris photos for items other than bakwagen.

**Never:**
- Reusing marketing photo URLs that require `requireMarketing` for BookAVan `<img>`.
- Letting clients request arbitrary `itemId`/`photoId` through the new endpoint.
- Changing reservation/approval/calendar logic.
- Requiring photo re-upload in marketing.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path | Logged-in + bakwagen has primary photo | Hero image renders under title | N/A |
| No photo | Bakwagen exists, zero photos | No image block; rest of page OK | N/A |
| Unauthenticated | GET image API | 401 | No bytes |
| Bakwagen missing | No slug item | 404 from image API; UI hides image | Logged/soft |
| S3 failure | Valid photo key, S3 error | 502 from API; UI hides/broken avoided | `{ message }` / status |

</frozen-after-approval>

## Code Map

- `lib/bookavan/bakwagen.ts` -- Resolve bakwagen item by slug
- `app/api/bookavan/vehicle-photo/route.ts` -- NEW: auth + stream primary bakwagen photo
- `lib/storage.ts` -- Reuse `getObject` (keys already `marketing/items/...`)
- `app/bookavan/page.tsx` -- Hero `<img>` (or small component) under heading
- `components/bookavan/VehiclePhotoHero.tsx` -- NEW optional presentational hero (preferred over bloating page)
- `lib/translations.ts` -- Alt text / labels nl/fr/en

## Tasks & Acceptance

**Execution:**
- [x] `app/api/bookavan/vehicle-photo/route.ts` -- GET for any authenticated user; load bakwagen + primary (or first) photo; stream via `getObject`; 401/404/502 as matrix
- [x] `components/bookavan/VehiclePhotoHero.tsx` -- Hero image under title; hide on error/404; sensible alt
- [x] `app/bookavan/page.tsx` -- Mount hero under heading/intro, before calendar
- [x] `lib/translations.ts` -- Add alt/label keys nl/fr/en

**Acceptance Criteria:**
- Given a logged-in user and a primary bakwagen photo in inventaris, when they open BookAVan, then that photo appears under the page title.
- Given no bakwagen photos, when they open BookAVan, then the page has no broken image and booking UI still works.
- Given a logged-out client, when they request `/api/bookavan/vehicle-photo`, then they receive 401 and no image bytes.
- Given a non-marketing employee, when the hero loads, then the image still displays (marketing allowlist not required).

## Design Notes

Prefer a fixed BookAVan endpoint so `<img src="/api/bookavan/vehicle-photo">` works with the session cookie:

```
GET /api/bookavan/vehicle-photo
→ auth() email required
→ getBakwagenItem()
→ ItemPhoto where itemId + (isPrimary first, else earliest sortOrder)
→ getObject(key) → image bytes
```

Do not expose marketing inventaris CRUD. Keep layout restrained: one image under the intro, full-width within `max-w-7xl`, not a card collage.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no errors

**Manual checks:**
- Marketing: bakwagen has primary photo → BookAVan shows it under title for a normal user.
- Remove/hide all photos → BookAVan has no broken image.
- Incognito GET `/api/bookavan/vehicle-photo` → 401.

## Suggested Review Order

**BookAVan-scoped photo API**

- Any logged-in user; bakwagen only; streams primary (or first) photo.
  [`vehicle-photo/route.ts:18`](../../app/api/bookavan/vehicle-photo/route.ts#L18)

- Errors use `no-store` so failed `<img>` loads are not sticky-cached.
  [`vehicle-photo/route.ts:7`](../../app/api/bookavan/vehicle-photo/route.ts#L7)

**Hero UI**

- Show only after successful load; hide on error (no empty chrome).
  [`VehiclePhotoHero.tsx:10`](../../components/bookavan/VehiclePhotoHero.tsx#L10)

- Mounted under intro, before calendar.
  [`page.tsx:278`](../../app/bookavan/page.tsx#L278)

**i18n**

- Alt text for the vehicle photo.
  [`translations.ts:128`](../../lib/translations.ts#L128)
