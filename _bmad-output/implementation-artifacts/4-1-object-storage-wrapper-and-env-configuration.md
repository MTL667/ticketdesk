# Story 4.1: Object storage wrapper and env configuration

Status: done

## Story

As a marketing user,
I want photo storage configured server-side,
so that images are stored securely outside the app database.

## Acceptance Criteria

1. `lib/storage.ts` provides upload/delete against S3-compatible bucket via `@aws-sdk/client-s3`
2. Credentials only from server env (`S3_*`) — never `NEXT_PUBLIC_` (NFR8, NFR15)
3. `.env.example` documents `S3_*` variables
4. Deploy path remains Docker/Easypanel compatible (runtime env only; NFR16)

## Tasks / Subtasks

- [x] Add `@aws-sdk/client-s3` dependency and sync lockfile
- [x] Implement `lib/storage.ts` (config from env, upload, delete, public URL builder, StorageError)
- [x] Confirm `.env.example` documents S3 vars; no secrets in client code
- [x] Typecheck / lint pass

## Dev Agent Record

### Completion Notes List

- S3-compatible wrapper with `forcePathStyle` for MinIO-style endpoints
- Env validated at call time via StorageError; credentials never `NEXT_PUBLIC_`

### File List

- `package.json`
- `package-lock.json`
- `lib/storage.ts`
- `.env.example` (already documented; verified)

## Change Log

- 2026-08-03: Implemented storage wrapper + dependency
