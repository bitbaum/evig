# AGENTS.md — Revamp-IT

Swiss non-profit tech platform: used computers repaired and rehomed, not landfilled.
This file is the quick agent brief. The full engineering standards and repo rules
live in `CLAUDE.md` (+ `.claude/CLAUDE.md` and the imported global standards) — read
those before non-trivial work. Don't duplicate their content here; this is a pointer.

## Stack

- **Framework:** Next.js 16, TypeScript 5.3 (strict), Tailwind CSS 4
- **DB:** PostgreSQL + Drizzle ORM. **Prod = self-hosted Postgres on Hetzner**
  (`DATABASE_URL=…@localhost:5432/revampit`); dev points at its own DB. Neon is retired for prod.
- **Auth:** NextAuth v5 (Auth.js) + `@auth/pg-adapter`. Staff = `@revamp-it.ch` email.
- **Search:** Meilisearch · **Payments:** Payrexx

## Develop

```bash
npm run d        # start everything (services + dev server)
npm run dev      # frontend only
```

## Verify — run before every commit

```bash
npm run verify   # lint + typecheck + build (SSOT)
```

`verify` is the single gating check bundle. CI's `quality` job in
`.github/workflows/ci.yml` calls `npm run verify` verbatim, so green locally ⇒ green
CI for that gate. Do not re-inline lint/typecheck/build in CI — edit the `verify`
script only. (i18n/umlaut/compliance helpers: `npm run compliance`, `npm run lint:umlauts`.)

## Database migrations

- **Location:** `scripts/db/migrations/*.sql` — forward-only, ordered, protected (never delete/edit applied ones).
- **`drizzle-kit push` is FORBIDDEN** against dev/prod. Add a new `.sql` migration instead.
- Apply locally: `npm run db:migrate`. CI replays every migration from zero (Migration Drift job).
- Deploy auto-applies unrecorded migrations to the prod DB before activating.
- App enums live in `src/config/*` + zod at the write boundary, NOT in SQL CHECK constraints.

## Deploy — self-hosted

- Production runs at **https://revampit.orangecat.ch** (self-hosted Hetzner).
  `https://www.revamp-it.ch` is the LEGACY Joomla site — never smoke-test deploys there.
- Push to `main` → `.github/workflows/deploy-selfhost.yml` runs lint + typecheck +
  i18n gate, then rsyncs the build to the box via `scripts/selfhost-deploy-revampit.sh`
  and runs a read-only prod smoke. Health check: `/api/health`.

## Non-negotiables (see CLAUDE.md for the full list + rationale)

- SSOT / DRY / SoC · no god files (>300 lines) · nothing hardcoded (labels, stats, colors)
- `logger` not `console.log` · `TABLE_NAMES` + parameterized SQL · validate at boundaries
- Swiss German: real umlauts ä/ö/ü, `ß`→`ss` (`npm run lint:umlauts`)
- Design tokens only, no arbitrary hex (`grep -rn '\[#' src/` must be empty)
