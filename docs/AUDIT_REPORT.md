# Codebase Audit Report

**Date**: 2026-03-31
**Auditor**: Claude Code
**Branch**: main
**Commit**: 216dfc18
**Previous Audit**: 2026-03-13 (score 7.1/10)
**Baseline Audit**: 2026-03-08 (score 7.0/10)

## Executive Summary

RevampIT shows continued improvement since the last audit. All automated checks pass cleanly — 0 TypeScript errors, 0 ESLint errors, 0 umlaut violations, and 357/357 tests passing (up from 325/360 last audit). The console.log discipline remains perfect, and parameterized queries are used throughout with no SQL injection risks.

The main areas needing attention remain: SSOT violations (17 status config files exist but are bypassed by hardcoded strings in API routes, 21 raw table names in SQL), god components (5+ files over 350 lines), and accessibility gaps (broken label-input associations in ~50% of forms, WCAG contrast failures with text-gray-400, touch targets below 44x44px in several interactive elements).

Mission alignment is strong across 6 of 7 pillars. The subscription exchange feature remains schema-only with no public UI — the only unimplemented mission area. The open-source registry has grown to 70+ alternatives. Financial transparency, environmental impact tracking, and Swiss localization are all well-implemented.

## Health Score

| Area | Score | Δ from Last | Notes |
|------|-------|-------------|-------|
| First Principles | 7/10 | — | SSOT violations persist (17 status files bypassed, hardcoded config). 5 god components >350 lines |
| Best Practices | 9.5/10 | +0.5 | All checks pass: 0 TS errors, 0 lint errors, 357/357 tests. 21 raw TABLE_NAMES violations |
| Mission Alignment | 7/10 | +0.5 | OSS registry expanded to 70+ alternatives. Subscription exchange still schema-only |
| Functional Correctness | 8/10 | +0.5 | Auth system solid, content approval flow complete, consistent error handling |
| UI/UX & Responsive | 6/10 | +0.5 | Good mobile-first approach. Label-input broken in ~50% forms, contrast issues remain |
| **Overall** | **7.5/10** | **+0.4** | Meaningful improvement in test health, lint compliance, and mission features |

## Phase 1: First Principles

### Ground Truth 1: Software Serves Humans — 8/10

- **0 console.log violations** — full compliance
- **Silent error swallowing** in 6+ locations:
  - `src/lib/auth/redis.ts:55` — empty `catch {}` with no logging
  - `src/app/it-hilfe/helfer/[id]/page.tsx` — `.catch(() => {})` swallows errors
  - `src/app/api/tasks/[id]/attention/route.ts` — `.catch(() => ({}))`
  - `src/app/api/tasks/[id]/request/route.ts` — `.catch(() => ({}))`
  - `src/app/api/tasks/[id]/complete/route.ts` — `.catch(() => ({}))`
- **Incomplete migration**: `src/db/schema/itHilfe.ts:138-139` — `helper_profiles` table still exists alongside deprecated repairer_profiles

### Ground Truth 2: SSOT — 5/10 (stable)

- **17 status config files** in `src/config/*-status.ts` (594 total lines) — all share the same structure but are independently maintained. A generic status config builder could reduce duplication.
- **Types separate from schemas** (HIGH severity):
  - `src/lib/schemas/team.ts:91-125` — `TeamProfile` interface defined separately from `teamProfileSchema`
  - `src/components/admin/HirnChat.tsx:6-24` — `HirnActionCard` and `Message` interfaces with no schema validation
  - `src/components/admin/users/types.ts` — `UserRow` interface not derived from database schema
  - `src/app/repairers/page.tsx:20-33` — `ApiReviewResponse` defined locally
- **Hardcoded config in components**:
  - `src/app/admin/AdminLayoutClient.tsx:32-38` — `SENSITIVITY_REASONS` object inline
  - `src/components/erfassung/DataEntryTabs.tsx:43-50` — `CORE_TABS` defined inline
- **Normalization in UI**: `src/app/repairers/page.tsx:59-84` — camelCase→snake_case mapping in component (should be at API boundary)
- **116 scattered `process.env` calls** — should be centralized in `src/config/env.ts`
- **176 component-local interfaces** in `src/components/admin/` — makes reuse difficult

### Ground Truth 3: Design for Change — 5/10 (stable)

