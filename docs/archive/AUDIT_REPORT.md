# Codebase Audit Report

**Date**: 2026-05-11  
**Auditor**: Claude Code (4× parallel agents)  
**Branch**: main  
**Commit**: 6195f62e  
**Scope**: SSOT · DRY · SoC · God-file violations — full `src/` sweep  

---

## Executive Summary

190 K lines across 1 422 source files. The codebase has strong fundamentals: zero `any` types, universal admin route protection, standard API response shapes, correct TABLE_NAMES usage, and logger discipline. Recent SSOT work has centralised colours and button variants. However, **146 files exceed 300 lines**, several contain genuinely mixed concerns, and a recurring anti-pattern of rebuilding config objects inside page files means the same data is defined twice. The highest-leverage work is (a) extracting a handful of repeated feature-level duplicates and (b) pushing status-badge config fully to the config layer so page files stop reassembling it.

---

## Health Score

| Area | Score | Notes |
|------|-------|-------|
| SSOT compliance | 6/10 | Colours centralised; status configs still rebuilt in pages |
| DRY | 6/10 | Two full feature duplicates; pagination + hook patterns repeated |
| SoC | 6/10 | Many page files mix fetch + render; validation util leaks HTTP |
| God files | 5/10 | 14 files >400 lines mixing real concerns |
| Best practices | 9/10 | Zero `any`, zero console.log, full auth coverage |
| **Overall** | **6.4/10** | Good bones; significant structural debt |

---

## Part 1 — SSOT Violations

Issues are ordered high → low severity within each section.

### S-1 · `HELP_REQUEST_STATUS` defined twice with diverging schemas — **HIGH**

| File | Lines | Problem |
|------|-------|---------|
| `src/config/help-request-status.ts:6–13` | 14 | Defines 4-value enum + `HelpRequestStatus` type |
| `src/config/activity.ts:75–140` | 66 | Re-defines same enum as `HELP_REQUEST_STATUSES` **plus** labels, colours, type `HelpRequestStatus` |

The type is exported from two files under different names. Consumers import either; they will diverge on the next edit to one.

**Fix**: Delete `help-request-status.ts`. Move its re-exported type to `activity.ts` and update imports.

---

### S-2 · Status config rebuilt via `Object.fromEntries` in page files — **HIGH**

| Page file | Line | What it rebuilds |
|-----------|------|-----------------|
| `src/app/admin/locations/page.tsx:45–50` | 50 | Zips `LOCATION_STATUS` + `LOCATION_STATUS_COLORS` |
| `src/app/admin/reviews/page.tsx:62–67` | 67 | Zips `REVIEW_STATUS` + `REVIEW_STATUS_LABELS` + `REVIEW_STATUS_BADGES` |
| `src/app/dashboard/reviews/page.tsx:21–27` | 27 | Duplicates `REVIEW_STATUS_BADGES` values inline |

The config files already export the raw parts — the combined `{ label, color }` map should be exported directly from those files.

**Fix**:
```ts
// src/config/review-status.ts — add:
export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string }> =
  Object.fromEntries(
    Object.values(REVIEW_STATUS).map(s => [s, { label: REVIEW_STATUS_LABELS[s], color: REVIEW_STATUS_BADGES[s] }])
  ) as Record<ReviewStatus, { label: string; color: string }>

// src/config/location-status.ts — same pattern with LOCATION_STATUS_COLORS

// In each page: remove local Object.fromEntries block, import from config
```

---

### S-3 · `MEMBER_TYPE_LABELS` defined inline in admin membership page — **MEDIUM**

`src/app/admin/membership/page.tsx:59–64` defines a local `MEMBER_TYPE_LABELS` object. Business data in a page file.

**Fix**: Create `src/config/membership.ts` with `MEMBER_TYPE_LABELS`; import in the page.

---

### S-4 · `global-error.tsx` uses 7 inline hex values — **MEDIUM**

`src/app/global-error.tsx:15,19,22,28,35` — all inline `style={{ color: '#111827' }}` etc.  
`GLOBAL_ERROR_COLORS` already exists in `src/config/ui-colors.ts` — it just hasn't been wired.

**Fix**: Import and use the existing constant (5-minute fix).

---

### S-5 · Workshop participant-count options hardcoded in component — **MEDIUM**

`src/app/[locale]/workshops/propose/components/PracticalDetailsSection.tsx:28`:
```ts
const maxParticipantsOptions = [5, 8, 10, 12, 15, 20, 25, 30]
```
Business rule embedded in UI.

