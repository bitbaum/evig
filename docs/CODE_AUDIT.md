---
created_date: 2026-01-07
last_modified_date: 2026-02-17
last_modified_summary: Updated audit after reliability hardening - build fix, DB timeouts, middleware fix, AI caching, email fallback, test coverage at 312 tests
---

# RevampIT Code Audit Findings

**Last Audit Date**: 2026-02-17

This document tracks code quality issues, security findings, and performance problems identified during code audits.

---

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
| Swiss German compliance (ss not ss) | FIXED | `ddcd6ac` - 16 files |
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
| Missing TABLE_NAMES | 0 | FIXED | All added to database.ts |
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
| Duplicate count queries | TODO | Use COUNT(*) OVER() |
| Raw `<img>` tags | TODO | Migrate to Next.js `<Image>` |

---

## Build Configuration

Build is clean — no `ignoreBuildErrors` or `ignoreDuringBuilds` flags.
Always run `npm run typecheck` and `npm run lint` before commits.

---

## Remaining TODOs

### Low Priority
- Migrate raw `<img>` tags to `next/image` in BlogFeaturedGrid.tsx
- Consider COUNT(*) OVER() for pagination queries
- Voice transcription service is manual start (`npm run transcription:start`) — consider adding to docker-compose when Python deps are standardized

### Testing Coverage
**Current Coverage**: 312 tests across 24 test suites
- API route tests (notifications, admin endpoints)
- Business logic tests (protocols, payments, services, hirn)
- UI tests (marketplace, auth, middleware)
- Utility tests (erfassung, currency, tax compliance)

---

**Last Updated**: 2026-02-17
