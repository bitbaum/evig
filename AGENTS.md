# AGENTS.md - RevampIT

> Universal guide for AI coding agents (Claude, Codex, Gemini, Cursor)

## Project Overview

**RevampIT** is a Swiss non-profit enabling free exchange of technology through open-source advocacy.

| Aspect | Details |
|--------|---------|
| Type | Non-profit tech platform |
| Frontend | Next.js 16, TypeScript, Tailwind |
| Backend | Custom CMS (Express), Next.js API Routes |
| Database | PostgreSQL, Redis, Meilisearch |
| Location | Zürich, Switzerland |
| Language | Swiss High German |

## Quick Commands

```bash
# Development
npm run d              # Start everything (databases + frontend)
npm run dev            # Frontend only (port 3000)
npm run services:up    # Start Docker services
npm run services:down  # Stop Docker services
npm run setup-admins   # Create admin users

# Quality
npm run typecheck      # TypeScript check (REQUIRED before commits)
npm run lint           # ESLint
npm run build          # Production build
npm run test           # Jest tests
npm run test:e2e       # Playwright E2E

```

**Full reference**: `docs/COMMANDS.md`

## Project Structure

```
revampit/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── admin/         # Admin dashboard
│   │   └── shop/          # E-commerce pages
│   ├── components/        # React components
│   │   └── ui/           # Reusable UI
│   ├── lib/              # Utilities
│   │   ├── logger.ts     # Logging (USE THIS, not console.log)
│   │   ├── auth/         # Authentication
│   │   └── database.ts   # DB connection
│   └── config/           # Constants
│       ├── database.ts   # TABLE_NAMES
│       └── urls.ts       # URL constants
├── cms-api/              # Custom CMS backend
│   └── src/migrations/   # DB migrations (PROTECTED)
├── docs/                 # Documentation (SSOT)
└── scripts/              # Utility scripts
```

## Code Style Guidelines

### Logging (CRITICAL)
```typescript
// NEVER use console.log
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId: user.id });
logger.error('Database query failed', { error, query });
logger.warn('Deprecated function called', { function: 'oldFunc' });
```

### Database Queries
```typescript
import { TABLE_NAMES } from '@/config/database';
import { db } from '@/lib/database';

// Always use TABLE_NAMES constant
const query = `SELECT * FROM ${TABLE_NAMES.USERS} WHERE email = $1`;

// Always use parameterized queries
const result = await db.query(query, [email]);
```

### Component Pattern
```typescript
'use client';

import { logger } from '@/lib/logger';

interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
}

export function UserCard({ user, onSelect }: UserCardProps) {
  const handleClick = () => {
    logger.info('User selected', { userId: user.id });
    onSelect?.(user);
  };

  return (
    <div onClick={handleClick} className="p-4 border rounded">
      <h3>{user.name}</h3>
    </div>
  );
}
```

## Swiss Context

### Language Rules
```typescript
// Swiss High German - NO ß
"Strasse" ✓    "Straße" ✗
"Grüsse" ✓     "Grüße" ✗
"ausserhalb" ✓ "außerhalb" ✗

// Swiss vocabulary
"Velo" ✓       "Fahrrad" ✗
"Trottoir" ✓   "Gehweg" ✗
"Billett" ✓    "Ticket" ✗
```

### Formatting
```typescript
// Currency: CHF
"CHF 599.00" or "599.– CHF"

// Date: DD.MM.YYYY
"06.01.2026"

// Time: 24-hour
"13:00 - 17:00"

// Postal code: 4 digits
"8048" // Zürich
```

## Key Constants

### TABLE_NAMES (from `src/config/database.ts`)
```typescript
TABLE_NAMES.USERS
TABLE_NAMES.WORKSHOPS
TABLE_NAMES.PRODUCTS
TABLE_NAMES.APPOINTMENTS
TABLE_NAMES.SERVICES
```

### Access Points
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Admin | http://localhost:3000/admin |
| Shop | http://localhost:3000/shop |

## Protected Files - NEVER Delete

- `cms-api/src/migrations/*` - Database migrations
- `scripts/db/migrations/*` - Migration scripts
- `.env*` - Environment files
- `docs/*` - Documentation

## Don't

- Use `console.log` (use `logger`)
- Hardcode table names (use `TABLE_NAMES`)
- Use string concatenation in SQL queries
- Delete migration files
- Use "ß" (use "ss")
- Commit credentials or `.env` files
- Skip `npm run typecheck` before commits

## Pre-Commit Checklist

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `grep -r "console\." src/` returns no results
- [ ] All SQL uses `TABLE_NAMES` and parameterized queries
- [ ] Swiss German text uses "ss" not "ß"

## SSOT Documentation

| File | Purpose |
|------|---------|
| `docs/SHARED_CONTEXT.md` | Tech stack, database config |
| `docs/COMMANDS.md` | All npm scripts |
| `docs/MISSION_STATEMENT.md` | Organization mission |
| `docs/CODE_AUDIT.md` | Current issues |
| `.cursor/rules/*.mdc` | Cursor IDE rules |

---

**Last Updated**: 2026-01-08
