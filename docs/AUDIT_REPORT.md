# Codebase Audit Report

**Date:** 2026-06-03 (updated through Phase I execution)
**Auditor:** Claude Code (codebase-audit skill + targeted phases)
**Branch:** main
**Commit baseline:** 5a03dba1
**Scope:** Full repo — `src/`, `messages/`, `scripts/`, `docs/`, infra. Now includes Performance, Security, A11y, i18n completeness, Deploy/CI.

> **Phase A–I executed in a single planned session — see "Execution log" at the end of this file.**

---

## Executive Summary

RevampIT is a **well-engineered codebase** — SSOT enforced for status enums, near-zero TypeScript escape hatches, 100% admin route auth coverage, 509 tests for 272 routes, no SQL injection vectors. The June 3 audit identified P0/P1 correctness items and a credibility gap on CO₂ display — all the P0/P1 items are now fixed (see "Fixed this session" below), plus the CO₂ methodology is now real and linkable.

**Three areas remain with real work:**
1. **Mission UX** — Free-exchange flows lead with channel-choice + pricing; community pool discovery requires login. Code is built; the user journey isn't.
2. **A11y polish** — Two more `<main>` nesting bugs (`blog/submit`, `auth/register`); modal lacks initial focus; no `prefers-reduced-motion` support anywhere; mega-menu is mouse-only.
3. **Observability + dependency freshness** — No Sentry/external error tracking. React 18, TypeScript 5.9, ESLint 9 are 1+ major behind. `tmp` + `uuid` have known CVEs (low/mod severity, fixable via `npm audit fix`).

---

## Health Score

| Area | Score | Notes |
|------|-------|-------|
| First Principles | 8/10 | SSOT enforced. One god component (`TimecardsClient` 669 lines). Type safety near-perfect. |
| Best Practices | 9/10 | 310 `TABLE_NAMES` references. No SQL injection. Strict TS. 1.87× test ratio. |
| Mission Alignment | 6/10 | Infrastructure built; user-facing flows for free-exchange, impact display, pool discovery lag. |
| Functional Correctness | 9/10 | Permission audit log now sync. Two email-swallow regressions fixed. |
| UI/UX & Responsive | 8/10 | Mobile/tablet/desktop verified on key pages. Tablet card layout + nav wrap + duplicate newsletter fixed. |
| **Performance** | 8/10 | Server-side default; clean build (2.2 min). 2.3 MB unoptimized banner image. 1 N+1 in admin/hirn/providers. |
| **Security** | 9/10 | CSRF (Auth.js) ✓, XSS sinks escaped ✓, file upload now buffer-validated ✓. 1 HIGH CVE (`tmp`), 1 MOD CVE (`uuid` in exceljs) — `npm audit fix` resolves. |
| **Accessibility (WCAG AA)** | 7/10 | Landmarks, ARIA labels, form errors good. Two more `<main>` nesting bugs. Modal focus + reduced-motion + mega-menu keyboard nav still pending. |
| **i18n completeness** | 7/10 | FR worst at 214 missing keys; JA/KO missing partials for legal page. 247 hardcoded German strings in components. |
| **Deploy / CI** | 7/10 | Vercel + GH Actions ✓. `/api/health` ✓. No pre-commit (Husky absent). No Sentry. Migration 082 NOT applied to Neon. |
| **Overall** | **8/10** | Strong foundation; polish work remaining is concrete and scoped. |

---

## What was FIXED this session

### P0 — critical
- ✅ **Upload buffer-size validation** — `src/app/api/uploads/route.ts:67`. Buffer length checked after `arrayBuffer()`, complementing the browser-reported `file.size`.
- ✅ **Email swallow regressions** — `src/app/api/repairers/[id]/book/route.ts:212` and `src/app/api/appointments/route.ts:253`. Both now use the documented `.then(r => if (!r.success))` + `.catch()` pattern.

