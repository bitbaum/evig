# Codebase Audit Report

**Date:** 2026-07-02
**Auditor:** Claude Code (multi-agent: 4 parallel expert sub-teams + visual pass + automated checks)
**Branch:** main
**Commit:** 7d1ce407
**Prior audit:** 2026-06 (Overall 8/10) — archived at `docs/AUDIT_REPORT_2026-06.md`

---

## Executive Summary

RevampIT is a **genuinely well-engineered codebase** — the exception among non-profit
web apps. The hard signals are strong: **0 TypeScript errors, 0 lint errors** (50
warnings), **7,691 tests passing across 531 suites**, **0 arbitrary-hex** design
violations, clean parameterized SQL, global CSRF, uniform admin authorization, and a
deep `config/`-as-SSOT layer with types derived from schemas. The mission is real and
wired end-to-end: the two-sided marketplace, the IT-Hilfe repair loop, cited CO₂
impact, workshops, and Swiss context are all implemented against real DB/config, not
mocked.

"Absolute perfection" is therefore a matter of closing a **small, concrete, and
mostly mechanical** gap — not a rewrite. The findings cluster into four HIGH items
worth doing first (an SSOT bug that miscounts sales, one privilege-boundary gap, a
layering break across trust boundaries, and a public page shipping hardcoded German),
a batch of high-leverage MEDIUM polish (image optimization root-cause, pagination,
icon-button a11y, god-file splits), and one strategic gap (no public financial
disclosure for a transparency-focused non-profit).

**Overall: 8.3 / 10** — a strong, disciplined foundation; the remaining distance to
perfect is well-scoped and achievable.

---

## Criteria for Perfection (the rubric)

| # | Dimension | Perfect = |
|---|-----------|-----------|
| 1 | Systems design / architecture | SSOT everywhere; clean config→domain→api→ui layering; low coupling; no god files |
| 2 | Engineering correctness | 0 type/lint errors; meaningful tests; parameterized SQL; validated boundaries |
| 3 | Best-practice adherence | Project CLAUDE.md rules held everywhere (logger, TABLE_NAMES, Swiss German, response shape) |
| 4 | UI/UX | Every state handled; clear hierarchy; mobile-first; frictionless core journeys |
| 5 | Aesthetics / design system | One token SSOT; zero arbitrary hex/inline colors; shared primitives; consistent & modern |
| 6 | Accessibility | Semantic HTML; focus management; 44px targets; alt text; aria labels; keyboard operable |
| 7 | Performance | No N+1; indexed & paginated queries; optimized images; minimal client JS |
| 8 | i18n | Messages = strings only; structure in config; 8-locale parity; no hardcoded UI strings |
| 9 | Security | Auth on every protected route; correct authz; safe secrets; rate limiting; no injection |
| 10 | Mission alignment | Every feature moves donor→recipient / repair→technician; impact measurable; transparency visible |

---

## Health Scorecard

| Area | Score | Notes |
|------|-------|-------|
| First Principles | 8.5/10 | Config-as-SSOT genuinely lived; **`is_revampit` re-derived from email in 3 files** is the one real puncture |
| Architecture / SoC | 8/10 | Thin API routes, ~0 dead logic; voting UI under `app/admin/*` consumed by public/dashboard breaks layering |
| Best Practices | 9/10 | 0 type errors, 0 lint errors (50 warn), 7691 tests, TABLE_NAMES + parameterized SQL, umlauts clean |
| Mission Alignment | 9/10 | 6 of 7 pillars fully wired; only gap = no public financial disclosure |
| Functional Correctness | 9/10 | Auth uniform on all 44 admin routes; approval flow is a proper state machine; 2 missing rate limiters |
| Aesthetics / Design System | 9/10 | 0 hex, 0 heavy shadows, 0 decorative gradients; 4 raw-palette chrome slips |
| Accessibility | 7/10 | `useFocusTrap` everywhere + correct alt; icon-only buttons lack `aria-label`; 1 drawer not a dialog |
| i18n | 7/10 | umlaut/ß clean; `invite/page.tsx` ships hardcoded German on a public route |
| Performance | 7/10 | Good caching; **R2 missing from `remotePatterns`** → unoptimized storefront images; unbounded `tasks` list |
| Security | 8.5/10 | Excellent IDOR/authz + global CSRF; `import-csv` uses `withAuth` not `withAdmin` |
| **Overall** | **8.3/10** | Strong foundation; the gap to perfect is small and concrete |

