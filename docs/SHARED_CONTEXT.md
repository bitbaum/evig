---
created_date: 2026-01-07
last_modified_date: 2026-06-15
last_modified_summary: Deploy SSOT — push-to-deploy to revampit.orangecat.ch (husky + GitHub Actions)
---

# Revamp-IT Shared Context (SSOT)

**Single Source of Truth** for project context used by all agent files and documentation.

---

## Project Overview

**Revamp-IT** is a Swiss non-profit organization dedicated to **enabling free exchange of technology** between individuals and groups, promoting **open-source hardware and software** as the ideal form of human collaboration.

**Location**: Birmensdorferstrasse 379, 8055 Zürich, Switzerland

**Full Mission Statement**: See `docs/MISSION_STATEMENT.md`  
**Legal Compliance**: See `docs/LEGAL_NONPROFIT_COMPLIANCE.md`

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS | Port 3000 |
| Backend | Next.js API Routes | — |
| Auth | Auth.js v5, Credentials, JWT sessions | Same login for `/dashboard` and `/admin` — see `docs/UNIFIED_AUTH.md` |
| E-commerce | Custom (inventory-based) | Integrated |
| Database | PostgreSQL (Neon prod; Docker 5433 local), Redis (6380), Meilisearch (7700) | Drizzle ORM |
| Deploy | Hetzner (revampit.orangecat.ch), push-to-deploy; Vercel disabled | See `docs/COMMANDS.md` |

---

## Database Configuration

| Database | Port | Name | User | Password Env Var |
|----------|------|------|------|------------------|
| Main | 5433 | `revampit_cms` | postgres | `$POSTGRES_PASSWORD` |
| Redis | 6380 | - | - | - |
| Meilisearch | 7700 | - | - | - |

---

## Access Points

- **Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **AI CMS Editor**: http://localhost:3000/ai-cms
- **Shop**: http://localhost:3000/shop

---

## File Structure

```
src/
├── app/api/             # API routes
├── components/ui/        # Reusable UI components
├── lib/                  # Utilities (logger.ts, auth/, utils.ts)
├── config/               # Constants (database.ts, urls.ts)
└── types/                # TypeScript definitions

scripts/db/migrations/    # Migration scripts (PROTECTED)
```

---

## Swiss Context

- **Language**: Swiss High German ("ss" not "ß", "Velo" not "Fahrrad")
- **Currency**: CHF (Swiss Francs)
- **Postal Codes**: 4-digit format (e.g., 8048)
- **Error Messages**: Use German for user-facing, English for logs

**Detailed Rules**: See `.cursor/rules/swiss-context.mdc`

---

## Auth & onboarding (pointers)

- **SSOT:** `docs/UNIFIED_AUTH.md` — registration, verify-code, password reset, staff permissions
- **Live onboarding:** `OnboardingChecklist` on `/dashboard` (`src/lib/domain/onboarding.ts`)
- **Notifications:** central `notifyUsers()` pipeline — see `docs/ARCHITECTURE_DEBT.md` (#2 closed)

---

## Monitor-Upcycling mini-site

Public sub-site at `/projects/upcycling/*`. Routes, reading flow, gallery, business plan i18n, and scripts: **`docs/projects/upcycling.md`**.

Nav dropdown labels for projects live under **`nav.items.*`** in locale files; use `nav-i18n.ts` helpers in header components.

**Last Updated**: 2026-06-15
