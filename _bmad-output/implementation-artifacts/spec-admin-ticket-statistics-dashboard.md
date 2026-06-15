---
title: 'Admin Ticket Statistics Dashboard'
type: 'feature'
created: '2026-06-15'
status: 'done'
baseline_commit: 'b97c275'
context: ['_bmad-output/project-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Admins have no central overview of ticket volume, status distribution, or top creators — forcing manual counting or external tools to answer basic questions like "how many tickets this quarter?"

**Approach:** Add an admin statistics dashboard at `/admin/stats` with a period selector (month/quarter/year), KPI summary cards, an interactive donut chart for status distribution, a toggleable trend-line / comparison-table section, and a top ticket creators bar chart. All components react to the selected period.

## Boundaries & Constraints

**Always:**
- Follow existing admin page shell (client auth via `/api/admin/check`, nav bar, inline `t(nl, fr, en)`)
- Use `clickupCreatedAt` for date-based ticket filtering
- Status values are dynamic ClickUp strings — aggregate from DB, never hardcode
- Desktop-only layout; admin-only access (auth + isAdmin on API)

**Ask First:**
- Charting library choice (recommend recharts)

**Never:**
- No alerts, anomaly detection, or action-oriented features
- No priority segmentation, category breakdowns, or duration metrics
- No responsive/mobile optimization
- No smart annotations — donut + KPI cards carry the data

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default load | Admin opens `/admin/stats` | Current month selected, all components populated | N/A |
| Period switch | Selects "Quarter" + Q2 2026 | All components update to Q2 data | N/A |
| Year view table | Selects "Year" + 2026 | Table shows Q1│Q2│Q3│Q4│Year Total columns | N/A |
| Donut hover | Hovers segment | Tooltip: status, count, percentage | N/A |
| Donut click | Clicks "In Progress" segment | Navigate to ticket list filtered by that status | N/A |
| No tickets | Selects future month | Cards show 0, donut empty state, empty table | N/A |
| API error | Stats endpoint fails | Error message in dashboard area | "Failed to load" msg |

</frozen-after-approval>

## Code Map

- `prisma/schema.prisma` -- Ticket model: `status`, `clickupCreatedAt`, `userEmail`, `userName` (no changes)
- `app/api/admin/stats/route.ts` -- NEW: aggregated stats endpoint
- `app/admin/stats/page.tsx` -- NEW: dashboard page with charts
- `app/admin/page.tsx` -- add quick-link to `/admin/stats`
- `lib/translations.ts` -- add stats.* keys (nl/fr/en)
- `package.json` -- add recharts

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- run `npm install recharts` -- charting library for donut + line charts
- [x] `app/api/admin/stats/route.ts` -- create GET endpoint accepting `view` (month|quarter|year) and `period` (e.g. `2026-06`, `2026-Q2`, `2026`) query params; use `prisma.ticket.groupBy` on `status` and `userEmail` with date-range filter on `clickupCreatedAt`; return `{ current: {total, statuses}, trend: [...], topCreators: [...] }`
- [x] `app/admin/stats/page.tsx` -- create dashboard: segmented period selector (month/quarter/year) with prev/next navigation; KPI cards row (total + per-status with percentages); recharts PieChart donut with center total, hover tooltips, click-to-navigate; trend/table toggle (LineChart or HTML table with delta arrows); top creators horizontal BarChart (top 10). Copy admin page shell from `/admin/users`
- [x] `app/admin/page.tsx` -- add quick-link card to `/admin/stats` alongside existing links
- [x] `lib/translations.ts` -- add keys: `stats.title`, `stats.month`, `stats.quarter`, `stats.year`, `stats.total`, `stats.topCreators`, `stats.noData`, `stats.chart`, `stats.table` in nl/fr/en

**Acceptance Criteria:**
- Given an admin, when navigating to `/admin/stats`, then current month stats load with KPI cards, donut, trend, and top creators
- Given the period selector, when switching view or period, then all components update to the selected timeframe
- Given the donut, when hovering a segment, then tooltip shows status name, count, and percentage
- Given the donut, when clicking a segment, then navigation to a filtered ticket listing occurs
- Given the toggle, when switching chart↔table, then the same data renders in the alternate format with deltas in table mode
- Given a non-admin, when accessing `/admin/stats` or its API, then redirect or 401/403

## Design Notes

**API response shape:**
```json
{
  "current": {"total": 260, "statuses": {"Done": 114, "To Do": 99}},
  "trend": [{"label": "Jul 2025", "total": 45, "statuses": {"Done": 20}}],
  "topCreators": [{"email": "jan@x.com", "name": "Jan", "count": 45}]
}
```

**Trend scope by view:** month → rolling 12 months; quarter → quarters of that year; year → Q1–Q4 of that year. Year-view table adds a "Year Total" summary column.

**Donut:** recharts `PieChart` with `innerRadius` for donut hole; total count rendered as custom center label.

## Verification

**Commands:**
- `npx next build` -- expected: no build errors
- `npx eslint app/admin/stats/ app/api/admin/stats/` -- expected: no lint errors

## Suggested Review Order

**Data layer & API**

- Period parsing with month boundary validation (1-12)
  [`route.ts:14`](../../app/api/admin/stats/route.ts#L14)

- Trend range generation — 12 months rolling, quarterly, yearly
  [`route.ts:56`](../../app/api/admin/stats/route.ts#L56)

- Prisma groupBy aggregation for status counts and top creators
  [`route.ts:99`](../../app/api/admin/stats/route.ts#L99)

- Auth guards and request handler orchestration
  [`route.ts:119`](../../app/api/admin/stats/route.ts#L119)

**Dashboard UI**

- Period selector with segmented control and prev/next navigation
  [`page.tsx:166`](../../app/admin/stats/page.tsx#L166)

- KPI summary cards with dynamic status entries and percentages
  [`page.tsx:209`](../../app/admin/stats/page.tsx#L209)

- Interactive donut chart with center total, tooltips, and click-to-filter
  [`page.tsx:234`](../../app/admin/stats/page.tsx#L234)

- Chart/table toggle with LineChart and ComparisonTable
  [`page.tsx:299`](../../app/admin/stats/page.tsx#L299)

- ComparisonTable with year total column and delta percentages
  [`page.tsx:365`](../../app/admin/stats/page.tsx#L365)

**Supporting changes**

- Admin hub quick-link added alongside existing links
  [`page.tsx:298`](../../app/admin/page.tsx#L298)

- Translation keys added in nl/fr/en
  [`translations.ts:123`](../../lib/translations.ts#L123)

### Review Findings

- [x] [Review][Decision→Patch] Donut click-to-filter: added `status` URL param support to `/admin/users` page and API
- [x] [Review][Decision→Patch] Removed unused `stats*` translation keys from `lib/translations.ts`
- [x] [Review][Patch] Trend month labels now human-readable ("Jun 2026" instead of "2026-06")
- [x] [Review][Patch] Year-view summary column header now says "Jaar Totaal/Year Total"
- [x] [Review][Patch] API 500 response uses generic message instead of leaking `error.message`
- [x] [Review][Patch] Removed `language` from `fetchStats` deps — error message translated at render time
- [x] [Review][Patch] Added API response shape validation before setting state
- [x] [Review][Patch] Added null `userEmail` guard in `getTopCreators`
- [x] [Review][Defer] DB query amplification: month view runs 14 separate Prisma queries per request [route.ts:155-165] — deferred, optimization
- [x] [Review][Defer] Stale data remains visible during period/view refetch without loading overlay [page.tsx:265] — deferred, UX polish
- [x] [Review][Defer] Top creator display names derived from email local-part, no real name resolution [route.ts:121] — deferred, existing limitation
- [x] [Review][Defer] No automated tests for date parsing, period shifting, or aggregation logic — deferred, out of scope
- [x] [Review][Defer] No retry button on API error state [page.tsx:259] — deferred, UX enhancement
- [x] [Review][Defer] Accessibility: unlabeled prev/next buttons, no keyboard navigation on charts [page.tsx:241] — deferred, admin-only desktop tool
