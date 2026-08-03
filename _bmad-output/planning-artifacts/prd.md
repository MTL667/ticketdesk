---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
releaseMode: phased
classification:
  projectType: 'web_app'
  domain: 'general'
  complexity: 'medium'
  projectContext: 'brownfield'
  feature: 'Jira Cloud API integration — fetch live Jira issue data during ClickUp sync for tickets with jiraUrl'
inputDocuments:
  - '_bmad-output/project-context.md'
  - 'docs/index.md'
  - 'docs/project-overview.md'
  - 'docs/architecture.md'
  - 'docs/api-contracts.md'
  - 'docs/data-models.md'
  - 'docs/source-tree-analysis.md'
  - 'docs/component-inventory.md'
  - 'docs/development-guide.md'
  - 'docs/deployment-guide.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectContext: 1
  projectDocs: 9
projectType: 'brownfield'
---

# Product Requirements Document — Ticketdesk Jira Integration

**Author:** Kevin
**Date:** 2026-04-27

## Executive Summary

Ticketdesk syncs support tickets from ClickUp and presents them via a Next.js web app authenticated with Azure AD. Tickets escalated to development are tracked in Jira Cloud, but users currently see only a static Jira status imported via ClickUp custom fields — often stale or incomplete.

This enhancement fetches live Jira issue data directly from the Jira Cloud REST API during each ClickUp sync cycle. Tickets with a `jiraUrl` field gain real-time visibility into development status, assignee, and priority.

### What Makes This Special

Users currently see one dimension — the ClickUp service desk status. With Jira integration, they see the full journey: from intake ("Aangemeld") through development ("In Progress", "In Review", "Testing") to delivery ("Done"). This eliminates "where is my ticket?" inquiries and gives users confidence their request is actively being worked on — without needing to know about ClickUp or Jira internals.

## Project Classification

- **Type:** Web application (brownfield enhancement)
- **Domain:** IT Service Management / Internal tooling
- **Complexity:** Medium — Jira Cloud REST API integration, conditional sync logic, data mapping between two external systems
- **Context:** Brownfield — extends existing ClickUp sync in `lib/sync.ts` with parallel Jira data fetching

## Success Criteria

### User Success

- Jira-linked tickets display live Jira status, assignee, and priority on the ticket detail page
- Jira data is at most 5 minutes old (synced with the existing ClickUp cycle)
- ClickUp status (service desk) and Jira status (development) appear side by side
- Tickets without a Jira link display normally with no visual clutter

### Business Success

- Reduction in "where is my ticket?" support inquiries — self-service visibility
- ~80% of tickets have Jira links and benefit from this integration
- Zero operational overhead: Jira sync piggybacks on the existing ClickUp cycle

### Technical Success

- Fully optional: absent `JIRA_*` env vars → application behaves exactly as before
- Retry/backoff pattern consistent with existing SendGrid integration (`sgFetch`)
- Failed Jira fetch never blocks ClickUp sync
- Jira data stored locally in PostgreSQL — no per-request API calls

### Measurable Outcomes

- 100% of Jira-linked tickets show live Jira status after sync
- Jira data staleness ≤ 5 minutes
- Sync duration increases by no more than 30%
- Zero downtime or degradation when Jira is unreachable

## User Journeys

### Journey 1: Sarah — "Where does my ticket really stand?"

**Persona:** Sarah, 34, finance department. Submitted a bug report two weeks ago. ClickUp status has said "In behandeling" for days.

**Opening Scene:** Sarah opens Ticketdesk and navigates to her ticket. Next to the familiar ClickUp status, she now sees **Jira: In Review** and assignee "Pieter D."

**Rising Action:** The Jira priority ("High") confirms her bug is actively being reviewed by a developer — not sitting idle.

**Climax:** Next day, Jira status changes to "Testing". Sarah knows her fix is almost ready without sending a single email.

**Resolution:** Sarah's trust in the process grows. The system speaks for itself.

**Capabilities revealed:** Jira status display, assignee display, priority display, auto-sync during ClickUp cycle

### Journey 2: Kevin — "Is the Jira integration healthy?"

**Persona:** Kevin, IT administrator and Ticketdesk admin.

**Opening Scene:** Kevin configures `JIRA_*` environment variables in Easypanel and triggers a deploy and manual sync.

**Rising Action:** He opens a Jira-linked ticket — status, assignee, priority displayed correctly. A non-Jira ticket shows no Jira section.

**Climax:** Server logs show `[jira] Fetched 47/52 Jira issues (5 skipped - no jiraUrl)` and a retry: `[jira] 503 transient error, retry 1/3`.

**Resolution:** The integration is optional, graceful on errors, and observable in logs.

**Capabilities revealed:** Optional env var config, sync logging, retry logic, graceful error handling

### Journey 3: Marc — "I just have a hardware request"

**Persona:** Marc, 28, operations staff. Submitted a ticket for a new monitor — purely a ClickUp request, no Jira involvement.

**Opening Scene:** Marc sees ClickUp status "Bestelling geplaatst" and expected delivery date. No Jira section, no clutter.

**Resolution:** Marc's experience is unchanged. The Jira feature is invisible for tickets that don't need it.

**Capabilities revealed:** Conditional display (Jira section only when `jiraUrl` exists), backward compatibility

### Journey Requirements Summary

| Capability | Revealed by |
|------------|-------------|
| Jira status, assignee, priority display | Sarah |
| Auto-sync Jira data during ClickUp sync | Sarah, Kevin |
| Optional configuration via env vars | Kevin |
| Retry/backoff for Jira API errors | Kevin |
| Sync logging with Jira-specific output | Kevin |
| Conditional UI: Jira section only when `jiraUrl` exists | Marc |
| Zero impact on non-Jira tickets | Marc |
| Graceful degradation when Jira is unreachable | Kevin |

