# Contributing

Thanks for the interest. This document covers the practical workflow for shipping changes to Revamp-IT.

## Ways to contribute

- **Code** — fix a bug, ship a feature, refactor, add tests
- **Docs** — improve the [docs/](./docs) index, write a how-to, fix outdated reference material
- **Translation** — RevampIT ships in seven locales (de · en · fr · es · it · ja · ko); the message catalogues are in [`src/i18n/messages/`](./src/i18n/messages)
- **Triage** — reproduce bug reports, label issues, close stale ones
- **Design** — UI/UX critique, accessibility audit, visual polish (mobile-first matters here)
- **Operations** — donate hardware, time, or money to the [Verein itself](https://revamp-it.ch/get-involved/donate); the platform is one part of the org

## Prerequisites

- Node.js **20+**
- A Postgres instance — start local Docker with `npm run services:up` (port 5433). Production runs on self-hosted Postgres 17 on Hetzner.
- (Optional, for full feature coverage) Meilisearch, Redis (upstash), Listmonk

## Local setup

```bash
git clone https://github.com/g-but/revampit.git
cd revampit
cp .env.example .env.local         # fill in DATABASE_URL, AUTH_SECRET, payment + email keys
npm install
npm run db:migrate                  # apply scripts/db/migrations/*.sql
npm run dev                         # Next.js on :3000
```

The app is a **single Next.js 16 application**. There is no separate API server, CMS server, or microservice — everything (pages, API routes, admin surface) lives in `src/app/`. Earlier iterations had a `cms-api/` subproject; it is no longer maintained and its files are not part of the dev loop.

Full architecture orientation: [`docs/ARCHITECTURE_QUICK_START.md`](./docs/ARCHITECTURE_QUICK_START.md). Every npm script: [`docs/COMMANDS.md`](./docs/COMMANDS.md).

## Workflow

### Branch naming

`<type>/<short-slug>` — for example `feat/marketplace-shipping-cost`, `fix/pool-join-race`, `docs/refresh-readme`, `refactor/erfassung-pipeline`.

### Commit messages

Conventional commits. Types we use: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `deps`.

```
fix(api): pool join — wrap memberCount check + INSERT in FOR UPDATE tx
```

Lead the body with **why**, not what — the diff already shows what.

### Before opening a PR

```bash
npm test               # Jest (7,500+ tests across 500+ suites)
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run lint:umlauts   # catches ASCII umlaut substitutes in German strings
```

CI re-runs all of these. PRs blocked by failing CI will not be merged.

## Code standards (enforced, not suggested)

These are the rules the codebase actually relies on. Violations either fail CI or break things at runtime — read [`docs/BEST_PRACTICES.md`](./docs/BEST_PRACTICES.md) for the full set.

| Rule | Why |
|---|---|
| `import { logger } from '@/lib/logger'` — never `console.log` | Structured logs; `console.*` is silently dropped in serverless |
| Use `TABLE_NAMES` from `@/config/database` — never hardcode table strings | One source of truth; renaming a table is one diff |
| Parameterized queries only — never string-concatenate user input | SQL injection |
| Use `CONTACT` / `ORG` / `LOCATIONS` from `@/config/org` — never hardcode addresses, phones, emails | Same SSOT principle, applied to org-level data |
| Swiss German: `ss` (not `ß`), proper `ä/ö/ü` (never `ae/oe/ue`) | Project locale standard; `npm run lint:umlauts` enforces it |
| Wrap multi-statement writes in `db.transaction(...)` with explicit `FOR UPDATE` when needed | Concurrency safety — TOCTOU races cost us real bugs in 2026-Q1 |
| Mobile-first responsive Tailwind, 44×44 minimum tap targets | Most users land on phones |

## Reviewing

Code reviews focus on: correctness, the rules above, test coverage, and whether the change is the simplest thing that solves the problem (no preemptive abstraction). Tone is direct; don't take it personally.

## Recognition

Contributors land in [GitHub's contributor graph](https://github.com/g-but/revampit/graphs/contributors); significant contributions get a callout in release notes. We don't currently maintain a separate CONTRIBUTORS file — git history is the source of truth.

## License

By submitting a contribution, you agree it is licensed under the project [MIT License](./LICENSE).
