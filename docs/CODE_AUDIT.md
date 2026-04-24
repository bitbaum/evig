---
created_date: 2026-01-07
last_modified_date: 2026-04-25
last_modified_summary: Full i18n gap closure (workshops.materials/registration/reviews, blog/contact/itHelp/services/workshops for es/it/ja/ko, getInvolved.kontakt.form + itHelp.review for fr); POOL_STATUS + POOL_MEMBERSHIP_STATUS SSOT constants added; DECISION_STATUS.CLOSED and REQUEST_STATUSES.PENDING used consistently.
---

# RevampIT Code Audit Findings

**Last Audit Date**: 2026-04-25

This document tracks code quality issues, security findings, and performance problems identified during code audits.

---

## Summary of Recent Fixes (2026-04-25)

| Fix | Status | Details |
|-----|--------|---------|
| workshops.materials/registration/reviews translations | FIXED | 3 namespaces × 5 locales (fr/es/it/ja/ko) — 215 additions |
| blog/contact/itHelp/services/workshops translations (es/it/ja/ko) | FIXED | 72 keys × 4 locales; fr got 35 (getInvolved.kontakt.form + itHelp.review) |
| POOL_STATUS + POOL_MEMBERSHIP_STATUS SSOT | FIXED | Added to src/config/database.ts; all pool routes (5 files) updated |
| DECISION_STATUS.CLOSED usage | FIXED | close-decisions cron was using hardcoded 'closed' despite importing DECISION_STATUS |
| REQUEST_STATUSES.PENDING usage | FIXED | task-requests route used hardcoded 'pending' default |
| Translation coverage | FIXED | All 6 locales now have 0 missing real keys vs de.json (dead keys excluded) |

## Summary of Recent Fixes (2026-04-24)

| Fix | Status | Details |
|-----|--------|---------|
| sql.raw() for TABLE_NAMES in Drizzle sql templates | FIXED | Plain string interpolation in sql`` parameterizes values; fixed pools (3), appointments, close-decisions, create-review (7 tables), listing routes (3) |
| Hardcoded table names in API routes | FIXED | appointments/route.ts, cron/close-decisions, lib/reviews/create-review.ts |
| Full i18n pass (all public pages) | FIXED | All hardcoded German strings wired to next-intl across 7 locales |
| Hardcoded German loading text (24 files) | FIXED | Removed text prop from LoadingSpinner — icon is universal |
| Layout metadata (8 layouts) | FIXED | Converted static German metadata to async generateMetadata with getTranslations |
| Dashboard/auth metadata (12 pages) | FIXED | All use getLocale() pattern for non-locale routes |
| IT-Hilfe card/offer actions | FIXED | useTranslations wired in RequestCard, OffersList, MarkCompletedCard |
| Involvement layout CTA | FIXED | 4 hardcoded German strings → getInvolved.cta namespace |
| AISearchModal German strings | FIXED | searchPlaceholder + articleNumberExample keys added |
| Blog admin submissions page | FIXED | All 17 keys wired including t.rich() for tip text |

## Summary of Recent Fixes (2026-02-17)

| Fix | Status | Details |
|-----|--------|---------|
| Build broken (client/server boundary) | FIXED | Extracted `detect-multi.ts` to break pg import chain |
| IT-Hilfe 404s | FIXED | Config routes corrected (`/it-hilfe/my`, `/it-hilfe/my/offers`) |
| Email fallback missing | FIXED | Listmonk → Brevo SMTP fallback chain in `sendEmail`/`sendCustomEmail` |
| Middleware drops query params | FIXED | `callbackUrl` now includes `request.nextUrl.search` |
| Neon cold start timeouts | FIXED | Connection timeout 5s→10s, retry delays [100,300]→[500,1500] |
| AI provider config DB spam | FIXED | 60s TTL cache on `loadProviderRuntimeConfig()` |
| User columns cache never expires | FIXED | 5-minute TTL on `getUserColumns()` cache |
| Pagination lint (nested components) | FIXED | `PageItem`/`NavButton` extracted to module scope |
| `ignoreBuildErrors` in next.config.js | FIXED | Already removed |

### Previous Fixes (2026-01-14)

| Fix | Status | Commit |
|-----|--------|--------|
| Security auth/rate limiting | FIXED | Previously completed |
| N+1 query in reviews | FIXED | `33dff13` - Used json_agg |
| Swiss German compliance (ss not ß) | FIXED | `ddcd6ac` - 16 files |
| Cache headers for public APIs | FIXED | `66e70cc` - repairers endpoints |
| React.memo optimizations | FIXED | FilterBar + ComparisonCard |
| Hardcoded table names | FIXED | `2af0448` - Using TABLE_NAMES |
| Unused imports | FIXED | `b59b3c1` - Cleaned up |

---

## Critical Issues to Fix

| Category | Count | Priority | Status |
|----------|-------|----------|--------|
| console.log statements | ~5 | LOW | Only in logger.ts (correct) |
| `any` type usage | 1 | LOW | Only `window.next` check (acceptable) |
| Hardcoded role strings | 0 | FIXED | Using constants |
| Missing TABLE_NAMES | 0 | FIXED | All table refs use TABLE_NAMES + sql.raw() in Drizzle sql templates |
| Missing auth checks | 0 | FIXED | Auth added to endpoints |
| Missing rate limiting | 0 | FIXED | Rate limiting in place |

---

## Security Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Missing auth on GET /blog/submit | CRITICAL | FIXED |
| No rate limiting on registration | HIGH | FIXED |
| Missing return in webhook handler | HIGH | FIXED |
| XSS risk (dangerouslySetInnerHTML) | MEDIUM | SAFE - Only JSON-LD patterns |

---

## Performance Issues

| Issue | Status | Fix Applied |
|-------|--------|-------------|
| N+1 query (reviews + attachments) | FIXED | json_agg subquery |
| Missing cache headers | FIXED | apiSuccessCached helper added |
| No React.memo | FIXED | FilterBar, ComparisonCard wrapped |
| AI provider config queried every call | FIXED | 60s TTL cache |
| User columns cache never invalidates | FIXED | 5-minute TTL |
| Neon cold start connection failures | FIXED | 10s timeout, longer retry delays |
| Duplicate count queries | LOW TODO | Use COUNT(*) OVER() for pagination |

---

## Build Configuration

Build is clean — no `ignoreBuildErrors` or `ignoreDuringBuilds` flags.
Always run `npm run typecheck` and `npm run lint` before commits.

---

## Remaining TODOs

### Low Priority
- Consider COUNT(*) OVER() for pagination queries (avoids separate count query)
- Voice transcription service is manual start (`npm run transcription:start`) — consider adding to docker-compose when Python deps are standardized
- itHilfe Phase 2: update all queries to use `repairer_profiles`, then drop legacy table (see `src/db/schema/itHilfe.ts:146`)

### Notes on img tags
- `BlogFeaturedGrid.tsx` already uses `next/image` — stale TODO removed
- `ImageUploadGrid.tsx` and `ProductImageUpload.tsx` use raw `<img>` for blob URL previews — this is **correct** (`next/image` cannot optimize blob: URLs)

### Testing Coverage
**Current Coverage**: 354 tests across 27 test suites (updated 2026-04-25)
- API route tests (notifications, admin endpoints)
- Business logic tests (protocols, payments, services, hirn)
- UI tests (marketplace, auth, middleware)
- Utility tests (erfassung, currency, tax compliance)

---

**Last Updated**: 2026-04-25
