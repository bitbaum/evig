---
created_date: 2026-01-07
last_modified_date: 2026-07-04
last_modified_summary: IT-Hilfe journey E2E (edit + withdraw); local run notes
---

# RevampIT Commands Reference (SSOT)

**Single Source of Truth** for all package scripts and commands.

---

## Quick Start Commands

```bash
pnpm run d              # Start everything (databases + dev server)
pnpm run dev            # Frontend only (port 3000)
pnpm run services:up    # Start Docker services (db, meilisearch, listmonk)
pnpm run services:down  # Stop Docker services
pnpm run setup-admins   # Create admin users
```

---

## Development Commands

```bash
pnpm run dev            # Start Next.js dev server (port 3000)
```

---

## Docker Services

```bash
pnpm run services:up    # Start all services (db, meilisearch, listmonk)
pnpm run services:down  # Stop all services
pnpm run db:up          # Start main database only
pnpm run db:down        # Stop main database
pnpm run setup          # Start database and wait 5 seconds
pnpm run reset          # Stop all, remove volumes, and reset
```

---

## Build & Production

```bash
pnpm run build          # Production build (Next.js + sitemap)
pnpm run start          # Start production server
pnpm run typecheck      # TypeScript validation (run before commits!)
pnpm run lint           # ESLint check
pnpm run i18n:businessplan  # Business plan i18n shape/invariant parity (8 locales)
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
pnpm run test           # Vitest unit tests
pnpm run test:watch     # Vitest watch mode
pnpm run test:coverage  # Vitest with coverage
pnpm run test:e2e       # Playwright E2E tests
pnpm run test:e2e:auth  # Auth login smoke (needs AUTH_TEST_EMAIL/PASSWORD)
pnpm run test:e2e:inventory # Dual-persona feature inventory (user + admin)
pnpm run test:e2e:inventory:prod # Same, with prod health wait (CI / post-deploy)
pnpm run test:e2e:user-admin # Legacy quick smoke (subset)
pnpm run test:e2e:it-hilfe    # IT-Hilfe hub/journey specs
pnpm run test:e2e:it-hilfe:journey # Dual-persona lifecycle + edit/withdraw (see E2E section)
pnpm run test:e2e:marketplace:journey # User sells, admin buys (Payrexx when configured)
pnpm run test:e2e:workshops:proposal:journey # User proposes, admin approve/reject
pnpm run test:e2e:timecards:journey          # Staff submit + admin approve (TIME round-trip)
pnpm run test:e2e:intake:journey             # Admin intake create → checklist → publish
pnpm run test:e2e:tasks:journey              # Admin task create → complete
pnpm run test:e2e:protocols:journey          # Admin protocol create → JSON import → finalize
pnpm run test:e2e:decisions:journey          # Admin decision create → vote → close
pnpm run test:e2e:cms:journey                # Admin blog draft → publish → public view
pnpm run test:e2e:it-hilfe:preferred:journey # Request with preferred techniker
pnpm run test:e2e:service:journey # User books repair, admin assigns techniker (dual-persona)
pnpm run test:e2e:ui    # Playwright with UI
pnpm run test:all       # Run all tests
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
| `PLAYWRIGHT_CHANNEL` | `chrome` or `msedge` when bundled Chromium cannot install (e.g. Ubuntu 26) |

**Local marketplace journey (no prod secrets):**

```bash
pnpm run e2e:seed
PLAYWRIGHT_CHANNEL=chrome \
AUTH_TEST_USER_EMAIL=e2e-user@revampit.test AUTH_TEST_USER_PASSWORD='E2EUser123!' \
AUTH_TEST_ADMIN_EMAIL=e2e-admin@revampit.test AUTH_TEST_ADMIN_PASSWORD='E2EAdmin123!' \
pnpm run test:e2e:marketplace:journey
```

**Local IT-Hilfe dual-persona journey** (owner edit + withdraw offer + full lifecycle):

```bash
pnpm run e2e:seed
PLAYWRIGHT_CHANNEL=chrome PLAYWRIGHT_BASE_URL=http://localhost:3001 \
AUTH_TEST_USER_EMAIL=e2e-user@revampit.test AUTH_TEST_USER_PASSWORD='E2EUser123!' \
AUTH_TEST_ADMIN_EMAIL=e2e-admin@revampit.test AUTH_TEST_ADMIN_PASSWORD='E2EAdmin123!' \
pnpm run test:e2e:it-hilfe:journey
```

Use `pnpm exec next dev --port 3001 --webpack` locally if Turbopack returns 404 on `/api/auth/*`. Restart the dev server if create-request rate limit (`Zu viele Anfragen`) trips during repeated runs.

Apply migration `114_listing_questions.sql` before first local run (`pnpm run db:migrate` or direct `psql`). **Prod:** applied on Hetzner 2026-07-04 (see `docs/FEATURE_INVENTORY.md` → Marketplace UX rollout tracker).

After each successful deploy, **Dual-persona inventory smoke** runs automatically when the two password secrets are set (routes + IT-Hilfe + marketplace + workshops + service journeys). Manual re-run: `pnpm run test:e2e:inventory:prod`.

Payrexx go-live checklist: `docs/operations/PAYREXX_SETUP.md` · config SSOT: `src/config/payrexx.ts`.

### Manual

```bash
pnpm run deploy          # same as deploy:selfhost
pnpm run deploy:selfhost # build standalone → release backup → activate → /api/health gate → rollback on failure
pnpm run ship            # quality gate (typecheck, lint, build, tests)
pnpm run db:migrate      # apply unrecorded scripts/db/migrations/*.sql (DATABASE_URL / PG* env)
```

Operational checks:

```bash
curl https://revampit.orangecat.ch/api/health  # dependency health
curl https://revampit.orangecat.ch/api/version # deployed version / git SHA
```

Production dependencies on the Hetzner box:

| Service | Runtime | Binding | Notes |
|---------|---------|---------|-------|
| `revampit-app` | systemd | `127.0.0.1:4004` behind Caddy | `/opt/revampit/app`, restarted by `scripts/selfhost-deploy-evig.sh` |
| `revampit_meilisearch` | Docker | `127.0.0.1:7700` | Required for healthy `/api/health`; master key is stored only in `/opt/revampit/app/.env` |

The deploy script copies the server-local `.env` and `launch.sh` into each release before activation. Do not put those runtime secrets in git.

---

## Database

```bash
pnpm run db:migrate-users  # Migrate existing users
```

---

## Production Docker

```bash
pnpm run prod:build     # Build production Docker image
pnpm run prod:up        # Start production containers
pnpm run prod:down      # Stop production containers
```

---

**Last Updated**: 2026-09-04  
**Last Modified Summary**: Post-deploy dual-persona inventory in GitHub Actions; E2E secret docs.  
**Source**: `package.json`
