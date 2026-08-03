# Deferred Work

Pre-existing issues surfaced during adversarial review but not in scope of the current change.

## From spec-jira-webhook-notification-observability (2026-06-02)

- **PII firehose in `[jira-webhook] Received payload` log** (`app/api/webhooks/jira/route.ts:38`). On every Jira webhook (including own-comment/dedupe/not-mentioned cases that are immediately skipped) the handler logs `authorEmail` and a 500-char `bodySnippet`. Gate behind `LOG_LEVEL=debug` or trim aggressively.

- **HTML injection in SendGrid notification body** (`app/api/webhooks/jira/route.ts:163` → `lib/sendgrid.ts:372`). `authorName` (from Jira `displayName`, attacker-controllable) and `preview` are interpolated raw into the HTML email template. A Jira user with display name `<img src=x onerror=…>` injects HTML into outgoing email. Escape both values before interpolation.

- **Ambiguous Jira issue key match in DB lookup** (`app/api/webhooks/jira/route.ts:117`). `where: { jiraUrl: { contains: issueKey } }` will match `PROJ-1` against tickets whose `jiraUrl` references `PROJ-10`, `PROJ-100`, etc. Notification could be delivered to the wrong customer. Use an exact-match on a normalized key column or a more precise regex.

- **In-process dedupe Map breaks under multi-instance hosting** (`app/api/webhooks/jira/route.ts:8`). `processedEvents` lives in module memory. On Vercel / Fly / any horizontally scaled deployment, a retried webhook hitting another instance sends a duplicate email. Move the dedupe to Redis, a Prisma `WebhookEvent` table with unique constraint, or the existing DB layer.

## From spec-admin-ticket-statistics-dashboard (2026-06-15)

- **Stats API query count** (`app/api/admin/stats/route.ts`). Month view runs 13 separate `groupBy` queries (1 current + 12 trend). For admin-only use this is acceptable, but consider a single raw SQL query or response caching if performance becomes an issue at scale.

- **Recharts bundle size** (`app/admin/stats/page.tsx`). The recharts library is statically imported. Consider `next/dynamic` with `ssr: false` to code-split it from the main admin bundle.

- **Creator display names** (`app/api/admin/stats/route.ts`). Top creators show `userEmail.split("@")[0]` as display name since the Ticket model has no userName field. If user display names become available, update the API to use them.

## Deferred from: code review of spec-admin-ticket-statistics-dashboard (2026-06-15)

- **DB query amplification** (`route.ts:155-165`). Month view runs 14 separate Prisma groupBy queries per request. Consider single raw SQL or response caching if performance becomes an issue.
- **Stale data during refetch** (`page.tsx:265`). When switching period/view, old data remains visible without a loading overlay. Consider adding a loading state or skeleton during refetch.
- **Top creator display names** (`route.ts:121`). Names derived from email local-part; no real name resolution available yet.
- **No automated tests**. Date parsing, period shifting, trend range generation, and aggregation logic have no unit or integration tests.
- **No retry UX on error** (`page.tsx:259`). Error banner is static with no retry button; user must manually refresh.
- **Accessibility gaps** (`page.tsx:241`). Prev/next navigation buttons use unlabeled Unicode glyphs; chart segments lack keyboard navigation. Acceptable for admin-only desktop tool.

## Deferred from: code review of epic-1 (2026-08-03)

- **No DB check constraints for inventory qty invariants** (`prisma/schema.prisma`). `available > total`, negative stock, non-positive loan quantity not enforced at DB level — Epic 2/3 inventory scope.
- **No automated tests for BookAVan overlap/cancel/auth/timezone**. Not required by Epic 1 ACs; add when TEA/test stories cover the module.

## Deferred from: code review of epic-2 (2026-08-03)

- **Optimistic concurrency on item update** — no `updatedAt` precondition; last write wins until multi-editor concurrency becomes an issue.
- **KPI reconciliation vs loan rows** — displayed loaned = total − available; Epic 3 checkout/return should keep this consistent.
- **Full loan-history pagination** — detail currently caps at 50; truncation note is MVP; full paging later.
- **Automated tests for marketing CRUD/auth** — not required by Epic 2 ACs.

## Deferred from: code review of epic-3 (2026-08-03)

- **Partial-return audit trail** — partial returns reduce loan quantity in place; no separate return event rows. FR27 allows partial qty; richer audit later.
- **Checkout idempotency keys** — UI disables submit while busy; API-level keys if duplicate POSTs become a problem.
- **Item list truncation UX (>200)** — carried from Epic 2; metadata exists, UI paging later.
- **Automated tests for loan concurrency/overdue** — not required by Epic 3 ACs.
- **Strict available === total − openLoans on manual edit** — ceiling vs open loans already enforced; free downward adjustment allowed.

## Deferred from: code review of epic-4 (2026-08-03)

- **Photo delete API/UI** — upload + primary selection only in Epic 4 ACs; delete later.
- **Server-side thumbnail resize** — architecture nice-to-have; full images used for thumbs for now.
- **Automated tests for storage/upload** — no test runner in repo; same stance as Epics 1–3.
- **Deep content-type validation** — MIME/extension allowlist only; magic-byte sniffing later if needed.
- **DB unique constraint for single primary** — app-level multi-primary repair exists; schema constraint later.
- **Orphan S3 reconciliation** — best-effort delete after failed DB create; no background sweeper.
- **Stale absolute photo URLs** — URL baked at upload from `S3_PUBLIC_URL`; rotation needs rebuild path.
- **Private-bucket ACL / SSE options** — assumes publicly readable objects via `S3_PUBLIC_URL`.
