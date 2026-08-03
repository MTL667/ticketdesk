---
title: 'BookAVan availability month calendar'
type: 'feature'
created: '2026-08-03'
status: 'done'
baseline_commit: 'a37b090b25b4fc668e5d328054b8d315728b6a97'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On `/bookavan`, users only see availability after picking dates or via a “now” status card—there is no at-a-glance month view of free vs booked days.

**Approach:** Add a month calendar (Europe/Brussels) that marks each day available or unavailable when any non-cancelled reservation overlaps that local day, and clicking a day prefills the reservation form start/end for that day.

## Boundaries & Constraints

**Always:**
- Use Europe/Brussels for day boundaries and month labeling (same as BookAVan booking).
- A day is **unavailable** if any non-`CANCELLED` reservation overlaps `[day 00:00:00, day 23:59:59]` Brussels.
- Status must not rely on color alone (text/legend + icon or label).
- i18n for new UI strings in nl/fr/en.
- Keyboard: month prev/next and day buttons focusable.

**Ask First:**
- Changing day-busy rule (e.g. partial-day still “available”).
- Adding a new calendar API instead of deriving from the existing reservations list.

**Never:**
- New home/nav tiles for BookAVan.
- Editing/cancelling reservations from the calendar.
- Hourly/slot heatmaps or multi-vehicle calendars.
- Blocking reservation create when clicking an unavailable day (user may still choose overlapping times; existing availability check remains source of truth).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Empty month | No active reservations in month | All days shown available | N/A |
| Multi-day booking | Reservation spans Wed–Fri | Wed, Thu, Fri marked unavailable | N/A |
| Cancelled only | Only CANCELLED on a day | Day remains available | N/A |
| Click available day | User activates day cell | Form start/end set to that Brussels day (start morning / end evening defaults) | N/A |
| Click unavailable day | User activates busy day | Still prefills that day; availability check may warn as today | N/A |
| Month navigate | Prev/next month | Grid rebuilds from current reservations list | N/A |

</frozen-after-approval>

## Code Map

- `app/bookavan/page.tsx` -- Mount calendar above form grid; pass reservations + date prefill into form
- `components/bookavan/ReservationForm.tsx` -- Add optional controlled/prefill props for `startAt`/`endAt` (datetime-local values)
- `components/bookavan/AvailabilityCalendar.tsx` -- NEW month grid UI + busy-day computation
- `lib/bookavan/datetime.ts` -- Helpers: month grid days in Brussels, date-only start, format for datetime-local
- `lib/translations.ts` -- Calendar strings nl/fr/en
- Existing `GET /api/bookavan/reservations` -- Data source (no new endpoint unless Ask First)

## Tasks & Acceptance

**Execution:**
- [x] `lib/bookavan/datetime.ts` -- Add Brussels month-day helpers + datetime-local string builders for a selected day (default window e.g. 08:00–17:00 local)
- [x] `components/bookavan/AvailabilityCalendar.tsx` -- Month grid, legend, prev/next, busy/available from reservation `{startAt,endAt,status}`
- [x] `components/bookavan/ReservationForm.tsx` -- Accept optional `prefillStartAt`/`prefillEndAt` (or single `datePrefill` key) and apply without wiping other fields
- [x] `app/bookavan/page.tsx` -- Render calendar; on day select set prefill state and scroll/focus form if practical
- [x] `lib/translations.ts` -- Add nl/fr/en keys for title, legend, month nav, available/unavailable

**Acceptance Criteria:**
- Given loaded reservations, when the user opens `/bookavan`, then a month calendar shows available vs unavailable days for the current Brussels month.
- Given a reservation overlapping a Brussels calendar day and status not CANCELLED, when that month is shown, then that day is marked unavailable with a non-color-only cue.
- Given the user clicks a day, when the form updates, then start/end datetime-local fields are filled for that day (defaults 08:00–17:00 Brussels wall time as local form values).
- Given the user changes month, when prev/next is used, then the grid updates without a full page reload.
- Given CANCELLED-only activity on a day, when the month renders, then the day stays available.

## Design Notes

- Prefer deriving busy days client-side from the already-fetched reservations list to avoid a new API.
- Prefill must not reset driver/entity/claim via `formResetKey`; use a dedicated prefill effect.
- Place calendar above the form + sidebar grid so availability is visible before booking.

## Verification

- Manual: `/bookavan` with 0 bookings → all available; create multi-day booking → days turn unavailable after refresh; cancel → free again.
- Manual: click day → form dates populate; availability banner runs on existing debounce.
- Spot-check nl/fr/en legend strings.

## Suggested Review Order

**Entry / wiring**

- Calendar above form; day click prefills and focuses start field
  [`page.tsx:277`](../../app/bookavan/page.tsx#L277)

**Busy-day logic**

- Brussels month grid + day overlap helpers
  [`datetime.ts:225`](../../lib/bookavan/datetime.ts#L225)

- Client-side busy set from non-cancelled reservations
  [`AvailabilityCalendar.tsx:37`](../../components/bookavan/AvailabilityCalendar.tsx#L37)

**Form prefill**

- Prefill dates without wiping driver/claim via formResetKey
  [`ReservationForm.tsx:80`](../../components/bookavan/ReservationForm.tsx#L80)

**i18n**

- Calendar title/help/legend strings (nl/fr/en)
  [`translations.ts`](../../lib/translations.ts)
