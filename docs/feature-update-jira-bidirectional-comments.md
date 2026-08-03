# Feature Update: Bi-directional Jira Communication

**Date:** April 28, 2026
**Status:** Live

---

## What changed?

Ticket requesters can now **communicate directly with developers** through TicketDesk — no need to leave the platform or have access to Jira.

When a ticket is linked to a Jira issue, the ticket detail page automatically switches to a **developer communication window**. Messages sent here appear as comments on the Jira issue, and developer replies in Jira show up in TicketDesk in real-time.

## How it works

### For developers (Jira side)

- When a requester sends a message through TicketDesk, it appears as a **regular Jira comment** on the linked issue, prefixed with the requester's name: `[kevin.vanhoecke]: Can you clarify the expected behavior?`
- **Just reply in Jira as you normally would.** Your comment is automatically picked up by TicketDesk within 30 seconds.
- Rich text formatting (bold, italic, code blocks, lists, links) is fully supported — TicketDesk renders your ADF-formatted comments.
- The requester receives an **email notification** when you reply, with a direct link back to the ticket.

### For requesters (TicketDesk side)

- Tickets with a Jira link automatically show the developer communication window.
- The previous ClickUp conversation remains accessible via a toggle button.
- File attachments are supported.
- Failed messages are automatically retried with visual feedback.

## Architecture overview

```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│  TicketDesk  │◄──poll──│   Jira API   │◄──write──│Developer │
│  (requester) │──write──►│  (comments)  │──read───►│  (Jira)  │
└──────┬───────┘         └──────┬───────┘         └──────────┘
       │                        │
       │                        │ webhook
       │                        ▼
       │                 ┌──────────────┐
       ◄───email─────────│   SendGrid   │
                         └──────────────┘
```

- **No local storage** — Jira is the single source of truth. Comments are fetched live on every page load + 30s polling.
- **Service account** — All TicketDesk comments are posted via a shared Jira service account with the requester's name as prefix.
- **Webhook-driven notifications** — A Jira webhook fires on new comments and triggers an email via SendGrid. Deduplication prevents double emails.
- **Comment tagging** — TicketDesk-originated comments are tagged with a `source: ticketdesk` property to prevent them from appearing as developer messages.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JIRA_BASE_URL` | Yes | Already configured |
| `JIRA_EMAIL` | Yes | Service account email (must match the API token owner) |
| `JIRA_API_TOKEN` | Yes | API token created by the service account |
| `JIRA_ACCOUNT_ID` | Recommended | Service account's Atlassian account ID (for webhook filtering) |
| `JIRA_WEBHOOK_SECRET` | Recommended | Shared secret for webhook URL validation |
| `SENDGRID_FROM_EMAIL` | No | Sender email for notifications (default: `servicedesk@spoq.be`) |
| `SENDGRID_FROM_NAME` | No | Sender display name (default: `ServiceDesk`) |

## Jira webhook setup

A webhook must be configured in Jira to enable email notifications:

1. **Jira Settings → System → WebHooks → Create**
2. **URL:** `https://servicedesk.hertbelgium.be/api/webhooks/jira?secret=<JIRA_WEBHOOK_SECRET>`
3. **Events:** Comment → created
4. **JQL filter:** All issues (or scoped to relevant projects)

## Files added/modified

| File | Change |
|------|--------|
| `lib/jira.ts` | Added comment CRUD, pagination, property management, attachment upload |
| `lib/adf-renderer.tsx` | New — Jira ADF → React renderer with graceful fallback |
| `lib/adf-utils.ts` | New — Server-safe plain text extraction from ADF |
| `lib/sendgrid.ts` | Added `sendCommentNotification()` |
| `lib/translations.ts` | Added nl/fr/en keys for all new UI elements |
| `components/JiraTicketComments.tsx` | New — Jira comments UI with polling, retry queue, attachments |
| `components/TicketCommunication.tsx` | New — Toggle wrapper (developer / previous conversations) |
| `app/tickets/[id]/page.tsx` | Replaced `TicketComments` with `TicketCommunication` |
| `app/api/tickets/[id]/jira-comments/route.ts` | New — GET/POST API routes for Jira comments |
| `app/api/webhooks/jira/route.ts` | New — Webhook endpoint with dedup + SendGrid trigger |
| `middleware.ts` | Excluded `/api/webhooks/` from auth |

## Known limitations

- Outgoing messages from TicketDesk are **plain text only** (no rich text editor).
- Attachment references appear as `[Attachment: filename.ext]` text in the Jira comment, not inline previews.
- The in-memory deduplication cache for webhooks resets on server restart (5-minute TTL is sufficient for burst duplicates).
