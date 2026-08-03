---
stepsCompleted: ['step-01-requirements-extracted', 'step-02-epics-designed', 'step-03-stories-drafted', 'step-03-complete', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd-bookavan-marketing.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/project-context.md'
workflowType: 'epics-and-stories'
project_name: 'Ticketdesk'
scope: 'BookAVan + Marketing Inventaris'
date: '2026-08-03'
status: complete
completedAt: '2026-08-03'
---

# Ticketdesk - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Ticketdesk (BookAVan + Marketing Inventaris), decomposing the requirements from the PRD and Architecture into implementable stories. No separate UX Design document exists; UX requirements are derived from the hybrid mockup-migration approach agreed in PRD/Architecture.

## Requirements Inventory

### Functional Requirements

FR1: Authenticated employees can access BookAVan after signing in with the organization identity provider
FR2: Marketing-authorized users can access Marketing Inventaris features
FR3: Non-marketing users are denied access to Marketing Inventaris pages and APIs
FR4: Administrators can designate which users are marketing-authorized without a separate auth system
FR5: Employees can create a bakwagen reservation with driver, department/company, start and end date-time, destination, reason, and optional notes
FR6: Employees must accept damage and fine liability terms before a reservation is confirmed
FR7: Employees can view the damage and fine terms before accepting them
FR8: Employees can see whether the bakwagen is available for a selected period before confirming
FR9: The system rejects reservation requests that overlap an existing active reservation
FR10: Employees can view pre-departure rules/checklist related to bakwagen use
FR11: Employees can view a list of bakwagen reservations with period, driver, department, destination, reason, and status
FR12: Employees can see current vehicle status (available vs reserved) and related context (e.g. next/active booking)
FR13: Authenticated employees can navigate to BookAVan from the main Ticketdesk navigation/home
FR14: Employees can cancel an active bakwagen reservation so the period becomes available again for others
FR15: Marketing users can create inventory items with name, entity, category, location, total quantity, available quantity, minimum stock, and notes
FR16: Marketing users can edit inventory item attributes
FR17: Marketing users can remove inventory items
FR18: Marketing users can view an item detail page with specifications and lending history
FR19: Marketing users can view dashboard KPIs for total units, available, loaned, and reorder-needed
FR20: Marketing users can filter inventory by entity
FR21: Marketing users can filter inventory by category
FR22: Marketing users can search inventory by text query
FR23: Marketing users can browse inventory items in a list/grid overview
FR24: The system indicates items that need reordering when available quantity is at or below minimum stock
FR25: Marketing users can check out quantity of an item to a borrower with event/reason and optional return date
FR26: Marketing users can mark a loan as permanently lent (no return date)
FR27: Marketing users can register full or partial return of an open loan
FR28: Marketing users can view open loans and their due dates
FR29: The system marks loans as overdue when the return date has passed and the loan is not returned
FR30: Available quantity updates when items are checked out or returned
FR31: Checkout is blocked when requested quantity exceeds available quantity
FR32: Marketing users can upload multiple photos for an inventory item
FR33: Marketing users can view a photo gallery for an item including a primary/main photo selection
FR34: Marketing users can add photos from file upload or device camera capture where supported
FR35: The bakwagen exists as an inventory item once Marketing Inventaris is available
FR36: BookAVan reservations appear as loans on the bakwagen inventory item history
FR37: Entities used for departments/companies and inventory ownership share one organizational entity list
FR38: Users can use BookAVan and Marketing Inventaris UI in Dutch, French, and English
FR39: Marketing-authorized users can navigate to Marketing Inventaris from Ticketdesk navigation
FR40: Employees can complete primary BookAVan and inventaris tasks on tablet-sized viewports

### NonFunctional Requirements

NFR1: Reservation create, cancel, and availability/overlap checks complete within 2 seconds under normal internal-network conditions (NFR-P1)
NFR2: Inventory list/KPI dashboard loads within 3 seconds for typical catalog sizes (NFR-P2)
NFR3: Photo upload provides clear in-progress/completion feedback; individual photo processing does not block browsing other items (NFR-P3)
NFR4: Concurrent reservation attempts for overlapping periods must not both succeed — zero double-books (NFR-P4)
NFR5: All BookAVan and Marketing Inventaris routes and APIs require an authenticated Ticketdesk session / Azure AD (NFR-S1)
NFR6: Marketing Inventaris APIs enforce marketing authorization server-side (NFR-S2)
NFR7: Damage/fine claim acceptance is persisted with the reservation (who + that terms were accepted) (NFR-S3)
NFR8: Object-storage credentials and marketing allowlist remain server-side only (NFR-S4)
NFR9: Users only mutate inventory/loans within their authorized role; tenant access via existing ALLOWED_TENANTS (NFR-S5)
NFR10: Forms expose associated labels and required-field indication (NFR-A1)
NFR11: Claim/terms and checkout/return dialogs are keyboard-operable (NFR-A2)
NFR12: Availability, loan status, and overdue states are not conveyed by color alone (NFR-A3)
NFR13: Formal WCAG audit is not an MVP gate; pragmatic Ticketdesk UI parity required (NFR-A4)
NFR14: Modules reuse existing NextAuth Azure AD identity; no parallel login (NFR-I1)
NFR15: Photo storage uses S3-compatible object store via server-side configuration (NFR-I2)
NFR16: Schema and deploy path remain compatible with Docker/Easypanel + Prisma workflow (NFR-I3)

### Additional Requirements

- Brownfield: no starter template / no create-next-app; extend existing Ticketdesk (Next.js ^15.x only — not v16+)
- Prisma models: `Entity`, `Item`, `Loan`, `ItemPhoto` with enums `LoanType` (RESERVATION | INVENTORY) and `LoanStatus` (ACTIVE | RETURNED | CANCELLED | OVERDUE as needed)
- Loan field `permanent: Boolean` for permanent inventory loans
- Overlap: Prisma `$transaction` + `SELECT … FOR UPDATE` on bakwagen Item; exclude CANCELLED from overlap
- Cancel auth: creator email OR isMarketing/isAdmin; soft status CANCELLED frees slot
- `isMarketing(email)` beside `isAdmin` + `MARKETING_USERS` env
- Validation: Zod ^4.x in `lib/validators/*` (client + server)
- API errors: `{ message }` + status; 409 for overlap / unauthorized cancel
- BookAVan APIs: GET/POST `/api/bookavan/reservations`, cancel on `[id]`, GET `/api/bookavan/availability`
- Marketing APIs: items CRUD, loans checkout/return, photos, `/api/marketing/check`
- Object storage: `lib/storage.ts` + `@aws-sdk/client-s3`; env `S3_*`; ItemPhoto in Phase 1 schema, upload in Phase 2
- Seed: entities + bakwagen as first Item
- Document new env keys in `.env.example`
- Follow `project-context.md` patterns (auth, `@/` imports, Prisma singleton, i18n nl/fr/en)
- Implementation order: Foundation → BookAVan → Inventaris core → Lending → Photos → bakwagen bridge

### UX Design Requirements

_No separate UX Design document. Derived from PRD + Architecture (hybrid mockup migration)._

UX-DR1: Migrate BookAVan mockup flows into Ticketdesk layout (cards, nav, max-w-7xl) with SPOQ accent color tokens — not a standalone visual redesign
UX-DR2: Implement BookAVan page composition: reservation form, availability status, claim/terms dialog, pre-departure rules panel, reservation history table
UX-DR3: Implement Marketing dashboard composition: KPI bar (total/available/loaned/reorder), entity/category/search filters, item grid/list
UX-DR4: Implement item detail layout with specs, lending history, and photo gallery (main photo + thumbnail strip)
UX-DR5: Use native `<dialog>` for claim, checkout, return, and item create/edit modals with keyboard open/dismiss/primary action
UX-DR6: Organize UI under `components/bookavan/*` and `components/marketing/*` (PascalCase component files)
UX-DR7: All new user-facing strings via `lib/translations.ts` keys (`bookavan.*`, `marketing.*`) in nl/fr/en
UX-DR8: Status/availability/overdue indicators must include text or icons, not color alone
UX-DR9: Primary BookAVan and inventaris tasks usable on tablet-sized viewports
UX-DR10: Loading: route `loading.tsx` plus local submitting/loading flags on forms; photo upload shows in-progress feedback
UX-DR11: After create/cancel/checkout/return, refetch or update list state from API response (no global event bus)
UX-DR12: Nav/home links for BookAVan (all users) and Marketing Inventaris (marketing users only)

### FR Coverage Map

FR1: Epic 1 — Access BookAVan when authenticated
FR2: Epic 2 — Marketing users access inventaris
FR3: Epic 2 — Non-marketing denied inventaris
FR4: Epic 1 — MARKETING_USERS / isMarketing designation (enables Epic 2)
FR5: Epic 1 — Create bakwagen reservation
FR6: Epic 1 — Claim acceptance required
FR7: Epic 1 — View claim terms
FR8: Epic 1 — See availability for period
FR9: Epic 1 — Reject overlapping reservations
FR10: Epic 1 — Pre-departure rules panel
FR11: Epic 1 — Reservation list/history
FR12: Epic 1 — Vehicle status display
FR13: Epic 1 — Navigate to BookAVan
FR14: Epic 1 — Cancel reservation (frees slot)
FR15: Epic 2 — Create inventory item
FR16: Epic 2 — Edit inventory item
FR17: Epic 2 — Remove inventory item
FR18: Epic 2 — Item detail + history shell
FR19: Epic 2 — Dashboard KPIs
FR20: Epic 2 — Filter by entity
FR21: Epic 2 — Filter by category
FR22: Epic 2 — Search inventory
FR23: Epic 2 — Browse item grid/list
FR24: Epic 2 — Reorder / min-stock indication
FR25: Epic 3 — Checkout loan
FR26: Epic 3 — Permanent loan
FR27: Epic 3 — Full/partial return
FR28: Epic 3 — View open loans
FR29: Epic 3 — Overdue marking
FR30: Epic 3 — Available qty updates
FR31: Epic 3 — Block over-checkout
FR32: Epic 4 — Upload photos
FR33: Epic 4 — Photo gallery + main photo
FR34: Epic 4 — File/camera capture
FR35: Epic 3 — Bakwagen as inventaris item
FR36: Epic 3 — BookAVan reservations on bakwagen history
FR37: Epic 1 — Shared Entity list (departments + inventaris)
FR38: Epic 1 + Epic 2 — i18n nl/fr/en for module UI
FR39: Epic 2 — Navigate to Marketing Inventaris
FR40: Epic 1 + Epic 2 — Tablet-usable primary tasks

## Epic List

### Epic 1: Bakwagen reservatie (BookAVan)
Employees can reserve the company bakwagen with availability checks, damage/fine claim acceptance, planning history, and cancel-to-free-slot — delivered inside Ticketdesk with shared domain foundation.
**FRs covered:** FR1, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR37, FR38 (BookAVan), FR40 (BookAVan)

### Epic 2: Marketing inventaris beheren
Marketing-authorized users can manage inventory items (CRUD), browse with KPIs/filters/search, and open item detail — gated by server-side marketing auth.
**FRs covered:** FR2, FR3, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR38 (marketing), FR39, FR40 (inventaris)

### Epic 3: Materiaal uitlenen & bakwagen-brug
Marketing users can check out/return inventory (including permanent and overdue), and see the bakwagen as an inventaris item with BookAVan reservations in loan history.
**FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR35, FR36

### Epic 4: Inventaris foto’s
Marketing users can upload and browse item photos (gallery, main photo, file/camera) via S3-compatible storage.
**FRs covered:** FR32, FR33, FR34

## Epic 1: Bakwagen reservatie (BookAVan)

Employees can reserve the company bakwagen with availability checks, damage/fine claim acceptance, planning history, and cancel-to-free-slot — delivered inside Ticketdesk with shared domain foundation.

### Story 1.1: Shared domain foundation for reservations

As an authenticated employee,
I want the bakwagen and organization entities available in Ticketdesk’s data model,
So that reservations can be stored and later linked to inventaris.

**Acceptance Criteria:**

**Given** the Ticketdesk Prisma schema
**When** schema changes are applied
**Then** models `Entity`, `Item`, `Loan`, and `ItemPhoto` exist with `LoanType` (`RESERVATION` | `INVENTORY`), `LoanStatus` including at least `ACTIVE` and `CANCELLED`, and `Loan.permanent` boolean
**And** a seed loads shared entities (for departments/companies) and one bakwagen `Item`
**And** `isMarketing(email)` is implemented beside `isAdmin` using `MARKETING_USERS` (case-insensitive)
**And** `.env.example` documents `MARKETING_USERS`
**And** existing Ticket-related models remain unchanged

### Story 1.2: Reservation API with availability and overlap protection

As an authenticated employee,
I want to create and list bakwagen reservations via API with overlap protection,
So that double-booking is impossible and planning data is reliable.

**Acceptance Criteria:**

**Given** an authenticated session
**When** I `POST /api/bookavan/reservations` with driver, department/entity, start/end, destination, reason, optional notes, and claim acceptance
**Then** a `Loan` of type `RESERVATION` with status `ACTIVE` is created with `claimAcceptedAt` and `claimAcceptedBy` persisted
**And** creation runs in a transaction that locks the bakwagen `Item` and rejects overlapping non-`CANCELLED` reservations with `409` and `{ message }`
**And** `GET /api/bookavan/reservations` returns reservations with period, driver, department, destination, reason, and status
**And** `GET /api/bookavan/availability?from=&to=` indicates whether the period is free
**And** unauthenticated requests receive `401`
**And** Zod validation rejects invalid payloads with `400`

### Story 1.3: Cancel reservation API

As an authenticated employee (owner) or marketing/admin user,
I want to cancel an active bakwagen reservation,
So that the time slot becomes available again for others.

**Acceptance Criteria:**

**Given** an active `RESERVATION` loan
**When** the creator, an `isMarketing` user, or an `isAdmin` user cancels via `/api/bookavan/reservations/[id]`
**Then** status becomes `CANCELLED` and the period no longer counts in overlap/availability checks
**And** a different authenticated non-owner non-marketing non-admin user receives `409` or `403` with a clear message
**And** cancelling an already cancelled reservation fails with a clear error

### Story 1.4: BookAVan booking page

As an authenticated employee,
I want a BookAVan page to book the bakwagen and see availability and rules,
So that I can reserve in one guided flow inside Ticketdesk.

**Acceptance Criteria:**

**Given** I am signed in
**When** I open `/bookavan`
**Then** I see vehicle status, a reservation form (driver, department, from/to datetime, destination, reason, notes), claim checkbox with terms dialog, pre-departure rules panel, and availability feedback (UX-DR2, UX-DR5)
**And** I cannot submit without accepting claim terms (FR6/FR7)
**And** overlapping periods are blocked with a clear message before/on submit (FR8/FR9)
**And** UI uses Ticketdesk layout + SPOQ accents and `bookavan.*` translations nl/fr/en (UX-DR1, UX-DR7)
**And** primary actions are usable on tablet viewports (FR40)
**And** nav/home links to BookAVan exist for authenticated users (FR13, UX-DR12)

### Story 1.5: Reservation history and cancel in UI

As an authenticated employee,
I want to see reservation history and cancel my booking from the UI,
So that planning is visible and I can free a slot when plans change.

**Acceptance Criteria:**

**Given** reservations exist
**When** I view BookAVan planning/history
**Then** I see period, driver, department, destination, reason, and status (FR11/FR12)
**And** I can cancel an eligible active reservation and the UI refreshes to show `CANCELLED` and updated availability (FR14, UX-DR11)
**And** status is not color-only (UX-DR8)
**And** forms/dialogs meet label and keyboard basics (NFR10/NFR11)

## Epic 2: Marketing inventaris beheren

Marketing-authorized users can manage inventory items (CRUD), browse with KPIs/filters/search, and open item detail — gated by server-side marketing auth.

### Story 2.1: Marketing auth guard and navigation

As a marketing-authorized user,
I want inventaris routes protected and linked in navigation,
So that only the right people manage marketing materials.

**Acceptance Criteria:**

**Given** `MARKETING_USERS` is configured
**When** a marketing user calls `GET /api/marketing/check` or opens `/marketing`
**Then** access is allowed and Marketing appears in nav (FR2, FR39)
**And** a non-marketing authenticated user gets `403` on marketing APIs and is denied/redirected from `/marketing` (FR3, NFR6)
**And** unauthenticated users get `401` / sign-in redirect (NFR5)

### Story 2.2: Items CRUD API

As a marketing user,
I want to create, read, update, and delete inventory items via API,
So that inventaris data is the source of truth.

**Acceptance Criteria:**

**Given** a marketing session
**When** I `POST/GET/PUT/DELETE /api/marketing/items` (and `[id]`)
**Then** items support name, entity, category, location, total, available, minStock, notes (FR15–17)
**And** list supports filter by entity/category and text search (FR20–22)
**And** Zod validates payloads; non-marketing receives `403`

### Story 2.3: Inventaris dashboard with KPIs and filters

As a marketing user,
I want a dashboard with KPIs, filters, and an item grid,
So that I can find materials and see stock health at a glance.

**Acceptance Criteria:**

**Given** inventory items exist
**When** I open `/marketing`
**Then** I see KPIs for total, available, loaned, and reorder-needed (FR19, FR24)
**And** I can filter by entity/category, search, and browse a grid/list (FR20–23, UX-DR3)
**And** reorder-needed reflects available ≤ minStock
**And** UI uses marketing translations + Ticketdesk/SPOQ hybrid styling; tablet-usable (FR38, FR40, UX-DR1, UX-DR7, UX-DR9)
**And** KPI/status cues are not color-only (UX-DR8)

### Story 2.4: Item detail page

As a marketing user,
I want an item detail page with specs and lending history,
So that I can inspect one asset before lending or editing.

**Acceptance Criteria:**

**Given** an item id
**When** I open `/marketing/items/[id]`
**Then** I see item specifications and lending history section (FR18, UX-DR4)
**And** I can navigate back to the dashboard
**And** edit entry points exist for later/edit flows (at least link/button to edit)
**And** non-marketing users cannot access the page

### Story 2.5: Create and edit items in UI

As a marketing user,
I want dialogs to add and edit items,
So that I can maintain inventaris without leaving the app.

**Acceptance Criteria:**

**Given** I am on inventaris UI
**When** I create or edit an item via modal/dialog
**Then** required fields are labeled and validated (FR15–16, UX-DR5, NFR10)
**And** successful save refreshes list/detail (UX-DR11)
**And** I can delete an item with confirmation (FR17)

## Epic 3: Materiaal uitlenen & bakwagen-brug

Marketing users can check out/return inventory (including permanent and overdue), and see the bakwagen as an inventaris item with BookAVan reservations in loan history.

### Story 3.1: Checkout and return API

As a marketing user,
I want APIs to check out and return inventory loans,
So that stock quantities stay accurate.

**Acceptance Criteria:**

**Given** an item with available quantity > 0
**When** I `POST /api/marketing/loans` with borrower, event/reason, quantity, optional dueDate, optional `permanent: true`
**Then** an `INVENTORY` loan is created and available quantity decreases (FR25–26, FR30)
**And** checkout above available quantity is rejected (FR31)
**And** return via `/api/marketing/loans/[id]` supports full or partial quantity and updates available (FR27, FR30)
**And** open loans can be listed with due dates; overdue loans are detectable when dueDate passed and not returned (FR28–29)
**And** non-marketing receives `403`

### Story 3.2: Checkout, return, and open loans UI

As a marketing user,
I want checkout/return dialogs and an open-loans panel,
So that day-to-day lending is tracked in the UI.

**Acceptance Criteria:**

**Given** inventaris UI for an item or dashboard
**When** I check out or return material
**Then** modals capture borrower, event, quantity, due date / permanent flag (FR25–27, UX-DR5)
**And** open loans panel shows due dates and overdue indication with non-color-only cues (FR28–29, UX-DR8)
**And** KPIs for loaned/available update after actions (FR19, FR30, UX-DR11)
**And** checkout blocked state is clear when none available (FR31)

### Story 3.3: Bakwagen as inventaris item with reservation history

As a marketing user,
I want the bakwagen visible as an inventaris item with BookAVan reservations in its history,
So that vehicle usage and material loans share one traceability model.

**Acceptance Criteria:**

**Given** Phase 1 bakwagen `Item` and BookAVan `RESERVATION` loans exist
**When** I open the bakwagen item in Marketing Inventaris
**Then** the item is listed/filterable like other items (FR35)
**And** lending/reservation history includes BookAVan reservations as loans (FR36)
**And** no duplicate bakwagen administration is required

## Epic 4: Inventaris foto’s

Marketing users can upload and browse item photos (gallery, main photo, file/camera) via S3-compatible storage.

### Story 4.1: Object storage wrapper and env configuration

As a marketing user,
I want photo storage configured server-side,
So that images are stored securely outside the app database.

**Acceptance Criteria:**

**Given** S3-compatible credentials in server env
**When** `lib/storage.ts` is used
**Then** upload/delete (or equivalent) operations work against the configured bucket
**And** credentials are never exposed with `NEXT_PUBLIC_` (NFR8, NFR15)
**And** `.env.example` documents `S3_*` variables
**And** deploy path remains Docker/Easypanel compatible (NFR16)

### Story 4.2: Photo upload API

As a marketing user,
I want to upload multiple photos for an item via API,
So that visual references are attached to inventaris records.

**Acceptance Criteria:**

**Given** a marketing session and an item id
**When** I `POST /api/marketing/items/[id]/photos` with one or more files
**Then** `ItemPhoto` rows are created with storage keys/URLs
**And** non-marketing receives `403`
**And** upload failures return clear `{ message }` errors without blocking other items (NFR3)

### Story 4.3: Photo gallery UI

As a marketing user,
I want a gallery with main photo selection and file/camera capture,
So that I can manage item imagery from the detail page.

**Acceptance Criteria:**

**Given** an item detail page
**When** photos exist or I upload new ones
**Then** I see a gallery with thumbnail strip and can select a main/primary photo (FR32–33, UX-DR4)
**And** I can add photos via file upload and device camera capture where supported (FR34)
**And** upload shows in-progress/completion feedback (UX-DR10, NFR3)
**And** UI remains keyboard-accessible for primary actions (NFR11)
