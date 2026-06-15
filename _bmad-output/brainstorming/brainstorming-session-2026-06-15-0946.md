---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Admin dashboard with ticket statistics - metrics, KPIs, visualizations, UX, and data insights'
session_goals: 'Broad exploration of all possibilities - valuable metrics, presentation methods, actionable insights, and intuitive admin UX'
selected_approach: 'ai-recommended'
techniques_used: ['Mind Mapping', 'Role Playing', 'SCAMPER Method']
ideas_generated: 36
session_active: false
workflow_completed: true
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Kevin
**Date:** 2026-06-15

## Session Overview

**Topic:** Admin dashboard with ticket statistics — from raw data and KPIs to visual presentation (chart types, layout, UX)
**Goals:** Broad exploration of all possibilities — which metrics are valuable, how to present them, what insights to offer, and how to make the whole experience intuitive and actionable for admins

### Session Setup

Kevin wants to brainstorm broadly about a ticket statistics admin dashboard for Ticketdesk. The scope covers both the data layer (which metrics, KPIs, aggregations) and the presentation layer (chart types, dashboard layout, UX patterns). The aim is to generate a wide range of innovative ideas before narrowing down.

**Reference:** Kevin provided a reference dashboard image (IT/Dev Service Desk Tickets, Q3 2026) with KPI summary cards, donut charts per category, and a quarterly overview section as visual inspiration.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Admin dashboard with ticket statistics, broad exploration of data, visualization, and UX

**Recommended Techniques:**

- **Mind Mapping:** Map the full landscape of dashboard possibilities — metrics, time periods, chart types, UX patterns, and user needs as branching visual structure
- **Role Playing:** Explore the dashboard from different stakeholder perspectives (admin, support agent, manager, CEO) to reveal diverse metric needs and priorities
- **SCAMPER Method:** Systematically refine and enhance generated ideas through seven creative lenses — Substitute, Combine, Adapt, Modify, Put to other uses, Eliminate, Reverse

**AI Rationale:** This three-phase sequence moves from broad landscape mapping (divergent) through multi-perspective validation (exploratory) to systematic refinement (convergent). The progression ensures comprehensive coverage while building toward actionable, innovative dashboard features.

## Technique Execution Results

### Mind Mapping (Phase 1 — Landscape)

**Interactive Focus:** Branching out from central concept "Admin Dashboard — Ticket Statistics" into five main branches: time dimensions, ticket metrics, visualization types, user perspectives, and action-orientation.

**Key Ideas Generated:**

- **#1 KPI Summary Cards:** Large prominent cards at the top showing totals per status — total tickets, done, planned, on hold, in progress, to do — each with absolute number and percentage.
- **#2 Status Distribution:** Donut charts showing status distribution with color codes and legends.
- **#3 Quarterly Overview:** Summary block per quarter with three main groups — completed, in progress, still open.
- **#4 Quarter-over-Quarter Comparison:** Compare Q1 vs Q2 vs Q3 vs Q4 side by side — same metrics, to spot trends and seasonal patterns.
- **#5 Smart Annotations:** Auto-generated text summaries under each chart. → _Later eliminated via SCAMPER._
- **#6 Trend Line over Quarters:** Line chart showing development over Q1–Q4 per status.
- **#7 Comparison Table with Deltas:** Table with columns per quarter and rows per status — with delta indicators (arrows, +14%, -8%).
- **#8 Top Ticket Creators Ranking:** Overview of which users opened the most tickets in a period — as bar chart or ranked list.
- **#9 Ticket Resolver Ranking:** Who resolves the most tickets. → _Not selected for final scope._
- **#10 Average Lead Time per Quarter:** → _Not selected — keeping scope to counts and statuses only._
- **#11 Time-in-Status Breakdown:** → _Not selected — keeping scope to counts and statuses only._
- **#12 Month Breakdown within Quarter:** Per quarter, a split per month as grouped bar chart.
- **#13 Year-to-Date Progress Bar:** → _Not selected for final scope._
- **#14 Top Creators as Horizontal Bar Chart:** Top 5 or 10 with an "other" group.
- **#15 Dashboard Structure/Layout:** KPI cards on top, donut + trend line in the middle, comparison table below, top creators at the bottom.
- **#16 Period Selector:** Dropdown or toggle at the top for switching between month, quarter, and year view.
- **#17 Single Large Donut — Overall Status Distribution:** One prominent donut chart showing the complete status distribution with legend, counts, and percentages.
- **#18 Period Selector at Top — Month / Quarter / Year:** Segmented control at the top. All data on the dashboard adapts to the selected period.
- **#19 Top Creators Follow Period Selector:** The top creators list automatically adapts — select "Q2 2026" and see that quarter's top creators.
- **#20 View Mode Granularity:** Same components, different granularity per mode — month shows daily/weekly points, quarter shows months, year shows quarters.
- **#21 New vs Resolved Ratio:** → _Later eliminated via SCAMPER (too much)._

