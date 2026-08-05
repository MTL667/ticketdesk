---
title: 'Bi-directional Jira comment communication'
type: 'feature'
created: '2026-04-28'
status: 'review'
baseline_commit: '56427632406f46d3e2171d3838356f1fa8308a35'
context:
  - '{project-root}/_bmad-output/brainstorming/brainstorming-session-2026-04-28-0829.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** When a development ticket is pushed to Jira, the ticket requester in TicketDesk has no way to communicate with developers — the only communication channel is ClickUp. Developers work in Jira and never see ClickUp messages.

**Approach:** Add bi-directional Jira comment support: when a ticket has a `jiraUrl`, replace the ClickUp communication window with a Jira communication window (toggleable back to ClickUp). TicketDesk reads comments via Jira REST API polling, writes plain-text comments via a service account with a name prefix, renders incoming ADF as HTML, sends email notifications via a Jira webhook + SendGrid, and handles failures with a retry queue + visual feedback.

## Boundaries & Constraints

**Always:**
- Jira is source of truth — no local comment storage; live fetch on every load + 30s polling
- Outgoing comments use the service account and include `[RequesterName]: ` prefix
- Set `source: ticketdesk` comment property on outgoing comments to prevent duplicate display; if PUT property fails, retry 2x with backoff; if still fails, log warning and rely on fallback detection (service-account email + prefix pattern `[`)
- Filter out comments with `source: ticketdesk` property when rendering; fallback: also filter comments where author = service account email AND body starts with `[`
- Paginate Jira comment fetches using `startAt`/`maxResults` loop — never assume all comments fit in one response
- Jira window is default when `jiraUrl` exists; ClickUp is secondary via toggle; refresh resets to Jira
- Toggle labels must be functional, not brand names: "Ontwikkelaar" / "Eerdere gesprekken" (not "Jira" / "ClickUp") — the requester shouldn't need to know the underlying tools
- Use existing `jiraFetch()` retry wrapper and `parseJiraKeyFromUrl()` from `lib/jira.ts`
- ADF renderer must never throw on unknown node types — return null + `console.warn('adf.unknown_type', { type })` for graceful degradation
- Webhook endpoint must deduplicate events using `commentId + updated` timestamp to prevent duplicate SendGrid emails
- All new UI text must have nl/fr/en translations

**Ask First:**
- Any new npm dependency (for ADF rendering)
- Changes to the Prisma schema

**Never:**
- Store comments in local database
- Build a full ADF-compatible rich text editor — send plain text to Jira
- Bypass `lib/jira.ts` — all Jira API calls go through `jiraFetch()`

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Jira ticket with comments | Ticket has `jiraUrl`, Jira has 3 comments (1 from TicketDesk, 2 from devs) | Show 2 dev comments as received + 1 own comment as sent (filtered by property) | N/A |
| Send comment to Jira | User types message and clicks send | POST to Jira as `[UserName]: message`, then PUT property `source: ticketdesk` (2x retry) | Queue + retry + visual error on POST failure; PUT failure = log warning, rely on fallback detection |
| No Jira link | Ticket has no `jiraUrl` | Show ClickUp communication window (existing behavior) | N/A |
| Jira API down during read | Polling fails | Show last fetched comments + error banner | Auto-retry on next 30s poll |
| Jira API down during write | POST fails | Message shows "sending failed" indicator, auto-retry in background | After 3 retries, show permanent error with manual retry button |
| Toggle to ClickUp | User clicks toggle while on Jira view | Switch to ClickUp comments; badge shows unread count | N/A |
| Page refresh | User refreshes page on ticket with `jiraUrl` | Jira window shown (not ClickUp), toggle state not persisted | N/A |
| Jira webhook: new comment | Developer adds comment in Jira | Webhook endpoint receives event, deduplicates by commentId+updated, sends SendGrid notification email to requester | Log error if SendGrid fails; do not block webhook response; skip duplicate events silently |
| Jira webhook: duplicate event | Same comment event arrives twice (at-least-once delivery) | Second event is detected as duplicate and skipped | No email sent; log at debug level |
| POST→PUT property failure | POST succeeds, PUT property fails after retries | Comment exists in Jira without property; next poll uses fallback detection (service-account + prefix) | Log warning with commentId for monitoring |
| Upload attachment | User attaches a file | Upload via Jira Attachment API, reference inline in comment body | Show error if upload fails, do not send comment without attachment |

