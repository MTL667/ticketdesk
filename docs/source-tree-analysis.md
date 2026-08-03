# Source Tree Analysis

_Annotated directory structure of the Ticketdesk project._

---

```
Ticketdesk/
├── app/                              # Next.js App Router (all routes)
│   ├── layout.tsx                    # Root layout: Inter font, globals.css, Providers wrapper
│   ├── page.tsx                      # Home page
│   ├── providers.tsx                 # Client: SessionProvider + LanguageProvider
│   ├── globals.css                   # Tailwind directives + global body styles
│   ├── signin/
│   │   └── page.tsx                  # Sign-in page (Azure AD)
│   ├── tickets/
│   │   ├── page.tsx                  # Client: ticket list with search/pagination
│   │   ├── loading.tsx               # Route loading state
│   │   ├── [id]/
│   │   │   ├── page.tsx              # Client: ticket detail view
│   │   │   └── loading.tsx           # Route loading state
│   │   └── new/
│   │       ├── page.tsx              # New ticket (embedded ClickUp form)
│   │       └── loading.tsx           # Route loading state
│   ├── releases/
│   │   ├── page.tsx                  # Releases list
│   │   └── [id]/
│   │       └── page.tsx              # Release detail
│   ├── admin/
│   │   ├── page.tsx                  # Admin dashboard with quick links
│   │   ├── users/
│   │   │   └── page.tsx              # Admin: user management, search, CSV export
│   │   └── email/
│   │       └── page.tsx              # Admin: SendGrid email activity & suppressions
│   └── api/                          # ── API Route Handlers ──
│       ├── auth/
│       │   └── [...nextauth]/route.ts  # NextAuth.js handler (Azure AD)
│       ├── tickets/
│       │   ├── route.ts              # GET: list user's tickets
│       │   └── [id]/
│       │       ├── route.ts          # GET: ticket detail + attachments
│       │       └── comments/
│       │           └── route.ts      # GET/POST: ticket comments (ClickUp)
│       ├── sync/
│       │   └── route.ts              # GET/POST: sync status & trigger
│       ├── releases/
│       │   ├── route.ts              # GET: list releases
│       │   └── [id]/route.ts         # GET: release detail
│       ├── status/
│       │   └── route.ts              # GET: system status (Zabbix)
│       ├── settings/
│       │   └── banner/route.ts       # GET/POST/DELETE: banner management
│       └── admin/
│           ├── check/route.ts        # GET: admin check
│           ├── services/
│           │   ├── route.ts          # GET/POST: monitored services
│           │   └── [id]/route.ts     # PUT/DELETE: service management
│           ├── zabbix/route.ts       # GET: Zabbix hosts
│           ├── users/
│           │   ├── route.ts          # GET: user list with ticket counts
│           │   └── [email]/
│           │       ├── tickets/route.ts  # GET: user's tickets
│           │       └── export/route.ts   # GET: CSV export
│           └── email/
│               ├── route.ts          # GET: SendGrid email search
│               ├── [msgId]/route.ts  # GET: message detail/trace
│               └── suppressions/
│                   ├── route.ts      # GET/DELETE: suppression check/remove
│                   └── list/route.ts # GET: list suppression entries
├── components/                       # Reusable React components
│   ├── LanguageSelector.tsx          # NL/FR/EN language switcher
│   ├── NewTicketClient.tsx           # New ticket form (ClickUp iframe)
│   ├── ReleaseList.tsx               # Release listing UI
│   ├── SystemStatus.tsx              # Monitored services status display
│   ├── TicketComments.tsx            # Comments thread (ClickUp integration)
│   └── TicketList.tsx                # Ticket list with search, pagination, status chips
├── contexts/
│   └── LanguageContext.tsx           # React Context: language state, t() function
├── lib/                              # Core utilities & API wrappers
│   ├── admin.ts                      # isAdmin() check from ADMIN_EMAILS env
│   ├── auth.ts                       # NextAuth v5 config: Azure AD, callbacks, handlers
│   ├── clickup.ts                    # ClickUp REST API wrapper, ClickUpNotFoundError
│   ├── prisma.ts                     # Prisma singleton client (globalThis pattern)
│   ├── sendgrid.ts                   # SendGrid API wrapper with sgFetch() retry
│   ├── sync.ts                       # ClickUp → PostgreSQL sync logic
│   ├── translations.ts              # NL/FR/EN translation keys
│   └── zabbix.ts                     # Zabbix JSON-RPC API wrapper
├── types/
│   ├── index.ts                      # Shared TypeScript types
│   └── next-auth.d.ts                # NextAuth type augmentations (tenantId, email)
├── prisma/
│   └── schema.prisma                 # Database schema (5 models)
├── scripts/
│   └── start.sh                      # Docker startup: prisma db push + node server.js
├── public/                           # Static assets
├── middleware.ts                      # Auth middleware: redirect unauthenticated → /signin
├── Dockerfile                        # Multi-stage build (deps → builder → runner)
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript config (strict, bundler, @/ alias)
├── tailwind.config.ts                # Tailwind CSS config
├── next.config.mjs                   # Next.js config (standalone output)
├── postcss.config.mjs                # PostCSS config
├── .eslintrc.json                    # ESLint: next/core-web-vitals
├── .env.example                      # Environment variables template
└── .env.local                        # Local environment variables (git-ignored)
```

## Critical Directories

| Directory | Purpose | Key Contents |
|-----------|---------|-------------|
| `app/api/` | All backend API route handlers | 23 route files |
| `lib/` | Core business logic & external API wrappers | 8 modules |
| `components/` | Reusable React UI components | 6 components |
| `prisma/` | Database schema definition | 5 models |
| `contexts/` | React Context providers | Language context |
| `types/` | TypeScript declarations | Shared types, NextAuth augmentation |

## Entry Points

- **Web application**: `app/layout.tsx` → `app/page.tsx`
- **Authentication**: `middleware.ts` → `lib/auth.ts`
- **API**: `app/api/*/route.ts`
- **Docker startup**: `scripts/start.sh`
