---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: complete
completedAt: '2026-08-03'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd-bookavan-marketing.md'
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
workflowType: 'architecture'
project_name: 'Ticketdesk'
user_name: 'Kevin'
date: '2026-08-03'
lastStep: 1
scope: 'BookAVan + Marketing Inventaris'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**  
40 FRs across Access & Authorization, Vehicle Reservation, Reservation Planning & History (incl. cancel), Inventory Management, Inventory Discovery & Dashboard, Lending, Media, Cross-Module Traceability, Localization & Navigation. Architecturally: (1) shared domain schema, (2) BookAVan reservation API/UI with overlap + claim + cancel, (3) Marketing inventaris CRUD/KPIs/loans, (4) object-store media, (5) bakwagen bridge via unified Loan. Brainstorm maps to 5 epics / 16 stories (Foundation → BookAVan → Inventaris core → Lending → Photos).

**Non-Functional Requirements:**  
Performance (≤2s reservation/overlap/cancel; ≤3s inventaris lists; non-blocking uploads; zero double-books). Security (session on all routes; server-side marketing guard; persisted claim acceptance; secrets server-only). Accessibility (pragmatic Ticketdesk parity). Integration (reuse Azure AD; S3-compatible photos; Docker/Easypanel + Prisma).

**Scale & Complexity:**

- Primary domain: full-stack brownfield web (Next.js App Router + Prisma)
- Complexity level: low–medium (extends existing patterns; new domain models + object storage; no multi-tenant SaaS redesign)
- Estimated architectural components: ~8 (Entity/Item/Loan schema + seed; `isMarketing`; bookavan API/pages; marketing API/pages; loan/checkout services; `lib/storage`; photo API; nav/i18n)

**UX approach (no separate UX doc):** Migrate SPOQ HTML mockup flows into Ticketdesk layout/components with SPOQ accent colors.

### Technical Constraints & Dependencies

- Stay on Next.js 15 / existing Ticketdesk stack (`project-context.md`)
- Auth: NextAuth Azure AD + `ALLOWED_TENANTS`; extend `lib/admin.ts` pattern for marketing
- Prisma/PostgreSQL; deploy via `db push` / existing startup
- Phase 1 schema must already support Phase 2 (bakwagen as Item, reservation as Loan)
- New env: `MARKETING_USERS`, S3-compatible credentials
- Client data fetching: `useState` + `useEffect` + `fetch` (no React Query)

### Cross-Cutting Concerns Identified

- Unified Loan model across BookAVan and inventaris
- Role gating: authenticated vs marketing vs admin
- Date-overlap concurrency for single bakwagen resource
- Claim/liability persistence on reservations
- i18n (nl/fr/en) for all new UI
- Hybrid visual language (Ticketdesk + SPOQ accents)
- Object storage abstraction for photos (Phase 2)
- Phased delivery: BookAVan independently shippable

## Starter Template Evaluation

### Primary Technology Domain

Full-stack brownfield web (Next.js 15 App Router monolith) — modules added to existing Ticketdesk codebase.

### Starter Options Considered

| Option | Verdict |
|--------|---------|
| `create-next-app@latest` | Rejected — greenfield; current defaults target Next.js 16; project locked to ^15.x |
| T3 / similar meta-starters | Rejected — would duplicate/conflict with existing auth, Prisma, deploy path |
| **Extend existing Ticketdesk repo** | Selected |

### Selected Starter: Not Applicable (Brownfield)

**Rationale:** BookAVan and Marketing Inventaris extend the running Ticketdesk application. Architectural foundations already exist; first implementation work is schema + routes inside this repo, not `create-*` scaffolding.

**Initialization Command:**

```bash
# N/A — work in existing repository
# Ensure local env is ready, then implement against current stack:
npm install
npx prisma generate
npm run dev
```

**Architectural Decisions Already Provided by Existing App:**

