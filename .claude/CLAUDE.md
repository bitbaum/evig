# Revamp-IT - Swiss Non-Profit Tech Platform

@~/.claude/CLAUDE.md

---

## Mission

**Used computers get repaired and rehomed — not landfilled.**

Revamp-IT serves two users: people who need affordable tech and can't get it through commercial channels, and donors/volunteers who want their old hardware to have a second life. The platform succeeds when a working computer reaches someone who needs it, a repair technician earns meaningful work, or a community member gains digital skills — all without extracting profit.

**Engineering guardrails derived from this mission:**
- Features that don't move hardware from donors to recipients, or connect repair needs to technicians, need strong justification before being built.
- Complexity that serves staff over users should be deferred until core user journeys are bulletproof.
- The platform is Swiss-based with international reach — multilingual support is not a nice-to-have, it is the mission.

**One-line value proposition:** Used computers repaired and rehomed — not landfilled.

---

## Overview

Revamp-IT is a **Swiss non-profit** enabling free exchange of technology, promoting open-source hardware and software. Built with Next.js 16, TypeScript, and Tailwind.

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
| **Main DB** | **Neon PostgreSQL (cloud)** | **Remote** |
| Search | Meilisearch | 7700 |
| Payments | Payrexx (mock in dev) | — |

### Database Configuration

**CRITICAL: This project uses Neon PostgreSQL (cloud), NOT local PostgreSQL.**

**.env.local MUST have:**
```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**To set up Neon:**
1. Get connection string from https://console.neon.tech
2. Run: `./switch-to-neon.sh` (will prompt for URL)
3. Migrations run automatically

**Never assume local PostgreSQL.** Always check for `DATABASE_URL` in `.env.local`.

### ERP Systems

Two ERP systems exist — do not confuse them:

| System | Status | Purpose | Key column |
|--------|--------|---------|------------|
| **Kivitendo** | Legacy (on-premise) | Historical CSV imports; article numbers from old ERP | `kivitendo_article_number` on `ai_extracted_products` + `inventory_items` |
| **Kivvi** | Current (cloud) | Async sync on erfassung; canonical business record | `kivvi_inventory_item_id` + `kivvi_sync_status` on `inventory_items` |

Kivitendo article numbers are **read-only historical references** for items imported via CSV (`/api/inventory/import-csv`). Never write new Kivitendo article numbers.

Kivvi sync happens non-blocking after erfassung commits via `syncToKivvi()` in `src/lib/kivvi/client.ts`. If Kivvi is not configured (`KIVVI_API_URL` / `KIVVI_API_TOKEN` env vars missing), sync silently skips — expected in dev.

### Storefront Architecture

RevampIT runs **two separate storefronts** — not a unified marketplace:

```
RevampIT Shop (internal stock)
  erfassung → ai_extracted_products + inventory_items
            → marketplace_listings (platform='internal')
            → /api/shop/inventory/

P2P Marketplace (community)
  /marketplace/sell → listings (is_revampit=false)
                    → /api/listings/
```

**The `listings` table has `is_revampit` and `inventory_item_id` columns, but these are unimplemented stubs.** RevampIT products do NOT appear in the P2P `listings` table. They are served exclusively via `marketplace_listings` + `/api/shop/inventory/`.

Do not attempt to merge the two storefronts without a deliberate architectural decision — both schemas, routes, and UI pages are currently independent.

## Quick Start

```bash
npm run d              # Start everything (recommended)
npm run dev            # Frontend only
npm run services:up    # Start Docker services
npm run setup-admins   # Create admin users
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

**Run `npm run lint:umlauts` to catch ASCII umlaut violations.**
**ALWAYS run this before committing German text changes.**

### 5. Organization Data — SSOT
All org-level data (name, addresses, phone, email, hours, URLs) lives in
`src/config/org.ts`. Never hardcode these values elsewhere — import from org.ts.

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
│ Regular Users        │ Staff (@revamp-it.ch email)           │
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

// Anyone with @revamp-it.ch email is staff
isStaffEmail('user@revamp-it.ch')  // true

// Super admins have full access to sensitive sections
isSuperAdmin('andreas@revamp-it.ch')  // true
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

Defined in `ADMIN_SECTIONS` constant:

| Section | Path | Sensitive |
|---------|------|-----------|
| dashboard | /admin | No |
| products | /admin/products | No |
| workshops | /admin/workshops | No |
| services | /admin/services | No |
| approvals | /admin/approvals | No |
| users | /admin/users | **Yes** |
| team | /admin/team | **Yes** |
| finances | /admin/hirn/finanzen | **Yes** |
| hirn | /admin/hirn | **Yes** |
| settings | /admin/settings | **Yes** |

**Sensitive sections** require super admin or explicit permission.

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
  isStaff: boolean,           // true for @revamp-it.ch emails
  staffPermissions: string[], // ['dashboard', 'products', ...] or ['*']
}
```

### Database Migration

Run `scripts/db/migrations/002-simplified-auth.sql` to add:
- `is_staff` column to users table
- `staff_permissions` column to users table
- `technician_profiles` table (replaces repairer)
- `seller_profiles` table
- `user_content_submissions` table

## Pre-Commit Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] No `console.log` statements
- [ ] Using `logger` from `@/lib/logger`
- [ ] Using `TABLE_NAMES` from `@/config/database`
- [ ] Parameterized SQL queries
- [ ] Swiss German for user-facing text

## Key Documentation (SSOT)

| Document | Purpose |
|----------|---------|
| `docs/SHARED_CONTEXT.md` | Tech stack, database, file structure |
| `docs/COMMANDS.md` | All npm scripts |
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

**Last Updated**: 2026-04-13