**Fix**: Add `WORKSHOP_MAX_PARTICIPANTS_OPTIONS` to `src/config/workshops.ts`.

---

### S-6 · `CATEGORY_LABELS` name collision across three config files — **MEDIUM**

| File | Export name | Meaning |
|------|------------|---------|
| `src/config/service-categories.ts:138` | `CATEGORY_LABELS` | Service categories |
| `src/config/marketplace.ts:32` | `CATEGORY_LABELS` | Marketplace categories |
| `src/config/analyse/metrics.ts:299` | `CATEGORY_LABELS` | Metric categories |

**Fix**: Rename to `SERVICE_CATEGORY_LABELS`, `MARKETPLACE_CATEGORY_LABELS`, `METRIC_CATEGORY_LABELS`.

---

### S-7 · Auth error codes in a switch — **LOW**

`src/components/auth/LoginForm.tsx:60–74`: 7-case switch mapping NextAuth error codes to German strings.

**Fix**: Add `AUTH_ERROR_MESSAGES: Record<string, string>` to `src/lib/error-messages.ts`. Replace switch with lookup.

---

### S-8 · `ShareButtons.tsx` — 6 third-party brand hex values — **LOW** (known)

`src/components/blog/ShareButtons.tsx:31,59,73`. Documented in CLAUDE.md.

**Fix**: Add `SOCIAL_BRAND_COLORS` to `ui-colors.ts` or a `brand.*` key in `tailwind.config.ts`.

---

## Part 2 — DRY Violations

### D-1 · `useSuggestionForm` exists in two separate feature trees — **HIGH**

| File | |
|------|-|
| `src/features/feedback/hooks/useSuggestionForm.ts` | full hook |
| `src/features/floating-ui/hooks/useSuggestionForm.ts` | full hook, ~80% identical |

Both call `/api/suggestions`, manage the same state shape, share validation messages (with slight wording drift already), identical `handleSubmit` structure.

**Fix**: Consolidate to `src/hooks/useSuggestionForm.ts`. Both feature files can re-export.

---

### D-2 · `generateSelector` DOM utility duplicated verbatim — **HIGH**

| File |
|------|
| `src/features/feedback/hooks/useElementSelection.ts` (private function) |
| `src/features/floating-ui/hooks/useElementSelection.ts:14–23` (private function) |

10-line function, character-for-character identical.

**Fix**: Extract to `src/lib/utils/element-selector.ts`, import in both hooks.

---

### D-3 · `useAIProductAnalysis` and `useProductAnalysis` — 70 % overlap — **HIGH**

| File | Lines |
|------|-------|
| `src/hooks/useAIProductAnalysis.ts` | 202 |
| `src/hooks/useProductAnalysis.ts` | ~70 |

Both wrap `/api/ai/analyze-product`, identical state management, identical error logging pattern.

**Fix**: `useProductAnalysis` wraps `useAIProductAnalysis` with a `transformResponse` option. Delete the duplicate state/fetch logic.

---

### D-4 · Pagination logic duplicated in two listing hooks — **MEDIUM**

| File | Pattern |
|------|---------|
| `src/hooks/useMarketplaceListings.ts:167–237` | offset/limit/currentPage/resetOffset |
| `src/hooks/useShopProducts.ts:35–79` | identical |

**Fix**: `src/hooks/usePagination.ts` — returns `{ pagination, setPagination, resetOffset, currentPage }`. Both hooks compose it.

---

### D-5 · Admin stat-fetching functions inlined in two Server Component pages — **MEDIUM**

`src/app/admin/users/page.tsx` and `src/app/admin/team/page.tsx` each define a local async `getUserStats()` / `getTeamStats()` with the same try/catch/query/parseInt pattern.

**Fix**: `src/lib/queries/admin-stats.ts` — export named query functions; pages import them.

---

### D-6 · Two `FeedbackScopeSelector` components with different data sources — **MEDIUM**

| File | Data |
|------|------|
| `src/features/feedback/components/FeedbackScopeSelector.tsx` | Hardcoded inline |
| `src/features/floating-ui/components/FeedbackScopeSelector.tsx` | `SCOPE_CONFIG` from feature config |

**Fix**: Single `src/config/feedback-scopes.ts` as SSOT. Both components import from it.

---

## Part 3 — Separation of Concerns Violations