</frozen-after-approval>

## Code Map

- `lib/jira.ts` -- Existing Jira API wrapper with `jiraFetch()`, `parseJiraKeyFromUrl()`, auth helpers. Add comment CRUD + property functions here.
- `lib/sendgrid.ts` -- Existing SendGrid wrapper. Add `sendCommentNotification()` for email alerts.
- `lib/adf-renderer.ts` -- New: lightweight ADF JSON → React element renderer for displaying Jira rich text.
- `components/TicketComments.tsx` -- Existing ClickUp comments component (reference architecture).
- `components/JiraTicketComments.tsx` -- New: Jira comments component mirroring ClickUp version with ADF rendering.
- `components/TicketCommunication.tsx` -- New: wrapper component with Jira/ClickUp toggle logic and unread badges.
- `app/tickets/[id]/page.tsx` -- Ticket detail page. Replace `TicketComments` with `TicketCommunication`.
- `app/api/tickets/[id]/jira-comments/route.ts` -- New: GET (fetch comments) and POST (send comment) API routes for Jira.
- `app/api/webhooks/jira/route.ts` -- New: webhook endpoint for Jira comment events → SendGrid notification.
- `lib/translations.ts` -- Add translation keys for Jira communication UI elements.
- `prisma/schema.prisma` -- Reference only: `Ticket.jiraUrl` field already exists.

## Tasks & Acceptance

**Execution:**
- [x] `lib/jira.ts` -- Add `getIssueComments(issueKey)` with `startAt`/`maxResults` pagination loop (sort results by `created` ascending), `postIssueComment(issueKey, body, authorName)`, `setCommentProperty(issueKey, commentId, key, value)` with 2x retry on failure, `getCommentProperties(issueKey, commentId)`. Use existing `jiraFetch()` and `getJiraAuth()`. Add `getServiceAccountEmail()` for fallback detection. Jira REST API v3 endpoints: `GET /rest/api/3/issue/{key}/comment`, `POST /rest/api/3/issue/{key}/comment`, `PUT /rest/api/3/comment/{commentId}/properties/{propertyKey}`.
- [x] `lib/adf-renderer.tsx` -- Create lightweight ADF → React element renderer with `renderAdfNode(node): ReactNode` using switch on `node.type`. Support: paragraph, text (with marks: strong, em, underline, strike, code), heading, bulletList, orderedList, listItem, codeBlock, hardBreak, link, mediaSingle/mediaGroup. Default case: `console.warn('adf.unknown_type', { type })` + return `null` — never throw. Add `extractPlainText(adf): string` helper for email notification previews (unknown nodes = skip).
- [x] `app/api/tickets/[id]/jira-comments/route.ts` -- GET: auth check → load ticket from Prisma → parse Jira key from `jiraUrl` → fetch all comments (paginated) → for each comment: check property `source: ticketdesk` OR fallback (author = service-account email AND body starts with `[`) → separate into "own" and "received" lists → return both sorted by `created`. POST: auth check → parse Jira key → post comment with `[userName]: ` prefix → attempt PUT property `source: ticketdesk` (2x retry, log on failure) → return comment.
- [x] `components/JiraTicketComments.tsx` -- Mirror `TicketComments` architecture: fetch from `/api/tickets/{id}/jira-comments`, 30s polling, chat-bubble UI, ADF rendering for received messages, plain text input for sending, retry queue with visual status indicators, attachment upload button.
- [x] `components/TicketCommunication.tsx` -- Wrapper: if `jiraUrl` exists, default to `JiraTicketComments` with toggle to `TicketComments`; otherwise show only `TicketComments`. Toggle uses functional labels: "Ontwikkelaar" / "Eerdere gesprekken" (not brand names). Unread badges on toggle. State resets to Jira-view on mount (not persisted across refresh).
- [x] `app/tickets/[id]/page.tsx` -- Replace `<TicketComments ticketId={ticket.id} userEmail={...} />` with `<TicketCommunication ticketId={ticket.id} jiraUrl={ticket.jiraUrl} userEmail={...} userName={session.user?.name || ""} />`.
- [x] `app/api/webhooks/jira/route.ts` -- POST (no auth — webhook endpoint): verify webhook payload structure (check for `comment_created` event type) → deduplicate by `commentId + updated` (in-memory Set with TTL, or check against recent processed) → skip if comment has `source: ticketdesk` property → look up ticket by Jira issue key in Prisma (`jiraUrl` contains key) → get requester email → call `sendCommentNotification()` → return 200. Always return 200 quickly; process async where possible.
- [x] `lib/sendgrid.ts` -- Add `sendCommentNotification(toEmail, ticketName, ticketId, commentPreview)` using SendGrid Mail Send API (`POST /v3/mail/send`).
- [x] `lib/translations.ts` -- Add keys for all three languages: developerMessages, previousConversations, switchToDeveloper, switchToPrevious, sendingFailed, retrying, attachFile, jiraCommentNotificationSubject, noJiraComments, jiraMessagesHelp, unreadMessages.

