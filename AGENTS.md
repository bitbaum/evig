# AGENTS.md — evig

Affordable intelligence. Curated, durable hardware, repair, and digital access
at a fair price. Founded 2026 in Zürich, in formation. This repository is evig.
It is not Revamp-IT.

Revamp-IT (https://www.revamp-it.ch) is the Zürich non-profit evig grew out of.
Its history, its shop, and its mail domain are its own. Do not brief them as
evig's, and do not "fix" them back into this codebase.

Identity (name, motto, site, contact) has one producer: `src/config/org.ts`.
Who is staff has one producer: `src/lib/permissions.ts`. Do not restate either
here. A sentence in this file that disagrees with those two is a bug.

## What an agent gets wrong if it skips the code

- Staff is the `users.is_staff` column, granted by a super admin. An email
  domain grants nothing. `isStaffEmail` only picks a welcome-email template.
- Production is one Next.js app on the Hetzner box at https://evig.orangecat.ch,
  deployed by GitHub Actions (`deploy-selfhost.yml`) and systemd. There is no
  separate CMS and no second frontend host. Vercel is not used.
- `https://www.revamp-it.ch` is Revamp-IT's old Joomla site. Never smoke-test
  a deploy there.

Engineering rules: `CLAUDE.md` and `.claude/CLAUDE.md`. Retired claims the
fleet must not repeat live in `bitbaum/fleet` `registers/retired.json`, and
`pnpm run lint:claims` fails the build if this repo says them again.

## Stack

- Next.js 16, TypeScript, Tailwind CSS 4
- PostgreSQL + Drizzle. Prod is self-hosted Postgres on Hetzner. Neon is retired.
- Auth: NextAuth v5 (Auth.js). See `src/lib/permissions.ts`.
- Search: Meilisearch. Payments: Payrexx.

## Develop

```bash
pnpm run d        # services + dev server
pnpm run dev      # the app only
```

## Verify — run before every commit

```bash
pnpm run verify
```

`verify` is what CI's `quality` job runs. Do not re-inline those checks.

## Database migrations

- `scripts/db/migrations/*.sql` — forward-only. Never edit one that has applied.
- `drizzle-kit push` is forbidden against dev and prod.
- Apply locally: `pnpm run db:migrate`.

## Deploy

- Push to `main` runs `.github/workflows/deploy-selfhost.yml`.
- Health check: `/api/health` on https://evig.orangecat.ch.

## Non-negotiables

- One fact, one producer. A copy in a doc is the bug.
- Swiss German: real umlauts, `ß` → `ss` (`pnpm run lint:umlauts`).
- Design tokens only, no arbitrary hex.