- **God components (>300 lines)**:
  - `src/app/admin/AdminLayoutClient.tsx` — 517 lines
  - `src/components/erfassung/DataEntryTabs.tsx` — 419 lines
  - `src/components/admin/team/TeamProfileView.tsx` — 375 lines
  - `src/components/layout/MobileMenu.tsx` — 365 lines
  - `src/components/admin/ServiceForm.tsx` — 357 lines
- **46 components with direct `fetch()` calls** — no service layer abstraction, components tightly coupled to API paths
- **Multiple independent form hook patterns** (`useProductForm`, `useWorkshopForm`, etc.) with no shared abstraction

### Ground Truth 4: Automate the Mechanical — 8/10

- **160+ uses of `z.infer`** show good schema→type derivation pattern
- **Missing**: Lint rule to flag manual type definitions when Zod schema exists
- **Missing**: Centralized env validation at startup (`process.env` accessed directly 116 times)

### Ground Truth 5: Simplicity Scales — 7/10

- Large index files: `src/lib/services/index.ts` (379 lines), `src/lib/hirn/providers/index.ts` (282 lines)
- 17 status config files could be reduced to a factory function + data

### Ground Truth 6: Correctness Beats Speed — 7/10

- **2 `@ts-ignore`**: `src/lib/auth/redis.ts:32,59` — for dynamic imports (justifiable but could use better typing)
- **`any` in API response**: `src/app/repairers/page.tsx:60` — `map((r: any) =>` with no validation
- **5 `eslint-disable` without strong justification**: `src/app/admin/decisions/[id]/DiscussionThread.tsx:50`, `src/app/admin/tasks/TaskFiltersClient.tsx:38`, `src/components/map/LeafletMapInner.tsx:104`

## Phase 2: Best Practices

### Automated Checks — All Pass ✓

| Check | Result |
|-------|--------|
| TypeScript (`npm run typecheck`) | **PASS** — 0 errors |
| ESLint (`npm run lint`) | **PASS** — 0 warnings/errors |
| Umlaut lint (`npm run lint:umlauts`) | **PASS** — No violations |
| Tests (`npm test`) | **PASS** — 27 suites, 357 tests passing |

### Critical Rules

| Rule | Status | Details |
|------|--------|---------|
| No console.log | ✅ PASS | Only in `src/lib/logger.ts` (correct location) |
| TABLE_NAMES usage | ❌ **21 violations** | 10 files use raw table names in SQL (see below) |
| Parameterized queries | ✅ PASS | All SQL uses Drizzle ORM or `sql` tagged templates |
| Swiss German | ✅ PASS | Proper umlauts, no ß, no ASCII substitutes |
| Logger usage | ✅ PASS | All production code uses `@/lib/logger` |

### TABLE_NAMES Violations (21 instances in 10 files)

- **Certifications routes** (6): `src/app/api/admin/certifications/route.ts:71-81`, `[id]/verify/route.ts:32-34`, `[id]/reject/route.ts:29-30`
- **Listings routes** (3): `src/app/api/listings/mine/route.ts:53`, `favorites/route.ts:49`, `similar/route.ts:45` — `listing_images` hardcoded
- **Location route** (1): `src/app/api/locations/[id]/route.ts:44` — `location_approvals` hardcoded
- **IT-Hilfe routes** (5): `src/app/api/admin/it-hilfe/helpers/route.ts:35,62`, `stats/route.ts:24-26`
- **Marketplace routes** (5): `src/app/api/admin/marketplace/route.ts:47,76`, `stats/route.ts:25-27`
- **Messages route** (2): `src/app/api/messages/conversations/route.ts:56,61`

### Admin Auth Coverage

- **18/22 admin routes** use `withAdmin()` middleware — ✅
- **4 exceptions** (all acceptable): `/admin/auth`, `/admin/login`, `/admin/logout`, `/admin/profile`
- **Observation**: `/admin/profile` implements its own JWT verification instead of using shared middleware

### API Response Format

✅ All routes use `{ success, data/error }` format via `apiSuccess`/`apiError` helpers.

### Naming Conventions

✅ Generally compliant. 9 UI components use lowercase names (`alert.tsx`, `badge.tsx`, etc.) — these are shadcn/ui convention, acceptable.

## Phase 3: Mission Alignment

