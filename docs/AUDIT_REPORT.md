# Codebase Audit Report

**Date**: 2026-03-13
**Auditor**: Claude Code
**Branch**: main
**Commit**: d7606c0f (+ uncommitted quick-win fixes)
**Previous Audit**: 2026-03-13 earlier session (score 7.4/10)
**Baseline Audit**: 2026-03-08 (score 7.0/10)

## Executive Summary

RevampIT continues on a strong upward trajectory. All critical security issues from the baseline audit remain fixed (CSRF, dual auth, mutation validation). The TextEncoder polyfill fix resolved 5 test suites that were crashing before tests could run, revealing the true test health: 325/360 passing (90.3%). The remaining 5 failing suites all share a single root cause — Drizzle migration left test mocks outdated.

This deeper audit reveals two previously undercounted issues: WCAG contrast failures are ~1,079 lines (5x the prior estimate of ~200, which likely counted files not lines), and form label-input associations are completely broken (81 `htmlFor` attributes with 0 matching `id` on inputs). Mutation route validation is also less complete than previously reported — 34 of 43 mutation routes lack Zod schema validation, though many are justifiable (auth flows, webhooks, simple toggles). Roughly 12-15 user-facing routes with substantial request bodies need validation added.

The open-source registry (43 alternatives, 12 categories) and subscription exchange schema (4 tables with governance) demonstrate strong mission alignment. The subscription exchange remains schema-only — no API or UI — making it the only unimplemented mission pillar.

## Health Score

| Area | Score | Δ from Last | Notes |
|------|-------|-------------|-------|
| First Principles | 7/10 | — | 0 dead code, 0 `any` types. ~44 hardcoded status strings, 83 god components |
| Best Practices | 9/10 | — | All critical rules pass. 5 test suites failing (Drizzle mock debt) |
| Mission Alignment | 6.5/10 | — | OSS registry strong (43 alternatives). Subscription exchange schema-only |
| Functional Correctness | 7.5/10 | -1 | 12-15 user-facing mutation routes need Zod validation. Deeper count than before |
| UI/UX & Responsive | 5.5/10 | -0.5 ¹ | 1,079 WCAG contrast lines, 749 untyped buttons, 0 form label associations |
| **Overall** | **7.1/10** | **-0.3** | Deeper measurement lowered apparent scores; underlying code improved |

¹ Score decrease reflects more accurate measurement methodology, not code regression. The sm: breakpoint count actually increased 31.8% (827→1,090).

## Phase 1: First Principles

### Ground Truth 1: Software Serves Humans — 8/10

- **0 dead files** — `src/components/it-hilfe-create/types.ts` previously flagged as dead, confirmed to have 2 active consumers (`src/lib/domain/it-hilfe.ts:7`, `src/app/it-hilfe/create/page.tsx:30-31`)
- **0 console.log violations** — full compliance
- **0 explicit `any` types** — no `: any` or `as any` in production code
- **10 `Record<string, any>`** across 4 files — all justified (generic sanitize, audit snapshots, dynamic form state)

### Ground Truth 2: SSOT — 5/10 (stable)

- **83 hardcoded status strings** in `src/lib/` and `src/app/api/` (excluding config/tests) — ~44 are genuine runtime violations where config constants exist but aren't used
- Examples:
  - `src/app/api/listings/[id]/contact/route.ts:57` uses `'active'` instead of `MARKETPLACE_STATUS.ACTIVE`
  - `src/app/api/admin/intake/route.ts:48` uses `'approved'` instead of `PRODUCT_STATUS.APPROVED`
  - `src/lib/payments/payment-flow.ts:236` uses `'pending'` instead of `PAYMENT_STATUS.PENDING`
  - `src/lib/erfassung/create-product.ts:111-113` uses `'draft'`, `'approved'` literals
- **17 status config files** exist in `src/config/` — all imported at least once (1-31 consumers each), but data layer bypasses them
- **3 local PAGE_SIZE definitions** (all `= 20`) duplicate `API_DEFAULTS.ADMIN_PAGE_SIZE` (`= 25`) in `protocols/page.tsx:48`, `tasks/page.tsx:82`, `decisions/DecisionListClient.tsx:45`
- **36 types.ts files** across codebase — co-located, none dead

### Ground Truth 3: Design for Change — 5/10 (stable)

- **83 god components** (>300 lines), up 1 from 82. Top component offenders:
  - `DataEntryTabs.tsx` (419), `TeamProfileView.tsx` (375), `WorkshopRegistrationForm.tsx` (374), `MobileMenu.tsx` (365), `ServiceForm.tsx` (361)
