---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
completedAt: '2026-08-03'
releaseMode: phased
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-08-03-1021.md'
  - 'SPOQ Tools/SPOQ - Bakwagen/spoq_bakwagen_reservatie(1).html'
  - 'SPOQ Tools/SPOQ - Inventory/marketing-inventaris-met-merkkleuren (1).html'
  - '_bmad-output/project-context.md'
  - 'docs/index.md'
  - 'docs/project-overview.md'
  - 'docs/architecture.md'
  - 'docs/api-contracts.md'
  - 'docs/data-models.md'
  - 'docs/component-inventory.md'
  - 'docs/source-tree-analysis.md'
  - 'docs/development-guide.md'
  - 'docs/deployment-guide.md'
workflowType: 'prd'
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 9
  mockupCount: 2
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: brownfield
---

# Product Requirements Document - Ticketdesk (BookAVan + Marketing Inventaris)

**Author:** Kevin  
**Date:** 2026-08-03

## Executive Summary

Ticketdesk expands from support-ticket management into an internal operations hub with two modules: **BookAVan** (bakwagen reservation) and **Marketing Inventaris** (marketing asset inventory and lending). Both replace standalone HTML prototypes with authenticated, database-backed features in the existing Next.js platform.

**Target users:** All Azure AD–authenticated employees use BookAVan; a marketing allowlist (`isMarketing()`) manages inventaris, loans, and photos. **Problem:** Reservations and inventory live in browser-local demos—no shared truth, no real auth, no link between vehicle bookings and material loans. **Outcome:** One platform, one data model (`Entity` / `Item` / `Loan`), full traceability from booking through return and cancel.

### What Makes This Special

Architecture-first integration: Phase 1 BookAVan uses the shared `Loan` model so Phase 2 can treat the bakwagen as an inventory item and surface reservations as loans—without a rewrite. Reuses Ticketdesk auth (Azure AD + tenant allowlist), i18n (nl/fr/en), and UI patterns; hybrid visual style (Ticketdesk layout + SPOQ accents). Differentiator vs. Excel/separate tools: overlap-aware availability, cancel-to-free slots, damage/fine claim acceptance, multi-entity inventory with KPIs, overdue tracking, and object-store photo galleries—all under existing SSO.

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Project Type** | web_app |
| **Domain** | general (internal ops: vehicle reservation + asset inventory) |
| **Complexity** | low |
| **Project Context** | brownfield (modules on existing Ticketdesk monolith) |

## Success Criteria

### User Success

- **BookAVan:** Employee completes bakwagen booking in one flow (form + damage/fine claim acceptance), sees availability/overlap blocking immediately, finds reservations in planning/history, and can cancel to free the slot.
- **Marketing:** Marketing user manages items (CRUD), checks out/returns loans, and sees KPIs (total/available/loaned/reorder) and overdue signals without Excel.
- **Aha-moment:** Reservation or loan is traceable across entities; bakwagen later appears as an inventory item with the same loan history.

### Business Success

- Browser-local HTML demos replaced by one SSO-bound tool inside Ticketdesk.
- Phase 1 (BookAVan) live and usable before Phase 2; no double data-entry between reservation and inventaris after bakwagen integration.
- Adoption: bakwagen reservations go through `/bookavan` instead of ad-hoc channels; marketing inventaris is the source of truth for materials.

### Technical Success

- Shared data model: `Entity`, `Item`, `Loan` (reservation = loan).
- Auth: BookAVan = all authenticated users; Marketing = `isMarketing()` + `MARKETING_USERS` (same pattern as `isAdmin()`).
- Overlap detection on reservation dates; cancel restores availability; S3-compatible photo storage; i18n nl/fr/en; existing Ticketdesk patterns.

### Measurable Outcomes

| Metric | Target |
|--------|--------|
| BookAVan booking flow | End-to-end create + history + availability + cancel |
| Double-booking | 0 overlapping active reservations allowed |
| Marketing MVP | Items CRUD + loans + KPIs + filters + photos in first inventory iteration |
| Bakwagen bridge | BookAVan loans visible on bakwagen item in inventaris |
| Auth isolation | Non-marketing users receive 403 on `/marketing` APIs |

## Product Scope

### MVP - Minimum Viable Product