### Role Playing (Phase 2 — Perspectives)

**Interactive Focus:** Examining the dashboard through four admin perspectives to validate and refine the concept.

**Key Ideas Generated:**

- **#22 First Glance Need — Status Overview:** The admin wants to see absolute counts per status immediately upon opening — no charts, no trends, just the numbers. KPI-cards at the top are the anchor point.
- **#23 Management Reporting — Quarterly Results:** The admin needs to read at a glance: "This quarter X tickets, last quarter Y, delta is Z%." The comparison table with delta arrows is the reporting instrument.
- **#24 Year View — Four Quarters + Year Total:** In year view, the comparison table shows all four quarters side by side, with an extra "Year Total" column at the end. The donut shows the year's full status distribution.
- **#25 Top Creators Year Overview:** In year view, show who created the most tickets over the entire year. Reveals patterns invisible in quarterly views.
- **#26 Month View — 12-Month Rolling Trend Line:** In month view, the trend line shows a rolling window of the past 12 months, with the selected month highlighted.
- **#27 Month-over-Month Comparison Table:** The comparison table shows months side by side with deltas.
- **#28 Default View — Current Month:** Upon opening the dashboard, the admin always lands on the current month. From there, they can zoom out to quarter or year.

### SCAMPER Method (Phase 3 — Refinement)

**Interactive Focus:** Systematically enhancing and filtering ideas through seven creative lenses.

**Key Ideas Generated:**

- **S — Substitute:** Donut stays (no replacement with stacked bar chart). Kevin is "gehecht aan donuts."
- **#29 Donut → Stacked Bar:** → _Rejected — donut stays._
- **#30 C — Combine: KPI + Donut Integration:** The donut shows the total count in the center (like in the reference image — "260" in the middle).
- **#31 C — Combine: Trend/Table Toggle:** Trend line and comparison table under the same section with a toggle: "Grafiek | Tabel" — two ways to view the same data without doubling screen space.
- **#32 A — Adapt: Responsive/Mobile:** → _Rejected — desktop-only dashboard._
- **#33 M — Modify: Hover Tooltips on Donut Segments:** Hovering over a segment shows exact count, percentage, and change vs previous period.
- **#34 M — Modify: Clickable Donut Segments:** Click on a segment to navigate to a filtered ticket list — e.g., click "In Progress" to see all in-progress tickets for that period.
- **#35 E — Eliminate: Annotations Removed:** Smart annotations are redundant when donut already shows percentages and KPI-cards show counts.
- **#36 R — Reverse: Open Tickets Trend:** → _Rejected — too much._

## Idea Organization and Prioritization

### Thematic Organization

**Theme 1: Dashboard Layout & Navigation**

- **#15** Dashboard structure — KPI on top, donut + trend middle, creators bottom
- **#18** Period selector at the top — Month / Quarter / Year toggle
- **#28** Default view is current month
- **#31** Trend line and comparison table as toggle (Chart | Table)

**Theme 2: KPI Summary Cards**

- **#1** Large cards at top with totals and percentages per status
- **#22** First-glance need confirms: statuses must be immediately visible
- **#30** Donut shows total count in the center (combines with KPI info)

**Theme 3: Donut Chart Status Distribution**

- **#17** Single large donut with overall status distribution
- **#33** Hover tooltips with detail per segment
- **#34** Clickable segments — navigate to filtered ticket list

**Theme 4: Trend Lines & Comparisons**

