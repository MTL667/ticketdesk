# Story 4.3: Photo gallery UI

Status: done

## Story

As a marketing user,
I want a gallery with main photo selection and file/camera capture,
so that I can manage item imagery from the detail page.

## Acceptance Criteria

1. Item detail shows gallery: main photo + thumbnail strip (FR32–33, UX-DR4)
2. User can select a main/primary photo
3. Add photos via file upload and camera capture where supported (FR34)
4. Upload shows in-progress/completion feedback (UX-DR10, NFR3)
5. Primary actions keyboard-accessible (NFR11)
6. i18n nl/fr/en for new strings

## Tasks / Subtasks

- [x] `components/marketing/PhotoGallery.tsx` — main + thumbs + upload + set primary
- [x] Wire into `app/marketing/items/[id]/page.tsx`
- [x] Translation keys (nl/fr/en)
- [x] Typecheck / lint pass

## Dev Agent Record

### Completion Notes List

- File + camera inputs; local uploading/primary busy states
- Thumbnail buttons are keyboard-focusable with aria-labels

### File List

- `components/marketing/PhotoGallery.tsx`
- `app/marketing/items/[id]/page.tsx`
- `lib/translations.ts`

## Change Log

- 2026-08-03: Implemented photo gallery UI on item detail
