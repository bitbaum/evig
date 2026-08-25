# Deep-dive audit — 2026-08-24, refocus pass 2026-08-25

Two rounds. The first (PRs #358, #359, #368–#377) was correctness and gate
hygiene. The second (#379, #381, #382, #383) was the strategic refocus onto
**AI for all** — hardware, technicians, Linux/open source, retraining, and
adoption in organisations.

This file records what is **still open**, so the next session starts from the
findings rather than re-deriving them.

## What the refocus changed (do not re-litigate)

- **`evig architecture` and `evig health` are gone** (#379). They were George's
  personal research, not evig's work. They live on orangecat.ch as "Building
  for the Ruin" and "Healthspan and Preservation". Do not reintroduce.
- **`evig repairs` is now `evig technicians`** (#382). The old name described
  the service; the new one describes what the user is looking for — a person.
- **The homepage states five pillars** (#381), driven by `src/config/pillars.ts`.
  It no longer opens with a donation funnel or a recycling cycle.
- **The "not a charity" line is gone** (#379). evig is a gemeinnütziger Verein
  *in Gründung*; saying what it is not contradicted its own legal page.
- **evig does not ask for printers** (#382). Category `'60'` stays in erfassung
  for existing inventory rows; the donation copy no longer solicits new ones.

## Needs a human decision (not started)

**`src/lib/middleware/pci-compliance.ts` — 181 lines, fully tested, wrapped
around ZERO routes.** Deleting it removes a security control that fills a real
gap: **payment routes currently have no rate limiting at all** (only
`api/marketplace/cart/validate` has any). Wiring it adds a 429 path
(10 req/min per IP) and an HTTPS-required 403 to live payment endpoints —
a production decision, given shared-NAT clients and how `x-forwarded-proto`
behaves behind Caddy. Left in place on purpose.

**`src/lib/services/promo-codes.ts`** — half-shipped rather than dead: the
issuing routes exist, redemption (`validateAndComputeDiscount`,
`recordRedemption`) was never wired into checkout. Finish or remove.

**Pillar 5 (`adoption`) has no page.** It points at `/contact` deliberately —
writing a consulting service page for work nobody has scoped would be the
claim the honesty rule exists to prevent. When there is a real engagement to
describe, it belongs in `SERVICE_CONFIGS`, not as a bespoke page.

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
  props and variables are caught. Closing it needs a JSX text-node pass.
- **Its wrong-language detector cannot separate sibling Romance languages.**
  Ten correct Spanish/Italian strings were flagged as "looks like fr" across
  #381 and #382, every one scored `own 0` — the words are absent from the
  detector's word list for that language, so it falls through to whichever
  sibling has a hit. Verify by reading before accepting into the baseline;
  do not assume a flag means a bad translation.
- **`lint:chrome` greps `rounded-(lg|xl)`, so `rounded-2xl` slips past.** The
  abos loading skeleton hand-rolled a card shell for months and the ratchet
  could not see it. Widening the pattern would be a real improvement.
- **`compliance:i18n-stale` is deliberately NOT in `verify`.** Its `--update`
  asserts translations match the current German — a claim only a translator
  can make. Manual by design.
- **A missing-key audit cannot see a WRONG value.** `itHelp.hub.subtitle` sat
  as literal English in five locales; the key was present, so nothing flagged
  it. Only reading the rendered page found it.
- **Dead-key detection must grep the NAMESPACE PREFIX, not just call sites.**
  `home.newsletter` looked dead in every `t('…')` call in page.tsx and is in
  fact consumed by `NewsletterSignup.tsx` via
  `useTranslations('home.newsletter')`. next-intl lets any component mount a
  sub-tree as its own namespace, so grep `'home.` too. The typecheck caught it.

## Found but not fixed (from the audit sweeps)

### Content / IA
- **`/karriere` + `/karriere/[slug]`** are orphaned from nav AND footer, absent
  from the sitemap, and **fully hardcoded German with no i18n namespace** —
  a straight violation of the i18n SSOT rule.
- **Near-duplicate recruiting pages**: `/get-involved/technical-experts` vs
  `/get-involved/it-hilfe-techniker` — same shape, same namespace, different
  sub-keys. The latter has zero inbound links and is not in the sitemap.
- **Five `notFound()` stubs** kept deliberately ("hidden until real"):
  `/space`, `/about/finances`, `/about/impact`, `/about/press`,
  `/transparenz/kennzahlen`. Behaviourally identical to not existing; they
  document intent. `ROUTES.public.transparenzKennzahlen` was removed in #382.
- **`home.actions.sell`** is a *buy* card labelled `01 / SHOP` under a key
  named `sell` — key/content drift. `home.finalCta` still sends everyone to
  the shop rather than to the pillar they came for.
- **`/vision` is now in the nav** (#381), but "Über uns" is overloaded at
  8 items, mixing identity, division pages, trust pages and a Zürich subsidy
  programme.
- **"Dienstleistungen" splits pillars 3 and 5 across a Hardware/Software axis**
  that maps to neither, and lists `Hardware-Recycling` as a peer of
  `Reparatur` — recycling is a consequence, not a service headline.
- **Pillar 4 is buried**: `src/config/workshops.ts` already defines a
  `retraining` category with real strings, rendered as one of ten equal filter
  chips. No landing page, no nav entry, absent from `workshops.meta`.

### Correctness
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

### Structure
- **Two rate limiters** (`lib/auth/rate-limiter`, `lib/security/rate-limit`),
  ~20 routes each, plus a dead Redis backing (`lib/auth/redis.ts`).
- **`src/config/ui-colors.ts`** — 86 hex literals; a second token source
  competing with `globals.css`. Condition colours there are light-mode only.
- **God files**: `payment-webhook.ts` (938), `useTimecardDraft.ts` (969),
  `useITHilfeDetail.ts` (519, 21 `useState`), `auth.ts` (540).
- **Duplicate vocabularies**: two `SWISS_CANTONS` (names vs codes) both
  exported from `src/config`, two `DEVICE_CATEGORIES`, two `WORK_STATE_OPTIONS`
  with drifted labels.
- **Nav-active drift**: `ring-action/30` hand-rolled in
  `TimecardMonthGrid.tsx:205` and `UserMenu.tsx:135-136` instead of `NAV_STATE`.
- **`scripts/ship.sh`** duplicates `verify` with a different check list; delete
  it or make it call `verify`.
- Duplicate scripts: `rollback.sh` vs `rollback-production.sh`,
  `setup-admin.ts` vs `setup-all-admins.ts`.
- **Env drift**: code reads 106 `process.env.*` vars; the two example files
  document 40 — every payment secret is undocumented. Also two competing
  examples (`.env.example`, `environment.example`).

### E2E specs no CI job runs
Three are wired via `npm run test:e2e:guards` (`security`,
`notification-hrefs`, `user-admin-flows` = 41 assertions). The rest are **not**
wired because they do not pass, and the reason matters — specs nothing runs rot:

| spec | result | why |
|---|---|---|
| `marketplace` | 9 failed / 2 passed | expects `h1` = "Marketplace" and "gebrauchte IT-Geräte" — pre-rebrand copy |
| `it-hilfe` | 4 failed / 10 passed | mixed; best salvage candidate, two thirds already passes |
| `appointments` | 3 failed | session-email mismatch against seeded accounts |
| `payment-return` | 1 failed / 1 passed | — |
| `timecards` | 1 failed | — |
| `dashboard-timecards` | 1 skipped | skips its only test → inert if wired |

Note: `it-hilfe` copy changed in #382, so re-check its expectations before
salvaging — some failures may now be different failures.

## Process notes worth keeping

- **A conflicting PR runs NO CI.** #380 branched off a pre-squash history and
  went `mergeStateStatus: DIRTY`; only Snyk reported, which passes on
  everything, so it looked like a PR waiting on CI rather than one that would
  wait forever. Check `mergeable` before trusting a quiet checks list. Fix:
  cut a fresh branch from `origin/main` and cherry-pick.
- **Background `npm run verify` runs get killed** in this environment (five
  times in one session, no OOM, 12 GB free). `setsid nohup … &` survives.
- **CI green is not live.** Every merge here was re-probed against
  https://evig.orangecat.ch — which is how the stale divisions subtitle was
  caught, rendering under a heading that correctly read "3 Bereiche".

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
