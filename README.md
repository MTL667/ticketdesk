# ServiceDesk

A production-ready Next.js 15.4 application for managing internal support tickets, integrated with ClickUp and authenticated via Microsoft Entra ID (Azure AD).

## Features

- **Azure AD Multi-Tenant Authentication**: Secure authentication with Microsoft Entra ID, supporting multiple tenants with tenant validation
- **ClickUp Integration**: Ticket data is synced from ClickUp and cached in PostgreSQL for fast queries
- **PostgreSQL Database**: Local database for fast ticket searches (syncs with ClickUp)
- **ClickUp Form Integration**: Create tickets via ClickUp forms with automatic email pre-filling
- **Pagination & Search**: Browse tickets with instant search functionality
- **Automatic Email Tracking**: User email is automatically pre-filled in ClickUp forms for filtering
- **Ticket Viewing**: Users can view their own tickets with status, attachments, and full details
- **Trilingual Support**: Dutch/French/English interface
- **Docker Support**: Ready for containerized deployment with Easypanel

## Tech Stack

- Next.js 15.4 (App Router)
- TypeScript
- Tailwind CSS
- NextAuth.js v5 (Azure AD provider)
- Prisma ORM + PostgreSQL
- ClickUp API

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   User Browser   │────▶│   Next.js App    │────▶│   PostgreSQL     │
│                  │◀────│                  │◀────│   (Fast Cache)   │
└──────────────────┘     └────────┬─────────┘     └──────────────────┘
                                  │
                                  │ Background Sync
                                  ▼
                         ┌──────────────────┐
                         │   ClickUp API    │
                         │ (Source of Truth)│
                         └──────────────────┘
```

**How it works:**
1. Tickets are created in ClickUp (via form or API)
2. Background sync fetches tickets from ClickUp and stores in PostgreSQL
3. User queries read from PostgreSQL for instant results
4. Sync runs automatically every 5 minutes or manually via sync button

## Prerequisites

- Node.js 20+
- PostgreSQL database (can be on Easypanel)
- ClickUp account with API token
- Azure AD application registered in Microsoft Entra ID
- Docker (for containerized deployment)

## Setup

### 1. Clone and Install

```bash
npm install
```

### 2. Set up PostgreSQL Database

**Option A: Easypanel**
1. Create a new PostgreSQL service in Easypanel
2. Note the connection string (format: `postgresql://user:password@host:5432/database`)

**Option B: Local Development**
```bash
docker run -d --name ticketdesk-db \
  -e POSTGRES_USER=ticketdesk \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=ticketdesk \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Environment Variables

Create a `.env` file with all required values:

```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/database

# ClickUp Configuration
CLICKUP_API_TOKEN=your_clickup_api_token
CLICKUP_LIST_IDS=123456789,987654321

# Azure AD / Microsoft Entra ID
AZURE_AD_CLIENT_ID=your_azure_ad_client_id
AZURE_AD_CLIENT_SECRET=your_azure_ad_client_secret
AZURE_AD_TENANT_ID=common
ALLOWED_TENANTS=tenant-id-1,tenant-id-2

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_CLICKUP_FORM_URL=https://forms.clickup.com/xxxxx/f/xxxxx
```

### 4. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Initial Sync

After first login, click the **⚡ Sync** button to fetch tickets from ClickUp into PostgreSQL.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `CLICKUP_API_TOKEN` | ClickUp API token | `pk_xxxxx` |
| `CLICKUP_LIST_IDS` | Comma-separated ClickUp List IDs | `123456789,987654321` |
| `AZURE_AD_CLIENT_ID` | Azure AD app client ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `AZURE_AD_CLIENT_SECRET` | Azure AD app client secret | `xxxxx~xxxxx` |
| `AZURE_AD_TENANT_ID` | Tenant ID or `common`/`organizations` | `common` |
| `ALLOWED_TENANTS` | Comma-separated allowed tenant GUIDs | `guid1,guid2` |
| `NEXTAUTH_SECRET` | Random secret for sessions | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | `https://your-app.com` |
| `NEXT_PUBLIC_BASE_URL` | Public base URL | `https://your-app.com` |
| `NEXT_PUBLIC_CLICKUP_FORM_URL` | ClickUp form URL | `https://forms.clickup.com/xxx` |

## Building for Production

```bash
npm run build
npm start
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t ticketdesk .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:password@host:5432/database \
  -e CLICKUP_API_TOKEN=your_token \
  -e CLICKUP_LIST_IDS=list_id_1,list_id_2 \
  -e AZURE_AD_CLIENT_ID=your_client_id \
  -e AZURE_AD_CLIENT_SECRET=your_client_secret \
  -e AZURE_AD_TENANT_ID=common \
  -e ALLOWED_TENANTS=tenant-id-1,tenant-id-2 \
  -e NEXTAUTH_SECRET=your_secret \
  -e NEXTAUTH_URL=https://your-app.com \
  -e NEXT_PUBLIC_BASE_URL=https://your-app.com \
  ticketdesk
```

## Easypanel Deployment

1. **Create PostgreSQL service** in Easypanel
2. **Create App service** from GitHub repository
3. **Add environment variables** including `DATABASE_URL` pointing to PostgreSQL service
4. **Deploy** - Prisma will auto-generate on build

### Easypanel PostgreSQL Connection

Use internal hostname for DATABASE_URL:
```
DATABASE_URL=postgresql://postgres:password@postgresql:5432/ticketdesk
```

## Project Structure

```
/
├── app/                      # Next.js App Router
│   ├── api/
│   │   ├── auth/             # NextAuth routes
│   │   ├── sync/             # Sync API endpoint
│   │   └── tickets/          # Ticket API endpoints
│   └── tickets/              # Ticket pages
├── components/               # React components
├── lib/
│   ├── auth.ts               # NextAuth configuration
│   ├── clickup.ts            # ClickUp API integration
│   ├── prisma.ts             # Prisma client
│   └── sync.ts               # Sync service
├── prisma/
│   └── schema.prisma         # Database schema
├── Dockerfile                # Multi-stage Docker build
└── next.config.mjs           # Next.js configuration
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tickets` | GET | Get user's tickets from PostgreSQL |
| `/api/tickets/[id]` | GET | Get single ticket details |
| `/api/sync` | GET | Get sync status |
| `/api/sync` | POST | Trigger background sync from ClickUp |

## Sync Behavior

- **Automatic**: Background sync triggers when data is older than 5 minutes
- **Manual**: Click the ⚡ Sync button to force sync
- **Progress**: Shows syncing banner during sync operation
- **Status**: Displays last sync time in the UI

## Usage

1. **Sign In**: Users from allowed Azure AD tenants sign in with Microsoft account
2. **Create Ticket**: Click "Nieuw Ticket" to open the ClickUp form (email pre-filled)
3. **Sync**: Click ⚡ to sync latest tickets from ClickUp
4. **View Tickets**: Browse your tickets with instant search
5. **Ticket Details**: Click any ticket to view full details

## Troubleshooting

### Slow first load
Run a sync to populate the PostgreSQL database.

### Missing tickets
Check if your email is correctly stored in the ClickUp custom field.

### Database connection error
Verify `DATABASE_URL` is correct and PostgreSQL is accessible.

## Security

- All routes protected by NextAuth middleware
- Only users from allowed tenants can sign in
- All ClickUp API calls happen server-side
- Tickets filtered by user email (users only see their own)
- Session management via secure cookies

## License

Private/internal use only.