| Area | Status | Evidence | Gaps |
|------|--------|----------|------|
| **Free Exchange of Technology** | ✅ Implemented | Marketplace with "Nur Gratis" filter, multi-channel shop, P2P listings | No public "free hardware library" or donation request UI |
| **Open-Source Advocacy** | ✅ Implemented | 70+ alternatives in registry, Linux guide, migration difficulty ratings | No migration tutorials or success stories |
| **Environmental Impact** | ✅ Implemented | ~43 tons CO₂/yr tracked (Fraunhofer data), impact page with charts, donation calculator | No per-listing CO₂ badge on marketplace |
| **Education & Digital Inclusion** | ✅ Implemented | Workshops with categories/levels, IT-Hilfe peer support, 20+ repair categories | No structured learning paths |
| **Subscription Exchange** | 📋 Planned Only | DB schema complete (migration 048, 4 tables with governance) | **NO PUBLIC UI — Feature dormant** |
| **Financial Transparency** | ✅ Implemented | Finances page with self-financing ratio, multi-year revenue breakdown, Kivitendo source | No annual report download, no cost breakdown |
| **Swiss Context** | ✅ Implemented | CHF throughout, proper umlauts, Zürich address, canton selector, "Velo"/"Billett" vocabulary | None |

**Mission Score: 7/10** — 6 of 7 pillars implemented. Subscription exchange is the critical gap.

## Phase 4: Improvement Roadmap

### Quick Wins (<1 hour each)

1. **Fix silent error catches** — Add `logger.error()` to 6 empty catch blocks (redis.ts, task routes)
2. **Add viewport export** to `src/app/layout.tsx` — missing `export const viewport` for mobile responsiveness
3. **Replace `text-gray-400` with `text-gray-600`** in empty states, help text — fix WCAG AA contrast failures
4. **Increase touch targets** — Add `min-h-[44px] min-w-[44px]` to small buttons in BulkTable, AIFieldIndicator, ReviewForm
5. **Add `aria-labelledby`** to ConfirmDialog and modal components

### Medium Effort (1-5 hours each)

6. **Fix label-input associations** — Audit ~40 form components, add matching `htmlFor`/`id` pairs
7. **Migrate 21 raw table names** to use `TABLE_NAMES` constants in 10 API route files
8. **Derive types from schemas** — Convert `TeamProfile`, `UserRow`, `HirnActionCard` interfaces to `z.infer<>`
9. **Create status config factory** — Replace 17 independent status config files with a generic builder + data
10. **Centralize `process.env`** — Create `src/config/env.ts` with validation, replace 116 scattered calls
11. **Split largest god components** — Start with `AdminLayoutClient.tsx` (517 lines) and `DataEntryTabs.tsx` (419 lines)

### Strategic Improvements

12. **Implement Subscription Exchange UI** — Schema exists (migration 048), needs API routes + public pages. Last unimplemented mission pillar.
13. **Create service layer** — Abstract 46 component-level `fetch()` calls into centralized services
14. **Add per-listing CO₂ badge** — Show environmental savings on marketplace items
15. **Add automated accessibility testing** — Integrate axe/Lighthouse in CI pipeline
16. **Create structured learning paths** — Workshop progression from beginner to advanced

## Phase 5: Functional Correctness

### Authentication & Authorization — ✅ PASS

- **Session shape**: Correct — `id`, `email`, `name`, `isStaff`, `staffPermissions`, `isSuperAdmin` all threaded through JWT/session callbacks (`src/auth.ts:38-51`)
- **Staff detection**: `isStaffEmail()` checks `@revamp-it.ch` domain case-insensitively (`src/lib/permissions.ts:57-59`)
- **Super admin**: Hardcoded email list + DB flag, checked at every permission gate (`src/lib/permissions.ts:70-88`)
- **Admin layout**: Three-level server-side guard — auth → staff → section permissions (`src/app/admin/layout.tsx:13-56`)
- **Permission aliases**: `finances` → `finanzen` mapping prevents breaking changes (`src/lib/permissions.ts:131-140`)

### Content Approval Flow — ✅ PASS

- State machine: `pending → [approved, rejected]`, `rejected → [pending]`, `approved → []` (immutable)
- Implemented in `src/app/api/admin/approvals/[id]/route.ts:42-56`
- Email notifications on status change with graceful failure handling
- Reviewed-by and reviewed-at tracking

### API Route Quality — ✅ PASS

- All routes use consistent try-catch + `apiSuccess`/`apiError` pattern
- Proper HTTP status codes: 200, 201, 400, 401, 403, 404, 429, 500
- Rate limiting on public endpoints: registration, blog submission, listing browse/create
- Input validation via Zod schemas on mutation routes

### Security — ✅ PASS