## Technical Architecture

### Authentication

- Jira Cloud API Token (Basic Auth) — email + API token via environment variables (`JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`)
- Follows the same optional-configuration pattern as SendGrid (`isJiraConfigured()`)

### Sync Strategy — Bulk JQL Search

Critical for ~4000 issues:
- Use Jira Search API (`/rest/api/3/search`) with JQL: `key IN (KEY-1, KEY-2, ...)` batched in groups of 100 keys
- ~4000 Jira issues = ~40 API calls instead of 4000
- Parallelize batches with concurrency limit (5 concurrent requests)
- Parse Jira issue key from `jiraUrl`: extract `PROJ-123` from `https://org.atlassian.net/browse/PROJ-123`

### Data Mapping

- Map Jira fields to extended Prisma Ticket model fields
- MVP: status name, status category (to-do/in-progress/done), assignee display name, priority name, last updated timestamp
- Growth: transition history, sprint name, labels, comments

## Project Scoping & Phased Development

### MVP Strategy

**Approach:** Problem-solving MVP — deliver core visibility that eliminates "where is my ticket?" questions.

**Resource Requirements:** Single developer. Follows established patterns (SendGrid integration). No new infrastructure.

### Phase 1 — MVP

**Must-Have Capabilities:**
- `lib/jira.ts` — Jira Cloud REST API wrapper with retry/backoff and `isJiraConfigured()`
- Bulk JQL search via `/rest/api/3/search` in batches of 100 keys
- Parse Jira issue key from `jiraUrl` field
- Extend Prisma `Ticket` model: `jiraStatusCategory`, `jiraLastUpdated` (+ existing `jiraStatus`, `jiraAssignee`, `jiraPriority`)
- Integrate Jira fetch into `syncTicketsFromClickUp()` in `lib/sync.ts`
- Ticket detail page: conditional Jira section when `jiraUrl` exists
- Environment variables: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`

### Phase 2 — Enhanced Visibility

- Jira transition history timeline (status changes with timestamps)
- Sprint information display
- Priority mapping to visual indicators
- Direct "Open in Jira" link on ticket detail page
- Admin panel: Jira sync health overview

### Phase 3 — Deep Integration

- Jira comments alongside ClickUp comments
- Unified chronological timeline (ClickUp + Jira events merged)
- Jira webhooks for near-real-time updates
- Admin Jira dashboard with aggregated metrics

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Jira API rate limits (~4000 issues) | Bulk JQL search: 40 calls instead of 4000 |
| Jira downtime blocking sync | Non-blocking: ClickUp sync continues; stale Jira data preserved |
| `jiraUrl` format variations | Regex parser with fallback; unparseable URLs logged and skipped |
| Fewer resources than planned | Even just `jiraStatus` display is valuable; single developer sufficient |

## Functional Requirements

### Jira Data Visibility

- FR1: Users can view the current Jira status when a Jira link exists
- FR2: Users can view the Jira assignee on their ticket
- FR3: Users can view the Jira priority level on their ticket
- FR4: Users can view the Jira status category (to-do / in-progress / done)
- FR5: Users see no Jira-related information on tickets without a Jira link
- FR6: Users can view ClickUp status and Jira status side by side

### Jira Data Synchronization

- FR7: System fetches Jira issue data for all Jira-linked tickets during each ClickUp sync cycle
- FR8: System extracts the Jira issue key from the ticket's `jiraUrl` field
- FR9: System fetches Jira data in bulk batches to optimize API usage for ~4000 issues
- FR10: System continues ClickUp sync successfully when Jira data fetch fails
- FR11: System preserves previously fetched Jira data when a subsequent fetch fails

### Jira Connection Management

- FR12: Admins can configure Jira Cloud credentials via environment variables
- FR13: System operates fully without Jira integration when env vars are absent
- FR14: System detects whether Jira is configured and skips Jira operations when not
- FR15: Admins can monitor Jira sync outcomes via server logs

### Error Handling & Resilience

- FR16: System retries failed Jira API calls with exponential backoff
- FR17: System respects Jira rate-limit responses and pauses accordingly
- FR18: System logs Jira-specific sync warnings and errors
- FR19: System handles Jira API timeouts without blocking the sync pipeline

### Data Storage

- FR20: System stores Jira status name and status category per ticket
- FR21: System stores Jira assignee display name per ticket
- FR22: System stores Jira priority name per ticket
- FR23: System stores a Jira data last-updated timestamp per ticket

## Non-Functional Requirements

### Performance

- Bulk Jira sync for ~4000 issues completes within 30 seconds
- Total sync duration (ClickUp + Jira) increases by no more than 30% over baseline
- Ticket detail page with Jira data loads within 2 seconds (served from local database)
- Jira data staleness ≤ 5 minutes under normal operation

### Security

- Jira API credentials stored exclusively in server-side environment variables, never exposed to client
- All Jira API communication over HTTPS (TLS 1.2+)
- Jira data access follows existing Azure AD authentication
- Jira API token scoped to read-only (no write operations)

### Integration

- Uses Jira Cloud REST API v3 (`/rest/api/3/`)
- Failed API calls retried up to 3 times with exponential backoff
- HTTP 429 responses handled by respecting `Retry-After` header
- API timeouts capped at 30 seconds per request
- Unparseable `jiraUrl` values logged and skipped without failing the batch

### Reliability

- Jira API failure never blocks or delays ClickUp sync
- Previously fetched Jira data preserved on subsequent sync failure — users see last known state
- Full functionality maintained when Jira env vars are not configured
- Individual batch failures do not affect other batches in the same sync run
