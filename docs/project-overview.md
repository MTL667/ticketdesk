# Project Overview

---

## Ticketdesk

An internal support ticket management application for organizations using ClickUp as their ticketing backend. Users authenticate via Microsoft Entra ID (Azure AD) and view/manage their support tickets through a modern web interface.

## Purpose

- Provide end-users a clean, fast interface to view their support tickets
- Cache ClickUp ticket data locally for instant search and filtering
- Offer admin tools for user management, email diagnostics, and system monitoring
- Support Dutch, French, and English users

## Key Features

| Feature | Description |
|---------|-------------|
| **Ticket Management** | View, search, and filter support tickets synced from ClickUp |
| **ClickUp Sync** | Background sync keeps local database current (5-min interval) |
| **Azure AD Auth** | Multi-tenant authentication with tenant allowlisting |
| **Trilingual UI** | Dutch, French, and English interface |
| **Release Notes** | Dedicated view for tickets flagged as release notes |
| **Admin Panel** | User management, email activity (SendGrid), system status (Zabbix) |
| **CSV Export** | Admin can export user ticket data as CSV |
| **Email Diagnostics** | SendGrid email activity search, event tracing, suppression management |
| **System Status** | Zabbix-integrated service monitoring dashboard |

## Tech Stack Summary

| Category | Technology |
|----------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| Auth | NextAuth v5 (Azure AD / Microsoft Entra ID) |
| Integrations | ClickUp API, SendGrid API, Zabbix JSON-RPC |
| Deployment | Docker (multi-stage), Easypanel |

## Architecture Type

**Monolith** — Single Next.js application containing both frontend (React) and backend (API routes) in one codebase. External services provide ticket data (ClickUp), email diagnostics (SendGrid), and monitoring (Zabbix).

## Repository Structure

```
Ticketdesk/          Monolith: Next.js full-stack web application
├── app/             Pages (App Router) and API route handlers
├── components/      6 reusable React components
├── lib/             8 utility modules and API wrappers
├── contexts/        React Context (language)
├── types/           TypeScript declarations
├── prisma/          Database schema (5 models)
└── scripts/         Deployment scripts
```

## Related Documentation

- [Architecture](./architecture.md) — Technical architecture and design decisions
- [API Contracts](./api-contracts.md) — Complete API endpoint reference
- [Data Models](./data-models.md) — Database schema documentation
- [Source Tree](./source-tree-analysis.md) — Annotated directory structure
- [Development Guide](./development-guide.md) — Setup and development instructions
- [Deployment Guide](./deployment-guide.md) — Docker and Easypanel deployment
