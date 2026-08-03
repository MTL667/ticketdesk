# Architecture

---

## Executive Summary

Ticketdesk is an internal support ticket management application built with Next.js 15 (App Router). It integrates with ClickUp as the ticket source of truth, uses PostgreSQL as a local cache for fast queries, authenticates users via Azure AD (Microsoft Entra ID), and provides admin tools for user management, email activity tracking (SendGrid), and system monitoring (Zabbix).

## Architecture Pattern

**Layered monolith** with external service integrations:

```
┌─────────────────────────────────────────────────────┐
│                   Client (Browser)                   │
│  React components + Tailwind CSS + LanguageContext   │
└────────────────────────┬────────────────────────────┘
                         │ fetch("/api/...")
┌────────────────────────▼────────────────────────────┐
│              Next.js API Route Handlers              │
│  Authentication (NextAuth) → Admin guard (isAdmin)   │
└──┬─────────────┬──────────────┬────────────────┬────┘
   │             │              │                │
   ▼             ▼              ▼                ▼
┌──────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│Prisma│  │ ClickUp  │  │ SendGrid │  │   Zabbix     │
│(PgSQL)│  │  REST    │  │  REST    │  │  JSON-RPC    │
└──────┘  └──────────┘  └──────────┘  └──────────────┘
```

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | ^15.4.0 |
| UI | React + Tailwind CSS | ^19.0.0 / ^3.4.17 |
| Language | TypeScript (strict) | ^5.7.2 |
| ORM | Prisma | ^6.8.2 |
| Database | PostgreSQL | 15+ |
| Auth | NextAuth v5 (Azure AD) | ^5.0.0-beta.25 |
| Runtime | Node.js | 20 (Alpine) |

## Data Architecture

### Database Models (5)

- **Ticket** — Synced from ClickUp, keyed by ClickUp task ID, filtered by `userEmail`
- **Attachment** — File attachments linked to tickets (cascade delete)
- **SyncLog** — Tracks sync operation history and status
- **Setting** — Key-value store (banner messages, etc.)
- **MonitoredService** — Zabbix-linked services for status dashboard

See [Data Models](./data-models.md) for complete schema.

### Sync Architecture

ClickUp is the source of truth. Background sync:
1. Fetches all tasks from configured ClickUp lists
2. Upserts tickets into PostgreSQL
3. Removes tickets no longer in ClickUp
4. Logs operation in SyncLog

Sync triggers: manual (admin button) or automatic (5-minute interval).

## API Design

23 API route handlers organized by domain:

- **Public**: Auth handlers (NextAuth)
- **User**: Tickets, releases, sync, status, banner
- **Admin**: User management, email activity, services, Zabbix

See [API Contracts](./api-contracts.md) for complete endpoint reference.

## Authentication & Authorization

```
Request → Middleware (middleware.ts)
           │
           ├─ Public path? → Allow
           │
           └─ Check session → No auth? → Redirect /signin
                              │
                              └─ Authenticated → Allow
                                                  │
                              API Route checks:    │
                              ├─ auth() → 401      │
                              └─ isAdmin() → 403   │
```

- **Provider**: Azure AD (Microsoft Entra ID)
- **Tenant restriction**: `ALLOWED_TENANTS` env var
- **Admin check**: `ADMIN_EMAILS` env var (case-insensitive)
- **Session**: JWT-based via NextAuth

## External Integrations

| Service | Module | Protocol | Purpose |
|---------|--------|----------|---------|
| ClickUp | `lib/clickup.ts` | REST API | Ticket source, comments, task data |
| SendGrid | `lib/sendgrid.ts` | REST API | Email activity search, suppression management |
| Zabbix | `lib/zabbix.ts` | JSON-RPC | System/service health monitoring |

All integrations use dedicated wrapper modules with error handling and retry logic.

## Component Overview

6 reusable React components in `components/`:

| Component | Purpose |
|-----------|---------|
| `TicketList` | Ticket listing with search, pagination, status chips |
| `TicketComments` | Comment thread with ClickUp integration |
| `NewTicketClient` | Embedded ClickUp form for ticket creation |
| `ReleaseList` | Release notes listing |
| `SystemStatus` | Monitored services status display |
| `LanguageSelector` | NL/FR/EN language switcher |

## Internationalization

- Three languages: Dutch (default), French, English
- `LanguageContext` provides `t(key)` function
- All keys defined in `lib/translations.ts`
- Language preference stored in `localStorage`

## Deployment

- **Platform**: Easypanel
- **Build**: Multi-stage Docker (deps → builder → runner)
- **Output**: Next.js standalone mode
- **Startup**: `scripts/start.sh` (Prisma migrations + Node server)

See [Deployment Guide](./deployment-guide.md) for details.
