---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
completedAt: '2026-04-27'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/project-context.md'
---

# Ticketdesk Jira Integration - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Ticketdesk Jira Cloud integration, decomposing the requirements from the PRD and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can view the current Jira status when a Jira link exists
FR2: Users can view the Jira assignee on their ticket
FR3: Users can view the Jira priority level on their ticket
FR4: Users can view the Jira status category (to-do / in-progress / done)
FR5: Users see no Jira-related information on tickets without a Jira link
FR6: Users can view ClickUp status and Jira status side by side
FR7: System fetches Jira issue data for all Jira-linked tickets during each ClickUp sync cycle
FR8: System extracts the Jira issue key from the ticket's jiraUrl field
FR9: System fetches Jira data in bulk batches to optimize API usage for ~4000 issues
FR10: System continues ClickUp sync successfully when Jira data fetch fails
FR11: System preserves previously fetched Jira data when a subsequent fetch fails
FR12: Admins can configure Jira Cloud credentials via environment variables
FR13: System operates fully without Jira integration when env vars are absent
FR14: System detects whether Jira is configured and skips Jira operations when not
FR15: Admins can monitor Jira sync outcomes via server logs
FR16: System retries failed Jira API calls with exponential backoff
FR17: System respects Jira rate-limit responses and pauses accordingly
FR18: System logs Jira-specific sync warnings and errors
FR19: System handles Jira API timeouts without blocking the sync pipeline
FR20: System stores Jira status name and status category per ticket
FR21: System stores Jira assignee display name per ticket
FR22: System stores Jira priority name per ticket
FR23: System stores a Jira data last-updated timestamp per ticket

### NonFunctional Requirements

NFR1: Bulk Jira sync for ~4000 issues completes within 30 seconds
NFR2: Total sync duration (ClickUp + Jira) increases by no more than 30% over baseline
NFR3: Ticket detail page with Jira data loads within 2 seconds (served from local database)
NFR4: Jira data staleness ≤ 5 minutes under normal operation
NFR5: Jira API credentials stored exclusively in server-side environment variables, never exposed to client
NFR6: All Jira API communication over HTTPS (TLS 1.2+)
NFR7: Jira data access follows existing Azure AD authentication
NFR8: Jira API token scoped to read-only (no write operations)
NFR9: Uses Jira Cloud REST API v3 (`/rest/api/3/`)
NFR10: Failed API calls retried up to 3 times with exponential backoff
NFR11: HTTP 429 responses handled by respecting `Retry-After` header
NFR12: API timeouts capped at 30 seconds per request
NFR13: Unparseable `jiraUrl` values logged and skipped without failing the batch
NFR14: Jira API failure never blocks or delays ClickUp sync
NFR15: Previously fetched Jira data preserved on subsequent sync failure
NFR16: Full functionality maintained when Jira env vars are not configured
NFR17: Individual batch failures do not affect other batches in the same sync run

### Additional Requirements

From Architecture document:
- Brownfield project: no starter template, extends existing codebase
- Schema extension via `prisma db push` (additive nullable fields on Ticket model)
- New `lib/jira.ts` module following `lib/sendgrid.ts` structure (jiraFetch, JiraError, isJiraConfigured)
- Sync insertion point: after ClickUp upsert, before cleanup in `syncTicketsFromClickUp()`
- Bulk JQL batching: 100 keys per query, 5 concurrent requests, 30s timeout
- 3-layer error isolation: request → batch → pipeline
- Handle Jira Search API pagination (`startAt`/`maxResults` per batch)
- Jira URL parsing regex: `/\/browse\/([A-Z][A-Z0-9]+-\d+)/`
- Translation keys (NL/FR/EN) for all new UI text in `lib/translations.ts`
- `[jira]` log prefix for all Jira-related console output

### UX Design Requirements

No UX Design document. Brownfield enhancement uses existing Tailwind card patterns and ticket detail layout.