- Top page offenders: `AdminLayoutClient.tsx` (517), `impact/content.tsx` (512), `profil/skills/page.tsx` (498)
- **Drizzle ORM migration nearly complete**: 205 files use `@/db` (Drizzle), 8 files still import from `@/lib/auth/db` barrel (all auth flows — barrel internally delegates to Drizzle)
- **1 hybrid file**: `db-roles.ts` uses 18 raw SQL queries via `db.execute(sql`...`)` — last module not using Drizzle query builder

### Ground Truth 4: Automate the Mechanical — 9/10

| Metric | Count |
|--------|-------|
| `: any` / `as any` types | **0** |
| `Record<string, any>` | **10** (4 files, all justified) |
| `@ts-ignore` / `@ts-expect-error` | **2** (both in `redis.ts` for dynamic imports) |
| `eslint-disable` | **5** (all `react-hooks/exhaustive-deps`) |

### Ground Truth 5: Simplicity Scales — 7/10 (stable)

- Architecture remains pragmatic: config → service → API route → component
- No over-engineered abstraction layers detected
- The 17 status config files are well-designed but applied inconsistently — elaborate config infrastructure with partial enforcement

### Ground Truth 6: Correctness — 6.5/10 (↑ from 6)

- **TypeScript**: 0 errors (clean)
- **ESLint**: 0 errors, 0 warnings (clean)
- **Tests**: 5 suites failing, 35 tests failing (325/360 passing = 90.3%)

| Failing Suite | Tests | Root Cause |
|--------------|-------|------------|
| `notifications.test.ts` | 14 | Drizzle migration — mock uses string IDs, DB expects UUIDs |
| `order-service.test.ts` | 6 | Mock not updated for `db.execute()` |
| `provider-config.test.ts` | 5 | Runtime config loading changed, mock expectations stale |
| `payment-flow.test.ts` | 9 | `getPaymentProvider` return shape changed |
| `task-helpers.test.ts` | 1 | Notification insertion mock mismatch |

All 35 failures share one root cause: test mocks written for old `query()` pattern, not updated for Drizzle ORM. The recently fixed `it-hilfe/requests.test.ts` demonstrates the pattern for updating them.

## Phase 2: Best Practices

### Critical Rules — All Pass

| Rule | Status | Details |
|------|--------|---------|
| No console.log | **PASS** | 0 violations |
| TABLE_NAMES / Drizzle schema | **PASS** | 0 raw table strings; all SQL uses Drizzle schema refs or `getTableName()` |
| Parameterized queries | **PASS** | All `${...}` in SQL occurs inside Drizzle's `sql` tagged templates (auto-parameterized) |
| Swiss German (umlauts) | **PASS** | `npm run lint:umlauts` clean |
| Logger usage | **PASS** | 334 files import `@/lib/logger`, 0 console.* in production code |

### Automated Checks

| Check | Result |
|-------|--------|
| `npm run typecheck` | 0 errors |
| `npm run lint` | 0 errors, 0 warnings |
| `npm run lint:umlauts` | Clean |
| `npm test` | 5 failed, 22 passed (27 suites); 35 failed, 325 passed (360 tests) |

### Code Quality

- **API response format**: 231/233 route files use `apiSuccess()`/`apiError()` (99.1%). 2 protocol processing routes use raw `NextResponse.json` for streaming — justified
- **Auth checks**: 397 `withAdmin`/`withAuth` references + 53 manual `await auth()` calls across API routes
- **Naming conventions**: PascalCase components, camelCase utils, kebab-case config, UPPER_SNAKE constants — all consistent

## Phase 3: Mission Alignment

| Mission Area | Rating | Key Evidence |
|---|---|---|
| **Free Exchange of Technology** | **Implemented** | Full marketplace with "Nur Gratis" filter, IT-Hilfe community help, multi-channel shop |
| **Open-Source Advocacy** | **Implemented** | 43 OSS alternatives, 38 proprietary apps, 12 categories, migration tips, difficulty ratings, searchable registry with detail pages |
| **Environmental Impact** | **Implemented** | CO2 config (Fraunhofer IZM 2023), CO2Badge on listings, full impact page with environmental/social/economic tabs |
| **Education & Digital Inclusion** | **Implemented** | Workshop system with proposals, registration, payment, admin approval, category/level organization |
| **Subscription Exchange** | **Schema Only** | 4 DB tables ready (subscription_pools, pool_memberships, pool_contributions, pool_votes with governance). Zero API endpoints, zero UI |
| **Financial Transparency** | **Implemented** | Public `/about/finances` page, unauthenticated API, multi-year revenue breakdown in CHF from Kivitendo accounting |
| **Swiss Context** | **Implemented** | CHF (62 refs), 4-digit PLZ validation, Swiss VAT (7.7%/2.5%/3.5%), Swiss German throughout |

