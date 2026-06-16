# Revamp-IT

> Used computers repaired and rehomed — not landfilled.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791.svg)](https://neon.tech/)
[![Production](https://img.shields.io/badge/Production-revampit.orangecat.ch-green.svg)](https://revampit.orangecat.ch)

Revamp-IT is a Swiss non-profit association (Verein) operating since 2003 in Zürich. We accept donated computers, refurbish them, and redistribute them — to people who can't reach the commercial channel, to schools and community projects, and through our marketplace. We also run repair workshops and an open IT-Hilfe (IT help) program so the people we serve learn to keep their devices running themselves. This repository is the platform we use to run all of it.

## What this platform does

| Surface | Who it serves | What it does |
|---|---|---|
| **Storefront** | The public | Sells refurbished hardware (RevampIT-certified) to fund operations |
| **P2P Marketplace** | Community | Lets members buy / sell / give away tech between each other |
| **IT-Hilfe** | People who need help | Matches help requests with volunteer technicians; in-person + remote |
| **Workshops** | Community | Repair Café sessions, Linux installs, digital-skills classes — paid + free |
| **Erfassung pipeline** | Staff | AI-assisted intake → triage → photo → publish for donated hardware |
| **Member services** | Members | Member directory, Swiss-compliant donation receipts, voting on association decisions |
| **HIRN AI** | Staff | In-house knowledge / action assistant; cascades through Groq / OpenRouter / Ollama |

## How a non-profit funds this kind of platform

We are not VC-backed. The economic model is deliberately mixed so no single source carries the whole organization:

1. **Storefront revenue** — refurbished devices sold at affordable prices. Margin funds operations; surplus subsidizes the people who can't pay full price.
2. **Service revenue** — paid workshops, repair services, IT-Hilfe billable to companies that can pay (free for individuals who can't).
3. **Donations** — direct cash donations and in-kind hardware donations (we issue Swiss-tax-compliant receipts; see `LEGAL_NONPROFIT_COMPLIANCE.md`).
4. **Membership** — yearly membership fees (regular CHF 50, reduced CHF 20).
5. **Grants & partnerships** — selective collaborations with municipal programs and aligned organizations.

The platform is the operational backbone for all five. It is open-source ([MIT](LICENSE)) so other circular-economy organizations can adopt it directly — there's no extractive layer in between.

## Architecture

The application is a single Next.js 16 app with App Router for both pages and API routes. Data lives in a Neon-hosted PostgreSQL, accessed through Drizzle ORM. Authentication uses NextAuth v5 (Auth.js) with the @auth/pg-adapter. Search is powered by Meilisearch. Payments go through Payrexx (Swiss-based, ZKB/Twint/card). Email is delivered via Listmonk with Nodemailer / Brevo as fallback.

### TABLE_NAMES as Single Source of Truth

`src/config/database.ts` defines ~130 table name constants. Every database query references `TABLE_NAMES` -- never a hardcoded string. The constants are organized into logical groups:

```
User & Auth | Inventory | Messaging | Services | Workshops | Locations
Applications | Payments | Reviews | Documents | IT-Hilfe | HIRN AI
Staff | Tasks | Content | Activity Stream | Meeting Protocols
P2P Marketplace | Organizational Numbers
```

Related SSOT exports live alongside: `APPOINTMENT_ROLES`, `REVIEW_TARGET_TYPES`, `CONVERSATION_TYPES`, `SERVICE_CATEGORIES`, `FEATURED_SERVICE_SLUGS`.

Adding a new domain means adding constants to one file. If a table name is wrong, it's wrong in one place.

### Permission System

Three tiers, zero ambiguity:

```
Users  -->  Staff (@revamp-it.ch email)  -->  Super Admins (hardcoded list)
```

- `is_staff` boolean + `staff_permissions` text array on the users table
- Staff detection by email domain; super admins by explicit list
- Sensitive sections require permission checks -- no implicit trust

### Content Approval Flow

```
draft --> pending --> approved / rejected
```

Stored in `user_content_submissions`. Nothing goes live without review.

### HIRN AI

In-house AI knowledge management system with an action cockpit and executor. Handles organizational intelligence -- not a chatbot wrapper.

### Development Standards

These are enforced, not suggested:

- **Logger** -- `import { logger } from '@/lib/logger'`. Never `console.log`.
- **TABLE_NAMES** -- never hardcoded table strings. Import from `src/config/database.ts`.
- **Parameterized queries** -- never string concatenation. No exceptions.
- **Swiss German** -- user-facing text uses `ss` (not `ß`), proper `ä/ö/ü` (never `ae/oe/ue`). `npm run lint:umlauts` catches violations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 18, TypeScript 5, Tailwind 3 |
| Database | Neon PostgreSQL (cloud), Drizzle ORM |
| Auth | NextAuth v5 (Auth.js) + @auth/pg-adapter |
| Search | Meilisearch |
| Payments | Payrexx (Swiss-based; ZKB / Twint / card) |
| Email | Listmonk (primary), Nodemailer / Brevo (fallback) |
| Rate limiting | Redis (upstash) |
| AI | HIRN (in-house provider stack: Groq → OpenRouter → Ollama cascade) |
| Testing | Jest (7,500+ tests), Playwright (E2E) |
| CI/CD | GitHub Actions, Vercel |

<details>
<summary><strong>Quick Start</strong></summary>

### Prerequisites

- Node.js 20+
- A Neon PostgreSQL account (free tier works)
- Optional: Meilisearch, Redis, Listmonk for full feature coverage

### Setup

```bash
git clone https://github.com/g-but/revampit.git
cd revampit
cp .env.example .env.local    # fill in DATABASE_URL, AUTH_SECRET, payment keys, etc.
npm install
npm run db:migrate
npm run dev                    # Next.js on :3000
```

### Environment Variables

At minimum, configure:

- `DATABASE_URL` -- Neon PostgreSQL connection string (sslmode=require)
- `AUTH_SECRET` -- 32+ char random string for NextAuth JWT signing
- `PAYREXX_INSTANCE` / `PAYREXX_API_SECRET` / `PAYREXX_WEBHOOK_SECRET` -- payment integration
- `LISTMONK_URL` + Listmonk credentials -- email delivery
- `MEILISEARCH_URL` / `MEILISEARCH_KEY` -- search

See `.env.example` for the full list.

</details>

## Testing

7,500+ tests across 500+ Jest suites, plus a Playwright E2E layer.

| Category | Coverage |
|----------|----------|
| API routes | Notifications, admin, IT-Hilfe |
| Business logic | Protocols, payments, currency, tax compliance, HIRN AI |
| Auth | Password handling, permissions, rate limiter |
| Data processing | Bulk extraction, file parsing, CSV export/import |
| Validation | Schema tests |
| E2E (Playwright) | Auth smoke, marketplace, IT-Hilfe, security |

```bash
npm test              # run all Jest tests
npm run test:e2e      # run Playwright E2E suite
```

### CI Pipeline

Defined in `.github/workflows/ci.yml`:

1. **Code Quality** -- ESLint + TypeScript type check + Next.js build
2. **Auth Smoke Test** -- Playwright, runs conditionally
3. **Unit Tests** -- Jest, PR only

Vercel handles production deployment on merge to `main`.

## Project Structure

```
src/
  app/              # Next.js App Router (pages + API routes)
    [locale]/       # Public site (next-intl, de/en/fr/es/it/ja/ko)
    admin/          # Staff admin surface
    api/            # API route handlers
  components/       # React components (UI only, no business logic)
  config/
    database.ts     # TABLE_NAMES SSOT (~130 constants)
    org.ts          # Org-wide data SSOT (name, address, email, hours)
  lib/
    auth/           # NextAuth v5 wiring, permissions, staff detection
    services/       # Business logic (no HTTP, no UI)
    email/          # Templates and delivery
    it-hilfe/       # IT-Hilfe domain (notifications, matching, offers)
    payments/       # Payrexx integration
    logger.ts       # Structured logging
  hooks/            # Data fetching (SWR), state management
  db/schema/        # Drizzle schemas
scripts/
  db/migrations/    # Sequential SQL migrations (072 ADD COLUMN token_version, etc.)
tests/              # Jest test suites
e2e/                # Playwright E2E tests
```

## Contributing

1. Fork and create a feature branch
2. Follow the development standards (TABLE_NAMES, logger, parameterized queries, Swiss German rules)
3. Run `npm test` and `npm run lint:umlauts` before pushing
4. Open a PR against `main` -- CI will validate code quality and tests

## License

MIT

---

Revamp-IT -- Birmensdorferstrasse 379, 8055 Zürich -- [revamp-it.ch](https://revamp-it.ch)