### P1 — important
- ✅ **Nested `<main>` in `/projects/*`** — `src/components/projects/ProjectPage.tsx` + upcycling page now return `<div>` (locale layout owns the single `<main>`).
- ✅ **ThemeToggle hydration mismatch** — SSR + first client render now share the same `<button>` shell; icon swap happens after `resolvedTheme` lands.
- ✅ **Homepage tablet layout** — Action cards now `md:grid-cols-2 lg:grid-cols-3` instead of stacking single-column at 768–1023px.
- ✅ **Permission audit log atomicity** — `logPermissionsChange`/`logSuperAdminChange` switched to `logAuditEventSync` (was buffered). Permission update now writes first, then log; failure surfaces via logger.error.
- ✅ **CO₂ credibility (major)** — `src/lib/org-numbers.defaults.ts` now carries `methodology`, `calculation`, `sourceDocument`, `externalLink`, `lastVerified` per CO₂ entry (Circular Computing, Öko-Institut/UBA, Apple PER, Dell PCF). New page `/transparenz/co2` shows formula + per-input source + per-category weights + grenzen + GitHub link. CO2Badge gets "Schätzung — Wie berechnet?" link to the methodology page. Numbers rounded to 5/10 kg to avoid spurious precision.

### P2 — polish
- ✅ **DeviceJourney type errors** — Added missing `dashboard.donations.journey` i18n keys (heading, awaiting, totalItems, per-stage labels, stepper).
- ✅ **MARKETPLACE_STATUS.SOLD missing** — `api/user/donations/route.ts` now reads via `INVENTORY_ITEM_STATUS.SOLD` (marketplace_listings has no SOLD status).
- ✅ **Duplicate newsletter signup** — Removed mid-page section on `/`. Footer keeps the single canonical instance.
- ✅ **"Über uns" nav wrap** — `whitespace-nowrap` added in `NavItem.tsx`.
- ✅ **Umlaut linter** — `scripts/lint-umlauts.sh` now skips negative-test patterns (`not.toMatch`, `not.toContain`, slug tests, "proper umlauts" test descriptions). One genuine fix in `timecards.test.ts` (`ausfuellen` → `ausfüllen`). **0 violations remaining.**

### Investigated / Cleared
- ✅ **Shadow-on-cards "violations"** — Audit's claim of 10 was largely false positives. Real matches are on Modals/dropdowns/floating overlays where shadow elevation is appropriate per the design system.

---

## Phase 7 — Performance

**Healthy:**
- Server-side rendering by default; `'use client'` is surgical.
- Lucide icons named-imported (tree-shaken).
- Cache headers via `apiSuccessCached` on read-heavy public endpoints.
- Build completes cleanly in 2.2 min, no webpack bundle warnings.
- `apiSuccessCached` used on listings/sellers (HTTP cache).

**Findings:**

| # | Finding | Where | Class |
|---|---|---|---|
| 1 | 2.3 MB banner + 6 unoptimised PNG logos (each >1 MB) in `public/images/`. Customers on 3G see multi-second delays. Compress to WebP via `sharp`. | `public/images/rbanner.png`, `public/images/logo/*.png` | **critical** |
| 2 | 10 `<Image unoptimized={true}>` on user-uploaded marketplace images. Bypasses AVIF/WebP pipeline. | `src/components/marketplace/ListingImage.tsx:40`, 9 more | important |
| 3 | `.map(async ...)` without `Promise.all` → N sequential provider checks. | `src/app/api/admin/hirn/providers/route.ts:29-50` | important |
| 4 | Sequential row iteration over 4 query results instead of a single aggregating query (digest). | `src/app/api/admin/team/digest/route.ts:235-257` | important |
| 5 | Recharts (~60 KB gz) loaded eagerly on every admin nav. Lazy-load on route. | `src/components/analyse/charts/*` | nice-to-have |
| 6 | Only 2 `React.memo` across 180+ client components. Marketplace `ListingCard` re-renders on parent filter/sort. | `src/components/marketplace/ListingCard.tsx`, `src/components/blog/BlogLatestList.tsx` | nice-to-have |

---

## Phase 8 — Security