---

## Phase 1 — First Principles & Architecture

**HIGH — `is_revampit` re-derived from email (SSOT + real bug).** Three files compute
`isRevampit = listings.is_revampit OR seller.email LIKE '%@revamp-it.ch'`, the exact
anti-pattern CLAUDE.md forbids:
- `src/lib/marketplace/checkout-listing.ts:13`
- `src/app/api/admin/marketplace/stats/route.ts:14`
- `src/app/api/admin/marketplace/route.ts:23`
Effect: a staff member's **private** sale is mislabeled a RevampIT sale; admin stats
over-count RevampIT / under-count community. Also a DRY violation (same SQL copied 3×).
Fix: use the stored `${listings.isRevampit}` column directly; delete the `OR email LIKE`.

**HIGH — Layering break across trust boundaries.** `src/app/vote/[id]/PublicVoteClient.tsx`
(public, unauthenticated) and `src/app/dashboard/decisions/[id]/DashboardVotingClient.tsx`
import voting components from `@/app/admin/decisions/[id]/voting/*`. Move that folder to
neutral `src/components/decisions/voting/` and repoint all 3 consumers.

**MED — God files (mix concerns the rest of the codebase separates):**
`src/app/[locale]/projects/upcycling/GuideBody.tsx` (828), `src/lib/services/payment-webhook.ts`
(780), `src/components/timecards/useTimecardDraft.ts` (750), `DataEntryTabs.tsx` (423),
`MobileMenu.tsx` (469). (Long *config/data* files like `sections.ts` 1339 are acceptable.)

**MED — Dead code (verified 0 import sites, safe to delete):** `hooks/useSellerDashboard.ts`,
`components/ui/alert.tsx`, `components/dashboard/DashboardCard.tsx`, `components/community/CommunityStats.tsx`,
`lib/services/hr-retention.ts`, plus 5 stale `@deprecated` aliases (`routes.ts:27,83`, `it-hilfe.ts:46,55`, `techniker.ts:26`).

**LOW — Finance labels triplicated** (`admin/analyse/finanzen/page.tsx:23` + `config/analyse/metrics.ts:62` + `config/ui-colors.ts:24`) — import from `metrics.ts`.

Positives: only 6 `any` + 6 `@ts-ignore` in non-test code, 0 TODO/FIXME markers, 0 real commented-out blocks, no YAGNI over-engineering.

## Phase 2 — Best Practices (automated)

- `npm run typecheck` → **0 errors**
- `npm run lint` → **0 errors, 50 warnings** (mostly `react-hooks/set-state-in-effect` + `exhaustive-deps`)
- `npm run lint:umlauts` → **clean**
- `npm test` → **7,691 passed / 7,691** (531 suites)
- `grep '\[#' src` → **0** arbitrary hex
- `console.*` in src (excl logger) → **2**, both benign warnings (`env.ts:110`, `i18n/request.ts:70`)
- TABLE_NAMES + parameterized SQL: consistently used; no injection found

## Phase 3 — Mission Alignment

| Area | Status | Evidence |
|------|--------|----------|
| Free exchange of hardware | ✅ Implemented | marketplace browse/detail/sell → `api/listings`; cart/checkout; donations dropoff; gratis is a first-class price-0 state |
| Repair → technician (IT-Hilfe) | ✅ Implemented | request→offer→accept(+token)→complete→review, pre-acceptance chat, technician directory |
| Open-source advocacy | ✅ Implemented | `open-source-solutions` registry, `linux-open-source`, projects (LTSP/LinuxOLA/FreieComputer) |
| Environmental impact | ✅ Implemented | cited CO₂ SSOT (`org-numbers.defaults.ts`), `/transparenz/co2` methodology page, CO2Badge |
| Education / inclusion | ✅ Implemented | workshops browse/register(+pay)/propose |
| Financial transparency | ⚠️ Partial | `/transparenz` shows social metrics only; financials are admin-gated; no public Jahresrechnung |
| Swiss context | ✅ Implemented | Zürich address, 26-canton SSOT, CHF + 7.7% VAT, de-CH, proper umlauts/ss |

