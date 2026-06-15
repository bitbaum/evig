# Documentation

Curated reference for engineers, operators, and contributors. Everything in this folder is meant to stay reasonably current — point-in-time work logs, incident reports, and superseded plans live under [`archive/`](./archive).

## Getting started

- [SHARED_CONTEXT.md](./SHARED_CONTEXT.md) — tech stack, database, file layout
- [COMMANDS.md](./COMMANDS.md) — every npm script and what it does
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) — engineering standards (logger, TABLE_NAMES, parameterized queries, Swiss-German rules)
- [ARCHITECTURE_QUICK_START.md](./ARCHITECTURE_QUICK_START.md) — the 10-minute architecture orientation

## Architecture

- [ARCHITECTURE_DATABASE_BACKEND.md](./ARCHITECTURE_DATABASE_BACKEND.md) — schema, Drizzle ORM, query patterns
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — the canonical schema reference
- [UNIFIED_AUTH.md](./UNIFIED_AUTH.md) — Auth.js v5, JWT sessions, verify-code, shared admin login
- [ARCHITECTURE_DEBT.md](./ARCHITECTURE_DEBT.md) — resolved parallel-implementation debt (#1–#3 done)
- [HIRN_AI.md](./HIRN_AI.md) — the in-house AI knowledge / action system
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) — public + internal API surface

## Product surfaces

- [BLOG_SYSTEM.md](./BLOG_SYSTEM.md) — content pipeline + approval flow
- [PROJECT_PAGES_GUIDE.md](./PROJECT_PAGES_GUIDE.md) — community project pages
- [SERVICE_PAGES_GUIDE.md](./SERVICE_PAGES_GUIDE.md) — paid service pages
- [ADMIN_QUICK_REFERENCE.md](./ADMIN_QUICK_REFERENCE.md) — admin surface tour for staff
- [AI_BOT_SYSTEM_PROMPT.md](./AI_BOT_SYSTEM_PROMPT.md) · [AI_BOT_SYSTEM_PROMPT_README.md](./AI_BOT_SYSTEM_PROMPT_README.md) — public chatbot system prompt + how to update it

## Design

- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — CSS-variable SSOT, semantic Tailwind, dark-mode behavior
- [RESPONSIVE_DESIGN_SYSTEM.md](./RESPONSIVE_DESIGN_SYSTEM.md) — mobile-first responsive primitives in `src/lib/responsive.ts`

## Operations

- [MIGRATIONS.md](./MIGRATIONS.md) — canonical migration path (`scripts/db/migrations/`), naming, idempotency rules, Neon application
- [EMAIL_SETUP.md](./EMAIL_SETUP.md) — Listmonk + Brevo configuration
- [RELIABILITY.md](./RELIABILITY.md) — uptime expectations, on-call practices
- [CODE_AUDIT.md](./CODE_AUDIT.md) — running list of known issues being worked on
- [LEGAL_NONPROFIT_COMPLIANCE.md](./LEGAL_NONPROFIT_COMPLIANCE.md) — Swiss-Verein legal posture, data handling

## Mission

- [MISSION_STATEMENT.md](./MISSION_STATEMENT.md) — why this codebase exists
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) — community norms

## Subdirectories

- [`api/`](./api) — per-route reference
- [`components/`](./components) — component-level notes
- [`development/`](./development) — environment + workflow setup
- [`features/`](./features) — feature briefs
- [`guides/`](./guides) — how-to walkthroughs
- [`hirn/`](./hirn) — HIRN AI internals
- [`legacy/`](./legacy) — preserved older docs
- [`reference/`](./reference) — long-form reference material
- [`archive/`](./archive) — superseded plans, incident reports, completed-migration logs (preserved for history, not for navigation)