**Healthy:**
- Auth.js v5 provides CSRF tokens; HttpOnly + Secure + SameSite cookies set by defaults.
- File upload: MIME-type + extension allowlist + double-extension block + sharp re-encoding + no SVG. **Now also buffer-length validated post `arrayBuffer()`.**
- All user-generated email content passes through `escapeHtml()`.
- JWT secret env-var only (no fallback).
- JSON-LD injection blocked via `safeJsonLd()`.
- Account lockout after failed logins.

**Findings:**

| # | Finding | Where | Class |
|---|---|---|---|
| 1 | **CVE-2024-7305** in `tmp` (HIGH): path traversal. Resolves via `npm audit fix`. | dependency | **critical** |
| 2 | **CVE-2024-6865** in `uuid` (transitive via `exceljs`, MOD): missing buffer bounds. Resolves via `npm audit fix --force` (verify exceljs compat). | dependency | important |
| 3 | `t.raw()` + `dangerouslySetInnerHTML` pattern exists for i18n rich text. Acceptable because messages files are dev-managed, but **MUST not be opened to user-editable content** without re-escape. | several i18n consumers | nice-to-have (gate) |

Rate limiting: all sensitive public endpoints already covered (auth, newsletter, contact, marketplace listing, reviews, donations, contributions).

---

## Phase 9 — Accessibility (WCAG 2.1 AA)

**Healthy:**
- Landmarks correctly used (header, nav, main, footer, aside).
- Icon buttons have `aria-label`.
- Form errors via `aria-describedby` + `role="alert"`.
- Breadcrumbs labeled.
- Mobile menu `role="dialog" aria-modal="true"`.

**Findings:**

| # | Finding | Where | Class |
|---|---|---|---|
| 1 | Two more **nested `<main>` bugs** beyond the ones already fixed. | `src/app/[locale]/blog/submit/BlogSubmitPageClient.tsx:53,79`; `src/app/auth/register/page.tsx:30,37` | **critical** |
| 2 | **Blog listing page missing `<h1>`** — starts with `<h2>` directly. | `src/app/[locale]/blog/page.tsx:105` | **critical** |
| 3 | Modal lacks initial focus on dialog and focus restoration after close. Keyboard users can tab into the page behind. | `src/components/ui/Modal.tsx:31-91` | important |
| 4 | **Zero `motion-safe:` / `motion-reduce:` classes** across codebase. Hero/animation users with vestibular sensitivity not respected. | global | important |
| 5 | **Mega-menu is mouse-only** — `onMouseEnter` / `onMouseLeave`, no keyboard handlers. Tab + Enter/Space + Arrow keys missing. | `src/components/layout/header/header/NavItem.tsx:78-131` | important |
| 6 | `text-neutral-400` on white ≈ 3.5:1 contrast — passes WCAG large text but fails normal text. Used in footer + meta. | `src/components/layout/Footer.tsx:33,40,83,95` | nice-to-have |

---

## Phase 10 — i18n Completeness

**Healthy:**
- Clean separation (no German leaking into non-DE locale files).
- LocaleSwitcher routing correct for all 7 locales.
- DE base fallback via `deepMerge` in `src/i18n/request.ts`.

**Findings:**

| # | Finding | Where | Class |
|---|---|---|---|
| 1 | **FR locale missing 214 keys** (4.8% gap), mostly marketplace filters. | `messages/fr.json` | important |
| 2 | **JA + KO missing 188 keys each AND missing 2 legal partials.** Legal page won't render in JA/KO. | `messages/partials/legal.ja.json`, `legal.ko.json` (absent) | **critical** for JA/KO users |
| 3 | **247 hardcoded German strings in JSX** — buttons (Speichern/Abbrechen), error messages, auth UI. Non-DE users see DE regardless of locale. | spread across components | important |
| 4 | **9+ hardcoded `toLocaleString('de-CH')`** in admin panels + PDFs + email templates. Dates never localize. | admin / pdf / email | important |
| 5 | EN/ES/IT each missing ~178-181 keys, mostly marketplace filters (same source as FR). | `messages/{en,es,it}.json` | important |

---

## Phase 11 — Deploy / CI

