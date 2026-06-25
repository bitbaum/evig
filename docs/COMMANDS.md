---
created_date: 2026-01-07
last_modified_date: 2026-06-19
last_modified_summary: E2E commands; DB SSOT Hetzner-only
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
npm run test:e2e:auth  # Auth login smoke (needs AUTH_TEST_EMAIL/PASSWORD)
npm run test:e2e:inventory # Dual-persona feature inventory (user + admin)
npm run test:e2e:inventory:prod # Same, with prod health wait (CI / post-deploy)
npm run test:e2e:user-admin # Legacy quick smoke (subset)
npm run test:e2e:it-hilfe    # IT-Hilfe hub/journey specs
npm run test:e2e:marketplace:journey # User sells, admin buys (Payrexx when configured)
npm run test:e2e:ui    # Playwright with UI
npm run test:all       # Run all tests
```

---

## Deployment

Production app: **https://revampit.orangecat.ch** (Hetzner self-host).
Public legacy domain `revamp-it.ch` is still the old Joomla/Apache site and is not the production app.

### Automatic (push-to-deploy)

| Trigger | What happens |
|---------|----------------|
| `git push origin main` (local) | Pre-push hook builds + deploys in background → `/tmp/push-deploy-revampit.log` |
| `git push origin main` (GitHub) | Actions workflow `.github/workflows/deploy-selfhost.yml` runs lint + typecheck, then deploys if secrets are set |

Requires `.env.selfhost.local` locally (gitignored). Copy from a teammate or recreate from the prod `/opt/revampit/app/.env`.

**One-time GitHub secrets** (Settings → Secrets → Actions) for CI deploy when you push from anywhere:

| Secret | Value |
|--------|--------|
| `HETZNER_SSH_PRIVATE_KEY` | Private key for `ubuntu@167.233.22.31` |
| `SELFHOST_ENV` | Full contents of `.env.selfhost.local` |
| `AUTH_TEST_USER_PASSWORD` | Non-admin E2E account (`butaeff@gmail.com`) — post-deploy + CI inventory |
| `AUTH_TEST_ADMIN_PASSWORD` | Staff E2E account (`georgy.butaev@revamp-it.ch`) — post-deploy + CI inventory |
| `AUTH_TEST_USER_EMAIL` | Optional override for user persona (defaults to butaeff) |
| `AUTH_TEST_ADMIN_EMAIL` | Optional override for admin persona (defaults to georgy) |
| `AUTH_TEST_EMAIL` / `AUTH_TEST_PASSWORD` | Legacy single-account auth smoke (`test:e2e:auth`) |

After each successful deploy, **Dual-persona inventory smoke** runs automatically when the two password secrets are set (routes + IT-Hilfe journey). Manual re-run: `npm run test:e2e:inventory:prod`.

### Manual

```bash
npm run deploy          # same as deploy:selfhost
npm run deploy:selfhost # build standalone → release backup → activate → /api/health gate → rollback on failure
npm run ship            # quality gate (typecheck, lint, build, tests)
npm run deploy:vercel   # legacy Vercel script (Vercel retired — not used for prod)
npm run migrate-to-prod # database migrations against the prod self-hosted Hetzner Postgres
```

Operational checks:

```bash
curl https://revampit.orangecat.ch/api/health  # dependency health
curl https://revampit.orangecat.ch/api/version # deployed version / git SHA
```

Production dependencies on the Hetzner box:

| Service | Runtime | Binding | Notes |
|---------|---------|---------|-------|
| `revampit-app` | systemd | `127.0.0.1:4004` behind Caddy | `/opt/revampit/app`, restarted by `scripts/selfhost-deploy-revampit.sh` |
| `revampit_meilisearch` | Docker | `127.0.0.1:7700` | Required for healthy `/api/health`; master key is stored only in `/opt/revampit/app/.env` |

The deploy script copies the server-local `.env` and `launch.sh` into each release before activation. Do not put those runtime secrets in git.

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

**Last Updated**: 2026-06-19  
**Last Modified Summary**: Post-deploy dual-persona inventory in GitHub Actions; E2E secret docs.  
**Source**: `package.json`
