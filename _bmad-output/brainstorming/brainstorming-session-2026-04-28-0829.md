---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Bi-directional comment/message communication between TicketDesk and Jira'
session_goals: 'Enable ticket requesters in TicketDesk to exchange messages with developers in Jira and vice versa, once a development ticket exists in Jira. Replace existing ClickUp communication window with Jira communication window when ticket has a Jira ID.'
selected_approach: 'ai-recommended'
techniques_used: ['Question Storming', 'Analogical Thinking', 'Morphological Analysis']
ideas_generated: ['IMAP-client thin pattern', 'Asymmetric ADF conversion', 'Webhook as notification trigger only', 'Comment property marker for dedup', 'Service account with name prefix', 'Hard switch with toggle', 'SendGrid email notification', 'Queue retry with visual feedback', 'Phased implementation plan']
session_active: false
workflow_completed: true
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Kevin
**Date:** 2026-04-28

## Session Overview

**Topic:** Bi-directional comment/message communication between TicketDesk and Jira
**Goals:** Enable ticket requesters in TicketDesk to exchange messages with developers in Jira and vice versa, once a development ticket exists in Jira

### Session Setup

- Current system communicates with ClickUp for hardware issues
- Development tickets are pushed from ClickUp to Jira
- Existing Jira API integration is in place
- Need: comment/message sync between TicketDesk users and Jira developers
- Approach: AI-Recommended Techniques
- Key constraint: Existing ClickUp communication window should be replaced by Jira communication window when ticket has a Jira ID

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Bi-directional Jira comment sync with focus on replacing ClickUp communication window

**Recommended Techniques:**

- **Question Storming:** Define the full problem space — edge cases, identity mapping, sync challenges
- **Analogical Thinking:** Draw from proven bi-directional sync patterns in other systems
- **Morphological Analysis:** Systematically map all technical dimensions and combine into architectures

**AI Rationale:** Technical integration problem with existing infrastructure requires thorough problem definition before solution generation, inspiration from proven patterns, and systematic combination of architectural choices.

## Technique Execution Results

### Question Storming

**Key decisions established:**

| Question Area | Decision |
|---|---|
| Trigger for switch | When Jira link exists on ticket |
| UI model | Jira = main window, toggle to ClickUp, reset to Jira on refresh |
| Message direction | To Jira once Jira link exists |
| Identity in Jira | Service account with requester name in text prefix |
| Internal/external | Show all comments (no filtering) |
| Comment editing | Sync edits from Jira to TicketDesk |
| Rich text | Desired — requires ADF mapping + editor upgrade |
| Attachments | Desired — upload as Jira attachment |
| Error handling | Queue + error message |
| Rate limits | Not an issue for this volume (points-based since March 2026) |
| Local storage | No — live fetching from Jira, TicketDesk as thin client |
| Notification | Email via SendGrid when developer replies |
| One requester per ticket | Yes |
| JSM | Not considered — extra cost |

**Technical research findings:**
- Jira API does not support posting comments on behalf of another user via service account — comments appear under API credential owner
- Jira API supports comment visibility restrictions via `visibility` parameter (role/group based)
- Jira Cloud uses Atlassian Document Format (ADF) for rich text in API v3
- Jira Cloud rate limits are points-based (since March 2, 2026), API token traffic uses existing burst limits
- Maximum 5,000 comments per Jira issue
- SendGrid integration already exists in TicketDesk (lib/sendgrid.ts)
- Current TicketComments component is plain text only with 30s polling

### Analogical Thinking

**Patterns identified from 6 analogies:**

| Analogy | Pattern borrowed |
|---|---|
| Jira Service Management | Service account + requester name in message body |
| Zendesk/Freshdesk | Email notification on new reply |
| Slack-Jira integration | Source marker on comments to prevent duplicates |
| WhatsApp Business → CRM | Message queue for delivery guarantee |
| GitHub Webhooks | Webhook purely as notification trigger, not for storage |
| IMAP Email Client | Live read, direct write, push for alerts — thin client model |

**Key architectural insight:** TicketDesk acts as a "Jira comment client" — analogous to an email client reading from IMAP. No local storage, Jira is source of truth.

### Morphological Analysis

**Architecture decisions matrix:**

| Dimension | Choice | Rationale |
|---|---|---|
| 1. Reading Jira comments | Polling at pageload + 30s interval | Consistent with existing ClickUp approach |
| 2. Writing to Jira | Direct API POST (sync) | Honest feedback to user, simplest |
| 3. Notification to requester | Jira webhook → SendGrid email | Real-time, works even when TicketDesk is closed |
| 4. Identity in Jira | Service account + name as text prefix | Simple, universally readable by developers |
| 5. Rich text editor | Simple textarea with basic formatting (bold/italic/links) | Covers 95% of use cases, minimal effort |
| 6. Attachments | Upload via Jira Attachment API + inline in ADF | Full experience from day one |
| 7. UI switch logic | Hard switch + toggle, Jira default on refresh | Clear mental model, consistent with earlier requirement |
| 8. Duplicate prevention | Comment property marker (source: ticketdesk) | Clean, reliable, invisible to developers |
| 9. Error handling | Queue + retry + visual error message | Robust UX despite sync API POST |
| 10. ADF conversion | Asymmetric: send plain text to Jira, receive ADF → render in TicketDesk | Significantly less work, developers can use rich text |

## Idea Organization and Prioritization

### Thematic Organization

**Theme 1: Communication Architecture**
_Focus: How messages flow between TicketDesk and Jira_

