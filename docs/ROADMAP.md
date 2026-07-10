# RevampIT Build Roadmap

Living queue of what we're building. Updated 2026-07-10. Keep in sync as items ship.

## ✅ Shipped (2026-07-10 session) — blog + site i18n

- **Blog overhaul**: sticky floating Table of Contents on long posts, an on-brand
  title image on every post, artifact-grade tables/code/callouts, and SEO
  (file posts in the sitemap, `/feed.xml` RSS, JSON-LD, hreflang, `noindex` on
  unlisted posts).
- **Site-wide i18n**: filled ~1,800 message keys that existed only in German
  (the cause of German leaking onto non-German pages), moved the `/about` history
  timeline out of `history.ts` into messages, and translated all 5 public posts
  into every locale. `/about` verified French, not German.
- **Mastodon runbook** published as an unlisted post + correctness fixes
  (`SKIP_POST_DEPLOYMENT_MIGRATIONS`, federation-backfill note).
- **Unlisted posts** are password-gated (`BLOG_UNLISTED_PASSWORD`, default `revamp`).
- **Blog comments** — any logged-in user can comment; author/staff delete (migration 119).
- **Admin manages every post** — git/file posts are now Edit (import to DB) /
  Delete (hide slug) from the admin UI, no git needed; posts carry a `visibility`
  column (migration 120).
- **`/support` deduped** into `/get-involved/donate`.
- **Verified (not a bug):** the "technician UI shown to a non-technician" report —
  the only `technician_profiles` row is the owner's own (active); `butaeff@gmail.com`
  has none, and every surface gates on an active profile. No change needed.

## ✅ Shipped — autonomous run (2026-07-09, part 2)
- **build-your-computer** fixed: broken option cards (Button base crushed stacked title+desc → overlap) → accessible OptionCard; dropped 11 fabricated "global inventory network / Europa" claims → honest local copy. Browser-verified.
- **Linux distro guide**: added a "Welche Distribution passt zu dir?" quick-chooser (need→Mint/Ubuntu/Fedora/Debian/MX, jumps to detail cards) on `/services/linux-open-source`. Browser-verified — looks great.
- **Marketplace OS picker**: computer/laptop listings (category 10/20) get a "Linux gratis vorinstalliert" distro picker + link to the chooser. (Fixed: category is a CODE not a label.)

## ✅ Shipped (2026-07-09 session)
- Timecard self-approval (super-admins) + submit/approve **emails** (submitter confirmation + sole-approver case)
- Verification gates admin, not login (frictionless signup; auto-sign-in)
- Dashboard redesign (lucide icons, monochrome x.ai discipline) + RSC-boundary outage fix
- IT-Hilfe: only technicians can offer + owner "raise compensation" no-offers nudge
- Technician registration dead-end fixed (auto-activate + `communityRoles` SSOT)
- E2E suite fixed → CI green
- Email audit + `docs/EMAILS.md` SSOT; wired shop-sale→seller bell + service-booking→customer
- **Promo/gift-code foundation** (migration 115, `revamp100`/`revamp100p`, tested engine) — Phase 1 Slice 1
- **Freigaben** `approval-sources.ts` SSOT + one count engine; killed the dead-`user_content_submissions` double-count; removed Techniker tab — Slice 1

## 🐛 Bugs to fix
- **Technician items shown to a non-technician** — `butaeff@gmail.com` (role=customer, NO `technician_profiles` row on prod) reportedly sees technician UI. Data is clean → a UI-gating bug: some nav/account-dropdown/dashboard surface shows technician links (Offene Anfragen / Meine Angebote) without checking for an active technician profile. Audit every place technician items appear and gate on `getActiveTechnicianProfileId` (the SSOT). NOT caused by the auto-activate change (that only touches existing profiles on save).

## 🆕 Newer asks
- **Marketplace OS selection** — for a laptop/computer listing, let the buyer choose which **Linux distro** to have pre-installed; if unsure, link to a **Linux-distro guide** (under Lernen/Guides). Build that guide if missing.
- **Linux distro guide (education)** — a beautiful, easy, progressive-disclosure guide (pictures/schemas/diagrams; source or AI-generate images) so people make an educated distro choice. Rethink Lernen/Guides navigation + content around it.
- **Profiles SSOT/debt** — are the 4-5 profile types (user/seller/technician/team) following SSOT/SoC/DRY, or spaghetti? (See debt notes.) Unify rating star (Lucide `Star` + one token); build the missing public buyer + team pages; skills taxonomy.

