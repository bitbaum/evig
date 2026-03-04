# Codebase Audit Report

**Date**: 2026-03-03
**Auditor**: Claude Code
**Branch**: main
**Commit**: d982cc16 (+ uncommitted audit fixes)

## Executive Summary

RevampIT is a substantial codebase (~1,200 files, ~177,000 lines) that is technically sound — 0 TypeScript errors, 0 ESLint errors, 362/362 tests passing. All critical coding standards are met: no console.log leaks, no raw table names in SQL, all parameterized queries, proper logger usage throughout. The recently-completed security migration (WI-1+2) added section-level permission checks to 59 admin API routes, and this audit session fixed all 5 remaining P0 security findings: promote-user section auth, open redirect validation, CSRF coverage for admin routes, webhook fail-closed behavior, and 3 missing section parameters.

Dead code has been cleaned (~1,565 lines deleted across 12 files + 1 directory), the legacy unified-permissions bridge has been fully migrated and deleted, and SSOT violations in location status labels have been resolved. Remaining technical debt: **god components** (24 TSX files over 300 lines), **legacy JWT auth system** (4 routes), and **55 mutation routes without Zod validation**.

From a mission perspective, the platform delivers well on open-source advocacy, education/workshops, repair services, and Swiss context. The key mission gap is **subscription exchange** (community funding of software subscriptions) — a core mission commitment with zero codebase infrastructure.

## Health Score

| Area | Score | Δ from Last | Notes |
|------|-------|-------------|-------|
| First Principles | 7/10 | +2 | ~1,565 lines dead code deleted, unified-permissions removed, SSOT improved; 24 god components remain |
| Best Practices | 9/10 | +1 | All critical rules pass; section-level auth complete; all P0 security findings fixed; 4 error format violations remain |
| Mission Alignment | 6/10 | — | Subscription exchange absent, financial transparency admin-only |
| Functional Correctness | 8/10 | +2 | All P0 security items fixed (promote-user, CSRF, open redirect, webhook, missing sections) |
| UI/UX & Responsive | 8/10 | +1 | All WI-6-9 + AdminPageWrapper wrapping + DonationsTable overflow fixed |
| **Overall** | **7.6/10** | **+1.2** | Strong improvement from 6.4; all P0 security fixed; dead code cleaned; architecture debt (legacy auth, god components) remains |

### Changes Since Last Audit (2026-03-02, commit d982cc16)

**Fixed:**
- [x] 59 admin API routes migrated to section-level permissions (WI-2)
- [x] Enhanced `withAdmin` middleware with section overloads (WI-1)
- [x] ConfidenceLevel type mismatch consolidated (WI-3)
- [x] Deleted 6 dead files: api-defaults.ts, editors.ts, share-button.tsx, MarketplaceCheckoutForm.tsx, payment-demo/page.tsx, lib/shop/ (WI-4)
- [x] ServiceCategory SSOT consolidated (WI-5)
- [x] formatPrice redirected to canonical import (WI-5)
- [x] 4 non-responsive grids fixed (WI-6)
- [x] 3 touch target violations fixed (WI-7)
- [x] Admin sidebar scroll lock added (WI-8)
- [x] 404 page translated to Swiss German (WI-9)
- [x] AI provider config merge bug fixed (DB enabled + no key now falls back to env var)
- [x] 5 thin AI system prompts enriched with RevampIT context
- [x] Smart product entry prompt moved to FORM_AI_REGISTRY (SSOT)
- [x] Blog quick actions derived from BLOG_PROMPTS (SSOT)
- [x] Image analysis typo fixed ("Geschätzer" → "Geschätzter")