- Parameterized queries throughout (Drizzle ORM + `sql` tagged templates)
- Password hashing with constant-time comparison
- HTTP-only, Secure, SameSite=lax cookies
- No information leakage in error responses
- Generic auth error messages prevent user enumeration

### Minor Observations

- **Dual auth systems**: Auth.js (main) + legacy CMS JWT (`/admin/login`, `/admin/profile`) — should document deprecation path
- **Missing timeout**: External CMS API call in `/api/admin/login/route.ts` has no `AbortSignal.timeout()`
- **Missing try-catch**: `/api/admin/auth/route.ts` — `auth()` call not wrapped

## Phase 6: UI/UX & Responsive Design

### Responsive Design — 7/10

**Strengths:**
- Mobile-first Tailwind approach consistently applied
- Header uses `hidden lg:flex` / `lg:hidden` for desktop/mobile navigation
- Responsive grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` pattern
- Good responsive spacing: `gap-6 sm:gap-8 lg:gap-x-8`

**Issues:**
- Hardcoded px widths: `w-[500px]`, `min-w-[800px]` in panels/tables — should use responsive classes
- Some tables require horizontal scroll on mobile (acceptable for data-heavy admin views)

### Accessibility — 5/10

**Critical Issues:**
- **Broken label-input associations** in ~50% of form components — labels have `htmlFor` but inputs lack matching `id`
  - Broken: `ProductBasicInfoSection.tsx`, `BasicInfoSection.tsx`, `TeamProfileForm.tsx`
  - Working: `AccountStep.tsx`, `LoginForm.tsx`, `ProtocolDetailsStep.tsx`
- **WCAG contrast failures** — `text-gray-400` on white background = ~4.2:1 ratio (needs 4.5:1 for AA)
  - `src/components/common/EmptyState.tsx:27`
  - `src/components/erfassung/ProductImageSection.tsx`
  - Multiple admin tables with `text-gray-400`/`text-gray-500`
- **Touch targets <44x44px**:
  - `src/components/erfassung/BulkTable.tsx:60-68` — `p-1.5` = ~22x22px
  - `src/components/ai/AIFieldIndicator.tsx:17` — `px-1 py-0.5` = ~16x12px
  - `src/components/it-hilfe/ITHilfeReviewForm.tsx:43` — `p-0.5` = ~8x8px
- **Missing `aria-labelledby`** on `ConfirmDialog.tsx` dialog

**Strengths:**
- Skip-to-content link in root layout (`src/app/layout.tsx:24-29`)
- 254 instances of focus ring styling across codebase
- Mobile menu has proper ARIA: `role="dialog"`, `aria-modal`, escape key, body scroll lock
- All images have alt text (25+ verified)
- Semantic HTML: `<main>`, `<nav>`, `<footer>` used correctly
- Breadcrumbs with `aria-label="Breadcrumb"`

### UI States — 9/10

- ✅ Reusable `LoadingState`, `EmptyState`, `ErrorAlert` components
- ✅ Consistent use across pages
- ✅ Empty states include helpful message + CTA

## Action Items

Prioritized by: Mission impact → User impact → Code quality

### Priority 1 — Mission Critical
1. [ ] **Implement Subscription Exchange UI** — Last unimplemented mission pillar (schema ready in migration 048)

### Priority 2 — User-Facing Quality
2. [ ] **Fix label-input associations** in ~40 form components (accessibility)
3. [ ] **Fix WCAG contrast** — Replace `text-gray-400` with `text-gray-600` in body text
4. [ ] **Fix touch targets** — Minimum `min-h-[44px] min-w-[44px]` on interactive elements
5. [ ] **Add viewport export** to root layout
6. [ ] **Add `aria-labelledby`** to dialog components

### Priority 3 — Code Quality
7. [ ] **Migrate 21 raw table names** to `TABLE_NAMES` constants
8. [ ] **Fix 6 silent error catches** — Add `logger.error()` calls
9. [ ] **Derive types from Zod schemas** — `TeamProfile`, `UserRow`, `HirnActionCard`
10. [ ] **Create status config factory** — Consolidate 17 files
11. [ ] **Centralize `process.env`** — Create `src/config/env.ts`
12. [ ] **Split god components** — Start with `AdminLayoutClient.tsx` (517 lines)

### Priority 4 — Strategic
13. [ ] **Create service layer** — Abstract 46 direct `fetch()` calls
14. [ ] **Add per-listing CO₂ badge** on marketplace
15. [ ] **Add accessibility CI** — axe/Lighthouse automated testing
16. [ ] **Deprecate legacy CMS JWT** auth path
