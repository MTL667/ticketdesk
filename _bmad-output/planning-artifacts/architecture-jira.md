---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
lastStep: 8
status: 'complete'
completedAt: '2026-04-27'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/project-context.md'
  - 'docs/index.md'
  - 'docs/architecture.md'
  - 'docs/api-contracts.md'
  - 'docs/data-models.md'
  - 'docs/source-tree-analysis.md'
  - 'docs/component-inventory.md'
  - 'docs/development-guide.md'
  - 'docs/deployment-guide.md'
  - 'docs/project-overview.md'
workflowType: 'architecture'
project_name: 'Ticketdesk'
user_name: 'Kevin'
date: '2026-04-27'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
23 FRs covering 5 capability areas. Architecturally, they decompose into 3 components: (1) a Jira API wrapper module, (2) sync pipeline extension, and (3) conditional UI display. All fit within the existing layered architecture without structural changes.

**Non-Functional Requirements:**
17 NFRs drive 2 key architectural decisions: (1) bulk JQL batching for performance (30-second sync target for ~4000 issues), and (2) error isolation ensuring Jira failures never block ClickUp sync. Security and reliability NFRs are satisfied by following existing patterns.

**Scale & Complexity:**

- Primary domain: Server-side integration + data display
- Complexity level: Low-medium (extends existing patterns, no new architectural layers)
- Estimated new architectural components: 3 (Jira wrapper, sync extension, UI section)

### Technical Constraints & Dependencies

- Existing Ticket model already has `jiraStatus`, `jiraAssignee`, `jiraUrl` fields — schema extension is additive
- Sync pipeline in `lib/sync.ts` is the single integration point
- `sgFetch()` retry pattern in `lib/sendgrid.ts` is the reference for Jira API calls
- Next.js 15 (App Router) — no version change permitted
- Prisma 6.8 — standard `db push` workflow for schema changes
- Docker standalone build — no changes to build pipeline

### Cross-Cutting Concerns Identified

- **Error Isolation:** Jira API failures must not propagate to ClickUp sync — requires try/catch boundary at the sync pipeline level
- **Optional Configuration:** `isJiraConfigured()` gate must be checked before any Jira operation — same pattern as SendGrid
- **Translation Keys:** All new UI text requires NL/FR/EN keys in `lib/translations.ts`
- **Logging:** Jira-specific log prefix `[jira]` for sync observability

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application (Next.js 15 + React 19 + TypeScript + Prisma + PostgreSQL)

### Starter Template: Not Applicable (Brownfield)

Brownfield enhancement to an existing, production-deployed application. Technology stack fully established:

| Decision | Already Established |
|----------|-------------------|
| Language & Runtime | TypeScript 5.7 (strict), Node.js 20 |
| Framework | Next.js 15.4 (App Router, standalone output) |
| UI | React 19 + Tailwind CSS 3.4 |
| ORM / Database | Prisma 6.8 / PostgreSQL 15+ |
| Authentication | NextAuth v5 (Azure AD) |
| Styling | Tailwind utility-first (no CSS modules) |
| Build | Docker multi-stage (node:20-alpine) |
| Deployment | Easypanel |
| Testing | No formal test framework configured |
| Linting | ESLint 9 (next/core-web-vitals) |

No starter template selection needed. The Jira integration extends the existing codebase using established patterns.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Jira sync pipeline insertion point
- Bulk JQL batching strategy
- Schema extension approach

**Important Decisions (Shape Architecture):**
- Error isolation between Jira and ClickUp sync
- Jira URL parsing strategy

**Deferred Decisions (Post-MVP):**
- Jira webhook architecture (Phase 3)
- Unified timeline data model (Phase 3)

### Data Architecture

**Schema Extension Strategy:**
Additive fields on existing Ticket model. No new tables needed for MVP.

| Action | Field | Type | Purpose |
|--------|-------|------|---------|
| Add | `jiraStatusCategory` | String? | Status category (to-do/in-progress/done) for visual indicators |
| Add | `jiraLastUpdated` | DateTime? | Staleness tracking — how old is the Jira data |
| Add | `jiraPriority` | String? | Priority level from Jira (if not already present) |
| Keep | `jiraStatus` | String? | Already exists — will be overwritten with live data |
| Keep | `jiraAssignee` | String? | Already exists — will be overwritten with live data |
| Keep | `jiraUrl` | String? | Already exists — source for Jira issue key extraction |

**Migration:** `prisma db push` (no formal migrations in this project)

### Authentication & Security

All decisions inherited from existing architecture:
- Azure AD via NextAuth v5 (no changes)
- Jira API Token stored in server-side env vars only (`JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`)
- Read-only Jira API token scope
- No new auth flows or middleware changes required

