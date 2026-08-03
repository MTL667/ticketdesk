# Development Guide

---

## Prerequisites

- **Node.js** 20+ (matches Docker runtime: node:20-alpine)
- **PostgreSQL** database (local Docker or Easypanel)
- **ClickUp** account with API token
- **Azure AD** application registered in Microsoft Entra ID
- **SendGrid** account with API key (for email activity features)
- **Zabbix** server (optional, for system monitoring)

## Installation

```bash
git clone <repository-url>
cd Ticketdesk
npm install
```

`npm install` triggers `postinstall` which runs `prisma generate`.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in all required values:

```bash
cp .env.example .env.local
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLICKUP_API_TOKEN` | ClickUp API token |
| `CLICKUP_LIST_IDS` | Comma-separated ClickUp List IDs |
| `AZURE_AD_CLIENT_ID` | Azure AD application client ID |
| `AZURE_AD_CLIENT_SECRET` | Azure AD application secret |
| `AZURE_AD_TENANT_ID` | Azure AD tenant ID or `common` |
| `ALLOWED_TENANTS` | Comma-separated allowed tenant GUIDs |
| `NEXTAUTH_SECRET` | Random secret for session encryption |
| `NEXTAUTH_URL` | Application URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_BASE_URL` | Public base URL |
| `NEXT_PUBLIC_CLICKUP_FORM_URL` | ClickUp form URL for ticket creation |
| `ADMIN_EMAILS` | Comma-separated admin email addresses |

### Optional Environment Variables

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key (for email activity admin) |
| `ZABBIX_URL` | Zabbix JSON-RPC API URL |
| `ZABBIX_API_TOKEN` | Zabbix API authentication token |

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Or run migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (database browser)
npx prisma studio
```

## Development Server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server with hot reload |
| `build` | `prisma generate && next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `next lint` | Run ESLint |
| `db:push` | `prisma db push` | Push schema changes to database |
| `db:migrate` | `prisma migrate deploy` | Run database migrations |
| `db:studio` | `prisma studio` | Open Prisma database browser |

## First Run

1. Start the dev server
2. Sign in with an Azure AD account from an allowed tenant
3. Click the sync button to fetch tickets from ClickUp into PostgreSQL
4. Tickets will appear in the list

## Common Development Tasks

### Adding a new API route

1. Create `app/api/<path>/route.ts`
2. Export named async functions: `GET`, `POST`, `DELETE`, etc.
3. Start with auth check: `const session = await auth()`
4. For admin routes, add `isAdmin()` check
5. Use `try/catch` with `NextResponse.json()` error responses

### Adding a new page

1. Create `app/<path>/page.tsx`
2. Add `"use client"` if client-side data fetching is needed
3. Add `loading.tsx` alongside for loading states
4. Use `useLanguage()` for translated strings

### Adding translations

1. Open `lib/translations.ts`
2. Add new key to `nl`, `fr`, and `en` objects
3. Use via `t("newKey")` in components

### Modifying the database schema

1. Edit `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Run `npx prisma db push` (development)
4. Commit both `schema.prisma` and any migration files
