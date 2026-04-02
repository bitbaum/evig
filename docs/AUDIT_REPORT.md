# Codebase Audit Report

**Date**: 2026-04-02
**Auditor**: Claude Code
**Branch**: main
**Commit**: c53e26c3
**Previous Audit**: 2026-03-31 (score 7.5/10)

## Executive Summary

RevampIT's codebase shows strong improvement since the last audit. A major refactoring session introduced shared utilities (`apiFetch`, `useFormHandler`, `FILE_SIZE_LIMITS`), decomposed the admin layout, and fixed critical DB status mismatches in payment workflows. Automated checks remain perfect: 0 TypeScript errors, 0 ESLint violations, 357/357 tests passing.

The primary remaining gaps are: (1) Subscription Exchange — a core mission feature with schema but zero UI, (2) SSOT violations in scattered env vars and status config duplication, and (3) 10 god components exceeding 300 lines. Security posture is excellent with parameterized queries, proper auth middleware, and rate limiting throughout.

## Health Score

| Area | Score | Change | Notes |
|------|-------|--------|-------|
| First Principles | 7/10 | +0.5 | SSOT improved (apiFetch, FILE_SIZE_LIMITS), god components partially decomposed |
| Best Practices | 9/10 | +0.5 | TABLE_NAMES violations reduced, apiFetch adopted in 50+ files |
| Mission Alignment | 7/10 | = | 6/7 pillars implemented; Subscription Exchange still dormant |
| Functional Correctness | 8.5/10 | +0.5 | Critical payment status bugs fixed (052 migration) |
| UI/UX & Responsive | 8/10 | = | Strong mobile-first patterns; minor contrast issues remain |
| **Overall** | **8/10** | **+0.5** | Systematic improvement trajectory |

---

## Phase 1: First Principles

### Ground Truth 1: Software Serves Humans — 8/10

**Strengths:**
- Zero console.log violations (strict logger-only policy)
- Consistent error handling with `apiSuccess`/`apiError` helpers
- User-friendly German error messages throughout

**Issues:**
- 6 silent error catches with no logging:
  - `src/lib/auth/redis.ts:55` — empty catch
  - `src/app/it-hilfe/helfer/[id]/page.tsx` — `.catch(() => {})`
  - `src/app/api/tasks/[id]/attention/route.ts` — `.catch(() => ({}))`
  - `src/app/api/tasks/[id]/request/route.ts` — `.catch(() => ({}))`
  - `src/app/api/tasks/[id]/complete/route.ts` — `.catch(() => ({}))`

### Ground Truth 2: State Defines Behavior (SSOT) — 6/10

**Improved since last audit:**
- `apiFetch()` centralizes client-side fetch pattern (was 100+ scattered)
- `FILE_SIZE_LIMITS` centralizes magic numbers (was hardcoded in 6+ files)
- `SERVICE_URLS` centralizes external endpoints
- `AdminSidebar` + `UserMenuDropdown` extracted from god component
- `getSensitivityReason()` moved to sections.ts config
- Section labels in PermissionRequestsManager now derived from config

**Remaining issues:**
- 17 status config files with identical structure (594 lines of near-identical boilerplate)
- 116+ scattered `process.env` calls — no central env validation
- Component-local type interfaces not derived from Zod/Drizzle schemas (e.g., `src/app/admin/it-hilfe/types.ts`, `src/app/admin/marketplace/types.ts`)
- ~10 TABLE_NAMES violations remain in certification, listing, IT-Hilfe, marketplace, and message routes

### Ground Truth 3: Design for Change — 6/10

**Improved:**
- AdminLayoutClient decomposed (517→~100 lines + 2 new components)
- `useFormHandler` hook eliminates duplicated form state patterns

**Remaining god components (>300 lines):**

