# Improvement Plan — toward "absolutely perfect"

**Date:** 2026-07-02 · **Base:** commit 7d1ce407 · **Inputs:** `docs/AUDIT_REPORT.md`
(2026-07-02 full audit) + deep admin-side audit + deep public/user-flows audit
(both 2026-07-02, multi-agent, every HIGH re-verified against source).

Personas served: anonymous visitor · buyer · P2P seller · IT-Hilfe requester ·
technician · workshop participant · donor · staff (Koordination/Leitung/Ehrenamt) ·
superadmin. Rule: everything shipped must WORK and be optimized for whoever uses it.

---

## Phase 1 — ✅ EXECUTED 2026-07-02 (all 35 items + user-requested Zeiterfassung/nav work)

Ordered by severity × diff-size. Every item verified against source before
inclusion, and every item below shipped in the 2026-07-02 batch. Additional
user-requested work in the same batch: **Zeiterfassung moved into the admin
area** (/admin/zeiterfassung, "Heute" group + admin mobile bottom nav slot 4,
`alwaysForStaff` permission class) and an **admin sidebar quick-filter** (type
to find any section across the 8 groups).

### 1A. Security / integrity (public + admin)
| # | Fix | Where |
|---|-----|-------|
| 1 | ~~`is_revampit` re-derived from email (mislabels staff private sales, skews stats)~~ ✅ done | checkout-listing.ts, admin/marketplace{,/stats} |
| 2 | ~~`import-csv` `withAuth`→`withAdmin('products')` (privilege boundary, POST+GET)~~ ✅ done | api/inventory/import-csv |
| 3 | Paid workshops registrable FREE — no price gate; earliest-instance pick, no future filter | api/workshops/register/route.ts:65-138 |
| 4 | IT-Hilfe rating hole — generic `POST /api/reviews` lets anyone review any completed request | api/reviews/route.ts:221-263 |
| 5 | Timecards exposed to non-staff — dashboard ignores `requiresStaff`; `/api/timecards` plain `withAuth` | sections.ts:1155, api/timecards |
| 6 | Admin page guards missing: membership + hr/* (`requireSection`) | admin/membership, admin/hr/* |
| 7 | Dashboard server actions check only `isStaff`, not section | lib/admin/actions.ts:16-22 |
| 8 | Timecard self-approval possible | lib/services/timecards.ts (reviewTimecard) |
| 9 | HIRN chat history not user-scoped (any session UUID readable/deletable) | api/admin/hirn/history, lib/hirn/chat.ts |
| 10 | `search-index` + `membership/members` + payroll read APIs lack section scoping | respective routes |
| 11 | Rate limiters on `listings/[id]/report` + `workshops/register` | respective routes |

### 1B. Broken features (shipped but never worked)
| # | Fix | Where |
|---|-----|-------|
| 12 | Payroll page fetch-loops forever (`bounds` new object each render) | PayrollClient.tsx:89 |
| 13 | ⌘K user search broken since migration 002 (`created_at` → `"createdAt"`) | api/admin/search-index:17 |
| 14 | Blog delete button has no onClick (API exists) | BlogListClient.tsx:166 |
| 15 | 5 bare `fetch()` calls bypass CSRF → mutations 403 in prod | NeedsPanel, ContributionsPanel, tasks/projects/new |
| 16 | Locations approve writes `approvalStatus`, readers filter `isApproved` → approval invisible | api/locations/[id]/approve:74 |
| 17 | "Um Hilfe bitten" dropdown always empty (field-name mismatch) | useTaskActions.ts:31 |
| 18 | `isMember` never populated → member votes never surface | admin/page.tsx:153 |
| 19 | Intake KPIs always 0 on first load (only paginate path sets counts) | useIntakePipeline.ts:37-88 |
| 20 | Marketplace verify doesn't refresh the visible list | VerifyActions.tsx:37,52 |
| 21 | All admin timestamps render UTC not Europe/Zurich (one-line SSOT fix) | lib/date-formats.ts:44 |
| 22 | Workshop participant counts include cancelled registrations | workshops/[slug]/data.ts:91 |
| 23 | Login errors collapse to "wrong credentials" (unverified-email users trapped) | src/auth.ts + LoginForm.tsx |
| 24 | IT-Hilfe cancel is silent (offers stay pending, helper never notified) | api/it-hilfe/requests/[id]:199-241 |
| 25 | Listing edit always sends `status: ACTIVE` → editing reserved/sold 403s | lib/domain/marketplace.ts:48 |

### 1C. Perf / a11y / design / hygiene
| # | Fix | Where |
|---|-----|-------|
| 26 | ~~R2 host in `remotePatterns`; strip `unoptimized` (9 files); Avatar→next/image~~ ✅ done | next.config.js, components |
| 27 | Paginate `api/tasks` (unbounded staff board) | api/tasks/route.ts:95 |
| 28 | `aria-label` on named icon-only buttons; BulkDetailPanel → real dialog (role/trap/Esc) | 5 components + BulkDetailPanel |
| 29 | Token slips: `text-teal-*` → `text-action` (ListingFormFields, VotingBanner) | 2 files |
| 30 | Delete dead code: 5 orphan modules + 5 deprecated aliases + BulkImportModal + legacy blog-admin dir | various |
| 31 | Dynamic `app/robots.ts` (robots.txt hardcodes wrong domain) | public/robots.txt |
| 32 | Lazy-load recharts (admin charts) + framer-motion (ai-camera) | ChartWrapper, ai-camera |
| 33 | Fix 2 literal `${…}` className strings (broken interpolation in DOM) | appointments/page.tsx:109, ActivityFeed.tsx:106 |

### 1D. Honest-UI minimum for never-worked features
| # | Fix | Where |
|---|-----|-------|
| 34 | Workshop create form is FAKE (setTimeout, no API) — implement POST or remove entry points | useWorkshopForm.ts:73 |
| 35 | Static-pages New/Edit call nonexistent API — implement CRUD or pull the UI | admin/content/pages |

---

## Phase 2 — NEXT (scoped project work, not this session)

1. **Silent-failure sweep** (~15 admin mutation sites): standardize `result.success ? … : toast.error(…)` on sonner; includes donations/intake/timecards/blog/erfassung + repairer-apps queue-blanking. (HIGH subset may land in Phase 1 if time allows.)
2. **Stranded payments**: pending-order retry links 404 (re-offer stored `payrexxGatewayId`), stale-RESERVED expiry cron, seller cancel button.
3. **P2P "mark as sold"**: owner ACTIVE→SOLD transition (no in-flight order) + button + `total_sold` bump — until Payrexx is live, no real sale can close honestly.
4. **Workshop lifecycle integrity**: notify registrants on instance cancel/reschedule; confirm+refund trail on registration cancel; unify `ATTENDED` vs `attended`; wire or delete caller-less reminder/feedback endpoints.
5. **Admin appointment lifecycle**: cancel/reschedule/re-assign + `preferred_date` column + filters.
6. **Products admin overhaul**: wire status/category filters (API supports) + pagination; bulk publish.
7. **Bulk operations in queues** (approvals, reviews, listings verify) + optional reason on review approve — copy the timecards select-all pattern.
8. **Chat → notification row** (bell never shows chats) + fix message email swallow.
9. **Dashboard shell i18n** (German-only in all 7 locales) + `hreflang` alternates + OnboardingChecklist/MobileNav strings.
10. **Pagination honesty batch**: donations (server-side stats), blog, reviews, appointments, instances, timecard queue, membership; delete duplicate users Pagination component.
11. **Persona toggle**: make modes actually curate content (or remove); derive default from team role; surface `?error=no_X_access`.
12. **Consolidation pass**: debounce in AdminFilterBar; migrate 6 hand-rolled modals to `ui/Modal`; adopt AdminListShell/EmptyState/AdminStatusBadge; ConfirmDialog on leave-period delete + payroll close.
13. **God-file splits**: GuideBody (828), payment-webhook (780), useTimecardDraft (750).
14. **Clear 50 lint warnings** (`set-state-in-effect`, exhaustive-deps — includes useTimecardDraft/PermissionRequestsManager from CI annotations).
15. **IT-Hilfe polish**: helper-email leak pre-acceptance; canton/radius matching for on-site; expiry-cron notifications; decline transactionality; dashboard requester card + techniker hub link.
16. **Zod on manual-check admin routes**; batch close-decisions cron; constant-time cron-secret compare.
17. **Task→project linkage UI** + project edit/complete/delete; rejected-approvals reopen tab + rejection reason field.
18. **Users table**: honor stored `is_super_admin`; replace `window.location.reload()` with state refresh.
19. **Donation dropoffs → DB rows** (currently email-only, invisible to admin module + donor history).
20. **Blog editor dirty-state guard + preview**; media library: hide dead chrome behind the "In Entwicklung" banner.

## Phase 3 — STRATEGIC
- Public financial disclosure on `/transparenz` (the one real mission gap).
- Payrexx go-live (config-only; checklist in docs/operations/PAYREXX_SETUP.md) — unlocks checkout, donations checkout, escrow.
- Distributed rate-limit store if ever horizontally scaled.
- Account deletion self-service; change-password UI (API exists, zero callers).

---

## Verification gate (every batch)
`npm run typecheck` + `npm run lint` + `npm test` + `npm run lint:umlauts` green;
deploy via push-to-main → GH Actions; verify key pages live on prod (public + admin).