### FR Coverage Map

FR1:  Epic 2 - View Jira status on ticket
FR2:  Epic 2 - View Jira assignee on ticket
FR3:  Epic 2 - View Jira priority on ticket
FR4:  Epic 2 - View Jira status category
FR5:  Epic 2 - No Jira info on non-Jira tickets
FR6:  Epic 2 - ClickUp + Jira side by side
FR7:  Epic 1 - Fetch Jira data during sync
FR8:  Epic 1 - Extract Jira key from jiraUrl
FR9:  Epic 1 - Bulk JQL batching for ~4000 issues
FR10: Epic 1 - Continue sync on Jira failure
FR11: Epic 1 - Preserve stale Jira data on failure
FR12: Epic 1 - Configure Jira via env vars
FR13: Epic 1 - Operate without Jira when unconfigured
FR14: Epic 1 - Detect Jira configuration status
FR15: Epic 1 - Monitor Jira sync via logs
FR16: Epic 1 - Retry with exponential backoff
FR17: Epic 1 - Respect rate-limit responses
FR18: Epic 1 - Log Jira warnings and errors
FR19: Epic 1 - Handle timeouts non-blocking
FR20: Epic 1 - Store Jira status + category
FR21: Epic 1 - Store Jira assignee
FR22: Epic 1 - Store Jira priority
FR23: Epic 1 - Store Jira last-updated timestamp

## Epic List

### Epic 1: Jira Integration & Sync
Admins can configure Jira Cloud credentials and the system automatically fetches live Jira data (status, assignee, priority) during each ClickUp sync cycle using bulk JQL search. Errors are handled gracefully with retry logic. Without configuration, the system works exactly as before.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23

### Epic 2: Jira Status Display on Tickets
Users can see live Jira status, assignee, priority, and status category alongside ClickUp status on their ticket detail page. Tickets without a Jira link display normally with no visual changes.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6

## Epic 1: Jira Integration & Sync

Admins can configure Jira Cloud credentials and the system automatically fetches live Jira data (status, assignee, priority) during each ClickUp sync cycle using bulk JQL search. Errors are handled gracefully with retry logic. Without configuration, the system works exactly as before.

### Story 1.1: Extend Ticket Schema with Jira Fields

As an **admin**,
I want the database to support storing Jira issue data per ticket,
So that synced Jira data persists locally for fast access.

**Acceptance Criteria:**

**Given** the Prisma schema is updated
**When** `prisma db push` runs
**Then** the Ticket model has `jiraStatusCategory` (String?), `jiraLastUpdated` (DateTime?), and `jiraPriority` (String?) fields
**And** existing `jiraStatus`, `jiraAssignee`, `jiraUrl` fields remain unchanged
**And** all existing data is preserved (additive migration only)

### Story 1.2: Create Jira Cloud API Wrapper

As an **admin**,
I want a Jira API module that connects to Jira Cloud with retry logic,
So that the system can reliably fetch Jira issue data.

**Acceptance Criteria:**

**Given** `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` env vars are set
**When** `isJiraConfigured()` is called
**Then** it returns `true`

**Given** Jira env vars are NOT set
**When** `isJiraConfigured()` is called
**Then** it returns `false`

**Given** a valid Jira API endpoint
**When** `jiraFetch()` is called
**Then** it sends a Basic Auth request over HTTPS to the Jira Cloud REST API v3

**Given** a Jira API call returns 5xx
**When** `jiraFetch()` handles the response
**Then** it retries up to 3 times with exponential backoff and logs `[jira]` prefixed warnings

**Given** a Jira API call returns 429
**When** `jiraFetch()` handles the response
**Then** it respects the `Retry-After` header before retrying

**Given** a Jira API call times out
**When** 30 seconds have elapsed
**Then** the request is aborted and retried (if retries remain)

