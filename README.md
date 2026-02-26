# RevampIT

Technology deserves a second life. So does the right to use it.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791.svg)](https://neon.tech/)
[![Live](https://img.shields.io/badge/Live-revamp--it.ch-green.svg)](https://revamp-it.ch)

## Mission

RevampIT is a Swiss nonprofit enabling the free exchange of technology on a nonprofit basis. We redistribute computers, hardware, and software while promoting open-source as the ideal form of human collaboration. Based in Zurich, everything we build serves that mission -- including this codebase.

## Architecture

### Why a Custom CMS

We built a lightweight CMS instead of adopting Strapi. The reasoning:

- **Complete control** over features and TypeScript integration -- no fighting the framework
- **Lighter footprint** -- simpler deployment, lower resource usage
- **No complexity tax** -- Strapi's setup conflicts and over-engineering weren't worth it

The CMS runs as an Express.js backend (port 3001) with JWT authentication, role-based access control (Admin / Editor / Viewer), and a RESTful API.

### TABLE_NAMES as Single Source of Truth

`src/config/database.ts` defines 165 table name constants. Every database query references `TABLE_NAMES` -- never a hardcoded string. The constants are organized into logical groups:

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
| Frontend | Next.js 16, React 18, TypeScript 5, Tailwind 3 |
| CMS | Express.js, JWT, RBAC |
| Database | PostgreSQL (Neon), Redis, Meilisearch |
| Payments | Stripe |
| Email | Nodemailer (Listmonk / Brevo) |
| AI | HIRN (in-house), OpenAI |
| Maps | Leaflet |
| Testing | Jest (312 tests), Playwright (E2E) |
| CI/CD | GitHub Actions, Vercel |

<details>
<summary><strong>Quick Start</strong></summary>

### Prerequisites

- Node.js 20+
- PostgreSQL (or a Neon account)
- Redis

### Setup

```bash
git clone https://github.com/revamp-it/revampit.git
cd revampit
cp .env.example .env.local    # fill in your database URL, Stripe keys, etc.
npm install
npm run db:migrate
npm run dev                    # Next.js on :3000, CMS on :3001
```

### Environment Variables

At minimum, configure:

- `DATABASE_URL` -- PostgreSQL connection string
- `REDIS_URL` -- Redis connection string
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`
- `JWT_SECRET`

See `.env.example` for the full list.

</details>

## Testing

312 tests across 24 suites.

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
  app/              # Next.js pages and API routes
  components/       # React components (UI only, no business logic)
  config/
    database.ts     # TABLE_NAMES SSOT (165 constants)
  lib/
    auth/           # JWT, permissions, staff detection
    domain/         # Business logic (no HTTP, no UI)
    email/          # Templates and delivery
    logger.ts       # Structured logging
  hooks/            # Data fetching, state management
scripts/
  db/migrations/    # Sequential SQL migrations
tests/              # Jest test suites
e2e/                # Playwright E2E tests
cms/                # Express.js CMS backend
```

## Contributing

1. Fork and create a feature branch
2. Follow the development standards (TABLE_NAMES, logger, parameterized queries, Swiss German rules)
3. Run `npm test` and `npm run lint:umlauts` before pushing
4. Open a PR against `main` -- CI will validate code quality and tests

## License

MIT

---

RevampIT -- Badenerstrasse 816, 8048 Zurich -- [revamp-it.ch](https://revamp-it.ch)