**Language & Runtime:** TypeScript ^5.7 strict, Node 20 Alpine, Next.js ^15.4 standalone  
**Styling:** Tailwind CSS ^3.4, Ticketdesk card patterns + SPOQ accents for new modules  
**Build Tooling:** `prisma generate && next build`, Docker multi-stage, Easypanel  
**Testing:** Follow existing project practices (no new test runner mandated by this architecture step)  
**Code Organization:** `app/` routes + API, `components/`, `lib/`, `prisma/`, `@/` aliases  
**Development Experience:** NextAuth session, LanguageProvider, existing middleware/tenant allowlist  

**Note:** No project-init story. First stories = Prisma foundation + BookAVan per PRD Phase 1.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (block implementation):**
- Shared Prisma models: `Entity`, `Item`, `Loan` (`type` enum), `ItemPhoto`
- Overlap concurrency via transaction + row lock; cancelled loans excluded from overlap
- Cancel auth: owner or marketing/admin only; status `CANCELLED` frees the slot
- `isMarketing()` + server-side API guards
- REST API routes under `/api/bookavan/*` and `/api/marketing/*`

**Important (shape architecture):**
- Zod validation (client + server); `zod` ^4.x
- Component folders `components/bookavan|marketing`
- S3-compatible `lib/storage.ts` via `@aws-sdk/client-s3` ^3.x
- Hybrid Ticketdesk + SPOQ accent UI

**Deferred:**
- Caching, rate limiting, OpenAPI, monitoring/scaling changes, hard-binding to one S3 vendor

### Data Architecture

| Decision | Choice |
|----------|--------|
| DB/ORM | PostgreSQL + Prisma (existing) |
| Domain model | `Entity`, `Item`, `Loan`, `ItemPhoto` |
| Loan discrimination | Single `Loan` table + `type`: `RESERVATION` \| `INVENTORY` |
| Overlap | DB transaction + `SELECT … FOR UPDATE` on bakwagen Item; only non-cancelled reservations compete |
| Cancel | Soft status `CANCELLED`; period reusable for new bookings |
| Validation | Zod ^4.4.x shared schemas |
| Photos | `ItemPhoto` rows + S3 objects; schema in foundation, upload in Phase 2 |
| Caching | Deferred |

### Authentication & Security

| Decision | Choice |
|----------|--------|
| AuthN | Existing NextAuth Azure AD + `ALLOWED_TENANTS` |
| Marketing AuthZ | `isMarketing(email)` beside `isAdmin` + `MARKETING_USERS` |
| Guards | API: `auth()`→401, role→403; pages: `/api/marketing/check` + redirect |
| Cancel AuthZ | Creator email **or** marketing/admin |
| Claim | Persist `claimAcceptedAt` + `claimAcceptedBy` on create |
| Secrets | Server-only env (no `NEXT_PUBLIC_` for S3/keys) |

### API & Communication Patterns

| Decision | Choice |
|----------|--------|
| Style | REST App Router handlers |
| Errors | `{ message: string }` + status (existing) |
| Conflicts | `409` for overlap / unauthorized cancel |
| BookAVan | `GET/POST /api/bookavan/reservations`, cancel on `[id]`, `GET /api/bookavan/availability` |
| Marketing | items CRUD, loans checkout/return, photos, `/api/marketing/check` |
| Rate limit / OpenAPI | Deferred |

### Frontend Architecture

| Decision | Choice |
|----------|--------|
| Fetching | `useState` + `useEffect` + `fetch` |
| Components | `components/bookavan/*`, `components/marketing/*` |
| Forms | Controlled + Zod client/server |
| Dialogs | Native `<dialog>` |
| Styling | Ticketdesk cards + SPOQ accent tokens |
| i18n | All strings in `lib/translations.ts` (nl/fr/en) |

### Infrastructure & Deployment

| Decision | Choice |
|----------|--------|
| Deploy | Existing Docker → Easypanel |
| Object storage | `lib/storage.ts` + `@aws-sdk/client-s3` ^3.x; provider via env |
| Env | `MARKETING_USERS`, `S3_*` (document in `.env.example`) |
| Schema vs runtime | `ItemPhoto` in Phase 1 schema; S3 required for Phase 2 |