**Given** a `jiraUrl` like `https://org.atlassian.net/browse/PROJ-123`
**When** `parseJiraKeyFromUrl()` is called
**Then** it returns `PROJ-123`

**Given** an unparseable `jiraUrl`
**When** `parseJiraKeyFromUrl()` is called
**Then** it returns `null` and logs the unparseable URL

### Story 1.3: Implement Bulk Jira Data Fetching

As an **admin**,
I want the system to fetch Jira data for thousands of issues efficiently,
So that sync completes within performance targets.

**Acceptance Criteria:**

**Given** a list of Jira issue keys extracted from tickets
**When** `fetchJiraIssuesBulk()` is called
**Then** it queries Jira Search API (`/rest/api/3/search`) with JQL `key IN (...)` in batches of 100 keys

**Given** ~4000 Jira-linked tickets
**When** bulk fetch runs
**Then** it executes ~40 API calls with max 5 concurrent requests
**And** completes within 30 seconds

**Given** a JQL batch returns paginated results (`startAt`/`maxResults`)
**When** more pages exist
**Then** it fetches all pages for that batch

**Given** a single batch fails after retries
**When** other batches are pending
**Then** the failed batch is logged and skipped, other batches continue

**Given** fetched Jira issues
**When** data is mapped
**Then** `status.name`, `status.statusCategory.name`, `fields.assignee.displayName`, `fields.priority.name`, and `fields.updated` are extracted per issue

### Story 1.4: Integrate Jira Fetch into Sync Pipeline

As an **admin**,
I want Jira data to be fetched automatically during each ClickUp sync,
So that Jira information stays fresh without manual intervention.

**Acceptance Criteria:**

**Given** Jira is configured and ClickUp sync completes upsert
**When** the sync pipeline reaches the Jira step
**Then** it extracts `jiraUrl` from all upserted tickets, parses Jira keys, and calls `fetchJiraIssuesBulk()`

**Given** Jira data is fetched successfully
**When** the sync pipeline updates tickets
**Then** `jiraStatus`, `jiraAssignee`, `jiraPriority`, `jiraStatusCategory`, and `jiraLastUpdated` are updated in the database

**Given** Jira is NOT configured (`isJiraConfigured()` returns false)
**When** sync runs
**Then** the Jira step is skipped entirely with no errors or log noise

**Given** the Jira fetch step fails completely
**When** the sync pipeline continues
**Then** ClickUp sync cleanup and SyncLog continue normally
**And** previously stored Jira data is preserved (not cleared)
**And** a `[jira]` warning is logged

**Given** a successful Jira sync
**When** the step completes
**Then** a log line like `[jira] Fetched 3800/4000 issues (200 skipped - no jiraUrl)` is output

## Epic 2: Jira Status Display on Tickets

Users can see live Jira status, assignee, priority, and status category alongside ClickUp status on their ticket detail page. Tickets without a Jira link display normally with no visual changes.

### Story 2.1: Display Jira Data on Ticket Detail Page

As a **user**,
I want to see the Jira development status, assignee, and priority on my ticket,
So that I can track the progress of my request without contacting support.

**Acceptance Criteria:**

**Given** a ticket with a `jiraUrl` and synced Jira data
**When** the user views the ticket detail page
**Then** a Jira section displays: Jira status, status category (with color indicator), assignee name, and priority
**And** the Jira section appears alongside the existing ClickUp status

**Given** a ticket with a `jiraUrl` but Jira data is not yet synced (fields are null)
**When** the user views the ticket detail page
**Then** the Jira section is not displayed (no empty/broken section)

**Given** a ticket without a `jiraUrl`
**When** the user views the ticket detail page
**Then** no Jira section is visible and the page looks identical to before

**Given** the Jira section is displayed
**When** the page loads
**Then** it loads within 2 seconds (data served from local database)

**Given** new Jira UI text
**When** the user switches language
**Then** all Jira labels are translated (NL/FR/EN) via `lib/translations.ts`
