---
title: 'Jira webhook notification observability + string-body preview'
type: 'bugfix'
created: '2026-06-02'
status: 'done'
route: 'one-shot'
baseline_commit: '51d7c0f930c997ec8a0723f4de8ab757d79763cf'
---

# Jira webhook notification observability + string-body preview

## Intent

**Problem:** The Jira comment webhook logs `PASS: all checks passed, proceeding to notification` and then nothing more — no visibility into whether the DB lookup, preview extraction, or SendGrid call is the blocker. On top of that, when Jira sends `comment.body` as a wiki-markup string (rather than ADF JSON), `extractPlainText` returns `""` so the notification preview is empty.

**Approach:** Add a log line for every post-PASS step (issueKey, ticket-lookup result, send-pre-call, send-success/failure) with PII-masked email output. Widen `extractPlainText` to accept strings and strip `[~accountid:...]` mentions. Wrap the preview extraction in try/catch with a Dutch fallback so an unexpected body shape never silently kills the notification.

## Suggested Review Order

**Observability**

- Entry point: where the silence used to live, now eight log lines from PASS to response
  [`route.ts:114`](../../app/api/webhooks/jira/route.ts#L114)

- Lookup logging — distinguishes "no ticket" from "ticket without userEmail"
  [`route.ts:137`](../../app/api/webhooks/jira/route.ts#L137)

- Send pre-call/success logs with `maskEmail` + `usingDefaultFrom` boolean (no PII, no leaked address)
  [`route.ts:164`](../../app/api/webhooks/jira/route.ts#L164)

- `maskEmail` helper — first char + domain only
  [`route.ts:11`](../../app/api/webhooks/jira/route.ts#L11)

**String-body handling**

- Wiki-markup string branch in `extractPlainText` — strips mentions, collapses whitespace
  [`adf-utils.ts:13`](../../lib/adf-utils.ts#L13)

- `textContainsMention` signature widened so future typed callers behave consistently
  [`adf-utils.ts:48`](../../lib/adf-utils.ts#L48)

- Try/catch around preview extraction with Dutch fallback
  [`route.ts:152`](../../app/api/webhooks/jira/route.ts#L152)

**Deferred (out of scope, recorded for follow-up)**

- See `deferred-work.md` — PII firehose at L38, HTML injection in mail body, ambiguous jiraUrl `contains` match, in-process dedupe doesn't survive multi-instance
  [`deferred-work.md`](./deferred-work.md)