## 📋 Queue (priority order)

1. **Freigaben full unification** — ✅ **hub + count engine done.** The
   `/admin/approvals` hub reads ONE SSOT engine (`getApprovalCounts` over
   `APPROVAL_SOURCES`), routing each source to its `reviewHref` by `reviewMode`
   (inline / bulk / page). ✅ **Dashboard reconciled (edcebec6):** the second
   engine is gone — `getDashboardStats` no longer reads the dead
   `user_content_submissions` table for approvals; `buildActionItems` now derives
   every approval row from the same SSOT counts, gated per-source permission +
   `superAdminOnly`, so hub and dashboard can't drift. Removed the dead
   `ActionItemsSection`/`QuickActionsSection`/`buildFulfillActions` the
   UnifiedQueue had already replaced. **Optional polish left:** filter chips on
   the hub; richer per-type review surfaces (the routing is correct, the
   destination pages vary in polish).

2. **Zeiterfassung de-frankenstein** — audit done; design tokens were actually clean (frankenstein is in the LOGIC).
   - ✅ **Slice 1 (the real bug, shipped+tested):** "fill from plan" had TWO builders storing different category/description for the same intent (month=schedule category, per-day=hardcoded ADMIN) → **divergent payroll rows**. Unified via one canonical `buildScheduleEntryForDate`; test locks range-fill===single-day-fill. Extracted `weekdayIdFromDate`.
   - ✅ **Slice 2 (config SSOT, shipped):** `TIMECARD_DAY_GRID` (06–22/30min/break window) + `TIMECARD_MANUAL_DEFAULT` (09:00/17:00/60) moved out of HourRangePicker + the hook into `config/timecards.ts`.
   - **Remaining (careful, payroll-adjacent — do attended):** the 3 input modes (calendar / hour-grid / shift-clock) don't share a selection engine (month grid hand-rolls it; `useCellSelection` "SSOT" is ignored by it) or a persist path (`addShiftEntry` rebuilds its own PUT); the 858-line `useTimecardDraft` god-hook needs splitting; two Save/Submit clusters with duplicated disabled logic → derive `canSave`/`canSubmit` once. Lower-severity: day-grid re-quantizes non-30-min breaks (edge case; the `firstRun` guard means viewing doesn't corrupt, only editing a non-aligned break). **NOTE: the audit's "dead week code" is NOT dead** — `buildTimecardEntriesFromSchedule`/`startOfWeek`/`period_type='week'` are live server-side for historical week timecards; do not remove.

2b. **Geräte-Eingang / erfassung intake** — the AI-entry page. ✅ **Photo/vision fixed** (2026-07-09): analysis cascades Groq (Llama 4 Scout) → OpenRouter → Ollama (`callVisionWithFallback`). ✅ **erfassung voice + photo tabs wired + dead voice module purged (this run):** the "Sprache"/"Bild" tabs were "coming soon" stubs — now live. New focused `<VoiceEntry>` composes the SSOT hooks `useVoiceRecording` (record→blob, 23 tests) + `useVoiceProduct` (blob→product, tested) → posts to the existing `/api/admin/erfassung/voice`; "Bild" now renders the existing `ImageCapture`. Deleted the fully DEAD `src/components/voice/*` (776 lines, zero importers) and the redundant 3rd voice hook `useVoiceTranscription` (the "slimmer sibling" `useVoiceProduct` is canonical). Net −1052 lines. **Still to do:** the two entry *pages* (`/admin/intake` pipeline vs `/admin/erfassung` Schnellerfassung — god-components ~350-420 lines) still duplicate a form; intake still has its own inline MediaRecorder voice + parallel `/api/admin/intake/extract-{text,voice}` routes ≈ the erfassung ones → adopt `<VoiceEntry>`/`ImageCapture` in intake + collapse the dup routes into one `/api/ai/extract-product`. **Bulk/CSV:** `import-csv` (API-only, Kivitendo) + erfassung `bulk-upload` (UI, CSV/XLSX) coexist (SSOT smell → consolidate); Shopware = docs-only.

    ⚠️ **Pre-existing red test (NOT mine):** `src/app/api/admin/erfassung/__tests__/route.test.ts` — 2 success cases 500 because the Kivvi refactor (1d230a3d) added a post-transaction `db.update(inventoryItems)` for `kivvi_sync_status` that the test's `db` mock doesn't stub. Route is fine in prod; the mock is stale. Fix the mock (add chainable `db.update().set().where()`), don't touch the route.

