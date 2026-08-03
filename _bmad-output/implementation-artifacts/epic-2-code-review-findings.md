# Epic 2 Code Review Findings

Date: 2026-08-03
Review mode: full
Sources: Blind Hunter, Edge Case Hunter, Acceptance Auditor
Status: patches applied

## Review Findings

### decision-needed

_(none)_

### patch

- [x] [Review][Patch] Unauthenticated `/marketing` and detail hang on loading — redirect when `status === "unauthenticated"`
- [x] [Review][Patch] Reject stock updates that conflict with open inventory loan quantities
- [x] [Review][Patch] Block delete when any loans exist (FK otherwise → 500); delete in transaction
- [x] [Review][Patch] Cap item list results (take 200) + query length cap
- [x] [Review][Patch] Category filter options from full catalog, not filtered subset
- [x] [Review][Patch] Replace `redirect()` inside async fetch with `router.push` / status guard
- [x] [Review][Patch] Guard stale `openEdit` detail response by item id
- [x] [Review][Patch] Disable create when no entities; avoid empty entityId submit
- [x] [Review][Patch] Reject empty/non-finite numbers in Zod + form empty→NaN
- [x] [Review][Patch] i18n: loading.tsx, eyebrow, loan status labels
- [x] [Review][Patch] Show truncation note when loan history hits 50-cap

### defer

- [x] [Review][Defer] Optimistic concurrency / `updatedAt` precondition on item update — deferred
- [x] [Review][Defer] Full KPI reconciliation vs loan rows — deferred to Epic 3
- [x] [Review][Defer] Full loan-history pagination — deferred
- [x] [Review][Defer] Automated tests for marketing CRUD/auth — deferred

## Dismissed

- Marketing check must 403 non-marketing users — mirrors admin check pattern
- `{ item }` response wrapper prohibited — matches BookAVan named-resource pattern
- Check response includes email — mirrors `/api/admin/check`
- Invalid entityId/category returning empty list — legitimate empty result