### C-1 · `validateBody` in `lib/schemas/index.ts` returns `NextResponse` — **HIGH**

`src/lib/schemas/index.ts:61–86`: a schema validation utility that imports `apiBadRequest()` (HTTP layer) and returns it on failure. Pure validation must not know about HTTP frameworks.

**Fix**:
```ts
// lib/schemas/index.ts — returns ZodResult only
export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  return schema.safeParse(body)
}

// Route handlers call apiBadRequest themselves when !result.success
```

---

### C-2 · `'use client'` page files with inline `apiFetch` in `useEffect` — **HIGH**

These pages call `apiFetch` directly instead of delegating to a hook:

| File | Lines | Missing hook |
|------|-------|-------------|
| `src/app/admin/locations/page.tsx:95–102` | 423 | `useLocationsList()` |
| `src/app/admin/reviews/page.tsx:85` | 423 | `useReviewsList()` |
| `src/app/admin/locations/[id]/page.tsx:96–102` | 482 | `useLocationDetail()` |
| `src/app/admin/tasks/page.tsx` | 432 | `useTasksList()` |
| `src/app/dashboard/appointments/page.tsx` | 406 | `useAppointments()` |
| `src/app/profil/techniker/page.tsx:82–98` | 501 | `useTechnicianProfile()` |
| `src/app/[locale]/abos/CreatePoolModal.tsx:33` | — | `usePoolCreation()` |

**Fix pattern**: Extract fetch + state into `use*.ts`. Page reduces to: call hook → render.

---

### C-3 · `useITHilfeDetail` hook mixes three sub-domains — **MEDIUM**

`src/components/it-hilfe/detail/useITHilfeDetail.ts` (484 lines) manages detail fetching, offer status, messaging thread, and permission checks in one hook.

**Fix**: Split into `useITHilfeDetail`, `useITHilfeOffers`, `useITHilfeMessaging`.

---

### C-4 · `profil/techniker/page.tsx` mixes five concerns — **MEDIUM**

501 lines: profile fetch, skill toggle state, location selection, rate validation, form submission, and JSX render — all in a single file.

**Fix**: Extract to `useTechnicianProfile()` + `useTechnicianForm()` hooks; page renders.

---

## Part 4 — God Files

Files >400 lines with genuinely mixed concerns (pure data/config files noted separately).

### Tier 1 — Act Now (high churn, multiple concerns)

| File | Lines | Concerns |
|------|-------|----------|
| `app/profil/techniker/page.tsx` | 501 | fetch + form + skills + rates + render |
| `components/it-hilfe/detail/useITHilfeDetail.ts` | 484 | detail + offers + messaging + permissions |
| `app/admin/locations/[id]/page.tsx` | 482 | fetch + inline CRUD handlers + status logic |
| `app/admin/protocols/new/ProtocolFormClient.tsx` | 481 | form state + validation + API + render |
| `app/dashboard/orders/[id]/page.tsx` | 480 | order + refund + actions + timeline |
| `app/[locale]/about/impact/content.tsx` | 514 | inline UI components + state + metrics |
| `app/[locale]/marketplace/MarketplacePageClient.tsx` | 461 | fetch + filter + search + pagination + render |
| `app/[locale]/it-hilfe/ItHilfePageClient.tsx` | 440 | list + filters + search + map + form |
| `app/admin/tasks/page.tsx` | 432 | list + filter + status + sort + fetch |
| `app/admin/reviews/page.tsx` | 423 | list + filter + moderation + pagination |
| `app/admin/workshops/page.tsx` | 425 | proposals + filter + actions + sort |
| `app/[locale]/workshops/[slug]/page.tsx` | 454 | detail + registration + reviews + related |
| `components/erfassung/DataEntryTabs.tsx` | 417 | text + file upload + speech + camera + bulk |

**Refactor pattern** (same for all):
1. Extract fetch + state → `useXxx()` hook(s)
2. Domain logic → functions in `lib/`
3. Page file renders what the hook returns (target: ≤100 lines of JSX)

### Tier 2 — Plan for Next Sprint (single-concern but too large to navigate)

