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
