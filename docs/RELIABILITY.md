# Reliability Hardening Summary

This project is configured to favor reliability of Auth and Database.

## What’s configured

- Database hardening
  - Migration `scripts/db/migrations/005b_auth_hardening_and_indexes.sql`:
    - Enforces case-insensitive emails via `CITEXT` with a safety pre-check.
    - Ensures Auth.js timestamp columns exist (`users."emailVerified"`, `"createdAt"`, `"updatedAt"`).
    - Adds critical indexes for interactions, preferences, segments, workshop instances, registrations, service appointments, and JSONB fields.
  - Every deploy (`scripts/selfhost-deploy-evig.sh`) applies unrecorded migrations to the prod DB before activating; see [MIGRATIONS.md](./MIGRATIONS.md).

- Redis-backed rate limiter and lockout (optional)
  - Configured in `src/config/redis.ts`, used by `src/lib/security/rate-limit.ts`.
  - Enable via env:
    - `ENABLE_REDIS_RATE_LIMITER=true`
    - `REDIS_URL=redis://localhost:6380`
  - Falls back to in-memory if Redis client is not available.

## How to run migrations locally

```
pnpm run db:up
pnpm run db:migrate   # bash scripts/db/run-migration.sh
```

This applies all `scripts/db/migrations/*.sql` in order.

## Production

Production runs self-hosted Postgres on the Hetzner box, with nightly backups to
Cloudflare R2 (`scripts/ops/backup-db-to-r2.sh`); recovery is in
[DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md).

Recommended settings:

- Enforce Postgres timeouts: `statement_timeout` (~15s), `idle_in_transaction_session_timeout` (~30s)
- Enable Redis rate limiting (`ENABLE_REDIS_RATE_LIMITER=true`)
- Admin 2FA (TOTP) and backup codes (future enhancement)
