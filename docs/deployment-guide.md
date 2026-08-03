# Deployment Guide

---

## Infrastructure

- **Platform**: Easypanel (Docker-based PaaS)
- **Runtime**: Node.js 20 Alpine
- **Database**: PostgreSQL (Easypanel service)
- **Source**: GitHub repository (auto-deploy on push)

## Docker Build

The project uses a **multi-stage Dockerfile**:

### Stage 1: Dependencies (`deps`)
- Base: `node:20-alpine`
- Installs `libc6-compat` and `openssl`
- Copies `package.json`, `package-lock.json`, and `prisma/`
- Runs `npm ci` (requires lock file in sync)
- Generates Prisma client

### Stage 2: Builder (`builder`)
- Copies source code and `node_modules` from deps
- Runs `npm run build` (= `prisma generate && next build`)
- Produces standalone output in `.next/standalone`

### Stage 3: Runner (`runner`)
- Minimal Alpine image with `openssl`
- Installs Prisma CLI globally for migrations
- Copies standalone build, static assets, Prisma schema/client
- Runs as non-root `nextjs` user
- Exposes port 3000

### Startup

`scripts/start.sh` runs:
1. `prisma db push --skip-generate` — applies schema changes
2. `node server.js` — starts Next.js standalone server

## Critical Deployment Rules

1. **Lock file sync**: After ANY `package.json` change, run `npm install` locally to update `package-lock.json` before pushing. `npm ci` in Docker will fail on mismatch.

2. **Environment variables**: All env vars are injected as Docker build args via Easypanel. They are baked into the build at compile time.

3. **Database migrations**: Run automatically on container startup via `start.sh`. No manual migration step needed.

## Easypanel Configuration

1. Create PostgreSQL service for the database
2. Create App service pointing to the GitHub repository
3. Configure all environment variables as build args
4. Set `DATABASE_URL` to internal hostname: `postgresql://postgres:password@<service-name>:5432/<db>`

## Manual Docker Build & Run

```bash
# Build
docker build -t ticketdesk .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e CLICKUP_API_TOKEN=... \
  -e AZURE_AD_CLIENT_ID=... \
  # ... other env vars
  ticketdesk
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `npm ci` fails in Docker | `package-lock.json` out of sync | Run `npm install` locally, commit lock file |
| Database connection error | Wrong `DATABASE_URL` | Check Easypanel internal hostname |
| Build timeout | Large dependency tree | Easypanel build timeout settings |
| Missing Prisma client | Generate step failed | Check `postinstall` script runs |