**Key change since baseline**: The subscription exchange now has a well-designed DB schema with cost sharing and governance (voting), but still needs API and UI implementation to become functional.

## Phase 4: Improvement Roadmap

### Quick Wins (<1 hour)

1. **Fix 5 failing test suites** — All share one root cause (Drizzle mock update). Pattern demonstrated by recent `it-hilfe/requests.test.ts` fix
2. **Add `type="button"` to buttons inside `<form>` elements** — 749/753 buttons lack explicit type. Prioritize forms to prevent unintended submissions
3. **Add `id` attributes to form inputs** — 81 `htmlFor` on labels, 0 matching `id` on inputs. Label-input associations completely broken
4. **Migrate `db-roles.ts` to Drizzle query builder** — Last file using raw SQL via `db.execute(sql`...`)`; 18 queries

### Medium Effort (1-5 hours)

5. **Add Zod validation to ~12-15 user-facing mutation routes** — Priority targets: `reviews/route.ts` (POST), `locations/route.ts` (POST), `messages/conversations/route.ts` (POST), `it-hilfe/requests/[id]/offers/route.ts` (POST), `appointments/book-with-payment/route.ts`, `user/technician-profile/route.ts` (PUT), `public/blog/submit/route.ts`, `newsletter/subscribe/route.ts`
6. **Replace ~44 hardcoded status strings** with config constants — Config files exist (`src/config/*-status.ts`), data layer just doesn't use them
7. **Fix WCAG contrast** — Replace `text-gray-400` on light backgrounds (~671 instances) with `text-gray-500`/`text-gray-600`. Also `text-gray-300` (~409 instances)
8. **Add rate limiting to `auth/forgot-password`** — Currently unprotected against brute-force email enumeration

### Strategic Improvements

9. **Design system adoption campaign** — Only 7.3% (46/634 files) use design system. New code (OSS registry) demonstrates the target quality bar
10. **Split top 5 god components** — `AdminLayoutClient.tsx` (517), `DataEntryTabs.tsx` (419), `TeamProfileView.tsx` (375), `WorkshopRegistrationForm.tsx` (374), `MobileMenu.tsx` (365)
11. **Implement subscription exchange API + UI** — DB schema ready with 4 tables. Only unimplemented mission pillar
12. **Wire content approval flow** — `user_content_submissions` table exists but no API routes reference it
13. **Admin responsive/touch target improvements** — Admin area 35.5% responsive, 357 potentially undersized interactive elements

## Phase 5: Functional Correctness

### Authentication & Authorization — SOLID

- Auth.js v5 with JWT strategy, 30-day expiry, 24-hour refresh (`src/auth.ts`)
- 3-tier admin guard: authentication → staff role → section-level permission (`src/app/admin/layout.tsx`)
- Permission system with staff detection, super admin, section-level access (`src/lib/permissions.ts`)
- 397 `withAuth`/`withAdmin` + 53 manual `auth()` calls across API routes
- All 11 unprotected mutation routes are appropriate exceptions (auth flows, webhooks, CMS proxy)

### CSRF Protection — STRONG

- Synchronizer Token Pattern with Double Submit Cookie, constant-time comparison (`src/lib/auth/csrf.ts`)
- Enforced on all `/api/` routes except webhooks, public endpoints, Auth.js routes (`src/middleware.ts`)
- Edge-compatible (Web Crypto API)

### Mutation Route Validation — NEEDS IMPROVEMENT

- **43 mutation handlers** across API routes
- **34 files** lack Zod schema validation
- Justifiable exclusions: 7 auth flows (minimal/no body), 1 webhook (signature-verified), 2 admin login/logout, 2 notification routes (simple status), 2-3 simple toggles (approve, accept, vote)
- **~12-15 user-facing routes with substantial request bodies** need Zod validation added:
  - `reviews/route.ts` (POST), `reviews/[id]/route.ts` (PUT), `reviews/[id]/response/route.ts` (POST/PUT)
  - `locations/route.ts` (POST), `locations/[id]/route.ts` (PUT), `locations/[id]/bookings/route.ts` (POST)
  - `messages/conversations/route.ts` (POST)
  - `it-hilfe/requests/[id]/offers/route.ts` (POST)
  - `user/technician-profile/route.ts` (PUT)
  - `appointments/book-with-payment/route.ts` (POST)
  - `public/blog/submit/route.ts` (POST)
  - `newsletter/subscribe/route.ts` (POST)
  - `ai/analyze-product/route.ts` (POST)

### Rate Limiting — GOOD