### Decision Impact Analysis

**Implementation sequence:** Foundation schema/seed/`isMarketing` → BookAVan API (overlap+cancel) → BookAVan UI → Marketing core → Loans → Storage+photos → bakwagen bridge.

**Dependencies:** Loan model + cancel semantics unlock BookAVan and inventaris; marketing guard gates Phase 2 UI; storage only blocks photo stories.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical conflict points:** ~12 (naming DB/API/code, response/error shapes, dates, Loan status/type enums, cancel rules, loading/errors, Zod placement, i18n keys, component folders)

### Naming Patterns

**Database (Prisma):**
- Models: PascalCase (`Entity`, `Item`, `Loan`, `ItemPhoto`)
- Fields: camelCase (`userEmail`, `claimAcceptedAt`, `startAt`, `endAt`)
- Enums: PascalCase values — `LoanType`: `RESERVATION` | `INVENTORY`; `LoanStatus`: `ACTIVE` | `RETURNED` | `CANCELLED` | `OVERDUE` (as needed)
- Tables: Prisma defaults (no custom `@@map` unless matching existing Ticket models)

**API:**
- Plural resources: `/api/bookavan/reservations`, `/api/marketing/items`, `/api/marketing/loans`
- Dynamic segments: `[id]` (Next.js); never snake_case paths
- Query params: camelCase (`from`, `to`, `entityId`, `category`)
- Check endpoints: `/api/marketing/check` (mirror admin)

**Code:**
- Components: PascalCase files in `components/bookavan|marketing/` (e.g. `ReservationForm.tsx`)
- Lib: camelCase (`storage.ts`, schemas in `lib/validators/bookavan.ts`)
- Functions: camelCase (`isMarketing`, `hasReservationOverlap`)
- Translation keys: dot namespaces `bookavan.*`, `marketing.*`

### Structure Patterns

- Pages: `app/bookavan/`, `app/marketing/`, `app/marketing/items/[id]/`
- APIs: `app/api/bookavan/...`, `app/api/marketing/...`
- Shared domain helpers: `lib/bookavan/`, `lib/marketing/` (overlap, loan qty) — not business logic in components
- Zod schemas: `lib/validators/*`
- No co-located tests required unless project later adopts them; follow existing repo habit

### Format Patterns

- Success JSON: direct resource or array — **no** `{ data: ... }` wrapper (match tickets API)
- Errors: `{ message: string }` + HTTP status; **409** overlap / forbidden cancel; **401** unauth; **403** not marketing; **400** validation
- Dates in API: ISO 8601 strings; store as `DateTime` in Prisma
- JSON fields: camelCase
- Booleans: `true`/`false`

### Communication Patterns

- No app-wide event bus; server mutations + client refetch
- After create/cancel/checkout: refetch list or update local state from response
- Toast/message: short translated string (existing toast pattern if any; else inline status text)

### Process Patterns

**Auth:** Every API route starts with `auth()`; marketing routes also `isMarketing()`; never trust client-only hide.

**Cancel:** Verify `session.user.email === loan.createdByEmail` OR `isMarketing|isAdmin`; set `status = CANCELLED`; overlap queries **exclude** `CANCELLED`.

**Overlap:** Inside Prisma `$transaction`: lock bakwagen `Item`, query active `RESERVATION` loans with range overlap, then insert.

**Validation:** Parse with Zod in route **before** DB; mirror key checks on client for UX.

**Loading:** Local `loading` / `submitting` boolean per page/form; `loading.tsx` for route segments with fetch.

**i18n:** No hardcoded user-facing strings in new UI; all three languages.

### Enforcement Guidelines

**Agents MUST:**
- Follow `project-context.md` (Next 15, `@/` imports, Prisma singleton, no secrets in client)
- Use shared Loan model + enums above — no parallel “Booking” table
- Persist claim acceptance on create
- Add translation keys for nl/fr/en together
- Document new env keys in `.env.example`

