# REVIEW.md — revampit review bar

Judge the DIFF against these gates, in order. Flag correctness and requirement
gaps only — lint owns style. Global standards load via CLAUDE.md; this file is
ONLY revampit's scars.

## Fatal invariants (one violation = block)

1. **`drizzle-kit push` is FORBIDDEN** — schema changes go through generated
   SQL migrations in `scripts/db/migrations/` (CI replays them against a
   throwaway Postgres). A push once broke CI for everyone; never again.
2. **`is_revampit` is a stored column** — NEVER re-derive staff status from the
   `@revamp-it.ch` email domain in queries or logic.
3. **Prod/dev DB split** — no code path may point dev tooling at the prod DB;
   check connection-string provenance on anything touching `DB_*` env.
4. **Payments** — `lib/services/payment-webhook.ts` is the highest-blast-radius
   money path; any change there requires its test suite green (921-line
   webhook test) + a manual reasoning note in the PR body.
5. **Swiss German** — `ß` never appears in user-facing strings (`ss` only);
   real umlauts ä/ö/ü required, never ae/oe/ue. `npm run lint:umlauts` gates it.

## Repo gotchas that have bitten before

- CHECK-constraint drift between migrations and live DB — if the diff adds a
  constraint, confirm the migration replay job still passes.
- i18n arrays must stay parallel across locales — the i18n audit script gates
  this; don't hand-edit one locale.
- Env files: `.env.example` + `.env.selfhost.local.example` are the ONLY
  tracked env files. Any diff adding another `.env*` to git = block.

## Process gates

- `verify`/CI green before review (lint, tsc, build, migrations replay, e2e journeys).
- Diff updates CLAUDE.md/docs if it changes documented structure/behavior.
- Second fix of the same bug class ships the rule/test that ends the class.
