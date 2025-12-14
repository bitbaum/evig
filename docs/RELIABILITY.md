# Reliability Hardening Summary

This project is configured to favor reliability of Auth and Database while keeping CMS disabled by default.

## What’s configured

- CMS disabled by default
  - `ENABLE_CMS=false` gates all CMS API routes and client calls.
  - `cms_api` service is commented out in `docker-compose.yml`.

- Database hardening
  - New migration `scripts/db/migrations/005_auth_hardening_and_indexes.sql`:
    - Enforces case-insensitive emails via `CITEXT` with a safety pre-check.
    - Ensures Auth.js timestamp columns exist (`users."emailVerified"`, `"createdAt"`, `"updatedAt"`).
    - Adds critical indexes for interactions, preferences, segments, workshop instances, registrations, service appointments, and JSONB fields.
  - Migration runner updated to apply all migrations in order.

- Redis-backed rate limiter and lockout (optional)
  - Enable via env:
    - `ENABLE_REDIS_RATE_LIMITER=true`
    - `REDIS_URL=redis://localhost:6380` (or use `MEDUSA_REDIS_URL`)
  - Falls back to in-memory if Redis client is not available.

## How to run migrations

```
npm run db:up
bash scripts/db/run-migration.sh
```

This applies all `scripts/db/migrations/*.sql` in order.

## Recommended production settings

- Managed HA Postgres (Multi-AZ, PITR) and PgBouncer (transaction pooling)
- Enforce Postgres timeouts: `statement_timeout` (~15s), `idle_in_transaction_session_timeout` (~30s)
- Enable Redis rate limiting (`ENABLE_REDIS_RATE_LIMITER=true`)
- Admin 2FA (TOTP) and backup codes (future enhancement)