## Phase 5 — Functional Correctness & Security

- **Auth/authz — strong.** All 44 admin route files guarded via `withAdmin`; clean permission SSOT (`isStaffEmail`/`isSuperAdmin`/`canAccessSection`); admin layout guard correct.
- **HIGH — `src/app/api/inventory/import-csv/route.ts:33`** uses `withAuth` (any user) but INSERTs into the staff-only inventory system → a regular user can inject stock. Fix: `withAdmin('products', …)`.
- **IDOR — all PASS.** Every mutate-by-id route scopes by owner/admin; `invoices/[id]` has a role-split field allowlist; it-hilfe offer accept uses `FOR UPDATE` (TOCTOU-safe).
- **API shape — excellent.** `apiSuccess/apiError` SSOT; no internal-error leakage (raw errors logged server-side only). 1 legacy `{error}` shape (internal cron).
- **Rate limiting — broad**, 2 gaps: `listings/[id]/report` (mitigated by UNIQUE constraint) and `workshops/register`. LRU limiter is per-process (fine for single box; not distributed).
- **Validation — public forms Zod-validated**; several `withAdmin` routes use manual presence checks (robustness, not privilege).

## Phase 6 — UI/UX & Aesthetics

Visual pass on prod (homepage, marketplace, IT-Hilfe, admin) at desktop; marketplace verified at true mobile via Playwright. Design language is **strong and consistent** — mono eyebrows, shared card system, monochrome + green discipline, real KPI counts (no fake stats).

- **MED design** — 4 raw-palette chrome slips where a semantic token exists: `invite/page.tsx:150` (`text-red-600`→`text-error-600`), `marketplace-sell/ListingFormFields.tsx:128` (`text-teal-600`→`text-action`), `admin/dashboard/VotingBanner.tsx:98,105` (`text-teal-*`→`text-action`).
- **MED consistency** — marketplace now uses a left filter rail on desktop, but the IT-Hilfe technician directory still uses a top horizontal filter; align the two browse surfaces.
- **LOW** — the "Neue Dienstleistung" admin quick-create pill is orange among otherwise-green actions (chrome should stay monochrome/green).
- **A11y MED** — many `size="icon"` buttons lack `aria-label` (rely on `title` or nothing): `BulkDetailPanel.tsx:109`, `NotificationBell.tsx:179`, `ITHilfeImageUpload.tsx:132`, `BulkTable.tsx:225/238`, `InventoryProductsTable.tsx:199-239`. Enforce at the `button.tsx` primitive.
- **A11y MED** — `BulkDetailPanel.tsx:85-115` is a slide-over without `role="dialog"`/`aria-modal`/`useFocusTrap`/Esc (every other drawer has them).
- **Responsive — no findings**; 0 desktop-first anti-patterns; `min-w-0` applied where needed; wide tables wrapped in `overflow-x-auto`.
- Note: `claude-in-chrome` can't reflow below the desktop window min-width, so full mobile visual sweep is code-level + Playwright-verified marketplace only.

## Phase 7 — Performance

