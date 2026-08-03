# API Contracts

_Discovered via quick scan of `app/api/` route structure._

---

## Public API Routes

| Endpoint | Method(s) | Auth | Description |
|----------|-----------|------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | Public | NextAuth.js authentication handlers (Azure AD) |

## Authenticated API Routes (User)

| Endpoint | Method(s) | Auth | Description |
|----------|-----------|------|-------------|
| `/api/tickets` | GET | User | List user's tickets from PostgreSQL |
| `/api/tickets/[id]` | GET | User | Get single ticket details with attachments |
| `/api/tickets/[id]/comments` | GET, POST | User | Get/post comments on a ticket (via ClickUp API) |
| `/api/sync` | GET, POST | User | Get sync status / Trigger background sync from ClickUp |
| `/api/releases` | GET | User | List releases (tickets with release notes flag) |
| `/api/releases/[id]` | GET | User | Get single release detail |
| `/api/settings/banner` | GET | User | Get current banner setting |
| `/api/status` | GET | User | Get system/service status (Zabbix integration) |

## Admin API Routes

All admin routes require both authentication AND `isAdmin()` check.

| Endpoint | Method(s) | Auth | Description |
|----------|-----------|------|-------------|
| `/api/admin/check` | GET | Admin | Check if current user is admin |
| `/api/admin/services` | GET, POST | Admin | List/create monitored services |
| `/api/admin/services/[id]` | PUT, DELETE | Admin | Update/delete monitored service |
| `/api/admin/zabbix` | GET | Admin | Fetch Zabbix host data |
| `/api/admin/users` | GET | Admin | List all users with ticket counts |
| `/api/admin/users/[email]/tickets` | GET | Admin | Get all tickets for a specific user |
| `/api/admin/users/[email]/export` | GET | Admin | Export user tickets as CSV |
| `/api/admin/email` | GET | Admin | Search SendGrid email activity |
| `/api/admin/email/[msgId]` | GET | Admin | Get SendGrid message detail/trace |
| `/api/admin/email/suppressions` | GET, DELETE | Admin | Check/remove email from suppression lists |
| `/api/admin/email/suppressions/list` | GET | Admin | List all entries of a suppression type |
| `/api/settings/banner` | POST, DELETE | Admin | Update/delete banner (admin-only methods) |

## API Patterns

- **Auth check**: `const session = await auth()` → 401 if no `session?.user?.email`
- **Admin check**: `isAdmin(session.user.email)` → 403 if not admin
- **Error format**: `NextResponse.json({ message: string }, { status: number })`
- **Dynamic params** (Next.js 15): `{ params }: { params: Promise<{ id: string }> }` → `const { id } = await params`

## External API Integrations

| Service | Wrapper | Purpose |
|---------|---------|---------|
| ClickUp | `lib/clickup.ts` | Ticket data source, comments, task management |
| SendGrid | `lib/sendgrid.ts` | Email activity search, suppression list management |
| Zabbix | `lib/zabbix.ts` | System/service monitoring status |
