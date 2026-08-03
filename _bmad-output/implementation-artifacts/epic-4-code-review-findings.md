# Epic 4 Code Review Findings

Date: 2026-08-03
Review mode: full
Sources: Blind Hunter, Edge Case Hunter, Acceptance Auditor
Diff: `_epic4-review.diff` (+ photo wiring snippets)

## Review Findings

### decision-needed

_(resolved — user chose JSON 401 for marketing/bookavan APIs)_

### patch

- [x] [Review][Patch] Exclude `/api/marketing` and `/api/bookavan` from middleware redirect so unauthenticated API calls get JSON 401 from route guards [`middleware.ts`]
- [x] [Review][Patch] All-fail upload: preserve StorageError 502 and return `{ message, errors }` for per-file detail [`lib/marketing/photos.ts`, route]
- [x] [Review][Patch] Cap multipart batch (file count + total bytes) [`lib/marketing/photos.ts`]
- [x] [Review][Patch] Partial success → HTTP 207 (or equivalent) when `errors.length > 0` [`photos/route.ts`]
- [x] [Review][Patch] Omit storage `key` from client-facing serializePhoto [`lib/marketing/photos.ts`]
- [x] [Review][Patch] `sortOrder` from `max(sortOrder)+1`, not `count` [`lib/marketing/photos.ts`]
- [x] [Review][Patch] S3 upload/delete timeout (`AbortSignal.timeout`) [`lib/storage.ts`]
- [x] [Review][Patch] Align camera `accept` with server allowlist (jpeg/png/webp/gif) [`PhotoGallery.tsx`]
- [x] [Review][Patch] Block concurrent set-primary clicks; apply primary from response id [`PhotoGallery.tsx`, detail page]
- [x] [Review][Patch] Abort in-flight photo upload on unmount/nav; handle 401 → signin [`app/marketing/items/[id]/page.tsx`]
- [x] [Review][Patch] Refresh S3 client when env config fingerprint changes [`lib/storage.ts`]

### defer

- [x] [Review][Defer] Photo delete API/UI — not in Epic 4 ACs
- [x] [Review][Defer] Magic-byte / content sniffing — MIME/extension allowlist only for MVP
- [x] [Review][Defer] DB unique constraint for single primary — app-level repair exists
- [x] [Review][Defer] Orphan S3 reconciliation if delete-after-failed-create also fails
- [x] [Review][Defer] Stale absolute URLs after `S3_PUBLIC_URL` rotation
- [x] [Review][Defer] Private-bucket ACL / encryption options — public URL assumed via env

## Dismissed

- Multi-tenant IDOR — product has flat marketing allowlist, no tenant model
- `forcePathStyle: true` — intentional for S3-compatible (MinIO-style) providers
- Lockfile missing `@aws-sdk/client-s3` — false positive; lockfile updated
- `tsx` in dependencies — pre-existing seed tooling, not introduced by photos feature
- Animated GIF “abuse” without dimension limits — out of MVP scope with MIME allowlist