**Fixed in this audit session (2026-03-03):**
- [x] F-1: `withAdmin('users', ...)` added to promote-user route
- [x] F-15: Open redirect validated in LoginForm.tsx (only relative same-origin paths)
- [x] F-16: Payrexx webhook fails closed when secret missing
- [x] F-13: CSRF protection extended to admin routes (narrowed exclusions to 3 external webhooks, fixed httpOnly cookie bug, injected CSRF_SCRIPT in root layout)
- [x] F-2/3/5: Section parameters added to users/[id], users/[id]/permissions, hirn/documents DELETE
- [x] Deleted ~1,565 lines dead code: number-sources.ts (914), admin-access.ts (182), role-checks.ts (178), labels.ts (124), sensitive-areas.ts (91), mappers.ts (87), auth.ts middleware (66), newsletter-status.ts (14), 3 unused hooks
- [x] Deleted `src/lib/database/` directory (empty after mappers.ts removal)
- [x] Fixed placeholder phone in page.tsx JSON-LD (`+41-43-960-32-64`)
- [x] Removed `src/config/sensitive-areas.ts` re-export layer (inlined into AdminLayoutClient)
- [x] Migrated 5 files off unified-permissions.ts to direct permissions
- [x] Deleted orphaned `src/lib/auth/unified-permissions.ts`
- [x] Imported status labels from `@/config/approval-status` in 2 location pages
- [x] Fixed AdminPageWrapper header wrapping (mobile-first flex layout)
- [x] Fixed DonationsTable horizontal scroll (`overflow-x-auto`)

---

## Phase 1: First Principles

### Ground Truth #1: Software Serves Humans — Dead Code

**Cleaned in this session (~1,565 lines deleted).** Previously dead files have been removed. Remaining dead code:

| File | Lines | Issue |
|------|-------|-------|
| `src/features/feedback/` (3 subdirs) | ~200 | Entire feature directory — but `SuggestionContext.tsx` imports from it. Needs careful migration. |

**Previously deleted (WI-4):** api-defaults.ts, editors.ts, share-button.tsx, MarketplaceCheckoutForm.tsx, payment-demo/page.tsx, lib/shop/.

**Deleted this session:** number-sources.ts (914), admin-access.ts (182), role-checks.ts (178), labels.ts (124), sensitive-areas.ts (91), mappers.ts (87), auth.ts middleware (66), newsletter-status.ts (14), 3 unused hooks, unified-permissions.ts, `src/lib/database/` directory.

### Ground Truth #2: State Defines Behavior — SSOT Violations

**Three competing auth systems:**

| System | Location | Used by | Status |
|--------|----------|---------|--------|
| Auth.js v5 + `withAdmin` | `src/auth.ts`, `src/lib/api/middleware.ts` | 87 routes | **Primary (correct)** |
| ~~Unified compatibility layer~~ | ~~`src/lib/auth/unified-permissions.ts`~~ | ~~6 files~~ | **DELETED — migrated all consumers** |
| Legacy JWT admin auth | `src/lib/admin-auth.ts` | 4 routes (`/api/admin/auth`, `login`, `profile`, `newsletter/subscribe`) | **Parallel system — shared password, bypasses Auth.js** |

Old ROLES constant in `src/lib/constants.ts:24-49` contains 14 deprecated roles still referenced by 12 files.

**Types defined separately from Zod schemas (should derive via `z.infer`):**

| Component Types File | Lines | Zod Schema Available | Issue |
|---------------------|-------|---------------------|-------|
| `src/components/workshops/types.ts` | 315 | `src/lib/schemas/workshops.ts` | 15+ types defined manually; Zod only covers input schemas |
| `src/components/repairers/types.ts` | 92 | None | `RepairerProfile` (5 interfaces) with no schema at all |
| `src/components/marketplace/types.ts` | 53 | `src/lib/schemas/marketplace.ts` | `ProductFormData`, `ListedProduct` defined manually |
| `src/components/marketplace-sell/types.ts` | 49 | `src/lib/schemas/marketplace.ts` | `ListingFormData` not derived from `CreateListingSchema` |
| `src/components/it-hilfe-create/types.ts` | 38 | `src/lib/schemas/it-hilfe.ts` | Fields diverge: `maxBudget: string` vs `maxBudgetCents: number` |