**Pattern enforcement:** PR/code review against this section + `project-context.md`; update both when patterns change.

### Pattern Examples

**Good:**
```ts
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const parsed = reservationCreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  // transaction + overlap → 409 if conflict
}
```

**Anti-patterns:**
- New `Booking` model instead of `Loan` type `RESERVATION`
- Counting `CANCELLED` loans in overlap
- `{ data, error }` response envelope
- `NEXT_PUBLIC_S3_SECRET`
- Hardcoded Dutch-only labels

## Project Structure & Boundaries

### Complete Project Directory Structure

_New / changed paths only (existing tickets/admin/etc. unchanged):_

```
Ticketdesk/
├── .env.example                    # + MARKETING_USERS, S3_*
├── prisma/
│   ├── schema.prisma               # + Entity, Item, Loan, ItemPhoto, enums
│   └── seed.ts                     # NEW: entities + bakwagen Item
├── lib/
│   ├── admin.ts                    # + isMarketing()
│   ├── storage.ts                  # NEW: S3-compatible wrapper
│   ├── translations.ts             # + bookavan.*, marketing.*
│   ├── validators/
│   │   ├── bookavan.ts             # NEW: Zod reservation schemas
│   │   └── marketing.ts            # NEW: Zod item/loan/photo schemas
│   ├── bookavan/
│   │   └── overlap.ts              # NEW: overlap helpers / transaction helpers
│   └── marketing/
│       └── loans.ts                # NEW: checkout/return/qty helpers
├── components/
│   ├── bookavan/
│   │   ├── ReservationForm.tsx
│   │   ├── ClaimDialog.tsx
│   │   ├── AvailabilityStatus.tsx
│   │   ├── RulesPanel.tsx
│   │   └── ReservationTable.tsx
│   └── marketing/
│       ├── KpiBar.tsx
│       ├── ItemGrid.tsx
│       ├── ItemFilters.tsx
│       ├── ItemFormModal.tsx
│       ├── CheckoutModal.tsx
│       ├── ReturnModal.tsx
│       ├── OpenLoansPanel.tsx
│       └── PhotoGallery.tsx
├── app/
│   ├── bookavan/
│   │   ├── page.tsx
│   │   └── loading.tsx
│   ├── marketing/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── items/
│   │       └── [id]/
│   │           ├── page.tsx
│   │           └── loading.tsx
│   ├── page.tsx                    # + nav/home links
│   └── api/
│       ├── bookavan/
│       │   ├── reservations/
│       │   │   ├── route.ts        # GET list, POST create
│       │   │   └── [id]/route.ts  # POST/DELETE cancel
│       │   └── availability/route.ts
│       └── marketing/
│           ├── check/route.ts
│           ├── items/
│           │   ├── route.ts
│           │   └── [id]/
│           │       ├── route.ts
│           │       └── photos/route.ts
│           └── loans/
│               ├── route.ts        # POST checkout
│               └── [id]/route.ts  # POST return
```

### Architectural Boundaries

**API:** BookAVan = any authenticated user; Marketing = `isMarketing()`. Both use Prisma only via `@/lib/prisma`. Photos only via `@/lib/storage` (no direct S3 in routes).

**Components:** UI only — fetch APIs; no Prisma. Domain rules in `lib/bookavan|marketing`.

**Data:** Single DB; Ticket* models untouched. Loans own reservation + inventory flows. Cancelled reservations excluded from availability.

### Requirements to Structure Mapping

