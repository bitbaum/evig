# Deep-dive audit — 2026-08-24, refocus 2026-08-25, page walk 2026-08-26

Three rounds. The first (PRs #358, #359, #368–#377) was correctness and gate
hygiene. The second (#379, #381–#385, #387) was the strategic refocus onto
**AI for all**. The third (#388, #389, #391) came from opening all 33 public
pages in a browser rather than reading the code, and found things no gate
could see.

This file records what is **still open**, so the next session starts from the
findings rather than re-deriving them.

## What the refocus changed (do not re-litigate)

- **`evig architecture` and `evig health` are gone** (#379). They were George's
  personal research, not evig's work. They live on orangecat.ch as "Building
  for the Ruin" and "Healthspan and Preservation". Do not reintroduce.
- **`evig repairs` is now `evig technicians`** (#382). The old name described
  the service; the new one describes what the user is looking for — a person.
- **The homepage states five pillars** (#381), driven by `src/config/pillars.ts`.
  It no longer opens with a donation funnel or a recycling cycle, and (#385)
  no longer says the same thing three times.
- **The "not a charity" line is gone** (#379). evig is a gemeinnütziger Verein
  *in Gründung*; saying what it is not contradicted its own legal page.
- **evig does not ask for printers** (#382). Category `'60'` stays in erfassung
  for existing inventory rows; the donation copy no longer solicits new ones.
- **The services catalogue is four entries** (#389): webDesign (kept — real
  revenue, George's explicit call), linuxOpenSource, openSourceSolutions and
  the new aiAdoption at `/services/ai-robotics`. hardwareRecycling and
  buildYourComputer were removed; computerRepair and dataRecovery redirect to
  `/it-hilfe`, because evig is where you FIND a technician, not the shop that
  charges CHF 70/h.
- **Über uns is five items in two sections** (#389), not nine unsectioned ones.
  `evig ai` and `Abos teilen` live under Marktplatz — three ways to get
  something, not three parts of an org chart.
- **Service placement is data** (#389). Each service declares
  `navGroup: 'services' | 'learn'` once; both menus derive from it. A service
  in two menus, or none, fails `services-nav.test.ts`.

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

**Praktikum + Wiedereinstieg — does evig actually run these?**
`/get-involved/internships` and `/get-involved/work-reintegration` describe
real integration programmes and name partners: HEKS, AOZ, the *Verein für
berufliche und soziale Integration Bezirk Uster* and the *Arbeitsintegrations-
stelle der Gemeinde Rüti*. If evig runs them they belong with pillar 4
(training) and should be much more prominent. If they came across with the
code from Revamp-IT, they are commitments evig cannot honour and naming those
four organisations is worse than off-thesis. **Only George can answer this**;
nothing in the repo distinguishes the two cases.

**`/karriere` is invisible and monolingual.** Not in the nav, not in the
footer, not in the sitemap — reachable only from the three get-involved CTAs
(`?track=volunteer|intern|reintegration`). Its hero is the only hardcoded
German `PageHero` on the site (`title="Karriere bei evig"`), so it is also the
one page that cannot be translated. Decide: surface it properly and i18n it,
or fold it into get-involved.

## Ratcheted debt (gated, may fall, must not rise)

| gate | baseline | meaning |
|---|---|---|
| `lint:chrome` | 3 | hand-rolled card shells (2 justified + 1 doc comment) |
| `lint:docs` | 68 | stale paths in older reference docs; CLAUDE.md/README held at 0 |
| `compliance:i18n-hardcoded` | 2430 src / 84 msg | was ~2531/706; the msg drop is real leaks fixed, the src drop is the deleted `community.ts` tree |
| `compliance:i18n` | 175 | missing translation keys |
| `compliance:i18n-leaks` | ja/ko/ru | untranslated leaks per locale |

## Gates added in this pass (each mutation-proved)

| gate | catches |
|---|---|
| `navigation-links-resolve.test.ts` | a nav entry with an empty or malformed href — two shipped as `<a href="">` for months |
| `services-nav.test.ts` (rewritten) | a service in two menus or none, now that `navGroup` decides placement |
| `workshops-config-matches-messages.test.ts` | the German category labels in config drifting from the message files |
| `page-titles-not-doubled.test.ts` | a title string carrying "\| evig" when the layout template already appends it |

**Every one was proved by planting the defect back and watching the gate name
it.** A gate that has never been seen red is a claim, not a check.

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
- **EDUCATION IS THE BIGGEST GAP.** George has said teaching and retraining
  will be a large part of what evig does, and today `/workshops` renders
  **"0 Workshops · Aktuell sind keine Workshops geplant"** while `/blog`
  renders nothing at all. The page is DB-driven; the only workshop rows in
  version control are 6 seeds in `001-unified-auth.sql` whose categories are
  legacy strings matching none of the 10 canonical ids, written in formal
  "Sie" against the site's informal "du", and **no `workshop_instances` are
  seeded anywhere except `e2e-seed.ts`** — without instances there are no
  dates and registration is impossible. Meanwhile the 43-entry open-source
  registry (1029 lines, real, indexed) is the largest teaching asset evig
  owns; #388 moved it and the Linux page into Lernen, which is a signpost,
  not a fix. Seeding real workshops in the `retraining` category is the
  single highest-value content job left.
- **Near-duplicate recruiting pages**: `/get-involved/technical-experts` vs
  `/get-involved/it-hilfe-techniker` — same shape, same namespace, different
  sub-keys. The latter has **zero inbound links anywhere** and is not in the
  sitemap. Technician recruiting also exists at `/profil/techniker` and in the
  `/it-hilfe` hub's offerHelp block: four doors, one job.
- **Five `notFound()` stubs** kept deliberately ("hidden until real"):
  `/space`, `/about/finances`, `/about/impact`, `/about/press`,
  `/transparenz/kennzahlen`. Behaviourally identical to not existing; they
  document intent. `ROUTES.public.transparenzKennzahlen` was removed in #382.
- **`home.actions.*` is gone** (#385) along with the section it fed, so the
  `sell`-key-on-a-buy-card drift went with it. `home.finalCta` now closes on
  the thesis rather than the shop.
- **A German typo in production copy**: `getInvolved.itHilfeTechniker.description`
  reads "kann anderen das Leben **leichtern**" (should be "erleichtern" or
  "leichter machen").
- **`/so-funktionierts` and `/reparaturbonus` left the nav** (#389) but both
  pages remain. Reparaturbonus describes a City of Zürich subsidy evig does
  not administer and, per the page's own FAQ, cannot redeem. Worth deciding
  whether it earns its 445 lines.

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
- **A cancelled deploy is not a failed deploy.** GitHub cancels an in-flight
  deploy when a newer commit lands on main, and a watcher that only checks
  "not success" reports a false alarm. Read `conclusion` and treat
  `cancelled` as "superseded", then verify the NEXT run.
- **OPEN THE PAGES.** The third round found things no gate could see, only
  because the site was loaded in a browser: two nav entries rendering
  `<a href="">`, donation buttons pointing at another organisation's Ko-fi,
  a 404 in the live FAQ, "16+ Jahre" on a two-year-old org, a wrapped price,
  and three different causes of a doubled page title. Greps and typechecks
  had all been green throughout. Budget a page walk per refocus.
- **Measure the output, don't reason about the framework.** Two of the three
  doubled titles were missed by reasoning about Next's `title.template`
  resolution and found by curling the rendered `<title>`.

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