**Phase 1 — BookAVan:** Shared foundation (`Entity`/`Item`/`Loan`, seed bakwagen, `isMarketing()` ready), reservation API (create/list/cancel + overlap), `/bookavan` UI (form, claim, status, rules, history, cancel), nav + translations.

**Phase 2 — Marketing Inventaris (full first iteration):** Items CRUD, dashboard KPIs + filters, detail + history, checkout/return + overdue, bakwagen integration, photo upload + gallery.

Detail and risks: see [Project Scoping & Phased Development](#project-scoping--phased-development).

### Growth Features (Post-MVP)

- Notifications (email/Teams) on reservation confirmation or overdue loans
- Calendar view for BookAVan; bulk CSV export (in inventaris mockup)
- Fine-grained roles within marketing; mutation audit log

### Vision (Future)

- More shareable assets (beyond bakwagen) via the same Loan model
- Cross-module analytics (usage per entity, peak periods)
- Optional: external/partner bookings with a separate auth path

## User Journeys

### Journey 1: Sofie — BookAVan happy path

**Persona:** Sofie (Sales, ACEG), Azure AD user.  
**Opening:** Needs bakwagen for a trade fair; previously arranged via chat/Excel with unclear availability.  
**Rising action:** Ticketdesk → BookAVan → available → fills driver/department/from–to/destination/reason → accepts claim terms.  
**Climax:** Confirmed; no overlap; reservation in planning as “Gereserveerd”.  
**Resolution:** Shared schedule is the source of truth.  
**Capabilities:** Auth, availability, booking form, claim modal, create, history, i18n.

### Journey 2: Tom — Overlap / claim / cancel edge cases

**Persona:** Tom (Marketing).  
**Opening:** Wants the same Friday as Sofie, or booked and plans change.  
**Rising action:** Overlap blocks submit; missing claim checkbox blocks confirm; or he cancels an active booking.  
**Climax:** Booking succeeds only when free + claim accepted; cancel frees the period for others.  
**Resolution:** No double-booking; liability recorded; slots reclaimable.  
**Capabilities:** Overlap detection, validation, claim required, cancel reservation, clear errors/toasts.

### Journey 3: Lien — Marketing inventaris + lending

**Persona:** Lien (Marketing allowlist).  
**Opening:** Needs beachflags for a SPOQ event; Excel is outdated.  
**Rising action:** `/marketing` → KPIs → filter entity/category → item detail → checkout → upload photos.  
**Climax:** Stock and “Uitgeleend” KPI update; open loans show due dates.  
**Resolution:** Current stock without spreadsheet chase.  
**Capabilities:** Marketing guard, CRUD, KPIs, filters, detail, checkout/return, photos, loan panel.

### Journey 4: Marc — No marketing access

**Persona:** Marc (HR).  
**Opening:** Tries `/marketing` or probes the API.  
**Climax:** UI deny/redirect; API 403. BookAVan still works.  
**Resolution:** Inventaris stays allowlist-only.  
**Capabilities:** Route + API marketing guard; nav for marketing users only.

### Journey 5: Ops — Bakwagen as inventory item (Phase 2)

**Persona:** Lien (after Phase 2).  
**Opening:** Wants bakwagen history alongside other materials.  
**Rising action:** Opens bakwagen item; sees BookAVan reservations as loans.  
**Climax:** One history for vehicle and materials.  
**Resolution:** No parallel administration.  
**Capabilities:** Bakwagen as Item, unified Loan reads, bridged history.

### Journey Requirements Summary

| Area | From journeys |
|------|----------------|
| Booking | Form fields, claim acceptance, availability, history, cancel |
| Conflict handling | Date overlap block, validation messages |
| Marketing ops | CRUD, KPIs, filters, checkout/return, photos |
| AuthZ | All-users BookAVan vs marketing allowlist |
| Cross-module | Bakwagen Item + shared Loan visibility |

## Web App Specific Requirements

### Project-Type Overview

Authenticated internal web modules in the Ticketdesk Next.js 15 monolith. Routes: `/bookavan` (all authenticated users), `/marketing` and item detail (marketing-authorized). Same App Router + API route patterns as tickets/admin.

### Technical Architecture Considerations

- **Stack:** Next.js 15 App Router, React 19, Prisma/PostgreSQL, NextAuth Azure AD, Tailwind, nl/fr/en via `LanguageContext`
- **Data:** Shared `Entity` / `Item` / `Loan`; BookAVan reservations are loans; Phase 2 inventaris + object-store photos
- **AuthZ:** Session required; Marketing = `isMarketing()` + `MARKETING_USERS` (mirror `isAdmin()`)
- **Out of scope:** Native mobile apps, CLI

### Browser Matrix

| Target | Support |
|--------|---------|
| Chrome, Edge, Firefox, Safari (latest 2 major) | Required |
| Mobile / tablet browsers | Responsive usable for primary tasks |
| IE / legacy | Out of scope |

### Responsive Design

- Desktop-first layouts matching Ticketdesk cards (`bg-white shadow-sm rounded-lg`, `max-w-7xl`)
- BookAVan and inventaris usable on tablet; no separate mobile app
- Hybrid visuals: Ticketdesk chrome + SPOQ accent colors from mockups

### Performance Targets

Aligned with [Non-Functional Requirements](#non-functional-requirements): sub-2s reservation/overlap path; inventaris list/KPIs within ~3s for typical catalogs; photo upload non-blocking; no optimistic double-book. Real-time sync not required.

### SEO Strategy

Not applicable — authenticated routes only; no public indexing.

### Accessibility Level

Pragmatic parity with Ticketdesk (labels, keyboard dialogs, non-color-only status). Formal WCAG audit is post-MVP optional. See NFR-A*.

### Implementation Considerations

- APIs under `/api/bookavan/*` and `/api/marketing/*` with auth + role guards
- All new UI strings in nl/fr/en
- Env: `MARKETING_USERS`, object-store credentials; seed bakwagen Item
- Deploy: existing Docker/Easypanel + Prisma workflow

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Platform MVP — ship BookAVan on the shared data model so employees get value immediately; Phase 2 inventaris plugs into the same `Loan` backbone.  
**Resources:** 1 full-stack engineer familiar with Ticketdesk; S3-compatible storage before Phase 2 photos.

### MVP Feature Set (Phase 1) — BookAVan

**Journeys:** Sofie (happy path), Tom (overlap/claim/cancel).

**Must-have:**
- Prisma: `Entity`, `Item`, `Loan` + seed bakwagen Item + entities
- `isMarketing()` + `MARKETING_USERS` (ready for Phase 2)
- Reservation API: create/list/cancel, overlap detection
- `/bookavan` UI: form, claim modal, status, rules, history, cancel
- Nav + home link + nl/fr/en

### Post-MVP Features

**Phase 2 — Marketing Inventaris (full first iteration):**
- Items CRUD API + dashboard KPIs, grid, entity/category/search filters
- Item detail + loan history; marketing auth guard + nav
- Checkout/return API + UI; overdue + “te bestellen” KPI
- Bakwagen as inventaris item; BookAVan reservations as loans
- Object-store setup, photo upload API, gallery UI (incl. thumbnails / main photo)

**Phase 3 — Growth:**
- Notifications, calendar view, CSV export, finer roles, audit log

### Risk Mitigation Strategy

| Risk | Mitigation |
|------|------------|
| **Technical** — Loan model unfit for both modules | Schema designed in Phase 1 with inventaris fields; bakwagen seeded as Item early |
| **Technical** — Double-booking | Server-side overlap check; reject concurrent conflicts |
| **Technical** — Photos delay Phase 2 | Photos remain in Phase 2 scope; storage wrapper isolatable |
| **Adoption** — Users stay on chat/Excel | Phase 1 ships usable BookAVan alone |
| **Resource** — Capacity slip | Phase 1 independently shippable |

## Functional Requirements

### Access & Authorization

- FR1: Authenticated employees can access BookAVan after signing in with the organization identity provider
- FR2: Marketing-authorized users can access Marketing Inventaris features
- FR3: Non-marketing users are denied access to Marketing Inventaris pages and APIs
- FR4: Administrators can designate which users are marketing-authorized without a separate auth system

### Vehicle Reservation

- FR5: Employees can create a bakwagen reservation with driver, department/company, start and end date-time, destination, reason, and optional notes
- FR6: Employees must accept damage and fine liability terms before a reservation is confirmed
- FR7: Employees can view the damage and fine terms before accepting them
- FR8: Employees can see whether the bakwagen is available for a selected period before confirming
- FR9: The system rejects reservation requests that overlap an existing active reservation
- FR10: Employees can view pre-departure rules/checklist related to bakwagen use

### Reservation Planning & History

- FR11: Employees can view a list of bakwagen reservations with period, driver, department, destination, reason, and status
- FR12: Employees can see current vehicle status (available vs reserved) and related context (e.g. next/active booking)
- FR13: Authenticated employees can navigate to BookAVan from the main Ticketdesk navigation/home
- FR14: Employees can cancel an active bakwagen reservation so the period becomes available again for others

### Inventory Management

- FR15: Marketing users can create inventory items with name, entity, category, location, total quantity, available quantity, minimum stock, and notes
- FR16: Marketing users can edit inventory item attributes
- FR17: Marketing users can remove inventory items
- FR18: Marketing users can view an item detail page with specifications and lending history

### Inventory Discovery & Dashboard

- FR19: Marketing users can view dashboard KPIs for total units, available, loaned, and reorder-needed
- FR20: Marketing users can filter inventory by entity
- FR21: Marketing users can filter inventory by category
- FR22: Marketing users can search inventory by text query
- FR23: Marketing users can browse inventory items in a list/grid overview
- FR24: The system indicates items that need reordering when available quantity is at or below minimum stock

### Lending

- FR25: Marketing users can check out quantity of an item to a borrower with event/reason and optional return date
- FR26: Marketing users can mark a loan as permanently lent (no return date)
- FR27: Marketing users can register full or partial return of an open loan
- FR28: Marketing users can view open loans and their due dates
- FR29: The system marks loans as overdue when the return date has passed and the loan is not returned
- FR30: Available quantity updates when items are checked out or returned
- FR31: Checkout is blocked when requested quantity exceeds available quantity

### Media

- FR32: Marketing users can upload multiple photos for an inventory item
- FR33: Marketing users can view a photo gallery for an item including a primary/main photo selection
- FR34: Marketing users can add photos from file upload or device camera capture where supported

### Cross-Module Traceability

- FR35: The bakwagen exists as an inventory item once Marketing Inventaris is available
- FR36: BookAVan reservations appear as loans on the bakwagen inventory item history
- FR37: Entities used for departments/companies and inventory ownership share one organizational entity list

### Localization & Navigation

- FR38: Users can use BookAVan and Marketing Inventaris UI in Dutch, French, and English
- FR39: Marketing-authorized users can navigate to Marketing Inventaris from Ticketdesk navigation
- FR40: Employees can complete primary BookAVan and inventaris tasks on tablet-sized viewports

## Non-Functional Requirements

### Performance

- NFR-P1: Reservation create, cancel, and availability/overlap checks complete within 2 seconds under normal internal-network conditions
- NFR-P2: Inventory list/KPI dashboard loads within 3 seconds for typical catalog sizes (hundreds of items, not tens of thousands)
- NFR-P3: Photo upload provides clear in-progress/completion feedback; individual photo processing does not block browsing other items
- NFR-P4: Concurrent reservation attempts for overlapping periods must not both succeed (conflict loses; zero double-books)

### Security

- NFR-S1: All BookAVan and Marketing Inventaris routes and APIs require an authenticated Ticketdesk session (Azure AD)
- NFR-S2: Marketing Inventaris APIs enforce marketing authorization server-side (client UI hiding alone is insufficient)
- NFR-S3: Damage/fine claim acceptance is persisted with the reservation (who accepted, that terms were accepted)
- NFR-S4: Object-storage credentials and marketing allowlist configuration remain server-side only (not exposed to the browser)
- NFR-S5: Users only mutate inventory/loans within their authorized role; cross-tenant Azure AD access remains governed by existing `ALLOWED_TENANTS`

### Accessibility

- NFR-A1: Reservation and inventaris forms expose programmatically associated labels and required-field indication
- NFR-A2: Claim/terms and checkout/return dialogs are operable via keyboard (open, dismiss, primary action)
- NFR-A3: Availability, loan status, and overdue states are not conveyed by color alone
- NFR-A4: Formal WCAG conformance audit is not an MVP gate; pragmatic parity with existing Ticketdesk UI is required

### Integration

- NFR-I1: Modules reuse existing Ticketdesk identity (NextAuth Azure AD); no parallel login
- NFR-I2: Photo storage uses an S3-compatible object store accessible via server-side configuration
- NFR-I3: Schema and deploy path remain compatible with existing Docker/Easypanel + Prisma workflow
