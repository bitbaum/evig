---
created_date: 2026-01-07
last_modified_date: 2026-01-07
last_modified_summary: Created SSOT for project context (mission, tech stack, location, database)
---

# RevampIT Shared Context (SSOT)

**Single Source of Truth** for project context used by all agent files and documentation.

---

## Project Overview

**RevampIT** is a Swiss non-profit organization dedicated to **enabling free exchange of technology** between individuals and groups, promoting **open-source hardware and software** as the ideal form of human collaboration.

**Location**: Badenerstrasse 816, 8048 Zürich, Switzerland

**Full Mission Statement**: See `docs/MISSION_STATEMENT.md`  
**Legal Compliance**: See `docs/LEGAL_NONPROFIT_COMPLIANCE.md`

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS | Port 3000 |
| Backend | Next.js API Routes, Express CMS API | Port 3001 |
| E-commerce | Custom (inventory-based) | Integrated |
| Database | PostgreSQL (5433), Redis (6380), Meilisearch (7700) | |
| Deploy | Vercel, Docker, GitHub Actions | |

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

cms-api/src/migrations/   # Database migrations (PROTECTED)
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

**Last Updated**: 2026-01-07
