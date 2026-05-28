# RevampIT Platform – Session Summary and Plan

## What We Changed (This Session)

- Auth & DB Hardening
  - `scripts/db/migrations/005_auth_hardening_and_indexes.sql`: Adds `CITEXT` case‑insensitive emails, ensures Auth.js columns (`"emailVerified"`, `"createdAt"`, `"updatedAt"`), and creates missing indexes (interactions, preferences, segments, workshops, service appointments, JSONB where used).
  - `scripts/db/run-migration.sh`: Runs all SQL migrations in order (001..005).
  - Optional Redis‑backed rate limiting/lockout with `ENABLE_REDIS_RATE_LIMITER=true` (fallback to in‑memory). Files: `src/lib/auth/redis.ts`, `src/lib/auth/rate-limiter.ts`, `src/lib/admin-auth.ts`.

- CMS Disabled by Default
  - Feature flag `ENABLE_CMS=false` gates CMS routes and client usage.
  - `docker-compose.yml`: `cms_api` commented out. NPM scripts updated to avoid starting CMS.

- Registration & Login UX
  - Role selector now responsive, compact, and optional on sign‑up (`NEXT_PUBLIC_ENABLE_ROLE_SELECTION_ON_REGISTER`, default false). Files: `src/components/auth/RoleSelector.tsx`, `src/components/auth/RegisterForm.tsx`.
  - Precise login error messaging: new API `POST /api/auth/login-status` classifies failures (no account, email unverified, passwordless account, locked, wrong password). File: `src/components/auth/LoginForm.tsx`, `src/app/api/auth/login-status/route.ts`.

- Dashboard Actions
  - Workshops: Cancel own registration – `PATCH /api/workshops/registrations/:id` + UI button.
  - Termine: Cancel own appointment – `PATCH /api/appointments/:id` + UI button.
  - Blog: “Beitrag verfassen” entry card to `/blog/submit`.
  - Files: `src/app/api/workshops/registrations/[id]/route.ts`, `src/app/dashboard/workshops/page.tsx`, `src/app/api/appointments/[id]/route.ts`, `src/app/dashboard/appointments/page.tsx`, `src/app/dashboard/page.tsx`.

- Webshop Integration Stability
  - Health endpoint: `GET /api/shop/health` checks `regions`/`products`.
  - Files: `src/app/api/shop/{products,regions}/route.ts`, `src/app/api/shop/cart/**`, `src/app/api/shop/health/route.ts`.

- System Health
  - Auth DB health: `GET /api/health/auth-db` verifies connection + core tables and shows effective DB config (without secrets).

- Marketplace Copy & CTA (Schweizer Hochdeutsch)
  - CTA “Auf Revamp‑IT verkaufen” and direct‑shipping description. Files: `src/app/marketplace/page.tsx`, `src/app/dashboard/page.tsx`.

## Expected Results (Acceptance)

- Auth & DB
  - Email casing no longer causes duplicates; login and registration stable.
  - Query performance improved on hot tables; no missing core tables.
  - Optional Redis for rate‑limiting/lockout works across instances.

- UX
  - Clean, responsive role tiles; optional role selection at registration.
  - Login shows accurate failure reasons (not generic “Configuration”).

- Dashboard
  - Users can cancel workshop registrations and Termine from their dashboards.
  - Users can submit a blog post from the dashboard.

- Webshop
  - Shop page working; health endpoint returns 200 for `regions` and `products`.

## What Still Needs to Be Done (Next)

- Webshop: Sell on Revamp‑IT (End‑to‑End)
  - `POST /api/uploads`: Multipart image upload (dev: local `/public/uploads`, prod: S3 later). Returns public URLs.
  - `POST /api/seller/products`: Server‑side product creation using CHF, single variant, image URLs, and metadata (`seller_user_id`, `seller_type: 'private'`, `condition`, `location`, `fulfillment: 'direct_seller'`).
  - Wire `ProductListingForm` submit → upload images → create product → success + link to listing.
  - Optional moderation: create as draft with `review_status: 'pending'`.

- Edit Responses from Dashboard
  - Workshops: “Feedback bearbeiten” modal – `PATCH /api/workshops/registrations/:id` for `{ feedback, rating }`.
  - Termine: “Angaben bearbeiten” – `PATCH /api/appointments/:id` for `{ description }` (and allow reschedule while `requested`).

- Repairer Discovery (Location + Feedback)
  - Use `user_profiles` address fields (city/canton/country) as initial filter; optional geocoding → lat/lng for proximity.
  - Create `GET /api/repairers?near=Zürich&radius=...` and a searchable directory page.
  - Add feedback model for completed jobs (reuse `service_appointments.rating/feedback` roll‑up into profile view).
  - Indexes: if using geocoding, add `repairer_locations` with GiST index or rely on city/canton filters.

- UX & Productization
  - Dashboard CTAs for Seller/Repairer with capability toggles (not hard role switches): `can_sell`, `can_repair` flags.
  - ISR/caching for shop/product lists with circuit breakers to avoid hard dependency on the backend.
  - Observability: alerts for auth/DB/shop health endpoints; error budgets.

- Data & Code Quality
  - Unify migrations fully under one canonical pipeline (we started this): continue removing duplicates and align all tables.
  - Add focused tests for auth/db helpers and API endpoints.
  - Keep modules DRY: feature flags (`ENABLE_CMS`, `ENABLE_REDIS_RATE_LIMITER`, `NEXT_PUBLIC_ENABLE_ROLE_SELECTION_ON_REGISTER`) and small, composable server routes.

## How to Verify Locally

- Database
  - `npm run db:up`
  - `bash scripts/db/run-migration.sh` (applies 001..005)
  - Visit `GET /api/health/auth-db` → expect `{ ok: true }`.

- Webshop
  - Visit `GET /api/shop/health` → expect `ok: true`.

## Open Questions / Decisions

- Moderation
  - Do we publish community listings immediately or require approval? (Default: publish)

- Seller/Repairer Onboarding
  - Minimal additional info (contact, shipping notes, service radius)? We can gate capability on first use.

- Geodata
  - Stick to city/canton filters initially or geocode for distance search? (Recommend: phase 1 city/canton, phase 2 geocode)

## Guiding Principles

- Modular & DRY: small typed server routes, feature flags, shared helpers.
- Secure by default: secrets server‑side only; rate limiting/lockout; audit logging.
- Reliable schema: migrations idempotent and additive; indexes where needed; casing rules enforced (CITEXT).
- Seamless UX: one account, one dashboard, same listing flow for us and customers.