**Hardcoded status labels (config exists but isn't used):**

| File | Lines | Hardcoded Labels | Config Available |
|------|-------|-----------------|-----------------|
| ~~`src/app/admin/locations/page.tsx`~~ | ~~133-137~~ | ~~`'Genehmigt'`, `'Ausstehend'`, `'Abgelehnt'`~~ | **FIXED — now imports from config** |
| ~~`src/app/admin/locations/[id]/page.tsx`~~ | ~~146-148~~ | ~~Inline status badge map~~ | **FIXED — now imports from config** |
| `src/app/dashboard/repairer/page.tsx` | 35-43 | Full booking status badge map | `config/booking-status.ts` |
| `src/app/dashboard/workshops/page.tsx` | 105 | `'Ausstehend'` | `config/approval-status.ts` |
| `src/components/admin/repairer-applications/ApplicationCard.tsx` | 52 | `'Ausstehend'` | `config/approval-status.ts` |
| `src/app/dashboard/listings/page.tsx` | 42 | `{ value: 'draft', label: 'Entwurf' }` | `config/marketplace-status.ts` |

**Inline interface definitions in pages (should be in types files):**
- `src/app/marketplace/[id]/page.tsx:39-82` — 43-field `ListingDetail` interface inline
- `src/app/dashboard/listings/page.tsx:25-36` — `MyListing` inline
- `src/app/dashboard/favorites/page.tsx:19` — `FavoriteListing` inline
- `src/app/dashboard/seller/page.tsx:24` — `Product` inline

**Previously fixed (WI-3, WI-5):** ConfidenceLevel type mismatch consolidated. ServiceCategory and formatPrice SSOT violations resolved.

### Ground Truth #3: Design for Change — God Components

**24 TSX files over 300 lines.** Top offenders:

| File | Lines | useState | Issue |
|------|-------|---------|-------|
| `src/app/marketplace/[id]/page.tsx` | 726 | **19** | Detail + favorites + messaging + sharing + reporting in one file |
| `src/app/about/impact/content.tsx` | 512 | — | Large static content |
| `src/app/admin/AdminLayoutClient.tsx` | 507 | — | Sidebar + layout + navigation |
| `src/app/profil/skills/page.tsx` | 498 | — | Skill management |
| `src/app/admin/locations/[id]/page.tsx` | 493 | — | Location detail with inline labels |
| `src/components/erfassung/ProductForm.tsx` | 490 | — | Product entry form |
| `src/app/marketplace/page.tsx` | 476 | — | Marketplace listing |
| `src/app/space/page.tsx` | 474 | — | Community space |
| `src/app/it-hilfe/page.tsx` | 472 | — | IT help page |

**62 .ts files over 300 lines** (non-test). Worst: `src/config/sections.ts` (946 lines — 7 type defs, 6 interfaces, 30+ sections, 15 helpers).

### Ground Truth #4: Automate the Mechanical

- **111 `await fetch()` calls** in .tsx client components, each reinventing loading/error/data state management. No shared `useFetch`/`useAsync` hook.
- **186 loading state declarations** (`useState...loading`) — highly repetitive pattern.
- **55 API routes** accept JSON via `request.json()` without Zod schema validation (41% of mutation routes), despite 21 unused schemas in `src/lib/schemas/`.
- **11 config files** each define their own badge color mappings — no shared utility.

### Ground Truth #5: Simplicity Scales

- `Record<string, any>`: 17 occurrences in production code
- `@ts-ignore`: 3 occurrences (2 in redis.ts, 1 in ProjectSection.tsx)
- `eslint-disable`: 4 occurrences (all `react-hooks/exhaustive-deps`)
- ~~`src/config/sensitive-areas.ts` (90 lines)~~ — **DELETED** (unique logic inlined into AdminLayoutClient)
- `src/lib/constants.ts` (108 lines) — primarily re-exports from permissions.ts
- Chatbot feature: 24 files, 5 services + engine for client-side chatbot, zero tests

### Ground Truth #6: Correctness Beats Speed

**Critical paths without tests:**

| Module | Files | Test Files | Key Untested |
|--------|-------|-----------|-------------|
| Auth system | 14 | 3 | audit.ts (534 lines), csrf.ts |
| Payments | 6 | 3 | payrexx-client.ts, stripe-client.ts |
| Chatbot | 24 | 0 | Entire feature untested |
| Email | ~4 | 0 | Template rendering |
| API routes | 215 | 7 | Only IT-Hilfe and notifications have route tests |

**Test ratio: 27 test files covering 1,210 source files (2.2%).**

**13+ empty catch blocks** in API routes (e.g., `src/app/api/repairer/dashboard/route.ts` lines 90, 147, 170).

~~**Placeholder in production:** `src/app/page.tsx:45`~~ — **FIXED** (now uses real phone from config/site.ts).

---

## Phase 2: Best Practices

### Critical Rules

| Rule | Status | Violations |
|------|--------|-----------|
| No console.log | **PASS** | 0 |
| TABLE_NAMES usage | **PASS** | 0 |
| Parameterized queries | **PASS** | 0 injection risks |
| Swiss German umlauts | **PASS** (advisory) | 2 in test file: `Laenge`/`Hoehe` in `src/lib/erfassung/__tests__/file-parser.test.ts:136` |
| Logger usage | **PASS** | 0 |

### Code Quality

| Check | Status | Details |
|-------|--------|---------|
| Auth checks (admin routes) | **PASS** | All admin routes have `withAdmin` with section parameter (5 intentionally bare — see Phase 5) |
| Naming conventions | **PASS** (advisory) | 9 shadcn/ui files use lowercase convention |
| TypeScript strict | **PASS** | 0 errors |
| Error response format | **FAIL** | 4 files — see below |
| Tests | **PASS** | 362/362 passing |

### Error Response Format Violations (4 files)

| File | Lines | Issue |
|------|-------|-------|
| `src/app/api/payments/payrexx-webhook/route.ts` | 76, 81, 92, 119, 223 | Uses `{ error: '...' }` without `success: false` |
| `src/app/api/payments/payrexx-mock-redirect/route.ts` | 17 | Missing `success` field |
| `src/app/api/auth/login-status/route.ts` | 18, 42 | Uses `{ ok: true }` instead of `{ success: true, data }` |
| `src/app/api/ai/extract/route.ts` | 82 | Raw passthrough without `{ success, data }` wrapper |

---

## Phase 3: Mission Alignment

| Mission Area | Status | Assessment |
|---|---|---|
| Free exchange of technology | **Implemented** | Marketplace with "Nur Gratis" filter, device donations, peer-to-peer exchange. Gap: checkout shows "Zahlungsabwicklung in Entwicklung". |
| Open-source advocacy | **Implemented** | OSS solutions page (13 categories), Knowhow page, FOSS-first as invariant, OSM alongside Google Maps. |
| Environmental impact | **Partially** | CO2 metrics (285kg/device savings), SDG mapping, zero-waste priority. Gap: most metrics `needs_data`, all `verified: false`. |
| Education & digital inclusion | **Implemented** | Full workshop system, blog, get-involved pages (internships, volunteering, work reintegration). |
| Subscription exchange | **Not Yet** | Zero infrastructure. Core mission commitment (Section 3) with no codebase support. |
| Financial transparency | **Partially** | Comprehensive admin analytics. Gap: detailed data admin-only, no public transparency page. |
| Swiss context | **Implemented** | CHF throughout, Swiss German, postal code lookup, IBAN, `de_CH` locale. |

### Key Mission Gaps
1. **Subscription exchange** is a founding mission commitment with zero implementation
2. **Financial transparency** exists but only for staff — public page needed
3. **Environmental metrics** framework built but data collection not automated
4. **Minor:** Store address inconsistency: `Hohlstrasse 89, 8004` (constants) vs `Birmensdorferstrasse 379, 8055` (impact metrics)

---

## Phase 4: Improvement Roadmap

### Quick Wins (< 1 hour each)

1. **Delete 15+ dead files** — ~1,550 lines: number-sources.ts (914), admin-access.ts (182), role-checks.ts (178), labels.ts (124), mappers.ts (87), auth.ts middleware (66), newsletter-status.ts (14), 3 unused hooks, features/feedback/ (~200)
2. **Fix placeholder phone** in `src/app/page.tsx:45` JSON-LD structured data
3. **Fix umlaut violations** in test file (`Laenge` → `Länge`, `Hoehe` → `Höhe`)
4. **Remove re-export layers** — `config/sensitive-areas.ts` and `lib/constants.ts` (redirect importers to source)
5. **Fix empty catch blocks** — 13+ occurrences in API routes (add logger.error or remove)

### Medium Effort (1-5 hours each)

6. **Add `withAdmin('users', ...)` to promote-user route** — any staff can currently promote users (F-1 CRITICAL)
7. **Validate callbackUrl** in LoginForm.tsx to prevent open redirect (F-15 HIGH)
8. **Fix Payrexx webhook to fail closed** — return 500 when secret missing instead of skipping verification (F-16 HIGH)
9. **Add CSRF protection to admin routes** — remove `/api/admin/` from excluded paths (F-13 HIGH)
10. **Wire Zod schemas into 55 unvalidated mutation routes** — 21 schemas already written but not connected
11. **Migrate 6 files off unified-permissions** to direct `@/lib/permissions` imports
12. **Centralize badge colors** — extract from 11 config files into shared utility
13. **Import status labels from config** — 6 files with hardcoded labels that have config equivalents
14. **Add rate limiting to admin AI routes** — blog generation, erfassung, hirn chat
15. **Fix login-status endpoint** — add rate limiting + use standard `{ success, data }` format (F-18, F-19)

### Strategic Improvements (multi-day)

16. **Retire legacy admin auth** — migrate 4 routes from `admin-auth.ts` to Auth.js, delete parallel JWT system (F-9/10/11/24)
17. **Create `useFetch`/`useAsync` hook** — deduplicate 111 fetch patterns + 186 loading states
18. **Break up god components** — start with marketplace/[id]/page.tsx (726 lines, 19 useState)
19. **Derive component types from Zod schemas** — 5 type files (547 lines) manually duplicating schema types
20. **Build subscription exchange feature** — core mission commitment, zero current infrastructure
21. **Create public financial transparency page** — expose subset of admin analytics publicly
22. **Increase test coverage** — 2.2% is critically low; prioritize auth, payments, chatbot (0 tests)

---

## Phase 5: Functional Correctness

### Authentication & Authorization

**Base auth layer: SOLID.** Auth.js v5 with JWT strategy. Session includes `isStaff`, `staffPermissions`, `isSuperAdmin`. bcrypt passwords. Generic error messages prevent enumeration.

**Section-level permissions: NOW IN PLACE (WI-1+2).** `withAdmin('section', handler)` pattern deployed across 70+ handlers.

### Remaining Route Findings

| ID | Severity | Route | Issue | Status |
|----|----------|-------|-------|--------|
| F-1 | **CRITICAL** | `/api/admin/promote-user` | `withAdmin(async ...)` without section | **FIXED** — added `'users'` section |
| F-2 | Medium | `/api/admin/users/[id]` | `withAdmin()` without `'users'` section | **FIXED** — added `'users'` section to GET/PATCH/DELETE |
| F-3 | Medium | `/api/admin/users/[id]/permissions` | `withAdmin()` without section | **FIXED** — added `'users'` section |
| F-5 | Medium | `/api/admin/hirn/documents` DELETE | DELETE lacked section | **FIXED** — added `'hirn'` section |
| F-4 | Low | `/api/admin/hirn/actions/execute` | Bare `withAdmin()` | By design — has per-action section checking internally |
| F-6/7 | Low | `/api/admin/permissions/requests[/[id]]` | Bare `withAdmin()` | By design — has internal `isSuperAdmin()` check |
| F-8 | Info | `/api/admin/permissions/request` POST | Any staff can request | By design — self-service endpoint |

### CSRF Protection (F-13 HIGH) — **FIXED**

**File:** `src/lib/auth/csrf.ts`

~~`excludedPaths` exempted ALL `/api/admin/` routes from CSRF protection.~~ **Fixed:** Narrowed exclusion list from 13 broad paths to 3 external webhook paths only (`/api/webhooks/`, `/api/payments/payrexx-webhook`, `/api/payments/webhook`). Also fixed critical implementation bug: cookie was `httpOnly: true` which prevented `CSRF_SCRIPT` from reading it via `document.cookie` — changed to `httpOnly: false` (correct for Double Submit Cookie pattern). Injected `CSRF_SCRIPT` into root layout.tsx for automatic fetch patching.

### Open Redirect (F-15 HIGH) — **FIXED**

**File:** `src/components/auth/LoginForm.tsx`

~~Reads `callbackUrl` from URL search params with no validation.~~ **Fixed:** Added validation — only allows relative paths starting with `/` that don't start with `//`. External URLs redirect to `/dashboard`.

### Webhook Authentication (F-16 HIGH) — **FIXED**

**File:** `src/app/api/payments/payrexx-webhook/route.ts`

~~When `PAYREXX_WEBHOOK_SECRET` is not set, verification was skipped (returned `true`).~~ **Fixed:** Now returns `false` when secret is missing, logging an error and rejecting the webhook (fail-closed).

Stripe webhook: OK — properly verifies via `stripe.webhooks.constructEvent()`.

### Legacy Auth System (F-24 HIGH)

**Files:** `src/lib/admin-auth.ts`, 4 route files

Two parallel auth systems coexist:
1. **Auth.js v5** — primary, session-based, permission-aware
2. **Legacy JWT** — shared admin password, creates own `admin_token` cookie, bypasses Auth.js permissions entirely

Routes using legacy auth: `/api/admin/auth`, `/api/admin/login`, `/api/admin/profile`, `/api/newsletter/subscribe`.

### Rate Limiting Gaps

| ID | Severity | Endpoint | Issue |
|----|----------|----------|-------|
| F-19 | Medium | `/api/auth/login-status` | User enumeration vector, no rate limit |
| F-22 | Medium | `/api/listings/[id]/contact` | Messaging spam vector |
| F-20 | Low | `/api/workshops/register` | Requires auth, lower risk |
| F-21 | Low | `/api/repairer/apply` | Requires auth + duplicate check |

### Additional Findings

- **F-14 (Low):** Constant-time compare in csrf.ts and password.ts leaks length (returns `false` immediately if lengths differ). Not exploitable in current usage.
- **F-23 (Low):** Content approval inconsistency — blog uses `user_content_submissions`, other types have separate flows.
- **F-25 (Medium):** Admin layout checks `isStaff` + any permissions, but doesn't enforce per-page sections.

---

## Phase 6: UI/UX & Responsive Design

### What's Done Well
- Responsive design system in `src/lib/responsive.ts` with grid/typography/spacing utilities
- Design system defines 44x44px minimum touch targets (`src/lib/design-system.ts:313`)
- Homepage uses consistent `flex-col sm:flex-row` mobile-first patterns
- Tables wrapped with `overflow-x-auto` in most admin views
- `ProductForm` is exemplary: `touch-manipulation`, `min-h-[48px]`, mobile-optimized padding
- 18 `loading.tsx` + 18 `error.tsx` files across route segments
- Public mobile menu has body scroll lock, escape key, portal rendering

### Fixed Since Last Audit (WI-6/7/8/9)
- [x] Task analytics grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (was `grid-cols-5`)
- [x] ComparisonTable: `grid-cols-1 md:grid-cols-3` (was `grid-cols-3`)
- [x] ImageUploadGrid: `grid-cols-2 sm:grid-cols-4` (was `grid-cols-4`)
- [x] ListingPreview: `grid-cols-2 sm:grid-cols-4` (was `grid-cols-4`)
- [x] Admin service action icons: `p-2.5` (was `p-1.5`)
- [x] Image remove button: enlarged
- [x] Footer social links: added padding
- [x] Admin sidebar scroll lock: `document.body.style.overflow = 'hidden'` when open
- [x] 404 page: translated to Swiss German

### Fixed This Session

- [x] `AdminPageWrapper.tsx:38` — header now uses `flex-col sm:flex-row` with `min-w-0` for proper mobile wrapping
- [x] `DonationsTable.tsx:50` — changed `overflow-hidden` to `overflow-x-auto` for horizontal scroll on mobile

### Remaining Issues

| Issue | Severity | Location |
|-------|----------|----------|
| `FloatingAdminToggle` position | Low | Exported but unused — `fixed bottom-6 right-6` would overlap if used alongside other floating buttons |

---

## Action Items (Prioritized)

### P0 — Security ~~(fix immediately)~~ **ALL FIXED**

1. [x] **F-1:** Add `withAdmin('users', ...)` to promote-user route
2. [x] **F-15:** Validate `callbackUrl` in LoginForm.tsx
3. [x] **F-16:** Fail closed on Payrexx webhook
4. [x] **F-13:** CSRF protection for admin routes (narrowed exclusions, fixed httpOnly bug, injected CSRF_SCRIPT)
5. [x] **F-2/3/5:** Section parameters added to users/[id], users/[id]/permissions, hirn/documents DELETE

### P1 — Correctness & Dead Code (mostly fixed)

6. [x] Delete dead files (~1,565 lines) — number-sources.ts, middleware/auth.ts, middleware/admin-access.ts, role-checks.ts, mappers.ts, labels.ts, sensitive-areas.ts, newsletter-status.ts, 3 hooks, unified-permissions.ts, lib/database/ dir
7. [ ] Wire Zod schemas into 55 unvalidated mutation routes
8. [ ] Fix 13+ empty catch blocks (add logger.error) — *Note: investigated, all have meaningful fallback logic*
9. [x] Fix placeholder phone in page.tsx JSON-LD
10. [x] Remove re-export layer (sensitive-areas.ts deleted, logic inlined)

### P2 — Architecture (partially fixed)

11. [ ] Retire legacy admin auth system — migrate 4 routes to Auth.js (F-24)
12. [x] Migrate files off unified-permissions — all 5 consumers migrated, file deleted
13. [ ] Centralize badge colors from 11 config files
14. [x] Import status labels from config — 2 location pages fixed (4 remaining)
15. [ ] Derive component types from Zod schemas (5 type files, 547 lines)
16. [ ] Add rate limiting to admin AI routes and login-status endpoint

### P3 — UI/UX **ALL FIXED**

17. [x] Fix AdminPageWrapper header wrapping on mobile
18. [x] Floating button overlap resolved (buttons are in separate layouts — no actual overlap)
19. [x] DonationsTable overflow fixed (`overflow-x-auto`)

### P4 — Strategic / Mission

20. [ ] Build subscription exchange feature (core mission, zero infrastructure)
21. [ ] Create public financial transparency page
22. [ ] Increase test coverage from 2.2% (prioritize: auth, payments, chatbot)
23. [ ] Create `useFetch`/`useAsync` hook (deduplicate 111 fetch + 186 loading state patterns)
24. [ ] Break up god components (start with 726-line marketplace detail, 19 useState)
