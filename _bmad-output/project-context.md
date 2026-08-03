---
project_name: 'Ticketdesk'
user_name: 'Kevin'
date: '2026-04-27'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 37
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- **Next.js** ^15.4.0 — App Router, `output: 'standalone'` for Docker builds
- **React** ^19.0.0
- **TypeScript** ^5.7.2 — `strict: true`
- **Tailwind CSS** ^3.4.17
- **Prisma** ^6.8.2 — PostgreSQL, `prisma generate` runs on `postinstall` and before `build`
- **NextAuth (Auth.js v5)** ^5.0.0-beta.25 — Azure AD provider, `@auth/core` ^0.37.0
- **Node.js** 20-alpine (Docker runtime)
- **ESLint** ^9.18.0 — `next/core-web-vitals` preset
- **PostCSS** ^8.4.49 + **Autoprefixer** ^10.4.20

---

## Critical Implementation Rules

### TypeScript / Language Rules

- **Strict mode is enabled** — never use `any` without justification; all code must pass `strict: true`
- **Path aliases** — always use `@/` imports (e.g. `@/lib/prisma`, `@/lib/admin`) instead of relative paths for cross-directory imports
- **Prisma import** — use default import: `import prisma from "@/lib/prisma"` (not the named export)
- **API route exports** — use named async function exports: `export async function GET(...)`, `export async function POST(...)`
- **Next.js 15 dynamic params** — route params are async: `{ params }: { params: Promise<{ id: string }> }` then `const { id } = await params`
- **Custom error classes** — each external integration has its own error class (`ClickUpNotFoundError`, `SendGridError`); catch these specifically before generic `Error`
- **Error response pattern** — always `try/catch`, log with `console.error`, return `NextResponse.json({ message: string }, { status: number })`
- **Transient error handling** — external API calls should retry on 5xx/429/timeout (see `sgFetch()` in `lib/sendgrid.ts` as reference pattern)

### Framework Rules (Next.js / React)

- **App Router only** — all routes use `app/` directory; no `pages/` router
- **Client-side data fetching** — no React Query/SWR; use `useState` + `useEffect` + `fetch("/api/...")` pattern
- **Component files** — PascalCase in `components/` directory (e.g. `TicketList.tsx`, `SystemStatus.tsx`)
- **Route loading states** — provide `loading.tsx` alongside `page.tsx` for route segments with data fetching
- **Auth in API routes** — always start with `const session = await auth()` from `@/lib/auth`, check `session?.user?.email` → 401 if missing
- **Admin guard** — after auth check, use `isAdmin(session.user.email)` from `@/lib/admin` → 403 if not admin
- **Client admin pages** — fetch `GET /api/admin/check` on mount, `redirect("/")` if not admin
- **Translations** — use `useLanguage()` hook from `@/contexts/LanguageContext`; call `t("key")` for translated strings; all keys defined in `lib/translations.ts`
- **Standalone output** — `next.config.mjs` uses `output: 'standalone'`; do not change this (required for Docker)
- **Providers** — `SessionProvider` + `LanguageProvider` wrap the app in `app/providers.tsx`; do not add providers elsewhere

### Code Quality & Style Rules

- **ESLint** — `next/core-web-vitals` preset; do not add conflicting rules
- **No Prettier** — no enforced formatting; follow existing code style (2-space indent, single quotes in JSX, double quotes in imports)
- **File structure** — `app/` (routes), `components/` (UI), `lib/` (utilities/API wrappers), `contexts/` (React Context), `types/` (TS declarations), `prisma/` (schema)
- **Component naming** — PascalCase files in `components/` (e.g. `TicketList.tsx`)
- **Lib module naming** — camelCase files in `lib/` (e.g. `sendgrid.ts`, `clickup.ts`)
- **API route folders** — lowercase, no kebab-case (e.g. `admin/email/suppressions/list/`)
- **Minimal comments** — do not add obvious narration comments; only comment non-obvious logic or API constraints
- **Tailwind CSS** — utility-first styling directly in JSX; no CSS modules or styled-components; global styles only in `app/globals.css`
- **UI consistency** — use `bg-white shadow-sm rounded-lg` card pattern; `max-w-7xl mx-auto` for page containers; status chips with color-coded backgrounds

### Development Workflow Rules

- **Deployment** — Easypanel with multi-stage Docker build (node:20-alpine); deploy triggers on push to GitHub
- **Lock file sync** — after ANY change to `package.json`, always run `npm install` to regenerate `package-lock.json` before committing; `npm ci` in Docker will fail if they are out of sync
- **Prisma workflow** — after schema changes: `npx prisma generate` (local) and `npx prisma db push` or `npx prisma migrate deploy` (production); schema lives in `prisma/schema.prisma`
- **Environment variables** — configured via Easypanel build args; local dev uses `.env.local`; reference `.env.example` for required keys
- **Build command** — `prisma generate && next build`; standalone output copies to `.next/standalone`
- **Startup** — `scripts/start.sh` runs Prisma migrations then starts Next.js server on port 3000

### Critical Don't-Miss Rules

- **Do not upgrade Next.js to v16+** — downgraded from 16 to 15 for stability; stay on ^15.x
- **ClickUp tasks can be deleted** — always handle `ClickUpNotFoundError` (404); return graceful response, never crash
- **SendGrid transient errors** — all SendGrid calls must go through `sgFetch()` retry wrapper; never call SendGrid API directly with `fetch`
- **External API wrappers** — never bypass `lib/clickup.ts`, `lib/sendgrid.ts`, or `lib/zabbix.ts`; always use the existing wrapper functions
- **Prisma singleton** — never create a new `PrismaClient()` instance; always import from `@/lib/prisma`
- **Admin routes double-check** — every admin API route must have BOTH `auth()` (401) AND `isAdmin()` (403) checks
- **Tenant restriction** — `ALLOWED_TENANTS` env var controls Azure AD tenant access; never bypass this check in `lib/auth.ts`
- **No secrets in client code** — API tokens, database URLs, and secrets must only be accessed server-side; never prefix with `NEXT_PUBLIC_` unless the value is truly public
- **Sync cleanup** — `syncTicketsFromClickUp()` in `lib/sync.ts` removes DB tickets that no longer exist in ClickUp; do not remove this cleanup step
- **Translation keys** — when adding new UI text, always add keys to all three languages (nl, fr, en) in `lib/translations.ts`
- **Docker build sensitivity** — the Dockerfile uses `npm ci`; any mismatch between `package.json` and `package-lock.json` will break deployment

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code
- Follow ALL rules exactly as documented
- When in doubt, prefer the more restrictive option
- Update this file if new patterns emerge

**For Humans:**

- Keep this file lean and focused on agent needs
- Update when technology stack changes
- Review quarterly for outdated rules
- Remove rules that become obvious over time

Last Updated: 2026-04-27