2c. ✅ **DONE (2026-07-09) — Product storage-location picker on erfassung.** New `storage_locations` table (migration 117: kind + optional holder_user_id + seeded Hauptlager/Laden/Nebenlager) + `inventory_items.storage_location_id` FK (free-text `location` kept for compat). Config SSOT `src/config/erfassung/storage-locations.ts` (5 kinds + labels). API `/api/admin/storage-locations` GET+POST. Erfassung: `<StorageLocationSelect>` (fetch + Select + inline "＋ Standort" add) replaced the free-text field; wired through zod schemas → `formDataToPayload` → `create-product`. 342 erfassung/schema tests green. Built in an isolated worktree (a parallel session held the main tree). **Minor follow-up:** the inventory GET doesn't return `storage_location_id` yet → EDIT doesn't pre-select it (new erfassung works).

   ~~Design notes:~~ current `inventory_items.location` is FREE TEXT; the `locations` table is for PUBLIC venues — did NOT reuse it. Built a dedicated internal model:
   - Migration: `storage_locations` table (`id`, `name`, `kind`, `holder_user_id` uuid NULL → users, `is_active`, `created_by`, timestamps) + `inventory_items.storage_location_id` uuid NULL FK. Seed defaults (Hauptlager, Laden, Nebenlager). Keep the old free-text `location` column for backfill/compat (don't drop).
   - Config SSOT `src/config/erfassung/storage-locations.ts`: `STORAGE_LOCATION_KINDS` = main_storage · shop · secondary_storage · member_possession · other, with DE labels + icon. (member_possession rows carry a `holder_user_id`.)
   - API `/api/admin/storage-locations`: GET (list active) + POST (create, withAdmin('intake'|'products')).
   - Erfassung: replace the free-text location `<Input>` in `ProductDimensionFields.tsx` with a `<Select>` of active storage locations + an inline "＋ Standort hinzufügen" that POSTs and re-selects. Keep `box_id`. Write `storage_location_id` in `formDataToPayload` + `/api/admin/erfassung`.
   - ONE location per product (the ask is "choose among a list", not split-across-places). SSOT/SoC/DRY: config = kinds, table = instances, one API, one Select component.

2d. ✅ **DONE (2026-07-09) — build-your-computer honesty fix + category SSOT review.**
   - **Category SSOT review conclusion:** `KATEGORIEN` is well-structured for part-matching — main codes + component subcategories already exist (70→ 701 Grafikkarten, 702 RAM, 703 SSDs/HDDs, 704 CPUs, 705 Netzteile, 706 Mainboards). NO restructure needed. **The real blocker for a live part-matcher:** `listings.category` is a SINGLE code with NO subcategory column, so the granular component codes never reach the storefront. A real inventory build-matcher needs a `listings.subcategory` migration + backfill first — flagged as future work.
   - **build-your-computer fabricated-data fix (shipped):** the tool showed `getMockRecommendation`/`MOCK_INVENTORY` — invented CPUs/GPUs with fake prices, fake stock, and fake cross-EUROPE locations (Berlin/London/Amsterdam/Paris/Rom…) for a LOCAL Zürich non-profit. Removed entirely. Replaced with honest `getBuildRecommendation(useCase)` → component-TIER guidance (no fake products/prices/scores) + Step3 now links to the REAL `/marketplace` + a "Build anfragen" CTA + an honest sustainability line (no fabricated CO₂ numbers). 44 config/i18n tests green.
   - **Still future:** real inventory build-matcher (needs `listings.subcategory`); the page's visual redesign was already done earlier this session (option cards + honest copy).

3. **Role-aware onboarding (partial — shipped staff-aware checklist)** — ✅ staff (`@revamp-it.ch`) now get a DISTINCT onboarding checklist (verify email · set schedule→Zeiterfassung · complete team profile skills/goals), DB-derived from `team_profiles`, surfaced on `/admin` + `/dashboard`, self-hiding when done.
   - 🐛 **Onboarding "complete your profile" link is DOUBLE-broken (diagnosed 2026-07-09, NOT yet fixed — security-adjacent, do attended):** the checklist links to `/admin/team/${userId}/edit`, but (a) that page + the `PUT /api/admin/team/profiles/[id]` route are BOTH gated `requireSection('team')`/`withAdmin('team')`, which new staff usually lack → 403; AND (b) the route param is the **team_profile.id** (`WHERE tp.id=$1`), but the link passes the **user_id** (`team_profiles.id` is a separate `defaultRandom()` uuid, `≠ user_id`) → `notFound()` even if allowed.
   - ✅ **Good news (de-risks the fix):** the PUT route ALREADY gates sensitive fields (salary/AHV/`hr_notes`/canton) on `isSuperAdmin` (route.ts:158-164), so self-service can't escalate to compensation data.
   - **Ready-to-execute plan (own-only = zero id-based authz to get wrong):** add `GET`+`PUT /api/admin/team/profiles/me` using `withAuth` (any staff) that ONLY ever touches `WHERE user_id = session.user.id`; reuse the existing super-only sensitive-field guard; add page `/admin/team/me/edit` (`withAuth`, `includeSensitive=false` for non-super) that loads own profile by user_id + renders `TeamProfileForm`; make `useTeamProfileForm` target `/profiles/me` in self mode; repoint the onboarding `teamProfileHref` to `/admin/team/me/edit`. Test: non-team staff can edit own non-sensitive fields; CANNOT write salary even if injected; CANNOT reach another profile.
   - **Also still to do:** AI-assisted profile fill; skills/interests **taxonomy** (config SSOT) to power dev-paths + interest-based task assignment.

4. **Profiles overhaul (NEW)** — audit + improve all profile types (team/staff, technician, seller, customer/people/organization). Public profiles should rival/beat **Ricardo/Amazon** (trust signals, ratings, verified badges, listing galleries, member-since, response time, activity). Staff profiles rich enough for dev-paths + task matching (skills taxonomy, interests, seniority, schedule). *(Audit running.)*

5. **Promo Slice 2** — admin issuance UI (`/admin/promo-codes`) + checkout redemption across marketplace/workshop/appointment, incl. **100%-off → skip Payrexx gateway → mark paid** (no flow supports zero-total today).

6. **Gift cards Phase 2** — purchasable, depleting balance, **sold in the marketplace**, recipient delivery. On the same promo_codes rail.

7. **Reparaturbonus ZH** — research the Stadt Zürich repair-bonus program (+ George's `dev/reparaturbonus-zh` repo; city didn't select us but we're building it anyway) and integrate bonus redemption so customers can use it on our site.

8. ✅ **DONE (2026-07-09) — Removed orphaned pro-repairer application/certification flow.** Deleted 36 files (`/api/repairer/apply`, all `/admin/repairer-applications` + `/api/admin/documents` + `/api/admin/certifications` routes, the admin page, the 9-file review-UI dir, repairer email templates, dead `certification-status.ts` + `document-status.ts`). Surgically edited shared files: dropped the `repairerApplications` drizzle table + 5 `TABLE_NAMES` entries; removed the dashboard repairer count (`getDashboardStats`/`buildActionItems`/`types`/`InlineActionButton`), `approveRepairerApplicationAction`, the `repairer-applications` section + permission alias + breadcrumb, and repointed the IT-Hilfe empty-state CTAs to the technician directory. Migration 116 drops `technician_applications`. **KEEP flow untouched:** `repairer_profiles` (community tier), `getActiveTechnicianProfileId`, all `/api/it-hilfe/*` + `/it-hilfe/*`, `TechnicianProfileSchema`. Verified: 0 dangling refs, 0 tsc errors, 131 suites / 3082 tests green. (The 4 cert/doc tables the routes queried never had a migration — they never existed — so nothing to drop for those.)

9. **Email follow-ups** (in `docs/EMAILS.md`) — paid-workshop + paid-appointment webhook confirmations, marketplace double-emails (apply `skipEmail`), time-off requester ack, `task_assigned` SSOT drift.

10. **GNU Taler + other payment rails** — wire as far as possible NOW (adapter registry already exists) so they're ready the moment external deps (creds/backend/store) are provided. Don't wait on things needing the team.

11. **AI email assistant** — inbox copilot on the HIRN RAG assistant + IMAP (Thunderbird/shared inbox, credential via user, never plaintext to Claude) + Nextcloud Talk. Spec as its own initiative.

12. **Deliverability (ops, user's task)** — authenticate `revampit.ch` in Brevo (SPF/DKIM/DMARC) so external emails actually land. Until then, prefer in-app notifications.