- Polling (30s) of Jira comments at pageload — live reading, no local storage
- Direct sync API POST to Jira when sending messages
- Asymmetric ADF: plain text to Jira, render ADF in TicketDesk
- Comment property marker (`source: ticketdesk`) for duplicate prevention
- Service account with `[Name]: message` prefix for requester identification
- One requester per ticket — no multi-user ambiguity

**Theme 2: Notification & Delivery**
_Focus: How stakeholders stay informed_

- Jira webhook triggers SendGrid email when developer replies
- Queue + retry + visual error message on send failures
- SendGrid infrastructure already exists in TicketDesk (lib/sendgrid.ts)
- Email notification works even when TicketDesk is closed (unlike polling)

**Theme 3: UI & User Experience**
_Focus: How the communication window looks and behaves_

- Hard switch to Jira window when Jira link exists on ticket
- Toggle button to switch to ClickUp window (secondary)
- Jira always default on page refresh
- Unread badges on both windows
- Simple textarea with basic formatting (bold/italic/links)
- Inline attachments via Jira Attachment API

**Theme 4: Identity & Visibility**
_Focus: Who sees what_

- Requester appears as service account + name prefix in Jira
- Developer appears with Jira name + profile photo in TicketDesk
- All comments visible (no internal/external filtering)
- Transparent switch — requester doesn't need to know the system changed

### Breakthrough Concepts

- **"IMAP Client" Pattern:** TicketDesk acts as a thin client for Jira comments — no local storage, Jira is source of truth. Consistent with existing ClickUp architecture.
- **Asymmetric ADF Conversion:** Enormous work saved by sending plain text to Jira and only receiving/rendering ADF. Avoids building a full ADF-compatible editor.
- **Webhook as Notification Trigger Only:** Not for storage or sync — purely to trigger SendGrid email. Clean separation of responsibilities.

### Prioritization Results

**Phase 1 — MVP: Basic Communication**
1. Build Jira comment API integration (read + write via service account)
2. Implement comment property marker for duplicate prevention
3. UI switch logic: show Jira window when Jira link exists
4. ADF → HTML renderer for displaying Jira comments in TicketDesk

**Phase 2 — Notifications & Error Handling**
5. Set up Jira webhook endpoint
6. Add SendGrid send function for notification emails
7. Retry queue with visual error message

**Phase 3 — Rich Experience**
8. Basic formatting toolbar (bold/italic/links) in textarea
9. Attachment upload via Jira Attachment API + inline reference in ADF
10. Toggle with unread badges
11. Developer profile photo + name display

### Action Planning

**Phase 1 — Immediate Next Steps (This Sprint)**

| Step | Action | Dependencies |
|---|---|---|
| 1 | Create `lib/jira-comments.ts` with `getIssueComments()` and `postIssueComment()` using existing Jira API connection | Jira API credentials (already available) |
| 2 | Add comment property support: set `source: ticketdesk` on outgoing comments, filter on incoming | Jira comment properties API |
| 3 | Create `JiraTicketComments` component mirroring existing `TicketComments` architecture | Existing ClickUp component as reference |
| 4 | Implement conditional rendering: if ticket has Jira ID → show Jira window, else → show ClickUp window | Jira link field on ticket data |
| 5 | Find/evaluate npm package for ADF → HTML rendering (e.g. `@atlaskit/renderer` or lightweight alternative) | Package research |

**Phase 2 — Next Sprint**

| Step | Action | Dependencies |
|---|---|---|
| 6 | Register Jira webhook for `comment_created` event pointing to TicketDesk API endpoint | Jira admin access |
| 7 | Create `/api/webhooks/jira` endpoint to receive webhook payloads | Next.js API route |
| 8 | Add `sendNotificationEmail()` to existing `lib/sendgrid.ts` | SendGrid API key (already configured) |
| 9 | Implement client-side retry queue with status indicators | Frontend state management |

**Phase 3 — Follow-up Sprint**

| Step | Action | Dependencies |
|---|---|---|
| 10 | Add basic formatting toolbar to comment input | UI component library |
| 11 | Implement Jira Attachment API upload + inline ADF media reference | Jira attachment permissions |
| 12 | Add unread badge counters on Jira/ClickUp toggle | Comment timestamp tracking |
| 13 | Fetch and display developer Jira profile data (name + avatar) | Jira user API |

### Technical Research Required

- Evaluate ADF → HTML rendering packages (lightweight vs @atlaskit)
- Confirm Jira comment properties API supports custom properties via REST API
- Verify Jira webhook registration process and payload format for comment events
- Test service account comment posting with name prefix formatting

## Session Summary and Insights

**Key Achievements:**

- Complete architecture defined for bi-directional Jira comment communication
- 10 technical dimensions systematically evaluated with clear decisions
- 6 analogies analyzed yielding 6 proven patterns to apply
- 35+ problem-space questions identified and resolved
- 3-phase implementation roadmap with concrete action steps
- Existing codebase analyzed: ClickUp integration, SendGrid, and TicketComments component understood

**Breakthrough Moments:**

1. Realizing TicketDesk should remain a thin client (no local comment storage) — consistent with existing architecture
2. The asymmetric ADF insight — send plain text, receive rich — cutting implementation effort dramatically
3. Discovering SendGrid infrastructure already exists, making email notifications a natural extension
4. The webhook-as-trigger-only pattern — elegant separation of notification from data sync

**Session Reflections:**

This brainstorming session transformed a broad question ("how to set up bi-directional Jira communication") into a concrete, phased architecture plan. The combination of Question Storming (defining the problem space), Analogical Thinking (borrowing proven patterns), and Morphological Analysis (systematic option evaluation) provided a natural funnel from divergent exploration to convergent decision-making. Key constraints discovered through the session — particularly the thin-client philosophy and cost avoidance of JSM — shaped the architecture toward an elegant, lightweight solution.