| File | Lines |
|------|-------|
| `src/components/erfassung/DataEntryTabs.tsx` | 414 |
| `src/components/admin/team/TeamProfileView.tsx` | 375 |
| `src/components/layout/MobileMenu.tsx` | 365 |
| `src/components/admin/protocols/ContentInputStep.tsx` | 338 |
| `src/components/workshops/WorkshopRegistrationForm.tsx` | 325 |
| `src/components/erfassung/ImageCapture.tsx` | 325 |
| `src/components/admin/ServiceForm.tsx` | 322 |
| `src/components/admin/HirnChat.tsx` | 319 |
| `src/components/admin/CategoryForm.tsx` | 312 |
| `src/components/auth/RegistrationWizard.tsx` | 307 |

### Ground Truth 4: Automate the Mechanical — 8/10
- 160+ uses of `z.infer` for schema→type derivation
- Drizzle ORM automates migrations
- Missing: env validation at startup, status config generation from factory

### Ground Truth 5: Simplicity Scales — 7/10
- Large orchestration modules (`decisions-core.ts` 669 lines, `payment-flow.ts` 531 lines)
- Well-justified complexity in AI/payment domains

### Ground Truth 6: Correctness Beats Speed — 8/10
- 4 `any` casts remaining (`src/app/repairers/page.tsx:60`, erfassung, smart entry)
- 1 `@ts-ignore` in redis.ts (justified for dynamic imports)
- 6 `eslint-disable` without documentation

---

## Phase 2: Best Practices

### Automated Checks — All Pass

| Check | Result |
|-------|--------|
| TypeScript | 0 errors |
| ESLint | 0 violations |
| Tests | 357/357 passing (27 suites) |
| Umlaut lint | 0 violations |

### Critical Rules Compliance

| Rule | Status | Details |
|------|--------|---------|
| No console.log | PASS | Only in logger.ts |
| TABLE_NAMES | ~10 violations | Certification, listing, IT-Hilfe, marketplace, message routes |
| Parameterized queries | PASS | All via Drizzle ORM or sql tagged templates |
| Swiss German | PASS | Proper umlauts, no ASCII substitutes, no ss→ss violations |
| Logger usage | PASS | All production code uses @/lib/logger |
| Auth on admin routes | PASS | 18/22 routes use withAdmin; 4 exceptions documented |
| API response format | PASS | All routes return { success, data/error } |
| Zod validation | PASS | 105/106 mutation routes validated |

### Codebase Statistics

| Metric | Count |
|--------|-------|
| Total .ts/.tsx files | ~1,300 |
| Test files | 27 |
| App Router pages | ~163 |
| API routes | ~80 |
| Config files | 30+ |
| Custom hooks | 80+ |
| Loading states (loading.tsx) | 23 |
| Error boundaries (error.tsx) | 17 |

---

## Phase 3: Mission Alignment

| Pillar | Status | Rating | Notes |
|--------|--------|--------|-------|
| Free Exchange of Technology | Implemented | 9/10 | Marketplace + shop with "Gratis" mode, P2P + inventory |
| Open-Source Advocacy | Implemented | 9/10 | 70+ alternatives in registry with migration ratings |
| Environmental Impact | Implemented | 8/10 | CO2 tracking data exists; CO2Badge component unused on listings |
| Education & Inclusion | Implemented | 8/10 | Workshops + IT-Hilfe peer support working |
| **Subscription Exchange** | **Not Implemented** | **0/10** | **DB schema exists (migration 048), zero UI/API** |
| Financial Transparency | Implemented | 8/10 | CHF revenue breakdown by year on /about/finances |
| Swiss Context | Implemented | 9/10 | CHF, proper umlauts, Zürich address, Payrexx payments |

**Critical gap**: Subscription Exchange is mission pillar #5 with complete DB schema but zero public-facing implementation.

---

## Phase 4: Improvement Roadmap

### Quick Wins (<1 hour)
1. Add `logger.error()` to 6 silent catch blocks
2. Enable CO2Badge on marketplace listing cards (component exists, just needs integration)
3. Fix remaining ~10 TABLE_NAMES violations in API routes

### Medium Effort (1-5 hours)
4. Create `src/config/env.ts` with Zod validation for 116 scattered `process.env` calls
5. Fix 4 remaining `any` casts with proper types
6. Split DataEntryTabs (414 lines) and TeamProfileView (375 lines) into sub-components
7. Fix 3 WCAG AA contrast violations (gray-400/500 on white backgrounds)