- Two complementary systems: auth rate limiter (progressive lockout) + security rate limiter (LRU-cache, 11 pre-configured limiters)
- 72 rate limiter references across codebase
- **Gap**: `auth/forgot-password` lacks rate limiting (email enumeration risk)

### Content Approval Flow — SCHEMA ONLY

- `user_content_submissions` table with proper schema (draft→pending→approved/rejected)
- No API routes reference it — the approval flow is not wired up

## Phase 6: UI/UX & Responsive Design

### Responsive Coverage

| Area | Responsive Files / Total | Percentage |
|------|-------------------------|-----------|
| Overall | 291 / 634 | **45.9%** |
| `app/` directory | 154 / 321 | 48.0% |
| `components/` directory | 133 / 296 | 44.9% |
| `app/admin/` | 44 / 124 | **35.5%** (weakest) |
| OSS Registry | 5 / 10 | 50.0% |

Breakpoint distribution (mobile-first confirmed):

| Breakpoint | Previous | Current | Change |
|------------|----------|---------|--------|
| `sm:` | 827 | **1,090** | **+31.8%** |
| `md:` | 406 | **421** | +3.7% |
| `lg:` | 253 | **281** | +11.1% |
| `xl:` | 6 | **6** | — |

While file-level responsive coverage is unchanged (291/634), breakpoint density within responsive files increased significantly (+263 `sm:` uses). Existing responsive files got more thorough treatment.

### Accessibility

| Issue | Count | Severity |
|-------|-------|----------|
| `text-gray-400` on light bg (WCAG AA fail, 2.9:1 ratio) | **671 lines** | **High** |
| `text-gray-300` on light bg (WCAG AA fail, 1.8:1 ratio) | **409 lines** | **High** |
| Buttons without `type=` attribute | **749 / 753** | **Medium** |
| Form labels with `htmlFor` but no matching input `id` | **81 broken** | **High** |
| Raw `<img>` tags (vs Next.js Image) | 2 (justified) | Low |
| Missing `alt` text | **0** | Clean |
| `aria-*` attributes | **322** | Good |
| `role=` attributes | **40** | Reasonable |
| Semantic HTML (`<nav>`, `<main>`, etc.) | **213** | Good |
| Focus visible states | **43** | Needs improvement |
| Dark mode (`dark:` classes) | **2,706** | Extensive |

**Critical new finding**: Form label-input association is completely broken. 81 `htmlFor` attributes exist on labels, but 0 form inputs have matching `id` attributes. Screen readers cannot programmatically associate any label with its input.

### OSS Registry Pages — 8.5/10

Above-average quality for the codebase:
- Responsive grids (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), responsive spacing (`px-4 sm:px-6 lg:px-8`)
- Semantic HTML (`<main>`, `<section>`, `<dl>`)
- `aria-label` on search input and clear button
- Mobile-first typography (`text-sm sm:text-base`)
- Missing: `type="button"` on 3 buttons, `text-gray-400` on 3 elements, no focus indicators on cards

### Design System Adoption

| Import | Files |
|--------|-------|
| `@/lib/design-system` | 27 |
| `@/lib/design/tokens` | 1 |
| `@/lib/responsive` | 19 |
| **Total unique files** | **~46 / 634 (7.3%)** |

Stalled at 7.3%. Ad-hoc Tailwind classes outnumber design token usage ~70:1.

## Action Items (Prioritized)

### Urgent (Test Health + Accessibility)
1. **Fix 5 failing test suites** — all Drizzle mock updates, pattern proven by it-hilfe fix
2. **Fix form label-input associations** — add `id` to inputs matching existing `htmlFor` on labels
3. **Fix WCAG contrast** — `text-gray-400`/`text-gray-300` on light backgrounds (~1,079 lines)

### High (Security)
4. **Add Zod validation to ~12-15 user-facing mutation routes** — reviews, locations, messages, offers, bookings, blog submit
5. **Add rate limiting to `auth/forgot-password`** — email enumeration risk
6. **Add `type="button"` to buttons inside forms** — prevent unintended submissions

### Medium (SSOT/Quality)
7. **Replace ~44 hardcoded status strings** with existing config constants
8. **Migrate `db-roles.ts` to Drizzle query builder** — last raw SQL module (18 queries)

### Strategic (Architecture/Mission)
9. **Implement subscription exchange API + UI** — DB schema ready, only unimplemented mission pillar
10. **Wire content approval flow** — schema exists, no API endpoints
11. **Drive design system adoption** — 7.3% → target 25%+ incrementally
12. **Split top 5 god components** — target <300 lines each
13. **Improve admin responsive design** — 35.5% coverage, undersized touch targets