- **HIGH (single highest-leverage fix)** — `next.config.js:16-25` whitelists only `*.amazonaws.com`, but content images are on Cloudflare R2 → `unoptimized` is sprinkled across the app (esp. `ListingImage.tsx:43`, the storefront's core image). Add the R2 host to `remotePatterns`, then strip `unoptimized`. Convert `Avatar.tsx:62` (plain `<img>`) to `next/image`.
- **HIGH** — `api/tasks/route.ts:95` staff task board has **no LIMIT** (returns all tasks). Paginate. Same for `admin/membership/members`, `user/donations`, `admin/blog`, `admin/hr/applications`.
- **MED** — eager heavy libs: recharts (`analyse/charts`), framer-motion (`ai-camera`), react-markdown (`CareerDetailClient` — a public page). Use `next/dynamic` / render markdown server-side.
- **MED** — `close-decisions` cron is 2×N queries; batch by scope.
- Positives: `stats/impact`, `stats/community`, `public/financials` are cached with `revalidate`.

## Phase 8 — i18n

- **HIGH (public)** — `src/app/[locale]/invite/page.tsx` renders literal German (`:83,85,94,102,105,113`) instead of `useTranslations` → non-DE users see raw German. Extract to `messages/*` under an `invite` namespace.
- **LOW** — hardcoded German `title=` in `InventoryProductsTable.tsx:202/219/228/237` (admin, DE-fallback tolerated; fixing as `aria-label={t()}` also closes the a11y finding).
- Positives: umlaut/ß discipline clean; structure-in-config respected; DE canonical + deep-merge.

---

## Improvement Roadmap (gap to perfection)

### HIGH — correctness / security / trust (do first)
1. Collapse `is_revampit` to the stored column in 3 files (SSOT bug miscounting sales).
2. `import-csv` → `withAdmin('products')` (privilege boundary).
3. Move voting UI to `src/components/decisions/voting/` (layering across trust boundaries).
4. Extract `invite/page.tsx` strings to messages (public i18n leak).

### MEDIUM — high-leverage polish
5. Add R2 host to `remotePatterns`; strip `unoptimized` from `ListingImage` + blog images; `Avatar` → `next/image`.
6. Paginate `tasks` (HIGH-traffic) + membership/donations/blog/hr-applications lists.
7. `aria-label` on all `size="icon"` buttons (enforce in `button.tsx`); make `BulkDetailPanel` a real dialog.
8. Swap 4 raw-palette classes for `error-*`/`action` tokens.
9. `next/dynamic` recharts + framer-motion; `CareerDetailClient` markdown server-side.
10. Split the 3 god files (GuideBody, payment-webhook, useTimecardDraft).
11. Delete the 10 dead modules/aliases.
12. Clear the 50 lint warnings (`set-state-in-effect`, exhaustive-deps).
13. Add rate limiters to `report` + `workshops/register`; add Zod to the manual-check admin routes.
14. Align IT-Hilfe technician filter to the marketplace pattern; recolor the orange quick-create pill.

### STRATEGIC — mission
15. Public financial disclosure on `/transparenz` (Jahresrechnung / budget) — the one real mission gap for a transparency-focused non-profit.
16. Consider a distributed rate-limit store if the app is ever horizontally scaled.

---

## Action Items (prioritized, specific)

1. `checkout-listing.ts:13`, `admin/marketplace/stats/route.ts:14`, `admin/marketplace/route.ts:23` — drop `OR email LIKE`, use `listings.isRevampit`.
2. `api/inventory/import-csv/route.ts:33` — `withAuth` → `withAdmin('products')`.
3. `next.config.js` — add R2 `remotePatterns`; remove `unoptimized` in `ListingImage.tsx:43` + blog image components; `Avatar.tsx:62` → `next/image`.
4. `api/tasks/route.ts:95` — add `parsePagination` + LIMIT/OFFSET + total.
5. Move `app/admin/decisions/[id]/voting/*` + `VotingPanel` → `src/components/decisions/voting/`; repoint `PublicVoteClient`, `DashboardVotingClient`, admin.
6. `invite/page.tsx` — extract 6 strings to `messages/*.invite`.
7. `button.tsx` — require `aria-label` for `size="icon"`; fix `BulkDetailPanel`, `NotificationBell:179`, `ITHilfeImageUpload:132`, `BulkTable:225/238`.
8. `BulkDetailPanel.tsx:85` — add `role="dialog"`/`aria-modal`/`useFocusTrap`/Esc.
9. `invite:150`, `ListingFormFields:128`, `VotingBanner:98/105` — semantic tokens.
10. Delete: `useSellerDashboard`, `ui/alert`, `DashboardCard`, `CommunityStats`, `hr-retention` + 5 deprecated aliases.