| Epic / Area | Location |
|-------------|----------|
| Epic 1 Foundation | `prisma/schema.prisma`, `prisma/seed.ts`, `lib/admin.ts` |
| Epic 2 BookAVan | `app/bookavan/*`, `app/api/bookavan/*`, `components/bookavan/*`, `lib/validators/bookavan.ts`, `lib/bookavan/*` |
| Epic 3 Inventaris core | `app/marketing/*`, `app/api/marketing/items/*`, `components/marketing/*` (grid/KPI/filters/form) |
| Epic 4 Lending + bakwagen bridge | `app/api/marketing/loans/*`, `lib/marketing/loans.ts`, checkout/return UI |
| Epic 5 Photos | `lib/storage.ts`, `app/api/marketing/items/[id]/photos`, `PhotoGallery.tsx` |
| i18n / nav | `lib/translations.ts`, home/`layout` nav links |

**FR mapping (high level):** FR1–14 → bookavan paths; FR15–34 → marketing paths; FR35–37 → shared schema + loan reads; FR38–40 → translations + responsive pages.

### Integration Points

**Internal:** Pages → `fetch("/api/...")` → auth/role → Zod → Prisma (± storage).

**External:** Azure AD (existing); S3-compatible store (Phase 2 photos).

**Data flow:** Create reservation → txn lock Item → overlap check → Loan `RESERVATION`/`ACTIVE` → list/availability. Cancel → `CANCELLED` → slot free. Checkout → Loan `INVENTORY` + qty. Photos → S3 + `ItemPhoto`.

### Development / Deploy

Unchanged: `npm run dev`, Docker/`start.sh` with Prisma push. New deps: `zod`, `@aws-sdk/client-s3`. Env via Easypanel + `.env.example`.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** Prisma/PostgreSQL, NextAuth, REST routes, Zod, S3 SDK, and brownfield Next 15 constraints are compatible. No greenfield starter conflicts.

**Pattern Consistency:** Naming, error envelope, Loan enums, cancel/overlap rules, and folder layout match Core Decisions and `project-context.md`.

**Structure Alignment:** Additive tree maps Epics 1–5 to concrete files; API/UI/lib boundaries prevent Prisma-in-components and raw S3-in-routes.

### Requirements Coverage Validation ✅

**Epic coverage:** Foundation, BookAVan, Inventaris core, Lending+bridge, Photos — all located.

**FR coverage:** FR1–40 supported via bookavan/marketing routes, shared schema, i18n/nav. FR14 cancel + auth (owner|marketing|admin) and freed slots documented.

**NFR coverage:** P1–P4 (incl. concurrency), S1–S5, A1–A4, I1–I3 addressed; caching/rate-limit explicitly deferred.

### Implementation Readiness Validation ✅

Decisions, patterns (with examples), and structure are specific enough for consistent multi-agent implementation. Schema field-level detail and thumbnail pipeline left to stories (intentional).

### Gap Analysis Results

| Priority | Gap | Resolution |
|----------|-----|------------|
| Important | Full Prisma field specs | Epic 1 story acceptance criteria |
| Important | Permanent inventory loan flag | Use `permanent: Boolean` on `Loan` |
| Nice-to-have | Thumbnail resize library/size | Photo story (Epic 5) |
| Nice-to-have | Entity merkkleuren UX | Optional polish; hybrid accents already mandated |

### Validation Issues Addressed

None critical. Permanent-loan flag recorded here as architectural convention for Epic 4.

### Architecture Completeness Checklist

**✅ Requirements Analysis** — context, scale, constraints, cross-cutting  
**✅ Architectural Decisions** — data/auth/API/FE/infra  
**✅ Implementation Patterns** — naming, formats, process, enforcement  
**✅ Project Structure** — tree, boundaries, FR/epic mapping  

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION  
**Confidence Level:** High  

**Strengths:** Shared Loan backbone; phased ship; strong auth/overlap rules; brownfield-aligned patterns.  
**Later:** OpenAPI, notifications, calendar, CSV export (PRD growth).

### Implementation Handoff

**AI agents:** Follow this doc + `project-context.md` + `prd-bookavan-marketing.md`; no parallel Booking model; exclude `CANCELLED` from overlap.

**First priority:** Prisma `Entity`/`Item`/`Loan`/`ItemPhoto` + seed bakwagen + `isMarketing()` / `MARKETING_USERS`.
