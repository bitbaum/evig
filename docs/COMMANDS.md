---
created_date: 2026-01-07
last_modified_date: 2026-06-15
last_modified_summary: Added i18n:businessplan and Monitor-Upcycling mini-site doc pointer
---

# RevampIT Commands Reference (SSOT)

**Single Source of Truth** for all npm scripts and commands.

---

## Quick Start Commands

```bash
npm run d              # Start everything (databases + dev server)
npm run dev            # Frontend only (port 3000)
npm run services:up    # Start Docker services (db, redis, meilisearch)
npm run services:down  # Stop Docker services
npm run setup-admins   # Create admin users
```

---

## Development Commands

```bash
npm run dev            # Start Next.js dev server (port 3000)
npm run dev:cms        # Start CMS (currently disabled)
```

---

## Docker Services

```bash
npm run services:up    # Start all services (db, redis, meilisearch)
npm run services:down  # Stop all services
npm run db:up          # Start main database only
npm run db:down        # Stop main database
npm run setup          # Start database and wait 5 seconds
npm run reset          # Stop all, remove volumes, and reset
```

---

## Build & Production

```bash
npm run build          # Production build (Next.js + sitemap)
npm run start          # Start production server
npm run typecheck      # TypeScript validation (run before commits!)
npm run lint           # ESLint check
npm run i18n:businessplan  # Business plan i18n shape/invariant parity (8 locales)
```

### Monitor-Upcycling content scripts

```bash
node scripts/sync-businessplan-locales.mjs   # After editing DE businessPlan block
node scripts/prune-businessplan-archive.mjs  # Remove archived citation keys from all locales
```

See `docs/projects/upcycling.md` for mini-site SSOT map.

---

## Testing

```bash
npm run test           # Jest unit tests
npm run test:watch     # Jest watch mode
npm run test:coverage  # Jest with coverage
npm run test:e2e       # Playwright E2E tests
npm run test:e2e:ui    # Playwright with UI
npm run test:all       # Run all tests
```

---

## Deployment

```bash
npm run ship           # Full ship process (build, test, deploy)
npm run deploy         # Deploy to production
npm run migrate-to-prod # Run database migrations in production
```

---

## Database

```bash
npm run db:migrate-users  # Migrate existing users
```

---

## Production Docker

```bash
npm run prod:build     # Build production Docker image
npm run prod:up        # Start production containers
npm run prod:down      # Stop production containers
```

---

**Last Updated**: 2026-06-15  
**Source**: `package.json`