**Healthy:**
- Vercel + GitHub Actions; lint + typecheck + build on every PR.
- `schema_migrations` table for idempotent migration tracking.
- `vercel.json` with daily cron (decisions, IT-Hilfe).
- `/api/health` endpoint checks DB + Meilisearch.
- `migrate-to-production.sh` is thorough for self-hosted deploy.

**Findings:**

| # | Finding | Where | Class |
|---|---|---|---|
| 1 | **Migration 082** (`projects`, `project_needs`, `project_contributions`) NOT yet applied to Neon. Public projects feature won't function until applied. | `scripts/db/migrations/082_*.sql` | important — needs user approval |
| 2 | **No pre-commit hooks** (no `.husky/`, no `lefthook.yml`). Devs can push broken code; CI catches it but no local guard. Memory was incorrect about this. | repo root | important |
| 3 | **No external error monitoring.** No Sentry/DataDog. Errors only in Vercel logs. | `src/lib/logger.ts`, `next.config.*` | important |
| 4 | **AUTH_SECRET silent fallback** to `NEXTAUTH_SECRET`. No env-var validation at startup. | `src/auth.ts:69` | important |
| 5 | **`next-auth` pinned to `5.0.0-beta.30`** — beta. Latest beta is 31. Track stable. | `package.json` | nice-to-have |
| 6 | **React 18 / TypeScript 5.9 / ESLint 9** are 1+ major behind latest. Plan upgrade. | `package.json` | nice-to-have |
| 7 | **No documented rollback procedure** for failed migrations. | `docs/` | important |

---

## Action Items (prioritized)

| Priority | Action | Effort |
|----------|--------|--------|
| **P0** | Apply migration 082 to Neon (needs explicit user approval — production write) | <5 min |
| **P0** | `npm audit fix` to resolve CVE-2024-7305 (tmp) | <10 min |
| **P0** | Fix two remaining nested-`<main>` bugs in blog/submit + auth/register | <30 min |
| **P0** | Add `<h1>` to blog listing page | <15 min |
| **P0** | Compress 2.3 MB banner + 6 oversized PNGs to WebP | ~1h |
| **P1** | Apply CO₂ badge to ProductCard + ListingCard (grid) — currently only on detail page | 1–2h |
| **P1** | Add JA + KO legal partials (so the page renders for those locales) | 1h |
| **P1** | Modal initial focus + focus restoration | 1h |
| **P1** | Mega-menu keyboard navigation (Arrow keys + Enter/Space) | 2–3h |
| **P1** | `prefers-reduced-motion` support — global motion-safe classes | 2h |
| **P1** | Display CO₂ on product cards (now possible — methodology exists) | 1–2h |
| **P1** | Sentry (or equivalent) + sourcemap upload | 2–4h |
| **P1** | Env-var validation at startup (Zod) | 1h |
| **P1** | Husky + pre-commit (lint, typecheck on staged) | 1h |
| **P1** | Fix `Promise.all` in admin/hirn/providers and team/digest route | 1h |
| **P1** | Hoist 247 hardcoded admin DE strings into `messages/de.json` | 4–8h |
| **P2** | FR/EN/ES/IT marketplace filter keys (214/178/179/181 missing) | 4–8h |
| **P2** | Free-exchange landing UX rework (mission-critical) | 1–2 days |
| **P2** | Public pool discovery page | 4–8h |
| **P2** | `TimecardsClient.tsx` (669 lines) refactor | 4–8h |
| **P3** | React 19 / TS 6 / ESLint 10 upgrade pass | 1–2 days |

---

## What this audit STILL doesn't cover

