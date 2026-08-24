# Deep-dive audit — 2026-08-24

Nine PRs (#358, #359, #368–#374), all merged, deployed and live-verified.
This file records what is **still open**, so the next session starts from the
findings rather than re-deriving them.

## Needs a human decision (not started)

**`src/lib/middleware/pci-compliance.ts` — 181 lines, fully tested, wrapped
around ZERO routes.** Deleting it removes a security control that fills a real
gap: **payment routes currently have no rate limiting at all** (only
`api/marketplace/cart/validate` has any). Wiring it adds a 429 path
(10 req/min per IP) and an HTTPS-required 403 to live payment endpoints —
which is a production decision, given shared-NAT clients and how
`x-forwarded-proto` behaves behind Caddy. Left in place on purpose.

**`src/lib/services/promo-codes.ts`** — half-shipped rather than dead: the
issuing routes exist, redemption (`validateAndComputeDiscount`,
`recordRedemption`) was never wired into checkout. Finish or remove.

## Ratcheted debt (gated, may fall, must not rise)

| gate | baseline | meaning |
|---|---|---|
| `lint:chrome` | 3 | hand-rolled card shells (2 justified + 1 doc comment) |
| `lint:docs` | 68 | stale paths in older reference docs; CLAUDE.md/README held at 0 |
| `compliance:i18n-hardcoded` | ~1.7k | hardcoded strings, mostly in older components |
| `compliance:i18n` | 175 | missing translation keys |
| `compliance:i18n-leaks` | ja/ko/ru | untranslated leaks per locale |

## Known gate limitations — do not read green as clean

- **`i18n-hardcoded` only sees QUOTED string literals.** A German sentence as
  JSX text (`<p>Keine Einträge…</p>`) is invisible to it. Attribute values,
  props and variables are caught. Documented at the top of the scanner.
  Closing it needs a JSX text-node pass.
- **`compliance:i18n-stale` is deliberately NOT in `verify`.** Its `--update`
  asserts translations match the current German — a claim only a translator can
  make. Manual by design.

## Found but not fixed (lower severity, from the five audit sweeps)

- **Workshop capacity** computed three ways; free registrations do not
  increment `current_participants` while the paid path reads that column, so an
  instance filled by free sign-ups can be **oversold**.
- **Commission** computed 4× and 3 copies omit the `is_revampit` exemption.
  Dormant only because `COMMISSION_RATE = 0`.
- **Order-completion *rule*** stated three ways: `ORDER_TRANSITIONS` says the
  buyer may complete only from `DELIVERED`, while `confirm-receipt` hardcodes
  `[SHIPPED, DELIVERED]` — editing the config table has no effect on the path
  users take.
- **Review rules** diverge across schema / route / two forms; the route injects
  filler text to dodge its own min-length rule.
- **Two rate limiters** (`lib/auth/rate-limiter`, `lib/security/rate-limit`),
  ~20 routes each, plus a dead Redis backing (`lib/auth/redis.ts`).
- **`src/config/ui-colors.ts`** — 86 hex literals; a second token source
  competing with `globals.css`. Condition colours there are light-mode only.
- **God files**: `payment-webhook.ts` (938), `useTimecardDraft.ts` (969),
  `useITHilfeDetail.ts` (519, 21 `useState`), `auth.ts` (540, contains
  registration + verification email).
- **Duplicate vocabularies**: two `SWISS_CANTONS` (names vs codes) both
  exported from `src/config`, two `DEVICE_CATEGORIES`, two `WORK_STATE_OPTIONS`
  with drifted labels.
- **E2E specs that no CI job runs**: `security.spec.ts`,
  `user-admin-flows.spec.ts`, `payment-return.spec.ts`, and 6 more — only
  `*journey.spec.ts` is wired.
- **`scripts/ship.sh`** duplicates `verify` with a different check list; delete
  it or make it call `verify`.
- Duplicate scripts: `rollback.sh` vs `rollback-production.sh`,
  `setup-admin.ts` vs `setup-all-admins.ts`.
- **Env drift**: code reads 106 `process.env.*` vars; the two example files
  document 40 — every payment secret is undocumented. Also two competing
  examples (`.env.example`, `environment.example`).

## Repo state

Three abandoned worktrees remain on disk, all superseded by work already on
main (verified commit-by-commit) — left alone because removing them touches the
user's own checkout:

```
.claude/worktrees/ci-e2e-unblock     perf/ci-e2e-unblock      (landed via ci.yml comments)
.claude/worktrees/ci-smoke-unblock   (detached)
.claude/worktrees/cron-auth          fix/cron-auth-fails-open (landed: lib/api/cron-auth.ts)
```

The main checkout `/home/g/dev/evig` is parked on `ci/central-automerge`
(2 commits, both superseded — `auto-merge.yml` already calls the central
dotfiles workflow). Next session starting there will see stale code.
