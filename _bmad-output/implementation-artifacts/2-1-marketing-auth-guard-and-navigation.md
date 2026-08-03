# Story 2.1: Marketing auth guard and navigation

Status: done

## Story

As a marketing-authorized user,
I want inventaris routes protected and linked in navigation,
so that only the right people manage marketing materials.

## Acceptance Criteria

1. Marketing users can call `GET /api/marketing/check` and open `/marketing`
2. Non-marketing authenticated users get `403` on marketing APIs and are denied/redirected from `/marketing`
3. Unauthenticated users get `401` / sign-in redirect
4. Marketing appears in nav for marketing users

## Tasks / Subtasks

- [x] Update `/api/marketing/check` (401 unauth, isMarketing for authed)
- [x] `requireMarketing()` helper for APIs
- [x] Home nav + card for marketing users
- [x] `/marketing` page access gate

## Dev Agent Record

### Completion Notes List

- Check endpoint returns 401 when unauthenticated; pages redirect non-marketing users.

### File List

- `app/api/marketing/check/route.ts`
- `lib/marketing/auth.ts`
- `app/page.tsx`
- `app/marketing/page.tsx`
