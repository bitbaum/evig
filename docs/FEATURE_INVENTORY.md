---
created_date: 2026-06-19
last_modified_date: 2026-07-05
last_modified_summary: IT-Hilfe magic-link claim E2E (#27)
---

# Feature Inventory (SSOT)

Living inventory of RevampIT product surfaces. Use this to track audit progress, broken links, and deployment status.

**Legend (Status column)**

| Symbol | Meaning |
|--------|---------|
| ✅ | Deployed and verified (or route exists + smoke-tested) |
| 🟡 | Partial, local-only, or not E2E-tested |
| ❌ | Broken / missing |
| ⬜ | Not audited |

**Architecture note (not a violation):** IT-Hilfe (`it_hilfe_requests`), Workshops (registrations), and Service appointments (`service_appointments`) are **separate domains**. The SSOT violation that was fixed: duplicate `/dashboard/appointments` vs `/dashboard/bookings` for the same `service_appointments` entity.

**Route SSOT:** `src/config/routes.ts` · Notification hrefs: `src/config/notifications.ts`

**Dual-persona E2E (how we verify):** Every navigable surface is smoke-tested from **both accounts**:

| Persona | Account | Checks |
|---------|---------|--------|
| **User** | `butaeff@gmail.com` (non-admin) | Dashboard, public pages, IT-Hilfe/marketplace/workshops — **must be blocked from `/admin/*`** |
| **Admin** | `georgy.butaev@revamp-it.ch` (super-admin) | All admin routes **plus** the same user + public routes |

```bash
PLAYWRIGHT_BASE_URL=https://revampit.orangecat.ch \
AUTH_TEST_USER_EMAIL=butaeff@gmail.com AUTH_TEST_USER_PASSWORD='…' \
AUTH_TEST_ADMIN_EMAIL=georgy.butaev@revamp-it.ch AUTH_TEST_ADMIN_PASSWORD='…' \
npm run test:e2e:inventory
```

Route matrix: `tests/e2e/helpers/inventory-routes.ts` · Spec: `tests/e2e/feature-inventory.spec.ts`

**Last prod run:** `npm run test:e2e:inventory:prod` green — 208 inventory + all journeys incl. decisions, CMS blog, protocols (2026-06-19).

---

## Phase tracker

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Appointment 404s, bookings redirect, notification hrefs | ✅ Done (deployed `9dcd3ab3`) |
| **2** | IT-Hilfe, marketplace, workshops, services E2E | ✅ Journeys for IT-Hilfe, marketplace, workshops; full Payrexx payment when configured 🟡 |
| **3** | Staff: protocols, tasks, decisions, intake, CMS | ✅ Inventory smoke + journey E2E (intake, tasks, protocols, decisions, CMS blog) |
| **4** | Cleanup: dead code, terminology, CI, timecard notify | ✅ Techniker SSOT; community visibility; CI auth + migration drift gates |
| **DB** | Hetzner-only Postgres SSOT; single `DATABASE_URL` pool | ✅ Done |
| **E2E** | Dual-persona inventory (`test:e2e:inventory`) | ✅ 209/209 prod |
| **HR** | Vacancies, applications, hire journey | 🟡 journey E2E added |

---

## P0 — Auth & account

| # | Feature | Route / API | Status |
|---|---------|-------------|--------|
| 1 | Register | `/auth/register` | ✅ inventory E2E |
| 2 | Login (credentials) | `/auth/login` | ✅ |
| 3 | Email verification | `/auth/verify-email`, `/api/auth/verify-code` | 🟡 page exists; code flow not E2E |
| 4 | Forgot / reset password | `/auth/forgot-password` | ✅ inventory E2E |
| 5 | Logout | session | ✅ |
| 6 | Profile (personal) | `/dashboard/profile` | ✅ |
| 7 | Settings (notifications, privacy) | `/dashboard/settings` | ✅ inventory E2E |
| 8 | Export my data (GDPR) | `/api/user/export-data` | ⬜ API-only |
| 9 | Onboarding checklist | `/dashboard` (OnboardingChecklist) | ✅ inventory E2E |
| 10 | Invite friends / referral | `/invite`, `/api/referral/invite` | ✅ page; API ⬜ |
| 11 | Membership application | `/mitglied-werden`, `/dashboard/membership` | ✅ inventory E2E |
| 12 | Staff vs user same login | `/dashboard` + `/admin` | ✅ user blocked from all admin routes |

---

## P0 — IT-Hilfe (peer help)

| # | Feature | Route | Actor | Status |
|---|---------|-------|-------|--------|
| 13 | IT-Hilfe hub | `/it-hilfe` | Public | ✅ (E2E hub paths) |
| 14 | Create help request | `/it-hilfe/create` | Public | ✅ (E2E form load) |
| 15 | Create with preferred technician | `/it-hilfe/create?technician=<profileId>` | Public | ✅ preferred journey E2E |
| 16 | Browse open requests | `/it-hilfe/anfragen` | Public / Techniker | ✅ (E2E browse) |
| 17 | Filters (skill, service type, match skills) | `/it-hilfe/anfragen` | Techniker | 🟡 (E2E category filter) |
| 18 | Request detail | `/it-hilfe/[id]` | Public | ✅ journey + preferred E2E |
| 19 | Owner edit request | `/it-hilfe/[id]/edit` | Owner | ✅ journey E2E (API + edit form smoke) |
| 20 | Preferred technician sidebar | request detail | Owner | ✅ preferred journey E2E |
| 21 | Match panel | request detail + API matches | Techniker | ✅ preferred first in matches API |
| 22 | Submit offer | `/api/it-hilfe/requests/[id]/offers` | Techniker | ✅ dual-persona journey E2E |
| 23 | Accept / decline offer | API offers accept/decline | Owner | ✅ journey accept |
| 24 | Withdraw offer | API | Techniker | ✅ journey E2E (withdraw + resurrect offer) |
| 25 | My requests | `/it-hilfe/my` | Requester | ✅ inventory E2E |
| 26 | My offers | `/it-hilfe/my/offers` | Techniker | ✅ inventory E2E |
| 27 | Claim request (magic link) | `/it-hilfe/accept` | Guest | ✅ journey E2E (token accept + inventory empty-state) |
| 28 | Technician directory | `/it-hilfe/techniker` | Public | ✅ (E2E list load) |
| 29 | Technician public profile | `/it-hilfe/techniker/[id]` | Public | ✅ dynamic inventory + preferred journey |
| 30 | Technician self-service profile | `/profil/techniker` | Techniker | ✅ (user + admin E2E) |
| 31 | Completeness banner | profil + anfragen | Techniker | ⬜ |
| 32 | Dashboard techniker overview | `/dashboard/techniker` | Techniker | ✅ inventory E2E |
| 33 | Reviews after completion | API confirm-review | Both | 🟡 (journey E2E review) |
| 34 | Notifications (new offer, match, etc.) | bell → `/it-hilfe/[id]` | Both | ✅ |
| 35 | Admin IT-Hilfe moderation | `/admin/it-hilfe` | Staff | ✅ (admin E2E) |
| 36 | Legacy `/techniker` redirect | → `/it-hilfe/techniker` | Public | ✅ (E2E) |

---

## P0 — Marketplace (hardware)

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 37 | Browse listings | `/marketplace` | ✅ |
| 38 | Listing detail | `/marketplace/[id]` | ✅ dynamic inventory |
| 39 | Search (Meilisearch) | `/marketplace?search=` | ✅ inventory E2E |
| 40 | Cart | `/marketplace/cart` | ✅ inventory E2E |
| 41 | Checkout (Payrexx) | `/marketplace/checkout/[listingId]` | ✅ journey E2E (full flow when Payrexx active) |
| 42 | Create / edit listing | `/marketplace/sell` | ✅ inventory E2E |
| 43 | My listings | `/dashboard/listings` | ✅ inventory E2E |
| 44 | Seller dashboard | `/dashboard/seller` | ✅ inventory E2E |
| 45 | My orders (buyer) | `/dashboard/orders`, `/dashboard/orders/[id]` | ✅ list + dynamic detail |
| 46 | Favorites | `/dashboard/favorites` | ✅ inventory E2E |
| 47 | Seller public page | `/sellers/[id]` | ✅ dynamic inventory |
| 48 | Listing reports | API | ⬜ API-only |
| 49 | Admin marketplace moderation | `/admin/marketplace` | ✅ inventory E2E |
| 50 | Legacy `/shop/*` redirects | → marketplace | ✅ inventory E2E |
| MKT-1 | P2P «Jetzt kaufen» on listing detail | `/marketplace/[id]` → checkout | ✅ prod verified on Dell Latitude listing (`both`) |
| MKT-2 | Public listing Q&A (ask + seller answer) | `/marketplace/[id]` + `/api/listings/[id]/questions` | ✅ prod UI + API verified |
| MKT-3 | Contact seller (private message) | listing detail | ✅ |

### Marketplace UX rollout tracker (2026-07-04)

Single checklist for the Ricardo-style gap closure (buy CTA + public Q&A). Update this table as each step lands.

| Step | What | Status | Notes |
|------|------|--------|-------|
| 1 | Schema `listing_questions` + Drizzle/API/UI | ✅ | `114_listing_questions.sql`, `ListingQuestions.tsx`, question APIs |
| 2 | P2P «Jetzt kaufen» CTA (`payment_mode` secure/both) | ✅ | Default sell form `both`; i18n router fix |
| 3 | Local unit tests | ✅ | marketplace config + Zod schemas |
| 4 | Local journey E2E (`test:e2e:marketplace:journey`) | ✅ | buy CTA, Q&A, checkout, mock Payrexx — 2026-07-04 |
| 5 | **Prod DB migration 114** | ✅ | Applied manually on Hetzner `2026-07-04T17:29Z`; `schema_migrations` + `listing_questions` verified |
| 6 | **Commit + deploy app code** | ✅ | `40a50b4e` deployed 2026-07-04T17:52Z; migration 114 skipped (already applied) |
| 7 | Prod smoke — listing detail buy CTA + Q&A | ✅ | Browser smoke 2026-07-04 on `b6b01592…` (`payment_mode` set to `both` for demo) |
| 8 | Admin Q&A moderation (`hide` question) | ✅ | `/admin/marketplace` Questions tab; hide/restore API |
| 9 | i18n parity (`marketplace.questions`, `securePayment*`, admin moderation) | ✅ | public + admin strings in all 8 locales |

**Marketplace UX rollout is complete (2026-07-04).** Shipped: buy CTA, public Q&A, admin moderation, prod migration 114, journey E2E, prod smoke. Resume wider inventory from Phase 2 / HR / P3 edge cases.

### IT-Hilfe Phase 2 tracker (2026-07-05)

| Step | What | Status | Notes |
|------|------|--------|-------|
| 1 | Owner edit request E2E (#19) | ✅ | API `PUT` + `/it-hilfe/[id]/edit` form smoke in `test:e2e:it-hilfe:journey` |
| 2 | Withdraw offer E2E (#24) | ✅ | API `DELETE` + resurrect offer flow in same journey |
| 3 | Update schema canton fix | ✅ | `UpdateITHilfeRequestSchema` uses `SWISS_CANTONS` (matches create) |
| 4 | Commit + deploy | ✅ | `7fecaeb3` active on prod `2026-07-04T23:42Z`; migrations up to date |
| 5 | Magic-link claim (#27) | ✅ | Guest journey E2E; CSRF fix deployed `82693d0f` 2026-07-05 |

---

## P1 — Workshops

| # | Feature | Route | Actor | Status |
|---|---------|-------|-------|--------|
| 51 | Workshop catalog | `/workshops` | Public | ✅ inventory E2E |
| 52 | Workshop detail + instances | `/workshops/[slug]` | Public | 🟡 dynamic when workshop exists |
| 53 | Register (free) | `/api/workshops/register` | User | ✅ workshops journey E2E |
| 54 | Register with payment | `/api/workshops/[slug]/register-with-payment` | User | 🟡 Payrexx-not-ready UI in journey; full payment when configured |
| 55 | My workshops | `/dashboard/workshops` | User | ✅ inventory E2E |
| 56 | Propose a workshop | `/workshops/propose` | User | ✅ inventory E2E |
| 57 | Admin workshop templates | `/admin/workshops` | Staff | ✅ inventory E2E |
| 58 | Create workshop | `/admin/workshops/new` | Staff | ✅ inventory E2E |
| 59 | Workshop instances list | `/admin/workshops/instances` | Staff | ✅ inventory E2E |
| 60 | Instance detail / edit | `/admin/workshops/instances/[id]` | Staff | ✅ (notification href) |
| 61 | Proposal review | `/admin/workshops/proposals/[id]` | Staff | ✅ proposal journey E2E |
| 62 | Approve proposal | API approve | Staff | ✅ proposal journey E2E |
| 63 | Registrations management | API admin registrations | Staff | ⬜ |
| 64 | Materials per workshop | API materials | Staff | ⬜ |
| 65 | Workshop reviews (public) | workshop detail | Public | ⬜ |
| 66 | Cancel registration | API | User | ✅ workshops journey cleanup |
| 67 | Notification: proposal approved | → admin workshops | User | 🟡 in-app on approve (journey API) |

---

## P1 — Services & professional repair

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 68 | Services landing | `/services` | ✅ inventory E2E |
| 69 | Service category pages | `/services/[service]` | ✅ inventory E2E |
| 70 | Book repair for device type | `/services/[service]/repair` | ✅ inventory E2E (3 slugs) |
| 71 | Open-source solutions subsite | `/services/open-source-solutions` | ✅ inventory E2E |
| 72 | Book via repairer profile | `/api/repairers/[id]/book` | 🟡 Legacy API |
| 73 | Repairer availability | `/api/repairers/[id]/availability` | ⬜ |
| 74 | Repairer ratings | `/api/repairers/[id]/ratings` | ⬜ |
| 75 | Unified technician list | `/api/technicians` | ✅ SSOT |
| 76 | Appointment booking (services) | `POST /api/appointments` | ✅ service journey E2E |
| 77 | Pay for appointment | `/api/appointments/[id]/pay` | ✅ (return banner) |
| 78 | My appointments (list) | `/dashboard/appointments` | ✅ (user E2E) |
| 79 | Appointment detail | `/dashboard/appointments/[id]` | ✅ service journey E2E |
| 80 | Repairer view appointments | `/dashboard/appointments?role=repairer` | ✅ service journey E2E |
| 81 | Inline edit/cancel on list | appointments page | ⬜ |
| 82 | My bookings (alternate UI) | `/dashboard/bookings` | ✅ → redirects to appointments |
| 83 | Booking detail | `/dashboard/bookings/[id]` | ✅ → redirects to appointments |
| 84 | Rate completed booking | appointments detail | ⬜ |
| 85 | Admin appointments queue | `/admin/appointments` | ✅ (admin E2E) |
| 86 | Admin appointment detail | `/admin/appointments/[id]` | ✅ service journey E2E |
| 87 | Assign repairer to appointment | API assign | ✅ service journey E2E |
| 88 | Repairer applications | `/admin/repairer-applications` | ✅ inventory E2E |
| 89 | Orphan paid booking UI | `components/payments/service-booking/` | ✅ Removed |
| 90 | Orphan book-with-payment API | `/api/appointments/book-with-payment` | ✅ Removed |

---

## P1 — Messaging & notifications

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 91 | Messages inbox | `/dashboard/messages` | ✅ (user E2E) |
| 92 | Send message | `/api/messages` | ⬜ |
| 93 | Notification bell | all pages | ✅ |
| 94 | Notification deep links | `RELATED_TYPE_HREFS` | ✅ (smoke test + membership/listing query fix) |
| 95 | Email notifications | SMTP | 🟡 |

---

## P2 — Governance (member-facing)

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 96 | Decisions list (dashboard) | `/dashboard/decisions` | ✅ inventory E2E |
| 97 | Decision detail + vote | `/dashboard/decisions/[id]` | 🟡 dynamic |
| 98 | Admin decisions CRUD | `/admin/decisions/*` | ✅ journey E2E (create → vote → close) |
| 99 | Voting (standalone system) | API `decisions/*` | ✅ journey E2E (vote + transition) |
| 100 | Create task from decision | API | ⬜ |

---

## P2 — Content & community

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 101 | Blog index | `/blog` | ✅ inventory E2E |
| 102 | Blog post | `/blog/[slug]` | 🟡 dynamic |
| 103 | Submit blog post | `/blog/submit` | ✅ inventory E2E |
| 104 | My submissions | `/dashboard/blog-submissions` | ✅ inventory E2E |
| 105 | Admin blog CMS | `/admin/content/blog/*` | ✅ journey E2E (draft → publish → public) |
| 106 | Static pages CMS | `/admin/content/pages/*` | ✅ inventory E2E |
| 107 | Categories | `/admin/content/categories/*` | ✅ inventory E2E |
| 108 | Media library | `/admin/content/media` | ✅ inventory E2E |
| 109 | Content submissions queue | `/admin/content/submissions` | ✅ inventory E2E |
| 110 | Approvals hub | `/admin/approvals` | ✅ inventory E2E |
| 111 | Reviews moderation | `/admin/reviews` | ✅ inventory E2E |
| 112 | Donate hardware | `/get-involved/donate` | ✅ inventory E2E |
| 113 | My donations | `/dashboard/donations` | ✅ inventory E2E |
| 114 | Admin donations | `/admin/donations` | ✅ inventory E2E |
| 115 | Projects (admin) | `/admin/projects`, `[slug]` | ✅ list; slug dynamic 🟡 |
| 116 | Upcycling mini-site | `/projects/upcycling/*` | ✅ inventory E2E (nav + guide) |
| 117 | Get involved pages | `/get-involved/*` | ✅ donate path |
| 118 | Legal pages | impressum, datenschutz, agb, transparenz | ✅ inventory E2E |
| 119 | FAQ, contact, support | `/faq`, `/contact`, `/support` | ✅ inventory E2E |
| 120 | Changelog | `/changelog` | ✅ inventory E2E |
| 121 | Newsletter subscribe | API | ⬜ |

---

## P2 — Admin operations (staff)

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 122 | Admin dashboard | `/admin` | ✅ (admin E2E) |
| 123 | Device intake / Erfassung | `/admin/erfassung` | ✅ inventory E2E |
| 124 | Products / inventory | removed 2026-07 — covered by `/admin/intake` + `/admin/marketplace` | ✂️ removed |
| 125 | Intake pipeline | `/admin/intake` | ✅ inventory + journey E2E |
| 126 | Locations | `/admin/locations/*` | ✅ inventory E2E |
| 127 | Admin services config | `/admin/services/*` | ✅ inventory E2E |
| 128 | Tasks + projects | `/admin/tasks/*` | ✅ inventory + journey E2E |
| 129 | Protocols (AI meeting notes) | `/admin/protocols/*` | ✅ inventory + journey E2E |
| 130 | Team HR | `/admin/team/*` | ✅ inventory E2E |
| 131 | Team approvals | `/admin/team/approvals` | ✅ inventory E2E |
| 132 | Users admin | `/admin/users/[id]` | ✅ list; detail dynamic 🟡 |
| 133 | Membership approvals | `/admin/membership` | ✅ inventory E2E |
| 134 | Timecards (staff submit) | `/dashboard/timecards` | ✅ inventory + journey E2E |
| 135 | Timecards (admin queue) | removed 2026-07 — merged into `/admin/team/approvals` (queue) + `/admin/zeiterfassung` (own editor) | ✂️ removed |
| 136 | Shift view | `/dashboard/shift` | ✅ inventory E2E |
| 137 | Time off requests | API `time-off/*` | 🟡 API-only |
| 138 | Payroll | `/admin/payroll` | ✅ inventory E2E |
| 139 | Analytics (legacy) | removed 2026-07 — replaced by `/admin/analyse/*` (row 140) | ✂️ removed |
| 140 | Analyse | `/admin/analyse/*` | ✅ inventory E2E |
| 141 | Hirn AI admin | `/admin/hirn` | ✅ inventory E2E |
| 142 | Settings | `/admin/settings` | ✅ inventory E2E |
| 143 | Permission requests | admin team help | ✅ inventory E2E |

---

## HR — Talent lifecycle (#HR)

| # | Feature | Route / API | Status |
|---|---------|-------------|--------|
| HR-1 | Public careers list | `/karriere` | 🟡 inventory + journey E2E |
| HR-2 | Vacancy detail + apply | `/karriere/[slug]` | 🟡 journey E2E |
| HR-3 | Guest apply + track forms | `POST /api/careers/[slug]/apply` | ✅ all 5 tracks (Zod SSOT) |
| HR-4 | CV upload (PDF) | `POST /api/careers/upload-cv` | 🟡 employee track |
| HR-5 | Admin vacancies CRUD | `/admin/hr/vacancies/*` | 🟡 inventory E2E |
| HR-6 | Publish / pause / fill | `POST …/transition` | ✅ journey E2E |
| HR-7 | Application inbox | `/admin/hr/applications` | 🟡 inventory E2E |
| HR-8 | Pipeline stages + hire | `POST …/hire` → `team_profiles` | ✅ journey E2E |
| HR-9 | Onboarding tasks on hire | config `ONBOARDING_TASK_TEMPLATES` | ✅ |
| HR-10 | Get-involved → careers links | `/get-involved/*?track=` | ✅ volunteer/intern/reintegration |
| HR-11 | About named leads | `team_profiles.show_on_about` | 🟡 admin toggle |
| HR-12 | Retention policy | `scripts/maintenance/hr-application-retention.ts` | 🟡 manual/cron |
| HR-13 | Funnel stats | `GET /api/admin/hr/stats` | 🟡 |

Config SSOT: `src/config/hr-vacancies.ts`, `src/config/hr-application-status.ts` · Runbook: `docs/HR_RUNBOOK.md`

---

## P3 — Edge cases & integrations

| # | Feature | Notes | Status |
|---|---------|-------|--------|
| 144 | Payrexx webhooks | marketplace + workshops + appointments | 🟡 SSOT `src/config/payrexx.ts`; setup `docs/operations/PAYREXX_SETUP.md` |
| 145 | Meilisearch indexing | listings search | ⬜ |
| 146 | R2 image uploads | `/api/uploads` | ⬜ |
| 147 | AI form assist | IT-Hilfe create, protocols | ⬜ |
| 148 | AI diagnosis on requests | IT-Hilfe | ⬜ |
| 149 | Cookie banner / consent | UI | ⬜ |
| 150 | i18n (de, en, ru, ja, ko) | all public pages | ⬜ |
| 151 | Dark mode | global | ⬜ |
| 152 | Legacy API 410 Gone | helpers, repairers list | ⬜ |
| 153 | `/api/repairers/[id]/*` sub-routes | book, availability | ⬜ |
| 154 | Kivvi integration | inventory (if configured) | ⬜ |
| 155 | Medusa/legacy shop UUID routes | `/shop/product/[uuid]` | ⬜ |

---

## Known broken / confusing (updated)

| Issue | Impact | Priority | Status |
|-------|--------|----------|--------|
| No `/dashboard/appointments/[id]` | Notification + email 404 | P0 | ✅ Fixed |
| No `/admin/appointments/[id]` | Admin links 404 | P0 | ✅ Fixed |
| Appointments vs Bookings duplicate UX | User confusion | P0 | ✅ Unified |
| `RELATED_TYPE_HREFS` broken paths | Bell links 404 | P0 | ✅ Fixed (incl. membership + marketplace query params) |
| Repairer vs Techniker labels mixed | Confusion | P1 | ✅ SSOT `src/config/terminology.ts` |
| Service-booking payment UI orphaned | Incomplete paid flow | P1 | ✅ Removed |
| Community techniker `is_verified=false` hidden | Profile invisible | P1 | ✅ Community active profiles public (`technician-visibility.ts`) |
| Dev `.env.local` pointed at retired cloud DB while prod uses Hetzner | Wrong data during local ops | P0 | ✅ Fixed — Docker 5433 locally; `.env.selfhost.local` → SSH tunnel |
| Prod vs dev DB drift (butaeff unverified on Hetzner only) | Login failures on prod | P0 | ✅ Fixed ops (verify + password + lockout clear) |
| Auth smoke CI fails (MissingSecret) | CI noise | P3 | ✅ Uses admin dual-persona fallback; skip when no secrets |
| Migration drift CI (vector ext) | CI noise | P3 | ✅ pgvector/pg17 + `apply-migrations-ci.sh` (104 migrations on fresh DB) |
| Timecard submit 400 (TIME format) | Submit blocked | P1 | ✅ API normalizes HH:MM:SS → HH:MM |
| Timecard approver email missing | Approvers not notified | P1 | ✅ notifyUsers on submit (journey E2E) |
| Intake detail crash after publish (`selling_price_chf.toFixed`) | Published device detail 500 | P1 | ✅ Number() coerce in IntakeDetailView |
| Dependabot open alerts (nodemailer, OTel, js-yaml, cms-core uuid) | Supply-chain risk | P2 | ✅ Bumped deps + npm overrides (`npm audit` 0) |

---

## Recommended test order (next)

1. **Run dual-persona inventory on every deploy:** automatic via GitHub Actions (`post-deploy-e2e` job) when `AUTH_TEST_USER_PASSWORD` + `AUTH_TEST_ADMIN_PASSWORD` are set; manual: `npm run test:e2e:inventory:prod`.
2. **Deep journeys** (API + multi-step): workshop register — IT-Hilfe ✅ · marketplace checkout ✅ (`test:e2e:marketplace:journey`; full Payrexx payment when `PAYREXX_INSTANCE` set on prod).
3. **Phase 4 cleanup** — terminology ✅ · community visibility ✅ · CI auth/migration gates ✅
4. **Expand matrix** — dynamic detail pages: discovery + empty-state fallbacks ✅

**E2E commands:** `npm run test:e2e:inventory:prod` · `npm run test:e2e:it-hilfe:journey` · `npm run test:e2e:it-hilfe:preferred:journey` · `npm run test:e2e:marketplace:journey` · `npm run test:e2e:workshops:journey` · `npm run test:e2e:workshops:proposal:journey` · `npm run test:e2e:service:journey` · `npm run test:e2e:timecards:journey` · `npm run test:e2e:intake:journey` · `npm run test:e2e:tasks:journey` · `npm run test:e2e:protocols:journey` · `npm run test:e2e:decisions:journey` · `npm run test:e2e:cms:journey`

See also: [`ARCHITECTURE_DEBT.md`](./ARCHITECTURE_DEBT.md) · [`ADMIN_UX_AUDIT.md`](./ADMIN_UX_AUDIT.md)
