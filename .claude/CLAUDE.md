# RevampIT - Swiss Non-Profit Tech Platform

@~/.claude/CLAUDE.md

---

## Overview

RevampIT is a **Swiss non-profit** enabling free exchange of technology, promoting open-source hardware and software. Built with Next.js 16, Medusa e-commerce, and custom CMS.

## Architecture

```
revampit/
├── src/                    # Next.js frontend
│   ├── app/               # App Router pages + API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities (logger, auth, db)
│   └── config/            # Constants (TABLE_NAMES, URLS)
├── cms-api/               # Custom CMS backend (Express)
├── medusa-backend/        # Medusa e-commerce
├── docs/                  # Documentation (SSOT files)
└── docker-compose.yml     # Infrastructure
```

### Tech Stack

| Layer | Technology | Port |
|-------|------------|------|
| Frontend | Next.js 16, TypeScript, Tailwind | 3000 |
| CMS API | Express.js | 3001 |
| E-commerce | Medusa | 9000 |
| Main DB | PostgreSQL | 5433 |
| Medusa DB | PostgreSQL | 5435 |
| Cache | Redis | 6380 |
| Search | Meilisearch | 7700 |

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

// CORRECT
import { TABLE_NAMES } from '@/config/database';
const query = `SELECT * FROM ${TABLE_NAMES.USERS} WHERE id = $1`;
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
```typescript
// Use "ss" not "ß"
"Strasse" ✓   "Straße" ✗
"Grüsse" ✓    "Grüße" ✗

// Use Swiss vocabulary
"Velo" ✓      "Fahrrad" ✗
"Billett" ✓   "Ticket" ✗
```

### 5. Protected Files - NEVER Delete
- `cms-api/src/migrations/*`
- `scripts/db/migrations/*`
- `.env*` files

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

---

**Last Updated**: 2026-01-23
