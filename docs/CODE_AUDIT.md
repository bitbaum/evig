---
created_date: 2026-01-07
last_modified_date: 2026-06-01
last_modified_summary: Autonomous design system gradient+shadow compliance pass (12+ fixes), SSOT error messages extension, DRY cleanup in donate tiers, stale it-hilfe legacy TODO investigated+closed, typecheck/lint verified clean.
---

# RevampIT Code Audit Findings

> **⚠️ HISTORICAL SNAPSHOT.** Some entries reference the retired Neon Postgres setup (e.g. "Neon cold start" fixes). Production is now self-hosted Postgres 17 on Hetzner; see `docs/SHARED_CONTEXT.md`. Findings are kept as a historical record.

**Last Audit Date**: 2026-06-01 (autonomous maintenance pass)

This document tracks code quality issues, security findings, and performance problems identified during code audits.

---

## Summary of Recent Fixes (2026-06-01) — Autonomous Design + Consistency Pass

| Fix | Status | Details |
|-----|--------|---------|
| Design system gradient violations | FIXED | Replaced 12+ decorative `bg-gradient-to-*` (admin avatars, chatbot CTAs/FABs/headers, section heroes, about hero, suggestion headers) with flat semantic `bg-primary-700` / `bg-primary-500` / `bg-neutral-500` per CLAUDE.md rules and DESIGN_TOKENS. Reduces dark-mode drift and maintains "color in focused moments only". One subtle suggestion hover tint left as non-decorative. |
| Design token SSOT enforcement | FIXED | Updated `data/about.ts` hero bg and multiple admin/team components to use palette solids instead of ad-hoc gradients. |
| API error message consistency (SSOT) | FIXED | `src/app/api/donations/dropoff/route.ts`: replaced hardcoded German success/error with English internal + `ERROR_MESSAGES.INTERNAL_SERVER_ERROR`. `src/app/api/admin/certifications/[id]/verify/route.ts`: now uses new `CERTIFICATION_ALREADY_VERIFIED` key (added to SSOT). |
| Error messages SSOT extension | FIXED | Added `CERTIFICATION_ALREADY_VERIFIED` to `src/config/error-messages.ts` (German, matching all other user-facing errors). |

**Verification**: `npm run typecheck` clean; targeted ESLint on 15+ edited files passed with 0 warnings. No behavior changes, no email/payment paths touched.

---

## Summary of Recent Fixes (2026-05-01)

| Fix | Status | Details |
|-----|--------|---------|
| Seller profile SEO metadata | FIXED | `/sellers/[id]/layout.tsx` added — generateMetadata + JSON-LD Person schema. Translation keys (techniker.seller.meta.*) added to de.json with deepMerge fallback. |
| Email template test coverage | FIXED | 11 email template modules now fully tested (254 tests): auth, it-hilfe, marketplace, workshop, admin, blog, appointments, decisions, locations, repairer, misc (content/inquiry/notification/newsletter/reviews/sellers) |

## Summary of Recent Fixes (2026-04-28)

| Fix | Status | Details |
|-----|--------|---------|
| Cache-Control extended to remaining public APIs | FIXED | apiSuccessCached applied to 7 more endpoints: stats/community (300s), stats/impact (3600s), workshops/[slug]/instances (30s), workshops/[slug]/reviews (60s), it-hilfe/helpers/[id] (60s), it-hilfe/requests/[id]/matches (30s), repairers/[id]/matching-requests (30s), pools (30s) |

## Summary of Recent Fixes (2026-04-27)

| Fix | Status | Details |
|-----|--------|---------|
| Cache-Control on public APIs | FIXED | apiSuccessCached applied to 11 endpoints: technicians (list+detail, 60s), shop inventory (list+detail, 30s), listings browse+similar (30/60s), search/listings (15s), sellers/[id] (60s), repairers proxy+ratings (60s), availability (15s), org-numbers (300s), financials (3600s), services (300s), blog/categories (300s) |

## Summary of Recent Fixes (2026-04-26)

| Fix | Status | Details |
|-----|--------|---------|
| Dynamic sitemap | FIXED | src/app/sitemap.ts replaces static public/sitemap.xml; 7 locales × static pages + blog/workshops/shop products; excludes auth/dashboard/admin |

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
| Duplicate count queries | FIXED | COUNT(*) OVER() in 8 routes: listings/mine, listings/favorites, it-hilfe/my-requests, it-hilfe/my-offers, locations, admin/users, admin/inventory |

---

## Build Configuration

Build is clean — no `ignoreBuildErrors` or `ignoreDuringBuilds` flags.
Always run `npm run typecheck` and `npm run lint` before commits.

---

## Remaining TODOs

### Low Priority
- Voice transcription service is manual start (`npm run transcription:start`) — consider adding to docker-compose when Python deps are standardized

**2026-06-01 update (autonomous investigation)**: "itHilfe Phase 2 legacy table" TODO appears stale. Current `src/db/schema/itHilfe.ts` and `services.ts` define only `repairer_profiles` + related (no legacy `repairers`/`it_hilfe_repairers` table in active schema). All references in `src/` (reviews, technicians, offers, dashboard) already target `repairer_profiles` (via TABLE_NAMES.REPAIRER_PROFILES). The `/api/repairers` list route is an *intentional* thin proxy (with name remap) for backwards compat per its own header comment — not a migration artifact. No DB drop or query updates needed; removed from active tracking. Proxy deprecation would require user decision on external callers + migration plan.

