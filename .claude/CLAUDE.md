# evig — affordable-intelligence tech platform

@~/.claude/CLAUDE.md

---

## ⚠️ Rebrand in progress: Revamp-IT → evig (since 2026-07-24)

This codebase was built for Revamp-IT and is now the platform for **evig** —
George's own independent org (founded 2026-07-24, `in Gründung`). evig is a
**non-profit run on a market/quality model**: make genuinely good, durable hardware
affordable to everyone — curated, not junk refurb. The non-profit purpose funds the
mission; affordable pricing is the product, not a subsidy.

**Non-profit framing (George, 2026-07-27) — with an honesty boundary:**
- evig IS positioned as a non-profit — a **gemeinnütziger Verein *in Gründung*** (being
  founded). Describe it that way; the earlier "NOT a charity, don't call it non-profit"
  rule is retired (that was an over-correction away from Revamp-IT's *specific* framing,
  not a rejection of non-profit status).
- **Honesty boundary — do NOT reactivate what isn't true yet:** until the Verein is
  actually registered AND canton-recognized as tax-exempt (`gemeinnützig`), evig may
  **not** issue tax-deductible donation receipts (Spendenbescheinigungen) or claim
  recognized tax-exempt status. Say "in Gründung"; never fabricate a UID, recognition,
  or receipt authority. The removal of false Spendenbescheinigungen stays correct until
  registration is real.
- Still George's call (not to be guessed): legal form confirmation (Verein) + timing of
  registration → when to switch copy from "in Gründung" to a recognized non-profit.

**Two layers — rebrand ONLY Layer A, never blind-rename Layer B:**
- **Layer A (user-facing brand)** → say `evig`: copy, i18n message values, README,
  page content, org identity in `src/config/org.ts`. Done on branch `rebrand/evig`.
- **Layer B (infra identifiers)** → still literally carry the `revampit` name and
  MUST stay accurate to the running system until a deliberate infra refactor:
  DB `revampit_cms` / prod DB `revampit`, the `is_revampit` column, staff-auth
  domain `@revamp-it.ch`, deploy paths `/opt/revampit/app`, systemd `revampit-app`,
  script `selfhost-deploy-revampit.sh`, host `revampit.orangecat.ch`. Renaming any
  of these in docs/code without migrating the actual infra makes the docs LIE and
  can lock the sole admin out (his login is `@revamp-it.ch`). Leave them until the
  infra cutover is explicitly done.

---

## Mission

**Make genuinely good computing affordable to everyone.**

evig curates decent, durable hardware people actually want to use and makes it
affordable — plus repair, IT-help, workshops, and an in-house AI assistant. It
serves people who need capable tech at a fair price, and the community that keeps
hardware in use instead of landfilled. Market/quality model: affordable pricing is
the product, not a subsidy.

**Engineering guardrails derived from this mission:**
- Features that don't help someone get capable, affordable tech — or keep hardware
  usefully in circulation — need strong justification before being built.
- Complexity that serves staff over users should be deferred until core user journeys
  are bulletproof.
- Swiss-based with international reach — multilingual support is not a nice-to-have.

**One-line value proposition:** Affordable intelligence — good hardware, fair price.

---

## Overview

evig is an **affordable-intelligence** platform — curated durable hardware, repair,
and digital access at a fair price. Built with Next.js 16, TypeScript, and Tailwind.

## Architecture

```
revampit/
├── src/                    # Next.js frontend + API routes
│   ├── app/               # App Router pages + API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities (logger, auth, db)
│   └── config/            # Constants (TABLE_NAMES, URLS, org.ts)
├── docs/                  # Documentation (SSOT files)
└── docker-compose.yml     # Infrastructure
```

### Tech Stack

| Layer | Technology | Port |
|-------|------------|------|
| Frontend | Next.js 16, TypeScript, Tailwind | 3000 |
| **Prod DB** | **Self-hosted Postgres on Hetzner** (Supabase stack, `localhost:5432/revampit`) | On the app box |
| **Dev DB** | PostgreSQL in Docker (`pnpm run services:up`, port 5433) | localhost:5433 |
| Search | Meilisearch | 7700 |
| Payments | Payrexx (mock in dev) | — |

### Database Configuration

**CRITICAL — prod and dev use DIFFERENT databases:**

