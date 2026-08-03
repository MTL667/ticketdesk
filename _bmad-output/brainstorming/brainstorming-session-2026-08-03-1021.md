---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - 'SPOQ Tools/SPOQ - Bakwagen/spoq_bakwagen_reservatie(1).html'
  - 'SPOQ Tools/SPOQ - Inventory/marketing-inventaris-met-merkkleuren (1).html'
session_topic: 'Integratie Bakwagen Reservatie + Marketing Inventaris als nieuwe Ticketdesk modules — scope, prioriteit en fasering'
session_goals: 'Heldere scope-afbakening, prioritering (wat eerst bouwen), opsplitsing in behapbare implementatie-delen'
selected_approach: 'ai-recommended'
techniques_used: ['Constraint Mapping', 'Morphological Analysis', 'Decision Tree Mapping']
ideas_generated: [5 epics, 16 stories]
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Kevin
**Date:** 2026-08-03

## Session Overview

**Topic:** Integratie van Bakwagen Reservatie en Marketing Inventaris als nieuwe modules in Ticketdesk — scope, prioriteit en fasering

**Goals:** Heldere scope-afbakening, prioritering (wat eerst bouwen), en een plan voor opsplitsing in behapbare implementatie-delen

### Context Guidance

Twee bestaande HTML-mockups van een collega dienen als startpunt:

1. **Bakwagen Reservatie (BookAVan)** — publieke boekingstool voor de bedrijfsbakwagen (formulier, schade-claim, reservatiehistoriek)
2. **Marketing Inventaris** — beheertool voor marketingmateriaal (CRUD items, uitleensysteem, KPI dashboard, multi-entiteit filtering, foto-galerij)

Beide moeten geïntegreerd worden in het bestaande Ticketdesk platform (Next.js 15, Prisma, PostgreSQL, NextAuth Azure AD).

### Session Setup

- Mockups zijn de feature-specificatie — de features zelf staan vast
- Focus is op integratie-strategie, scope-afbakening en fasering
- Bestaande Ticketdesk tech stack en patronen moeten gevolgd worden

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Integratie van twee nieuwe modules met focus op scope, prioriteit en fasering

**Recommended Techniques:**

- **Constraint Mapping (deep):** Map alle technische en organisatorische beperkingen — gedeelde entiteiten, auth-model, DB-overlap, bestaande patronen
- **Morphological Analysis (deep):** Ontleed modules in parameters en combineer alle mogelijke faseringen systematisch
- **Decision Tree Mapping (structured):** Vertaal inzichten naar concrete implementatiepaden en bouw-volgorde

**AI Rationale:** Scope/prioriteit vereist eerst een helder beeld van constraints (wat kan/kan niet onafhankelijk), dan systematisch ontleden van alle features, en tot slot concrete beslispaden. Deze volgorde gaat van "begrijpen" naar "structureren" naar "beslissen".

## Technique Execution Results

### Constraint Mapping

**Constraints identified and decisions made:**

| Constraint | Decision |
|-----------|----------|
| **Auth BookAVan** | Azure AD, tenant-restrictie, alle ingelogde users |
| **Auth Marketing** | Extra check via e-maillijst (`isMarketing()`) — zelfde patroon als bestaande `isAdmin()` |
| **Entiteiten** | Gedeelde `Entity`-tabel in DB (Option A) — één bron van waarheid |
| **Fasering** | Fase 1 = BookAVan, Fase 2 = Marketing Inventaris |
| **Bakwagen in inventaris** | Bakwagen wordt een item in inventaris in fase 2 |
| **Reservaties/uitleningen** | Eén gedeeld `Loan`-model (Option A) — een reservatie IS een uitlening |
| **Routing** | `/bookavan` (publiek), `/marketing` (beperkt) |
| **Visuele stijl** | Hybride — Ticketdesk-layout + SPOQ-kleuraccenten |
| **Foto-opslag** | S3-compatibele storage (MinIO, Cloudflare R2, of AWS S3) |
| **Tech stack** | Bestaande stack: Next.js 15, Prisma, PostgreSQL, Tailwind |

**Key insight:** De auth-patronen (`isAdmin()`, tenant-restrictie) en de bestaande Ticketdesk-architectuur bieden voldoende basis — geen nieuw auth-systeem nodig. De gedeelde Entity-tabel en het gedeelde Loan-model zijn de architecturele ruggengraat die beide modules verbindt.

### Morphological Analysis

**BookAVan features (Fase 1):**

1. Reservatieformulier (bestuurder, afdeling, van/tot, bestemming, reden)
2. Schade- en boeteclaimacceptatie (checkbox + voorwaarden-modal)
3. Reservatieoverzicht/historiek (tabel)
4. Voertuigstatus (beschikbaar/gereserveerd)
5. Regels-paneel ("Voor vertrek" checklist)

