---
title: 'BookAVan reservation approval by marketing'
type: 'feature'
created: '2026-08-03'
status: 'done'
baseline_commit: '750a235aff4c6f1a5bfed54493c1fd1ed68b29b5'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Bakwagen requests become active immediately with no marketing review, no requester status beyond booked/cancelled, and no email notifications for intake or decisions.

**Approach:** Reservations start as `PENDING`, block the calendar like approved ones, and marketing users approve/reject them from the inventaris dashboard; emails notify marketing on new requests and the requester on approve/reject (reject requires a reason).

## Boundaries & Constraints

**Always:**
- Approvers = `isMarketing()` (same allowlist as inventaris).
- New creates → `PENDING` (not immediately `ACTIVE`).
- Calendar/overlap: `PENDING` + `ACTIVE` block; `CANCELLED` + `REJECTED` do not.
- Requester sees status in BookAVan history (`PENDING` / `ACTIVE` / `REJECTED` / `CANCELLED`).
- Marketing dashboard shows pending bakwagen requests with approve + reject (reason required).
- Emails (SendGrid when configured): (1) all `MARKETING_USERS` on new request; (2) requester on approve; (3) requester on reject including reason.
- Existing `ACTIVE` rows stay approved (grandfathered); no mass rewrite required beyond enum/migration.
- i18n nl/fr/en for new UI strings; errors `{ message }`.

**Ask First:**
- Changing approver set away from marketing allowlist.
- Notifying only a subset of marketing emails instead of the full list.

**Never:**
- Non-marketing approving/rejecting.
- Blocking inventaris item CRUD behind approvals.
- Teams/Slack notifications (email only).
- Auto-approve after a timeout.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create reservation | Valid form + claim | Loan `PENDING`; marketing emails; day blocked on calendar | Overlap still 409 |
| Approve | Marketing + pending id | Status `ACTIVE`; requester email | Non-marketing 403; not pending 400 |
| Reject | Marketing + reason | Status `REJECTED`; slot free; requester email with reason | Empty reason 400 |
| Cancel pending | Owner/marketing/admin | `CANCELLED`; slot free | Same cancel auth as today |
| SendGrid missing | Env unset | Approval flow still works; mail skipped/logged | No hard fail create |

</frozen-after-approval>

## Code Map

- `prisma/schema.prisma` -- Add `PENDING`, `REJECTED` to `LoanStatus`; optional `rejectionReason`, `reviewedAt`, `reviewedByEmail`
- `lib/bookavan/overlap.ts` / `reservations.ts` -- Create as `PENDING`; overlap excludes `CANCELLED`+`REJECTED` only (or include only `PENDING`+`ACTIVE`)
- `lib/bookavan/approvals.ts` -- NEW list pending / approve / reject
- `app/api/bookavan/reservations/route.ts` -- Create triggers notify marketing
- `app/api/marketing/bookavan/pending/route.ts` + `[id]/approve|reject` -- Marketing-guarded APIs
- `lib/sendgrid.ts` -- Small helpers for bookavan notification emails (reuse mail/send pattern)
- `components/marketing/PendingReservationsPanel.tsx` -- NEW dashboard panel
- `app/marketing/page.tsx` -- Mount panel
- `components/bookavan/ReservationHistory.tsx` + calendar -- Status labels; busy = pending+active
- `lib/translations.ts` -- nl/fr/en
- `.env.example` -- Note that `SENDGRID_*` powers BookAVan mails (if not already)

## Tasks & Acceptance

**Execution:**
- [x] Schema: `PENDING`/`REJECTED` + review fields; migrate/push
- [x] Create reservation as `PENDING`; overlap/calendar treat pending as blocking; rejected free
- [x] Marketing APIs: list pending, approve, reject(reason)
- [x] SendGrid notify helpers + wire create/approve/reject (graceful if unset)
- [x] Marketing dashboard pending panel UI (approve/reject + reason)
- [x] BookAVan history status labels + cancel rules for pending; i18n

**Acceptance Criteria:**
- Given a new booking, when create succeeds, then status is `PENDING`, marketing users are emailed, and the day is unavailable on the calendar.
- Given a marketing user, when they approve a pending request, then status becomes `ACTIVE` and the requester is emailed.
- Given a marketing user, when they reject with a reason, then status becomes `REJECTED`, the slot is free, and the requester email includes the reason.
- Given a non-marketing user, when they call approve/reject APIs, then they receive 403.
- Given SendGrid is not configured, when create/approve/reject runs, then the status change still succeeds.

## Design Notes

- Prefer overlap filter `status in [PENDING, ACTIVE]` over “not cancelled” so `RETURNED`/`OVERDUE`/`REJECTED` cannot block bakwagen slots incorrectly.
- Reuse inventaris dashboard card/panel patterns next to `OpenLoansPanel`.
- Approval actions live under `/api/marketing/...` even though loans are BookAVan domain — matches “asset owned by marketing” intent.

## Verification

- Create booking as employee → pending on marketing dashboard + calendar busy.
- Approve → history shows active + mail (if SendGrid set).
- Reject with reason → calendar free + requester sees rejected + reason path.
- Non-marketing cannot approve via API.
