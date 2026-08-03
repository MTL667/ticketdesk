# Epic 3 Code Review Findings

Date: 2026-08-03
Review mode: full
Sources: Blind Hunter, Edge Case Hunter, Acceptance Auditor
Diff: `_epic3-review.diff`

## Review Findings

### decision-needed

_(none — policy defaults applied as patches: reject past due dates; parse due dates as Europe/Brussels end-of-day)_

### patch

- [x] [Review][Patch] Reject bakwagen checkout server-side (slug `bakwagen`) [`lib/marketing/loans.ts`]
- [x] [Review][Patch] Lock loan row (`FOR UPDATE`) before return to prevent double stock restore [`lib/marketing/loans.ts`]
- [x] [Review][Patch] Overdue: stop mutating on GET; use conditional `updateMany` only when needed OR compute-only effective status [`lib/marketing/loans.ts`]
- [x] [Review][Patch] Reject non-permanent due dates in the past [`lib/validators/marketing.ts`]
- [x] [Review][Patch] Parse due dates as Europe/Brussels end-of-day [`lib/marketing/loans.ts` / datetime helper]
- [x] [Review][Patch] `updateItem` stock edit in transaction with item `FOR UPDATE` + recount open loans [`lib/marketing/items.ts`]
- [x] [Review][Patch] Surface loan-list auth/load failures on dashboard and item detail [`app/marketing/page.tsx`, detail]
- [x] [Review][Patch] Prevent dialog dismiss while checkout/return submitting [`CheckoutModal`, `ReturnModal`]
- [x] [Review][Patch] Validate `itemId` exists when filtering open loans [`lib/marketing/loans.ts`]
- [x] [Review][Patch] Abort/ignore stale in-flight item+loan loads on filter/nav change [`app/marketing/page.tsx`, detail]

### defer

- [x] [Review][Defer] Partial-return audit trail (separate return events) — FR27 allows partial qty; full audit model later
- [x] [Review][Defer] Checkout idempotency keys — UI disables submit; API keys later if needed
- [x] [Review][Defer] Item list truncation UX (>200) — already deferred from Epic 2
- [x] [Review][Defer] Automated tests for loan concurrency/overdue — not required by Epic 3 ACs
- [x] [Review][Defer] Strict `available === total - openLoans` on manual edit — adjustments allowed; open-loan ceiling already enforced

## Dismissed

- `{ loan }` / `{ loans }` response wrappers — matches BookAVan named-resource pattern; architecture bans `{ data: ... }` specifically
- Empty return body = full return — intentional API convenience; UI always sends quantity
- Category filter from full catalog — intentional Epic 2 fix
- Duplicate modal element IDs across transitions — only one dialog instance mounted in practice
