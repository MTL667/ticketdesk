# Data Models

_Discovered from `prisma/schema.prisma`. Database: PostgreSQL via Prisma ORM._

---

## Entity Relationship Overview

```
Ticket (1) ──── (N) Attachment
SyncLog (standalone)
Setting (standalone, key-value)
MonitoredService (standalone)
```

## Models

### Ticket

Primary entity. Synced from ClickUp, keyed by ClickUp task ID.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (PK) | ClickUp task ID |
| `ticketId` | String? | Custom field: human-readable ID (e.g. ZTIMER-39647) |
| `name` | String | Ticket title |
| `description` | String? (Text) | Full description |
| `status` | String | Current status |
| `priority` | String? | Priority level |
| `userEmail` | String | Email of ticket owner (indexed) |
| `businessUnit` | String? | Business unit |
| `app` | String? | Application name |
| `jiraStatus` | String? | Linked Jira status |
| `jiraAssignee` | String? | Linked Jira assignee |
| `jiraUrl` | String? | Link to Jira ticket |
| `releaseNotes` | Boolean | Release notes flag (default: false) |
| `dueDate` | DateTime? | Due date from ClickUp |
| `clickupCreatedAt` | DateTime | ClickUp creation timestamp |
| `clickupUpdatedAt` | DateTime | ClickUp last update timestamp |
| `syncedAt` | DateTime | Last sync timestamp |
| `createdAt` | DateTime | Local creation timestamp |
| `updatedAt` | DateTime | Local update timestamp (auto) |

**Indexes:** `userEmail`, `status`, `ticketId`, `syncedAt`, `releaseNotes`

**Relations:** Has many `Attachment` (cascade delete)

### Attachment

File attachments linked to tickets. Synced from ClickUp.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (PK) | ClickUp attachment ID |
| `ticketId` | String (FK) | References Ticket.id |
| `title` | String | File name |
| `url` | String (Text) | Download URL |
| `extension` | String? | File extension (pdf, png, etc.) |
| `size` | Int? | File size in bytes |
| `dateAdded` | DateTime | When attachment was added |
| `createdAt` | DateTime | Local creation timestamp |

**Indexes:** `ticketId`

### SyncLog

Tracks ClickUp → PostgreSQL sync operations.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (PK) | CUID |
| `startedAt` | DateTime | Sync start time |
| `completedAt` | DateTime? | Sync completion time |
| `status` | String | running, completed, failed |
| `ticketsSynced` | Int | Number of tickets synced |
| `ticketsTotal` | Int | Total tickets found |
| `errorMessage` | String? (Text) | Error details if failed |

**Indexes:** `startedAt`

### Setting

Key-value store for application settings (e.g. banner messages).

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (PK) | CUID |
| `key` | String (unique) | Setting identifier |
| `value` | String? (Text) | Setting value |
| `updatedAt` | DateTime | Auto-updated timestamp |
| `updatedBy` | String? | Admin email who last changed |

### MonitoredService

Services monitored via Zabbix for system status page.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (PK) | CUID |
| `name` | String | Display name |
| `zabbixHostId` | String? | Zabbix host identifier |
| `zabbixHostName` | String? | Zabbix host name |
| `manualStatus` | String? | Manual override: ok, warning, critical, down |
| `manualMessage` | String? | Manual status message |
| `displayOrder` | Int | Sort order (default: 0) |
| `isActive` | Boolean | Active flag (default: true) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated timestamp |

**Indexes:** `isActive`, `displayOrder`

## Sync Architecture

- ClickUp is the source of truth for tickets
- `lib/sync.ts` → `syncTicketsFromClickUp()` performs full sync
- Sync upserts tickets and removes tickets no longer in ClickUp
- Sync runs manually (admin button) or automatically (5-minute interval)
- `SyncLog` tracks each sync operation status