| File | Lines | Recommended split |
|------|-------|------------------|
| `config/sections.ts` | 1 100 | `sections/admin.ts`, `sections/dashboard.ts`, etc. |
| `config/open-source-registry.ts` | 1 029 | `config/oss/` subdirectory per category |
| `config/community.ts` | 658 | `community/testimonials.ts`, `community/stats.ts` |
| `config/it-hilfe.ts` | 635 | `it-hilfe/statuses.ts`, `skills.ts`, `urgency.ts` |
| `lib/auth/rate-limiter.ts` | 574 | `rate-limit-store.ts`, `rate-limit-checker.ts` |
| `lib/hirn/chunking.ts` | 564 | Split by chunking strategy |
| `lib/auth/db-users.ts` | 439 | `db-users-read.ts`, `db-users-write.ts` |

---

## Part 5 — Security / Reliability Gaps

### R-1 · Public browse endpoints without rate limiting — **HIGH**

| Route | Risk |
|-------|------|
| `src/app/api/repairers/route.ts` | Public person data scraping |
| `src/app/api/workshops/route.ts` | Schedule data scraping |
| `src/app/api/tasks/route.ts` | Community project enumeration |
| `src/app/api/decisions/route.ts` | Internal decision data |

`/api/listings/route.ts` already has `rateLimiters.listingBrowse(clientIp)` — follow that pattern.

**Fix** (same for all four):
```ts
const clientIp = getClientIdentifier(request)
if (!rateLimiters.publicBrowse(clientIp)) return apiRateLimited()
```

---

## Part 6 — What Is Already Good (Do Not Break)

| Area | Finding |
|------|---------|
| TypeScript discipline | Zero `any` types across 1 422 files |
| Logger discipline | Zero `console.log` in production code |
| Admin route protection | 100% of admin API routes behind `withAdmin()` |
| API response shape | `{ success, data?, error? }` enforced everywhere |
| SQL safety | TABLE_NAMES used throughout; zero raw string table names |
| Schema-derived types | Zod schemas in `lib/schemas/decisions.ts` correctly import enums from config and derive types — use this as the model |
| Suppressions | 16 total `@ts-ignore`/`@ts-expect-error`; all justified (next-intl limits, optional deps) |

---

## Prioritised Action List

### 🔴 This week (≤2h each, high impact)

1. **Wire `GLOBAL_ERROR_COLORS`** into `global-error.tsx` — 10 min
2. **Export `REVIEW_STATUS_CONFIG`** from `config/review-status.ts`; remove `Object.fromEntries` in `admin/reviews/page.tsx` and `dashboard/reviews/page.tsx` — 30 min
3. **Export `LOCATION_STATUS_CONFIG`** from `config/location-status.ts`; remove rebuild in `admin/locations/page.tsx` — 20 min
4. **Delete `config/help-request-status.ts`**; merge into `config/activity.ts` — 20 min
5. **Add rate limiting** to `/api/repairers`, `/api/workshops`, `/api/tasks`, `/api/decisions` — 45 min
6. **Extract `generateSelector`** to `src/lib/utils/element-selector.ts` — 10 min
7. **Merge `useSuggestionForm`** duplicates into `src/hooks/useSuggestionForm.ts` — 30 min

### 🟡 Next sprint (1–4h each)

8. **`MEMBER_TYPE_LABELS`** → `src/config/membership.ts` — 20 min
9. **Workshop participant options** → `src/config/workshops.ts` — 15 min
10. **Rename `CATEGORY_LABELS`** in 3 files to domain-specific names — 30 min
11. **`LoginForm` error switch** → `AUTH_ERROR_MESSAGES` map in `error-messages.ts` — 20 min
12. **Merge `useAIProductAnalysis` / `useProductAnalysis`** — 1h
13. **Create `usePagination`**; refactor marketplace + shop hooks — 1h
14. **Admin stat queries** → `src/lib/queries/admin-stats.ts` — 1h
15. **Unify `FeedbackScopeSelector`** via shared `SCOPE_CONFIG` — 45 min
16. **Decouple `validateBody`** from HTTP layer in `lib/schemas/index.ts` — 45 min

### 🟢 Architectural (plan first, 4h+ each)

17. **Extract hooks from Tier-1 god pages** — 1–2h per file, ~12h total
18. **Split `useITHilfeDetail`** into three focused hooks — 2h
19. **Split large config files** (`sections.ts`, `open-source-registry.ts`, `it-hilfe.ts`, `community.ts`) — 3h total
20. **Split `DataEntryTabs`** into per-tab components — 2h
21. **`ShareButtons` brand colours** → named tokens — 30 min

---

*Generated by 4-agent parallel audit sweep — 2026-05-11*
