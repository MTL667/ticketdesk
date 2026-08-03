# Component Inventory

_Discovered via quick scan of `components/` directory._

---

## Overview

6 client-side React components, all using `"use client"` directive. No component library or design system — pure Tailwind CSS utility classes.

## Components

### Layout / Navigation

| Component | File | Description |
|-----------|------|-------------|
| `LanguageSelector` | `LanguageSelector.tsx` | Dropdown to switch between NL, FR, EN. Uses `useLanguage()` context. |

### Ticket Management

| Component | File | Description |
|-----------|------|-------------|
| `TicketList` | `TicketList.tsx` | Main ticket listing with search input, pagination, status/priority chips with color coding. Uses `useLanguage()` for translations. |
| `TicketComments` | `TicketComments.tsx` | Comment thread for a ticket. Fetches from `/api/tickets/:id/comments` (ClickUp). Handles deleted ticket state gracefully. |
| `NewTicketClient` | `NewTicketClient.tsx` | Embeds ClickUp form via iframe. Pre-fills user email as query parameter. |

### Information Display

| Component | File | Description |
|-----------|------|-------------|
| `ReleaseList` | `ReleaseList.tsx` | Lists tickets flagged as release notes. |
| `SystemStatus` | `SystemStatus.tsx` | Displays monitored service statuses from Zabbix integration. |

## Patterns

- **Data fetching**: `useState` + `useEffect` + `fetch("/api/...")` — no React Query or SWR
- **Translations**: All components use `useLanguage()` hook from `@/contexts/LanguageContext`
- **Styling**: Tailwind CSS utility classes directly in JSX
- **Card pattern**: `bg-white shadow-sm rounded-lg` with `p-4` or `p-6`
- **Status chips**: Color-coded backgrounds per status/priority value