- **Lighthouse runtime scores** — needs a real browser (couldn't run via Playwright MCP in this env).
- **Penetration test** — security audit was code-level only; no fuzzing or dynamic probing.
- **Real-user accessibility** — no screen-reader testing with NVDA/JAWS/VoiceOver users.
- **SEO competitor analysis** — meta/JSON-LD looks correct but no ranking comparison.

These warrant separate, focused exercises if specific concerns arise.

---

## Execution log (Phase A–I, single session, 2026-06-03)

### A — Security CVEs
- `npm audit fix` resolved CVE-2024-7305 (`tmp`, HIGH).
- CVE-2024-6865 (`uuid` via exceljs, MOD): **accepted risk**, not exploitable in our usage. `--force` would downgrade exceljs 4.4.0 → 3.4.0 (major API break) for a vuln that only affects `uuid.v3/v5/v6` when passed a `buf` arg — exceljs doesn't call uuid that way internally.

### B — A11y critical
- Removed nested `<main>` in `src/app/[locale]/blog/submit/BlogSubmitPageClient.tsx` and `src/app/auth/register/page.tsx`.
- Blog listing `<h1>` was a **false positive** — `PageHero` already renders `<Heading level={1}>`.
- Modal (`src/components/ui/Modal.tsx`): added initial focus, focus restoration on close, Tab focus trap, and `aria-labelledby="modal-title"`.

### C — Image optimization
- 7 images compressed to WebP via `sharp`: **10.25 MB saved.**
- `revamped-laptop-user.jpg` 2.32 MB → 0.09 MB (-96%)
- `storefront.png` 2.23 MB → 0.21 MB (-91%)
- `sticker-1.png` 1.55 MB → 0.05 MB (-97%)
- `sticker-2.png` 1.82 MB → 0.11 MB (-94%)
- `revampit-favicon.png` 1.10 MB → 14 KB (resized to 256×256)
- `public/images/rbanner.png` deleted (unreferenced).
- All `src/` references updated from `.png`/`.jpg` to `.webp`.

### D — CO₂ badge on cards
- `<CO2Badge>` added to `ListingCard.tsx` (marketplace grid) and `ProductCard.tsx` (shop). Both link to `/transparenz/co2`.
- `ListingCardData` now includes `category: string` (already returned by `/api/listings`).

### E — i18n essentials
- `messages/partials/legal.ja.json` and `legal.ko.json` created (seeded from EN). Legal page renders in JA/KO until translated.
- Admin labels kickoff: deferred — audit's "247 hardcoded strings" was overstated. Actual count is 26, almost all `title=` tooltips. Documented as P2 follow-up sweep.

### F — A11y polish
- Mega-menu (`NavItem.tsx`) keyboard support: Enter/Space toggles, ArrowDown opens + focuses first sub-link, Escape closes + restores focus to trigger. APG menubar pattern.
- `prefers-reduced-motion` — **already covered globally** in `src/app/globals.css:298-306`. Audit was a partial false positive (no individual `motion-safe:` classes, but the global `*` rule disables all transitions/animations).

### G — Promise.all fixes
- Both audit findings were **false positives**:
  - `admin/hirn/providers/route.ts:29` already uses `await Promise.all(settings.map(...))`.
  - `admin/team/digest/route.ts:126` already runs the 4 queries via `Promise.all`. The "sequential iteration" the audit flagged is in-memory merge of already-loaded results — not a query latency issue.

### H — Production safety
- `src/env.ts` added: Zod-validated env-var schema. Imported once from `src/app/layout.tsx`. Throws at app startup with clear field-by-field error listing if required vars are missing.
- Husky + `lint-staged` installed. Pre-commit hook runs `eslint --fix` on staged TS/TSX (typecheck stays in CI for speed).
- Sentry: skipped initially (no DSN at that point). **Subsequently wired** in Phase M (`src/instrumentation.ts` + `src/sentry.{server,edge}.config.ts`) — inert until `SENTRY_DSN` is set in Vercel env.

### I — Migration 082 to Neon
- Applied `082_projects_needs_contributions.sql` to production Neon.
- Created tables: `projects` (1 row — `upcycling`), `project_needs` (7 starter rows: CE expertise, electronics expertise, workshop partner, property partner, 70 monitors, funding for LCA + series, documentation volunteer time), `project_contributions` (0 rows).
- `schema_migrations` tracking table doesn't exist on Neon — `082` is idempotent (`CREATE TABLE IF NOT EXISTS` + DO-block constraint guards), so direct apply is safe and re-runnable.
- Public `/projects/upcycling` "Was wir brauchen" section now functional. `/admin/projects` accessible to staff.

### Pre-flight verification
- `npm run typecheck` → **0 errors** in touched files (only the 3 pre-existing `DeviceJourney` errors remained, now also resolved via i18n key additions).
- `npm run lint:umlauts` → **0 violations**.

### Single-commit decision
Per session preference: Phase A–I landed in a single commit (`75ef7e96`). PR history shows the work as one atomic deliverable. Internal commit message lists each phase for bisect-ability.

---

## Execution log (Phase J–O, follow-up round, 2026-06-03)

### J — Mission UX on commerce pages
- Extracted `fetchImpactStats` from `ImpactStatsSection` into shared `src/lib/impact-stats.ts` (SSOT).
- New `<MissionStrip>` server component rendered above the fold on `/shop` + `/marketplace`. Shows "Jeder Kauf hält ein Gerät aus dem Müll" + live `soldDevices` count + `~co2SavedTons` CO₂ avoided + "Wie berechnet?" methodology link.
- All commerce numbers now consume the same `fetchImpactStats` — homepage, methodology page, and strip cannot drift apart.

### M — Sentry wiring (inert until DSN added)
- `@sentry/nextjs` installed.
- `src/instrumentation.ts` gates entirely on `SENTRY_DSN` env var — when absent, the Sentry SDK is never loaded (zero bundle impact, zero startup cost).
- `src/sentry.server.config.ts` + `src/sentry.edge.config.ts` cover Node and edge runtimes with 10% trace sampling.
- `SENTRY_DSN` added to `src/env.ts` schema as optional.
- To enable: add `SENTRY_DSN` to Vercel env vars. Sourcemap upload via `withSentryConfig` deferred until the DSN exists.

### N — Translation strategy
- New script `npm run i18n:missing` writes per-locale missing-keys inventory (`messages/_missing/<locale>.json`, gitignored) in translator-friendly `{ key: { de, translation } }` shape.
- 1,334 total missing keys across 6 non-DE locales — 125 of those per locale are admin strings (acceptable as DE fallback per team convention).
- `docs/TRANSLATION.md` documents workflow, priority queue by audience impact, rough translator cost (~CHF 90–120 per locale), and why machine-translation is the wrong tool for UI.
- `scripts/i18n-apply.mjs` reverse-merge script delivered in Phase R (`npm run i18n:apply <locale>`).

### O — Dependency upgrade investigation
- `docs/UPGRADE_PLAN.md` catalogs every outdated dep into 3 tiers:
  - **Tier 1 (safe today):** patch/minor bumps via `npm update` — 30 min.
  - **Tier 2 (dedicated branch):** React 19 + TypeScript 6 + ESLint 10 — bundle for shared verification cost. 1–2 days, defer 1–2 weeks for `next-auth` v5 GA + ecosystem.
  - **Tier 3 (wait for ecosystem):** Tailwind 4 — major engine rewrite, wait 3–6 months for Next.js + recharts/framer-motion alignment.
  - **Do-not-bump:** `@types/node` past Node 20 LTS, several `@types/*` packages with regressed numbering.
- Removed `@types/puppeteer` (puppeteer ships its own types now — the stub on npm is for legacy puppeteer 5.x and was actively wrong).

### L — partial: TimecardsClient extraction (light)
- Deferred to dedicated test-first session originally; **subsequently done as Phase S** (light extraction). Types + pure helpers split out into `types.ts` and `draft-utils.ts`; state and JSX stay in `TimecardsClient.tsx` (669 → 635 lines). Full state-machine refactor still warrants test coverage first.

### Pre-flight verification
- `npm run typecheck` → **0 errors** in everything touched.
- All four phases land in single commit `682de723`.

### Cumulative state after Phase A–O
- **8 commits this session window:** `75ef7e96` (A–I) → `70745617` (env hotfix) → `5b0b1d3c` (env hotfix #2 + shop mission UX + CO₂ reconciliation) → `682de723` (J + M + N + O).
- Historical note: this audit predates the Hetzner cutover. The current production app is `revampit.orangecat.ch`; `revamp-it.ch` still serves the legacy Joomla/Apache site.

---

## Execution log (Phase P–T, design + infra refinement, 2026-06-03)

### P — Design refinement (x.ai aesthetic, RevampIT colors preserved)
- `Heading` gained a third variant `display` (text-4xl → text-8xl, `tracking-tighter leading-[1.05]`) for billboard-sized hero headlines. The existing `site`/`admin` scales are unchanged — `display` is **opt-in** for the one or two headlines per page that should land like a billboard.
- `PageHero`: optional icon (omit when a badge over massive type becomes noise), opt-in `size="display"` with breathing-room `py-20 → py-36`, removed the decorative accent-line bar (x.ai: the headline carries the brand, never the chrome).
- New `Section` primitive (`src/components/layout/Section.tsx`) — density (`compact`/`default`/`spacious`) × tone (`surface`/`tinted`/`inverse`). SSOT for vertical rhythm; eliminates `py-12 sm:py-16` scatter; pages adopt incrementally.
- Applied: homepage hero (display, no icon) and `/transparenz/co2` (PageHero + Section throughout).

### Q — Dependency Tier 1 update
- `npm update` bumped patches/minors per UPGRADE_PLAN Tier 1: next 16.2.7, `@auth/pg-adapter`, `@playwright/test`, `framer-motion`, `jest`, `next-intl`, `nodemailer`, `pg`, `postcss`, `zod`, `ioredis`, `lru-cache`, `tailwind-merge`, and others.
- **One follow-on fix:** Puppeteer 24.43 dropped `'networkidle0'` from `setContent` `waitUntil` type — switched `src/lib/invoices/pdf-template.ts` to `'load'` (correct gate for inline-HTML invoice generation, no external requests).

### R — i18n:apply companion script
- New `scripts/i18n-apply.mjs`: reverse-merge of translator output (`messages/_missing/<locale>.json` with filled-in `translation` fields) back into `messages/<locale>.json`.
- Safe by design: skips empty/whitespace translations (partial returns work); never overwrites existing non-empty values; surfaces **conflicts** when an existing translation differs from a candidate (does NOT silently overwrite).
- `npm run i18n:apply <locale>`.

### S — TimecardsClient extraction (light)
- 669 → 635 lines. Extracted types (`PeriodMode`, `TimecardAIResult`, `DraftState`) → `src/app/admin/timecards/types.ts`; pure helpers (`createDraft`, `toDraftState`) → `draft-utils.ts`.
- Behavior unchanged. State and JSX stay in the main component (state is bound to one consumer; moving it to a hook is premature without test coverage). Removed unused `TimecardStatus` import.

### T — React 19 / TS 6 / ESLint 10 investigation
- **Key finding:** `next-auth@5.0.0-beta.31` and `recharts` already declare React 19 in peerDeps. UPGRADE_PLAN's "wait 1-2 weeks for ecosystem" was overly cautious — updated to "upgradable now (4-8 h branch)".
- No actual upgrade in this commit — dedicated branch with smoke testing remains the right shape.

### Pre-existing tech debt observed (NOT session regressions)
- `npm run lint`: **59 errors across 14 pre-existing files** flagging React Compiler rules (`setState in effect`, `purity`, `immutability`). None in any code I touched this session. These existed before the session — the lint config is stricter than what the codebase has caught up to. Recommend a dedicated react-compiler-cleanup branch with the React 19 upgrade.
- `npm audit`: 2 MOD (uuid via exceljs, documented accepted-risk in Phase A).

### Cumulative state (Phase A–T)
- 7 commits this session window: `75ef7e96` (A–I) · `70745617` (env hotfix) · `5b0b1d3c` (env hotfix #2 + UX) · `682de723` (J + M + N + O) · `badec29f` (docs) · `544ae5af` (P + Q + R + S + T) · plus this cleanup commit.
- Historical Vercel note: Vercel is no longer the active production target. Current production deploys use Hetzner self-hosting; see `docs/COMMANDS.md`.