- **#6** Trend line over quarters
- **#7** Comparison table with delta indicators
- **#26** Month view: rolling 12-month trend line
- **#27** Month-over-month comparison table

**Theme 5: Period Views**

- **#4** Quarter-over-quarter comparison
- **#20** Same components, different granularity per mode
- **#24** Year view: Q1-Q4 + year total column
- **#12** Month breakdown within quarter

**Theme 6: User Statistics**

- **#8** Top ticket creators ranking
- **#14** Horizontal bar chart with top 5/10
- **#19** Creators follow period selector
- **#25** Year overview of top creators

### Eliminated Ideas (Consciously Removed)

| Idea | Reason |
|------|--------|
| #5 Smart Annotations | Redundant with donut percentages and KPI cards |
| #21 New vs Resolved Ratio | Too much — keep it lean |
| #29 Stacked Bar Chart | Donut stays — user preference |
| #32 Responsive/Mobile | Desktop-only dashboard |
| #36 Open Tickets Trend | Too much complexity |
| Priority segmentation | Does not exist in Ticketdesk |
| Category breakdown | Does not exist in Ticketdesk |
| Lead times / duration metrics | Not desired — counts and statuses only |
| Action-orientation / alerts | Not desired |
| Ticket resolver ranking | Not selected for scope |

### Final Dashboard Design

```
┌──────────────────────────────────────────────────────┐
│  [● Month]  [Quarter]  [Year]         ◂ Jun 2026 ▸  │
├──────────────────────────────────────────────────────┤
│  TOTAL  │  DONE  │ ON HOLD │ IN PROG │  TO DO       │
│   260   │  114   │   14    │   24    │   99         │
│         │ 43.8%  │  5.4%   │  9.2%   │ 38.1%       │
├───────────────┬──────────────────────────────────────┤
│               │  [● Chart | Table]                   │
│  🍩 Donut     │                                      │
│   (260)       │  Chart: trend line                   │
│               │  - Month: 12-month rolling           │
│  hover=tooltip│  - Quarter: Q-o-Q                    │
│  click=filter │  - Year: Q1→Q4                       │
│               │                                      │
│               │  Table: comparison + deltas           │
│               │  - Year: Q1│Q2│Q3│Q4│TOTAL           │
├───────────────┴──────────────────────────────────────┤
│  👤 Top Ticket Creators (follows period selector)    │
│  ████████████ Jan - 45                               │
│  ████████     Piet - 32                              │
│  ██████       Klaas - 24                             │
└──────────────────────────────────────────────────────┘
```

**Interaction Behaviors:**

- Period selector (Month/Quarter/Year) controls ALL dashboard components
- Default landing: current month
- Donut segments: hover for tooltips (count, %, delta), click to navigate to filtered ticket list
- Chart/Table toggle: same data, two presentation modes
- Year view comparison table includes Q1-Q4 columns + Year Total column
- Month view trend line shows rolling 12-month window
- Top creators ranking adapts to selected period

## Session Summary and Insights

**Key Achievements:**

- 36 ideas generated across 3 techniques (Mind Mapping, Role Playing, SCAMPER)
- Clear, implementable dashboard concept with consistent behavior across three period views
- Deliberate scope management — multiple features consciously eliminated to keep the dashboard lean and focused
- Strong information hierarchy validated through role-playing scenarios

**Creative Facilitation Narrative:**

Kevin came into the session with a clear reference image and a strong instinct for simplicity. The Mind Mapping phase established the broad landscape, but Kevin's decisive input quickly shaped it — "donuts stay," "desktop only," "counts and statuses, that's it." The Role Playing phase validated the layout by walking through real usage scenarios (Monday morning check, management reporting, year-end review). SCAMPER then tightened the design: combining KPI info into the donut center, introducing the chart/table toggle, adding hover+click interactivity, and eliminating redundant annotations. The result is a focused, no-nonsense admin dashboard that does one thing well.

**Design Principles That Emerged:**

1. **Simplicity over feature-richness** — every element must earn its place
2. **Consistency across views** — same components, different granularity
3. **One selector rules all** — period choice affects every component
4. **Overview first, detail on demand** — hover and click for drill-down
5. **Default to the most useful view** — current month on landing
