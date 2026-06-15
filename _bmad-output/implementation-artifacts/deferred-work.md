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