**Acceptance Criteria:**
- Given a ticket with `jiraUrl`, when the detail page loads, then the developer communication window is shown as default with a toggle labeled with functional names (not brand names) to previous conversations.
- Given the developer window is active, when the user sends a message, then it appears as a Jira comment with `[UserName]: ` prefix and `source: ticketdesk` property (or fallback detection if property PUT fails).
- Given a developer posts a comment in Jira (including ADF rich text with unknown node types), when the TicketDesk user views the ticket, then the comment renders gracefully within 30 seconds — known nodes as rich HTML, unknown nodes silently skipped.
- Given a developer posts a comment in Jira, when the webhook fires, then the requester receives exactly one email notification via SendGrid (duplicate webhook events are deduplicated).
- Given the Jira API is temporarily down, when the user sends a message, then a visual error is shown and the message is retried automatically.
- Given the user toggles to previous conversations and then refreshes the page, then the developer window is shown again.
- Given the user attaches a file, when sending, then the file is uploaded to Jira as an attachment and referenced in the comment.
- **End-to-end roundtrip (John's test):** Given one ticket with `jiraUrl`, when a requester sends a comment via TicketDesk AND a developer replies in Jira, then both messages appear in TicketDesk in correct chronological order, without duplicates, with the toggle functional in both directions — this single test proves the full chain works.

## Design Notes

**POST→PUT resilience (non-atomic by design):** POST comment and PUT property are two separate API calls. POST is the critical path; PUT property is best-effort. Flow: POST → save `commentId` → PUT property with 2x retry (500ms, 1s backoff). If PUT fails after retries: log `jira.property_sync_failed` with `commentId`, return success to client. Fallback detection on read: if comment author email matches `JIRA_EMAIL` env var AND comment body starts with `[`, treat as own comment even without property. This ensures zero orphan UX impact.

**ADF rendering strategy:** Recursive `renderAdfNode(node): ReactNode` with `switch(node.type)`. Default case: `console.warn('adf.unknown_type', { type: node.type })` → return `null`. Never throw. Helper `extractPlainText(adf): string` for email previews — unknown nodes skipped. Do not use `@atlaskit/renderer` (heavy dependency). Target nodes: doc, paragraph, text, heading, bulletList, orderedList, listItem, codeBlock, hardBreak, mediaSingle, mediaGroup. Text marks: strong, em, underline, strike, code, link.

**Comment pagination:** Jira GET comments returns paginated results. Use `startAt` + `maxResults` (default 50) in a loop until `startAt + results.length >= total`. Sort final array by `created` ascending for chronological display.

**Webhook security & idempotency:** Jira Cloud webhooks lack HMAC signing. Validate by: payload structure check + issue key exists in DB. Deduplicate using in-memory `Set<string>` keyed by `${commentId}:${updated}` with 5-minute TTL (sufficient for burst duplicates). Consider shared secret as query parameter on webhook URL for additional protection.

**Attachment flow:** Use `POST /rest/api/3/issue/{key}/attachments` with `multipart/form-data` and `X-Atlassian-Token: no-check` header. After upload, reference the attachment in the comment body as plain text: `[Attachment: filename.ext]`.

## Verification

**Commands:**
- `npx next build` -- expected: build succeeds with no TypeScript errors
- `npx next lint` -- expected: no new lint errors

**Manual checks:**
- Open a ticket with `jiraUrl` set — Jira communication window shows as default
- Send a message — appears in Jira as comment with name prefix and property
- Developer comment in Jira appears in TicketDesk within 30s with ADF formatting
- Toggle between Jira and ClickUp windows works; refresh resets to Jira
- Webhook test: POST to `/api/webhooks/jira` with mock payload — verify SendGrid called