**Marketing Inventaris features (Fase 2 — alle features in eerste iteratie, inclusief foto-upload):**

1. Dashboard met KPI's (totaal, beschikbaar, uitgeleend, te bestellen)
2. Items CRUD (toevoegen, bewerken, verwijderen)
3. Foto-galerij per item (S3-opslag, meerdere foto's, thumbnails)
4. Uitleensysteem (checkout, retour, retourdatum, overdue-markering)
5. Filteren op entiteit + categorie + zoeken
6. Detail-pagina per item met uitleenhistoriek
7. Minimum voorraad-waarschuwing
8. Bakwagen-integratie (bakwagen als item, reservaties als loans)

### Decision Tree Mapping

**Implementation path — 5 Epics, 16 Stories:**

#### Epic 1: Fundament (gedeeld, moet eerst)

| Story | Description |
|-------|-------------|
| 1.1 | **Prisma schema** — `Entity`, `Item`, `Loan` tabellen met relaties |
| 1.2 | **Seed script** — entiteiten laden + bakwagen als eerste Item |
| 1.3 | **`isMarketing()` helper** — auth check in `lib/admin.ts` + `MARKETING_USERS` env var |

#### Epic 2: BookAVan

| Story | Description | Dependencies |
|-------|-------------|-------------|
| 2.1 | **Reservatie API** — `POST/GET /api/bookavan/reservations`, beschikbaarheidscheck (overlap-detectie op datums) | Epic 1 |
| 2.2 | **BookAVan pagina** — `/bookavan` met reservatieformulier, beschikbaarheidsweergave, claimacceptatie | 2.1 |
| 2.3 | **Mijn reservaties** — historiekoverzicht op `/bookavan`, statusweergave | 2.1 |
| 2.4 | **Navigatie + vertalingen** — home dashboard link, nav-item, nl/fr/en teksten | 2.2 |

#### Epic 3: Marketing Inventaris — Core

| Story | Description | Dependencies |
|-------|-------------|-------------|
| 3.1 | **Items CRUD API** — `POST/GET/PUT/DELETE /api/marketing/items` met entiteit-filtering | Epic 1 |
| 3.2 | **Items overzicht** — `/marketing` dashboard met KPI's, grid, filtering (entiteit/categorie/zoek) | 3.1 |
| 3.3 | **Item detail pagina** — `/marketing/items/[id]` met specs en historiek | 3.1 |
| 3.4 | **Marketing auth + navigatie** — `isMarketing()` guard, nav, vertalingen | 3.2 |

#### Epic 4: Marketing Inventaris — Uitleensysteem

| Story | Description | Dependencies |
|-------|-------------|-------------|
| 4.1 | **Checkout/retour API** — `POST /api/marketing/loans`, retour boeken, overdue-detectie | Epic 1 (Loan tabel) |
| 4.2 | **Checkout/retour UI** — modals voor uitlenen en retourneren, open uitleningen paneel | 4.1, 3.3 |
| 4.3 | **Bakwagen-integratie** — bakwagen als item in inventaris, BookAVan-reservaties zichtbaar als loans | Epic 2, 4.1 |
| 4.4 | **Overdue tracking** — markering van verlopen uitleningen, "te bestellen" KPI | 4.1 |

#### Epic 5: Marketing Inventaris — Foto's

| Story | Description | Dependencies |
|-------|-------------|-------------|
| 5.1 | **S3-opslag setup** — `lib/storage.ts` wrapper, env vars voor S3-credentials | — |
| 5.2 | **Foto-upload API** — `POST /api/marketing/items/[id]/photos`, multi-upload, thumbnail generatie | 5.1, 3.1 |
| 5.3 | **Foto-galerij UI** — galerij op detail pagina, thumbnail strip, hoofdfoto selectie | 5.2, 3.3 |

**Build order:**

```
Epic 1 (fundament)
  ↓
Epic 2 (BookAVan) ←── kan live zodra af
  ↓
Epic 3 (Inventaris core)  ───┐
  ↓                          │ (parallel mogelijk)
Epic 4 (Uitleensysteem)      │
  ↓                          │
Epic 5 (Foto's) ─────────────┘
```

## Session Highlights

**User Creative Strengths:** Kevin pakte snel beslissingen met een duidelijke voorkeur voor schaalbare, vooruit-compatibele architectuur (gedeelde tabellen, S3-storage, hybride styling).

**Breakthrough Moments:**
- De realisatie dat de bakwagen een inventaris-item wordt in fase 2, wat het datamodel van fase 1 direct beïnvloedt
- De keuze voor één gedeeld `Loan`-model dat reservaties en uitleningen unificeert

**Key Architectural Decisions:**
- Gedeelde Entity/Item/Loan tabellen als ruggengraat
- Auth volgt bestaande patronen (geen nieuw systeem)
- S3-compatibele foto-opslag
- Hybride visuele stijl (Ticketdesk + SPOQ-accenten)
