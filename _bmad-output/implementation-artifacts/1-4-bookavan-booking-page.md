# Story 1.4: BookAVan booking page

Status: done

## Story

As an authenticated employee,
I want a BookAVan page to book the bakwagen and see availability and rules,
so that I can reserve in one guided flow inside Ticketdesk.

## Acceptance Criteria

1. `/bookavan` shows vehicle status, form, claim dialog, rules, availability feedback
2. Cannot submit without claim acceptance
3. Overlaps blocked with clear message
4. Ticketdesk layout + SPOQ accents; `bookavan*` i18n nl/fr/en
5. Tablet-usable primary actions
6. Home/nav link to BookAVan for authenticated users

## Tasks / Subtasks

- [x] Page + loading.tsx
- [x] Form, claim dialog, rules, status components
- [x] Translations nl/fr/en
- [x] Home card link
- [x] SPOQ CSS tokens in globals.css

## Dev Agent Record

### Agent Model Used

Cursor Grok 4.5

### Completion Notes List

- Hybrid Ticketdesk layout with SPOQ teal/navy accents.
- Claim terms via native `<dialog>`.

### File List

- `app/bookavan/page.tsx`
- `app/bookavan/loading.tsx`
- `components/bookavan/ReservationForm.tsx`
- `components/bookavan/ClaimDialog.tsx`
- `components/bookavan/RulesPanel.tsx`
- `components/bookavan/VehicleStatusCard.tsx`
- `lib/translations.ts`
- `app/globals.css`
- `app/page.tsx`
