# Installation Guide

This guide sets up the evig development environment on your local machine.
The short version is in the root `README.md` ("Quick Start"); every script is in
[`COMMANDS.md`](../COMMANDS.md).

## Prerequisites

- **Node.js 22.13+** (CI and deploy run Node 24) - [Download](https://nodejs.org/)
- **pnpm** (version pinned in `package.json` → `packageManager`)
- **Docker** — runs the local Postgres, Meilisearch and Listmonk
- **Git**

There is one app: the Next.js project at the repository root. There is no
separate API server.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/bitbaum/evig.git
cd evig
pnpm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

At minimum set `DATABASE_URL` and `AUTH_SECRET` (32+ characters). For the Docker
database:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/revampit_cms
```

`DATABASE_URL` is the single connection source: the app and auth share one pool.
`.env.example` lists every other variable (payments, email, search).

### 3. Database

```bash
pnpm run services:up   # Docker: Postgres on :5433, Meilisearch, Listmonk
pnpm run db:migrate    # apply scripts/db/migrations/*.sql
pnpm run setup-admins  # create admin users
```

Never point a local `.env.local` at the production database, and never use
`drizzle-kit push` against a shared database (see `.claude/CLAUDE.md`).

### 4. Start

```bash
pnpm run dev   # Next.js on http://localhost:3000
# or everything at once:
pnpm run d     # services:up + transcription worker + dev
```

- **Site**: http://localhost:3000
- **Admin**: http://localhost:3000/admin

## Verification

```bash
curl http://localhost:3000/api/health
pnpm run verify   # format, lint, umlauts, typecheck, tests, build — what CI runs
```

## Troubleshooting

### Port already in use

```bash
lsof -i :3000
kill -9 <PID>
```

### Database connection issues

```bash
docker compose ps db
psql "postgresql://postgres:postgres@localhost:5433/revampit_cms" -c 'select 1'
```

### Module not found

```bash
rm -rf node_modules
pnpm install
```

## Next steps

1. Read the [Development Guide](../development/DEV_GUIDE.md)
2. Check the [API Documentation](../API_DOCUMENTATION.md)
3. Review the [Contributing Guidelines](../../CONTRIBUTING.md)
4. Read [SHARED_CONTEXT.md](../SHARED_CONTEXT.md) for the stack and file layout