- **Production** runs a **self-hosted Postgres on the Hetzner box**
  (`DATABASE_URL=postgresql://…@localhost:5432/revampit` in
  `/opt/revampit/app/.env`). **Neon is fully retired** (cutover completed
  2026-06-18) — the prod `.env` no longer contains any `DB_*`/`AUTH_DB_*` Neon
  vars; the app + auth both connect via `DATABASE_URL`.
- **Local dev** `.env.local` points `DATABASE_URL` at its own DB (Neon for now).
- **One connection source (SSOT):** `getDbConfig()` (src/lib/auth/config.ts)
  prefers `DATABASE_URL`, so app (Drizzle) and auth (credentials) share one pool.

**Consequences you MUST respect:**
1. **Migrations must reach the PROD Hetzner DB.** The deploy
   (`selfhost-deploy-revampit.sh`) auto-applies any unrecorded
   `scripts/db/migrations/*.sql` to the prod DB before activating. To apply
   manually: ssh `ubuntu@167.233.22.31`, read `DATABASE_URL` from
   `/opt/revampit/app/.env`, pipe the `.sql` to `psql "$DB"` in a transaction,
   then record it in `schema_migrations`. Extension/owner ops need
   `sudo -u postgres psql -d revampit` (the app user isn't superuser).
2. **Schema reaches ANY shared database ONLY via `scripts/db/migrations/`.**
   `drizzle-kit push` is FORBIDDEN against dev/prod — push-created tables are
   invisible to from-scratch replays and broke CI for days (see 101b/109
   baselines). Local ad-hoc DBs: `pnpm run db:migrate`. The CI Migration Drift
   job replays every migration from zero; before pushing a new migration,
   replay locally in a throwaway pgvector container.
3. **App-level enums live in `src/config/*` + zod at the write boundary — NOT
   in SQL CHECK constraints.** Hand-synced CHECK lists drift (the
   `notifications_type_check` was recreated five times and still caused two
   incidents; dropped in migration 110). DB constraints are reserved for true
   invariants: ranges, money, date ordering, uniqueness (see
   `079_invariant_check_constraints.sql`). When touching a domain that still
   has a legacy enum CHECK, verify its write routes validate via zod/config,
   then drop the CHECK in that domain's migration.

**Never assume Neon for prod.** Check `DATABASE_URL` in the relevant `.env`.

### ERP Systems

Two ERP systems exist — do not confuse them:

| System | Status | Purpose | Key column |
|--------|--------|---------|------------|
| **Kivitendo** | Legacy (on-premise) | Historical CSV imports; article numbers from old ERP | `kivitendo_article_number` on `ai_extracted_products` + `inventory_items` |
| **Kivvi** | Current (cloud) | Async sync on erfassung; canonical business record | `kivvi_inventory_item_id` + `kivvi_sync_status` on `inventory_items` |

Kivitendo article numbers are **read-only historical references** for items imported via CSV (`/api/inventory/import-csv`). Never write new Kivitendo article numbers.

Kivvi sync happens non-blocking after erfassung commits via `syncToKivvi()` in `src/lib/kivvi/client.ts`. If Kivvi is not configured (`KIVVI_API_URL` / `KIVVI_API_TOKEN` env vars missing), sync silently skips — expected in dev.

### Storefront Architecture (UNIFIED — updated 2026-06)

There is **one storefront, one store**: the `listings` table (+ `listing_images`,
`listing_specs`), served by `/api/listings` and rendered at `/marketplace`. Two
*ingestion* pipelines feed that single store — keep them separate at the input
layer, but they converge on one storage model (this is intentional, not a DRY
violation):

```
RevampIT shop stock (bulk staff entry)
  /admin/erfassung → ai_extracted_products + inventory_items
                   → publishRevampitListing()  → listings (is_revampit=TRUE, inventory_item_id set)

Community P2P (individuals + staff posting privately)
  /marketplace/sell → POST /api/listings        → listings (is_revampit=FALSE)
```

- **`is_revampit` is the single source of truth** (a stored column). NEVER
  re-derive it from the seller's `@revamp-it.ch` email — staff posting *private*
  items are regular P2P sellers. The sell form always writes `is_revampit=false`;
  only `publishRevampitListing` sets it true.
- **`marketplace_listings` + `/api/shop/inventory` were REMOVED** (migration 103).
  The table is dropped; RevampIT shop stock lives only in `listings`
  (is_revampit=true). The `/shop/*` pages remain as redirects to `/marketplace`
  for legacy URLs. Do not reintroduce a separate RevampIT-shop table or API.
- Erfassung MAY result in a published listing; a staff member posting privately
  is nudged toward erfassung if it's clearly RevampIT stock, but can still post
  as a private individual (`is_revampit=false`).
- **QC gate (2026-07, revised 2026-07-17)**: devices of QC-required categories
  (derived from required testing/security checklist items — currently 10–60)
  default into the intake pipeline with a refurbish checklist. Checklist
  verdicts (pass/fail/n.a.) serialize on a row lock (`SELECT … FOR UPDATE`)
  and support atomic bulk marking (`item_ids[]`, ONE audit event); a failed
  required item puts the device in the `failed` state and ALWAYS blocks
  publishing. Staff can, however, publish WITHOUT QC in one audited click
  (`qc_skip` on the publish route, standard reason from
  `QC_SKIP_ONE_CLICK_NOTE`) — the listing then carries NO Prüfsiegel and
  buyers see the untested state. Final QA keeps the Vier-Augen-Prinzip with
  a one-click solo override (`SECOND_PERSON_SOLO_OVERRIDE_NOTE`). "Im Shop"
  in the pipeline derives from the `listings` table (SSOT); removing a
  listing returns the device to the pipeline. See `docs/INTAKE_QC_DESIGN.md`.
- **CO₂ SSOT (2026-07-17)**: every CO₂-avoidance figure derives from
  `src/config/co2-impact.ts` — per-category ADEME/ARCEP 2025 open-data
  factors × (1 − 15% refurbishment overhead), floored to 5 kg. NO weight×factor
  shortcuts, NO uncited numbers (guarded by `co2-impact.test.ts`); categories
  without a defensible open factor show no claim. Methodology page:
  `/transparenz/co2`.

## Quick Start

```bash
pnpm run d              # Start everything (recommended)
pnpm run dev            # Frontend only
pnpm run services:up    # Start Docker services
pnpm run setup-admins   # Create admin users
```

**Full commands**: See `docs/COMMANDS.md`

## Critical Rules

### 1. NEVER Use console.log
```typescript
// WRONG
console.log('User:', user);

// CORRECT
import { logger } from '@/lib/logger';
logger.info('User fetched', { userId: user.id });
```

### 2. ALWAYS Use TABLE_NAMES
```typescript
// WRONG
const query = `SELECT * FROM users WHERE id = $1`;

// CORRECT — plain JS template literal (passed to query())
import { TABLE_NAMES } from '@/config/database';
const query = `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = $1`;

// CORRECT — inside Drizzle's sql`` template tag, MUST use sql.raw()
// (plain string interpolation creates a bound parameter $1 — invalid as table name)
import { sql } from 'drizzle-orm';
const sub = sql`SELECT COUNT(*) FROM ${sql.raw(TABLE_NAMES.USERS)}`;
```

### 3. ALWAYS Use Parameterized Queries
```typescript
// WRONG - SQL injection risk
const query = `SELECT * FROM users WHERE email = '${email}'`;

// CORRECT
const query = `SELECT * FROM ${TABLE_NAMES.USERS} WHERE email = $1`;
const result = await db.query(query, [email]);
```

### 4. Swiss German Standards

**CRITICAL: NEVER write ASCII umlaut substitutes (ae/oe/ue) in ANY German string.**
This is the #1 most common mistake. EVERY German word with ä, ö, ü MUST use the real character.

```typescript
// ONLY replace ß with ss (Swiss German rule)
"Strasse" ✓   "Straße" ✗
"Grüsse" ✓    "Grüße" ✗
"schliessen" ✓ "schließen" ✗
"abschliessen" ✓ "abschließen" ✗

// ALWAYS use proper umlauts ä, ö, ü — NEVER ASCII substitutes
"für" ✓        "fuer" ✗
"wählen" ✓     "waehlen" ✗
"können" ✓     "koennen" ✗
"enthält" ✓    "enthaelt" ✗    ← COMMON MISTAKE
"erhält" ✓     "erhaelt" ✗
"verfügbar" ✓  "verfuegbar" ✗
"überprüfen" ✓ "ueberpruefe" ✗
"Länge" ✓      "Laenge" ✗
"Höhe" ✓       "Hoehe" ✗
"Übernehmen" ✓ "Uebernehmen" ✗
"Ungültig" ✓   "Ungueltig" ✗
"Änderung" ✓   "Aenderung" ✗
"Gerät" ✓      "Geraet" ✗
"später" ✓     "spaeter" ✗
"Passwörter" ✓ "Passwoerter" ✗
"nächste" ✓    "naechste" ✗
"zurück" ✓     "zurueck" ✗
"gewählt" ✓    "gewaehlt" ✗
"fällt" ✓      "faellt" ✗
"lässt" ✓      "laesst" ✗

// Use Swiss vocabulary
"Velo" ✓      "Fahrrad" ✗
"Billett" ✓   "Ticket" ✗
```

**Run `pnpm run lint:umlauts` to catch ASCII umlaut violations.**
**ALWAYS run this before committing German text changes.**

### 4b. Translation (i18n) SSOT — messages hold STRINGS ONLY

`messages/<locale>.json` are translatable human sentences and NOTHING else.
Anything language-independent must NEVER live in a message file:

- **Structure → config.** Slugs, routes/hrefs, enum keys (status/category/type),
  icon names, ordering, ids, counts/numbers used as data, booleans, CSS classes.
  These live in `src/config/*` or a route-local `data.ts` and are paired to
  translations by stable index/key (structure in config, only the human
  strings — title/description/features — in messages). Putting structure in
  messages let translators corrupt slugs → `/route/undefined`, and bloats
  next-intl's typed-key union.
- **Org data → org.ts.** Emails, phone, addresses, hours, org URLs come from
  `src/config/org.ts` (see §5), never baked into a translated string.
- **Arrays are fragile.** The DE deep-merge fallback (`src/i18n/request.ts`)
  replaces arrays wholesale — there is NO per-element fallback. NEVER iterate a
  translation array and index a config array by the loop index; iterate the
  CONFIG array (it owns length + icon) and pull strings by key/index. A
  desynced array length crashes that locale. Guarded by
  `src/config/__tests__/i18n-array-parity.test.ts` (locale arrays must match DE
  length + per-element keys) — keep it green.

DE is canonical; other locales deep-merge over it. Don't hardcode user-facing
strings in components — add a key. Run `pnpm run compliance:i18n` for parity.

### 6. Protected Files - NEVER Delete
- `scripts/db/migrations/*`
- `.env*` files

### 7. NEVER Hardcode Numbers/Stats in UI
Stats, counts, and metrics displayed to users must come from the database
or from `src/lib/org-numbers.defaults.ts` (the SSOT for org metrics).
Never use placeholder numbers like `100+`, `50+` in components.

```typescript
// WRONG — magic numbers in component
const STATS = [
  { label: 'Mitglieder', value: '100+' },
  { label: 'Inserate', value: '50+' },
]

// CORRECT — fetch real counts from DB
const { data } = await apiFetch('/api/stats/community')

// CORRECT — source from org-numbers SSOT
import { getDefaultNumeric } from '@/lib/org-numbers.defaults'
const devicesSaved = getDefaultNumeric('devices_sold_per_year')
```

## API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { TABLE_NAMES } from '@/config/database';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db.query(
      `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    );
    
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('API error', { error, path: request.url });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

## Authentication & Authorization

### Simplified Permission System (v2)

The auth system uses a simple, extensible approach:

```
┌──────────────────────────────────────────────────────────────┐
│                     USER TYPES                               │
├──────────────────────────────────────────────────────────────┤
│ Regular Users        │ Staff (promoted by a super admin)     │
│ - No roles needed    │ - is_staff: true                      │
│ - Create content     │ - staff_permissions: string[]         │
│ - Content needs      │ - Access admin dashboard              │
│   admin approval     │ - Super admins: full access           │
└──────────────────────────────────────────────────────────────┘
```

**Key Files:**
- `src/lib/permissions.ts` - Core permission system (SSOT)
- `src/auth.ts` - Auth.js configuration with session fields
- `src/app/admin/layout.tsx` - Server component with auth checks
- `src/app/admin/AdminLayoutClient.tsx` - Client sidebar with sections

### Staff Detection

```typescript
import { isStaffEmail, isSuperAdmin } from '@/lib/permissions';

// Staff status is the `is_staff` DB column, granted explicitly by a super
// admin (PATCH /api/admin/users/[id]/permissions) or the HR hire flow.
// It is NEVER derived from the e-mail domain — anyone may register.
// `isStaffEmail` is COSMETIC ONLY (picks the welcome-email template).

// Super admins have full access to sensitive sections. The DB
// (`users.is_super_admin`) is the SSOT; SUPER_ADMIN_EMAILS is a
// bootstrap floor holding only the owner, so evig can't lock itself out.
isSuperAdmin('georgy.butaev@revamp-it.ch')  // true
```

### Permission Checking

```typescript
import { canAccessSection, getAccessibleSections } from '@/lib/permissions';

// Check if user can access a section
const hasAccess = canAccessSection({
  email: session.user.email,
  is_staff: session.user.isStaff,
  staff_permissions: session.user.staffPermissions,
}, 'hirn');

// Get all sections user can access
const sections = getAccessibleSections(user);
```

### Admin Sections

**SSOT: `src/config/sections.ts`.** Read it — do not trust a table here.
`ADMIN_SECTIONS` in `lib/permissions.ts` is derived from it, and the ids/paths
change often enough that any copy in a doc goes stale and starts handing out the
wrong permission. This section used to carry a 10-row table listing ids that no
longer exist (`products`, `finances`) and paths that 404 — granting `workshops`
to a staff member gave them nothing, because the admin section is
`workshops-admin` while `workshops` is a *dashboard* section.

To see the real list:

```bash
# every admin section id + path
grep -nE "^  [a-z-]+: \{" src/config/sections.ts

# the sensitive ones (require super admin or an explicit grant)
grep -n "sensitive: true" -B8 src/config/sections.ts | grep -E "^\s+id:"
```

Rules that do not change:
- **Sensitive sections require super admin or an explicit permission.**
  `DEFAULT_STAFF_PERMISSIONS` = all sections *minus* the sensitive ones, so
  `is_staff` alone grants none of them.
- Route-level checks go through `withAdmin('<section>')`, or — for endpoints a
  resource owner must also reach — the section-specific helper (e.g.
  `canAccessFinance`). **Never** gate on `session.user.isStaff` directly; that is
  a much wider set and has produced a live privilege escalation before.

### Content Approval Flow

Users create content (products, services, workshops, blog posts) that goes through approval:

```
draft → pending → approved/rejected
```

Status is stored in `user_content_submissions` table.

### Session Fields

```typescript
session.user = {
  id: string,
  email: string,
  name: string | null,
  isStaff: boolean,           // from the is_staff DB column (admin-granted)
  staffPermissions: string[], // ['dashboard', 'products', ...] or ['*']
}
```

### Database Migration

Run `scripts/db/migrations/002b-simplified-auth.sql` to add:
- `is_staff` column to users table
- `staff_permissions` column to users table
- `technician_profiles` table (replaces repairer)
- `seller_profiles` table
- `user_content_submissions` table

## Pre-Commit Checklist

- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run lint` passes
- [ ] No `console.log` statements
- [ ] Using `logger` from `@/lib/logger`
- [ ] Using `TABLE_NAMES` from `@/config/database`
- [ ] Parameterized SQL queries
- [ ] Swiss German for user-facing text

## Key Documentation (SSOT)

| Document | Purpose |
|----------|---------|
| `docs/SHARED_CONTEXT.md` | Tech stack, database, file structure |
| `docs/COMMANDS.md` | All package scripts |
| `docs/MISSION_STATEMENT.md` | Organization mission |
| `docs/CODE_AUDIT.md` | Current issues to fix |

## Don't

- Use `console.log` (use `logger`)
- Hardcode table names (use `TABLE_NAMES`)
- Use string concatenation in SQL
- Delete migration files
- Use "ß" in German text (use "ss")
- Commit `.env` files
- Hardcode numbers/stats/metrics in UI (query from DB or use `org-numbers.defaults.ts`)

---

**Last Updated**: 2026-09-04
