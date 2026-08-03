# Story 1.1: Shared domain foundation for reservations

Status: done

## Story

As an authenticated employee,
I want the bakwagen and organization entities available in Ticketdesk’s data model,
so that reservations can be stored and later linked to inventaris.

## Acceptance Criteria

1. Models `Entity`, `Item`, `Loan`, and `ItemPhoto` exist with `LoanType` (`RESERVATION` | `INVENTORY`), `LoanStatus` including at least `ACTIVE` and `CANCELLED`, and `Loan.permanent` boolean
2. A seed loads shared entities (departments/companies) and one bakwagen `Item`
3. `isMarketing(email)` is implemented beside `isAdmin` using `MARKETING_USERS` (case-insensitive)
4. `.env.example` documents `MARKETING_USERS`
5. Existing Ticket-related models remain unchanged

## Tasks / Subtasks

- [x] Add Prisma enums and models (AC: #1, #5)
- [x] Create `prisma/seed.ts` for entities + bakwagen (AC: #2)
- [x] Add `isMarketing` / `getMarketingEmails` in `lib/admin.ts` (AC: #3)
- [x] Document `MARKETING_USERS` (and related keys) in `.env.example` (AC: #4)
- [x] Wire Prisma seed in `package.json`

## Dev Notes

- Follow architecture: single `Loan` table, no parallel Booking model
- `ItemPhoto` in schema now; upload API later (Epic 4)
- Bakwagen identified via slug `bakwagen`
- Source: `_bmad-output/planning-artifacts/epics.md` Story 1.1; `architecture.md` domain decisions

### References

- [Source: `_bmad-output/planning-artifacts/architecture.md`]
- [Source: `_bmad-output/project-context.md`]

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Completion Notes List

- Added shared domain models + seed; `isMarketing` beside `isAdmin`; `.env.example` updated.
- Deploy path uses existing `prisma db push` in start script — no separate migration folder required.

### File List

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `lib/admin.ts`
- `.env.example`
- `package.json`