### API & Communication Patterns

**Sync Pipeline Insertion Point:**

```
syncTicketsFromClickUp()
  1. Fetch tasks from ClickUp lists
  2. Upsert tickets to DB
  3. ← JIRA FETCH HERE (after upsert, before cleanup)
  4. Remove deleted tickets
  5. Log to SyncLog
```

Jira fetch after upsert ensures fresh `jiraUrl` data is available for parsing. Entire Jira step wrapped in try/catch — steps 4-5 always execute.

**Bulk JQL Batching Configuration:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Batch size | 100 keys per JQL query | Jira URL length limits |
| Concurrency | 5 parallel requests | Burst rate limit safe |
| Timeout | 30s per request | NFR requirement |
| Max retries | 3 with exponential backoff | Consistent with `sgFetch()` pattern |
| Error granularity | Per-batch isolation | One failed batch does not block others |

**Jira URL Parsing:**
Regex extraction of issue key from `jiraUrl` field: `https://org.atlassian.net/browse/PROJ-123` → `PROJ-123`. Pattern: `/\/browse\/([A-Z][A-Z0-9]+-\d+)/`

### Frontend Architecture

No new architectural patterns. Jira data is served from local database as part of the existing Ticket object. Ticket detail page conditionally renders a Jira section when `jiraUrl` is truthy. Uses existing Tailwind card patterns and `useLanguage()` for translations.

### Infrastructure & Deployment

No changes to infrastructure or deployment. Additive env vars (`JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`) configured in Easypanel build args. Missing vars = Jira integration disabled.

### Decision Impact Analysis

**Implementation Sequence:**
1. Schema extension (`prisma/schema.prisma` + `db push`)
2. `lib/jira.ts` — API wrapper with `jiraFetch()` and `isJiraConfigured()`
3. `lib/sync.ts` — inject Jira fetch after ClickUp upsert
4. Ticket detail page — conditional Jira section
5. `lib/translations.ts` — NL/FR/EN keys for Jira UI

**Cross-Component Dependencies:**
- Step 2 depends on step 1 (Prisma types for Jira fields)
- Step 3 depends on step 2 (`lib/jira.ts` functions)
- Step 4 depends on step 1 (Jira fields available on Ticket type)
- Step 5 is independent (can be done at any point)

## Implementation Patterns & Consistency Rules

### Existing Patterns (from project-context.md)

All 37 existing rules from `project-context.md` apply unchanged. The Jira integration follows established patterns exactly. Key references:

- API wrapper modules: `lib/clickup.ts`, `lib/sendgrid.ts`, `lib/zabbix.ts`
- Retry wrapper: `sgFetch()` in `lib/sendgrid.ts`
- Custom error classes: `ClickUpNotFoundError`, `SendGridError`
- API route guards: `auth()` → 401, `isAdmin()` → 403
- Error response: `NextResponse.json({ message }, { status })`

### Jira-Specific Patterns

**New Module: `lib/jira.ts`**

Follow the same structure as `lib/sendgrid.ts`:

```typescript
async function jiraFetch(url: string, init?: RequestInit): Promise<Response>
class JiraError extends Error { status: number; }
export function isJiraConfigured(): boolean
export async function fetchJiraIssuesBulk(keys: string[]): Promise<Map<string, JiraIssue>>
```

**Naming Conventions:**

| Element | Convention | Example |
|---------|-----------|---------|
| Prisma fields | camelCase, `jira` prefix | `jiraStatusCategory`, `jiraLastUpdated` |
| Lib functions | camelCase, descriptive | `fetchJiraIssuesBulk`, `parseJiraKeyFromUrl` |
| Error class | PascalCase + Error suffix | `JiraError` |
| Log prefix | `[jira]` lowercase | `console.log("[jira] Fetched 40/42 issues")` |
| Env vars | SCREAMING_SNAKE, `JIRA_` prefix | `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` |
| Translation keys | dot-notation, `jira.` prefix | `jira.status`, `jira.assignee`, `jira.priority` |

**Error Isolation — Three Layers:**

```
jiraFetch() → retry on 5xx/429/timeout (max 3)
  └→ fetchJiraIssuesBulk() → per-batch try/catch, log failures, continue
    └→ syncTicketsFromClickUp() → outer try/catch around entire Jira step
```

**Anti-Patterns:**
- Never call Jira API directly with `fetch()` — always use `jiraFetch()`
- Never create `new PrismaClient()` — always import from `@/lib/prisma`
- Never expose Jira API tokens in client-side code
- Never block ClickUp sync on Jira errors
- Never fetch Jira issues individually — always bulk JQL

