# Ticketdesk — Project Documentation Index

---

## Project Overview

- **Type:** Monolith (single Next.js full-stack application)
- **Primary Language:** TypeScript
- **Architecture:** Layered monolith with external service integrations

## Quick Reference

- **Framework:** Next.js 15.4 (App Router) + React 19
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth v5 with Azure AD (Microsoft Entra ID)
- **Styling:** Tailwind CSS 3.4
- **Integrations:** ClickUp, SendGrid, Zabbix
- **Deployment:** Docker (multi-stage) on Easypanel
- **Entry Point:** `app/layout.tsx` → `app/page.tsx`

## Generated Documentation

- [Project Overview](./project-overview.md) — Purpose, features, and tech stack summary
- [Architecture](./architecture.md) — Technical architecture, data flow, and design decisions
- [API Contracts](./api-contracts.md) — Complete API endpoint reference (23 routes)
- [Data Models](./data-models.md) — Database schema (5 models, PostgreSQL/Prisma)
- [Source Tree Analysis](./source-tree-analysis.md) — Annotated directory structure
- [Component Inventory](./component-inventory.md) — React components catalog (6 components)
- [Development Guide](./development-guide.md) — Setup, scripts, and development workflow
- [Deployment Guide](./deployment-guide.md) — Docker build, Easypanel, and troubleshooting

## Existing Documentation

- [README](../README.md) — Original project README with setup instructions and feature overview

## Getting Started

1. Clone the repository and run `npm install`
2. Copy `.env.example` to `.env.local` and configure all required variables
3. Run `npx prisma generate && npx prisma db push`
4. Start dev server with `npm run dev`
5. Sign in with Azure AD and trigger a ClickUp sync

For detailed instructions, see the [Development Guide](./development-guide.md).

---

_Generated: 2026-04-27 | Scan level: quick | Mode: initial_scan_