### Notes on img tags
- `BlogFeaturedGrid.tsx` already uses `next/image` — stale TODO removed
- `ImageUploadGrid.tsx` and `ProductImageUpload.tsx` use raw `<img>` for blob URL previews — this is **correct** (`next/image` cannot optimize blob: URLs)

### Testing Coverage
**Current Coverage**: 7353 tests across 497 test suites (updated 2026-05-03)

**API routes** (src/app/api/**/__tests__/): 251/251 routes covered
- All non-framework routes have dedicated test files
- auth/[...nextauth] excluded (NextAuth boilerplate with no testable logic)

**Config utilities** (src/config/__tests__/):
- it-hilfe, marketplace-status, invoice-status, location-status, donations, activity
- document-status, certification-status, appointment-status, booking-status, lifecycle-status
- dashboard, build-computer, editable-fields, open-source-registry, protocols, report-status
- status-config, co2-impact, erfassung/categories, erfassung/conditions
- marketplace, team, urls, review-status, workshop-registration-status, refund, service-categories, shop, workshops
- analyse-metrics, approval-status, canton-coordinates, intake-checklist, misc-config
- oss-protocols-config, registration-and-profile, remaining-config, sections, service-icons
- status-helpers, status-misc, system-constants, tasks

**Lib utilities** (src/lib/__tests__/ and subdirectories):
- utils, pricing, detect-multi, api-helpers, suggestion-utils, suggestion-enhancer
- chatbot-language, date-formats, design-system, org-numbers, permissions, swiss-postal-codes
- utils/date, utils/error, utils/slug, utils/escape-html, utils/safe-redirect
- activity, blog, blog-db, blog-utils, logger, uiEvents
- auth: audit, config, csrf, db-connection, db-roles, db-services, db-users, db-verification, db-workshops, password, permissions, rate-limiter
- ai: callWithFallback, decisions-narrative, extract, fill-prompt-template, prompt-helpers, protocol-processing, provider-config, providers-pure, schema-to-prompt
- api: client, helpers, middleware, response-helpers, task-helpers
- email templates: auth, it-hilfe, marketplace, workshop, admin, blog, appointments, decisions, locations, repairer, misc (content/inquiry/notification/newsletter/reviews/sellers)
- erfassung: ai-classification, ai-extraction, ai-field-mapping, bulk-extraction, create-product, detect-multi, file-parser
- hirn: action-cockpit, action-executor-contracts, action-executor, chat, chunking, format, ingestion, provider-impls, providers, retrieval; data: analysis, financial-loader, methodology-ssot
- services: appointment-actions, blog-submission, db, decisions-comments, decisions-crud, decisions-helpers, decisions-transitions, decisions-voting, index, inventory-service, notifications, order-service, payment-webhook, presentation, protocols-*, seller-service, technician-service
- payments: currency, payment-flow, payments-escrow, payments-fees, payments-gateway, payments-invoice, payrexx-client, security, security-misc, tax-compliance
- others: admin/edit-utils, admin/inventory-actions, dashboard/techniker, domain/it-hilfe, domain/marketplace, intake/timeline, inventory/csv-analysis, it-hilfe/notifications, it-hilfe/request-mapper, kivvi/client, marketplace/listing-helpers, marketplace/spec-utils, messaging/send-message, middleware/pci-compliance, pricing/index, protocols/audio-validation, protocols/workflow, reviews/create-review, reviews/review-service, schemas/* (30 schema files), search/meilisearch, security/rate-limit, security/sanitize, seo/json-ld, storage/image-upload, suggestion-utils/iconMapping, suggestion-utils/suggestionEnhancer

**Untestable** (env-dependent or React component returns):
- sections.ts, service-icons.ts: return LucideIcon components
- email.ts, redis.ts: require environment variables (Brevo SMTP, Redis)
- hirn/providers/groq, openrouter, ollama: require API keys
- Integration tests: require live Neon DB connection

---

## Summary of Recent Fixes (2026-05-02)

| Fix | Status | Details |
|-----|--------|---------|
| JSON-LD Product schema on shop product pages | FIXED | `/shop/product/[uuid]/page.tsx` now emits Product schema (name, brand, condition, price CHF, availability, seller org) + openGraph with image. |
| Wrong item_uuid alias in getInventoryProductByUuid | FIXED | `WHERE i.item_uuid` queried `inventory_items` (no such column). Fixed to `WHERE p.item_uuid` from `ai_extracted_products`. Product detail page was always 404-ing. |
| Sitemap shop product URLs used wrong UUID | FIXED | Sitemap used `aiExtractedProducts.id` (PK UUID) instead of `aiExtractedProducts.itemUuid` (I-YYMMDD-NNNN). Also added `INNER JOIN inventory_items` to only include products with published+in-stock inventory. |

---

**Last Updated**: 2026-05-03