## Project Structure & Boundaries

### Changes to Existing Structure

```
Ticketdesk/
├── lib/
│   ├── jira.ts                    # NEW: Jira Cloud REST API wrapper
│   ├── sync.ts                    # MODIFY: add Jira fetch step after ClickUp upsert
│   └── translations.ts           # MODIFY: add jira.* translation keys (NL/FR/EN)
├── prisma/
│   └── schema.prisma             # MODIFY: add jiraStatusCategory, jiraLastUpdated, jiraPriority
├── app/
│   └── tickets/
│       └── [id]/
│           └── page.tsx          # MODIFY: add conditional Jira section
└── types/
    └── index.ts                  # MODIFY: add JiraIssue type
```

5 files modified, 1 new file. No new directories, API routes, or components needed for MVP.

### FR → File Mapping

| FR Category | Files |
|-------------|-------|
| Jira Data Visibility (FR1–FR6) | `app/tickets/[id]/page.tsx`, `lib/translations.ts` |
| Jira Data Synchronization (FR7–FR11) | `lib/jira.ts`, `lib/sync.ts` |
| Jira Connection Management (FR12–FR15) | `lib/jira.ts` (env vars + logging) |
| Error Handling & Resilience (FR16–FR19) | `lib/jira.ts` (`jiraFetch()`) |
| Data Storage (FR20–FR23) | `prisma/schema.prisma`, `types/index.ts` |

### Architectural Boundaries

**Data Flow:**

```
ClickUp API → lib/sync.ts → DB (upsert tickets)
                    ↓
              lib/jira.ts → Jira Cloud API (bulk JQL)
                    ↓
              DB (update Jira fields on tickets)
                    ↓
app/api/tickets/[id]/route.ts → Client (ticket detail with Jira data)
```

**Integration Boundary:** `lib/jira.ts` is the sole interface to Jira Cloud API. No other file may call the Jira API directly.

**Error Boundary:** The entire Jira step in `lib/sync.ts` is wrapped in try/catch. If Jira fails, the sync continues with ClickUp data only.

## Architecture Validation Results

### Coherence Validation: PASS

- All technology choices inherited from production codebase — no conflicts possible
- Jira wrapper (`lib/jira.ts`) follows proven `lib/sendgrid.ts` pattern exactly
- Schema extension is additive (nullable fields) — zero breaking changes
- 3-layer error isolation prevents Jira from destabilizing existing sync

### Requirements Coverage: 100%

All 23 FRs and 17 NFRs have architectural support:

| Category | FRs | NFRs | Status |
|----------|-----|------|--------|
| Visibility | FR1–FR6 | — | Covered (ticket detail page) |
| Sync | FR7–FR11 | Performance (4) | Covered (bulk JQL + sync pipeline) |
| Config | FR12–FR15 | — | Covered (env vars + `isJiraConfigured()`) |
| Errors | FR16–FR19 | Integration (5), Reliability (4) | Covered (3-layer isolation) |
| Storage | FR20–FR23 | — | Covered (Prisma schema extension) |
| Security | — | Security (4) | Covered (server-side env vars, HTTPS, Azure AD) |

### Implementation Readiness: HIGH

- All critical decisions documented with versions and rationale
- 1 new file, 5 modifications — minimal surface area
- Follows established codebase patterns — low risk of implementation conflicts
- Clear implementation sequence defined

### Gap Analysis

| Priority | Gap | Mitigation |
|----------|-----|-----------|
| Low | No formal test strategy | Manual testing for MVP; add tests in Phase 2 |
| Low | Jira Search API pagination | `fetchJiraIssuesBulk()` must handle `startAt`/`maxResults` pagination per JQL batch if results exceed page size |
| Info | `jiraPriority` field may already exist in schema | Verify before migration; `db push` handles no-op gracefully |

### API Reference

Jira Cloud REST API v3: https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/#about
- Authentication: Basic Auth (email + API token) for ad-hoc integrations
- Pagination: `startAt`, `maxResults`, `total` fields in responses
- Timestamps: ISO 8601 format (matches Prisma DateTime)

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION
**Confidence Level:** High

**Implementation Priority:**
1. `prisma/schema.prisma` — add fields + `db push`
2. `lib/jira.ts` — new API wrapper with `jiraFetch()`, bulk JQL, URL parsing
3. `lib/sync.ts` — inject Jira step after ClickUp upsert
4. `app/tickets/[id]/page.tsx` — conditional Jira section
5. `lib/translations.ts` — NL/FR/EN keys
