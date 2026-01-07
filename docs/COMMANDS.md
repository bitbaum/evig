---
created_date: 2026-01-07
last_modified_date: 2026-01-07
last_modified_summary: Created SSOT for all npm commands and scripts
---

# RevampIT Commands Reference (SSOT)

**Single Source of Truth** for all npm scripts and commands.

---

## Quick Start Commands

```bash
npm run d              # Start everything (databases + dev server)
npm run dev            # Frontend only (port 3000)
npm run services:up    # Start Docker services (db, medusa_db, redis, meilisearch)
npm run services:down  # Stop Docker services
npm run setup-admins   # Create admin users
```

---

## Development Commands

```bash
npm run dev            # Start Next.js dev server (port 3000)
npm run dev:full       # Start Medusa + Next.js
npm run dev:shop       # Start shop (Next.js + Medusa concurrently)
npm run dev:medusa     # Start Medusa only
npm run dev:cms        # Start CMS (currently disabled)
```

---

## Docker Services

```bash
npm run services:up    # Start all services (db, medusa_db, redis, meilisearch)
npm run services:down  # Stop all services
npm run db:up          # Start main database only
npm run db:down        # Stop main database
npm run setup          # Start database and wait 5 seconds
npm run reset          # Stop all, remove volumes, and reset
```

---

## Medusa E-commerce

```bash
npm run medusa:start           # Start Medusa services (db, redis, meilisearch)
npm run medusa:up              # Start Medusa Docker services
npm run medusa:down            # Stop Medusa services
npm run medusa:dev             # Start Medusa dev server (port 9000)
npm run medusa:dev:9001        # Start Medusa dev server (port 9001)
npm run medusa:setup           # Start services + bootstrap
npm run medusa:bootstrap        # Bootstrap Medusa database
npm run medusa:logs             # View Medusa logs
```

---

## Build & Production

```bash
npm run build          # Production build (Next.js + sitemap)
npm run start          # Start production server
npm run typecheck      # TypeScript validation (run before commits!)
npm run lint           # ESLint check
```

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

**Last Updated**: 2026-01-07  
**Source**: `package.json`