### Strategic (5+ hours)
8. **Implement Subscription Exchange UI** — API routes, admin dashboard, public pages for creating/joining pools
9. Create status config factory to replace 17 boilerplate files (~400 lines saved)
10. Centralize env validation with startup checks
11. Continue god component decomposition (8 remaining >300 lines)

---

## Phase 5: Functional Correctness

### Authentication & Authorization — 8.5/10

- Auth.js v5 with JWT sessions
- Session shape: `{ id, email, name, isStaff, staffPermissions, isSuperAdmin }`
- Staff detection: case-insensitive @revamp-it.ch domain check
- Super admin: hardcoded emails + DB flag (dual check)
- Admin layout: 3-level server-side guard (auth → staff → section permission)
- `withAdmin()` middleware on 18/22 admin routes (4 documented exceptions)

### Content Approval Flow — 9/10
- State machine: draft → pending → approved/rejected
- Implemented for products, services, workshops, blog posts
- Email notifications on status change
- Approved content locked (immutable)

### API Routes Health — 8.5/10
- 105/106 mutation routes use Zod validation
- Consistent `{ success, data/error }` response format
- Proper HTTP status codes (200, 201, 400, 401, 403, 404, 429, 500)
- Rate limiting on public endpoints

### Security — 9/10
- Zero SQL injection risk (Drizzle ORM + parameterized queries)
- Bcrypt with salt for password hashing
- Constant-time password comparison
- HTTP-only secure cookies
- Generic login error messages (prevents enumeration)
- No stack traces in API responses

### Recent Critical Fixes (this session)
- Fixed marketplace order `pending_payment` vs DB `pending` constraint mismatch
- Fixed Payrexx webhook setting invalid `paid` status on service appointments
- Fixed appointment pay route referencing non-existent `approved` status
- Fixed inventory filter builder silently dropping 3rd+ conditions
- Migration 052 applied to Neon DB

---

## Phase 6: UI/UX & Responsive Design — 8/10

### Strengths
- Mobile-first responsive patterns with proper sm:/md:/lg: breakpoints
- Touch targets consistently 44x44px minimum on interactive elements
- 23 loading.tsx states across the app
- 17 error boundaries with retry actions
- All tables have `overflow-x-auto` for mobile scroll
- Proper dark mode with consistent `dark:` class patterns
- All `.map()` calls have proper `key` props
- Reusable `EmptyState` component with icon, message, and CTA
- Mobile menu with backdrop blur, escape key, body scroll lock, focus management

### Issues
- 3 WCAG AA contrast concerns: `text-gray-400`/`text-gray-500` on white backgrounds in DataEntryTabs, LoginForm, repairer dashboard
- `min-h-[400px]` fixed heights in loading/error states (not flexible for small screens)
- Contact form grid missing `sm:` breakpoint (jumps from 1-col to 2-col at `md:`)
- Limited `aria-label` usage in `src/components/ui/` library components

### God Components (UI)
10 components exceed 300 lines (listed in Phase 1 above). DataEntryTabs (414) and TeamProfileView (375) are top candidates for decomposition.

---

## Action Items (Prioritized)

### P0 — Mission Critical
- [ ] Implement Subscription Exchange UI (mission pillar #5, schema exists)

### P1 — User Impact
- [ ] Enable CO2Badge on marketplace listings
- [ ] Fix 3 WCAG AA contrast violations
- [ ] Add logger.error() to 6 silent catches

### P2 — Code Quality
- [ ] Fix ~10 remaining TABLE_NAMES violations
- [ ] Fix 4 remaining `any` casts
- [ ] Split DataEntryTabs (414 lines) and TeamProfileView (375 lines)
- [ ] Create env.ts with Zod validation for process.env

### P3 — Nice-to-Have
- [ ] Status config factory (replace 17 boilerplate files)
- [ ] Continue god component decomposition (8 more >300 lines)
- [ ] Add aria-labels to UI library icon buttons
- [ ] Document eslint-disable comments
