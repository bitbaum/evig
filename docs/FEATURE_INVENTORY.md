---
created_date: 2026-06-19
last_modified_date: 2026-06-19
last_modified_summary: GitHub E2E secrets set; 209/209 prod pass; CSRF + ISO 14044 smoke fixes
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

**Last prod run:** 209/209 passed (208 inventory + IT-Hilfe journey, 2026-06-25).

---

## Phase tracker

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Appointment 404s, bookings redirect, notification hrefs | ✅ Done (deployed `9dcd3ab3`) |
| **2** | IT-Hilfe, marketplace, workshops, services E2E | ✅ Inventory smoke + IT-Hilfe journey; payment/API flows 🟡 |
| **3** | Staff: protocols, tasks, decisions, intake, CMS | ✅ Inventory smoke (admin routes); deep CRUD 🟡 |
| **4** | Cleanup: dead code, terminology, CI, timecard notify | 🟡 Terminology open; CI inventory wired (needs secrets) |
| **DB** | Hetzner-only Postgres SSOT; single `DATABASE_URL` pool | ✅ Done |
| **E2E** | Dual-persona inventory (`test:e2e:inventory`) | ✅ 209/209 prod |

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
| 15 | Create with preferred technician | `/it-hilfe/create?technician=<profileId>` | Public | ✅ |
| 16 | Browse open requests | `/it-hilfe/anfragen` | Public / Techniker | ✅ (E2E browse) |
| 17 | Filters (skill, service type, match skills) | `/it-hilfe/anfragen` | Techniker | 🟡 (E2E category filter) |
| 18 | Request detail | `/it-hilfe/[id]` | Public | 🟡 (journey E2E) |
| 19 | Owner edit request | `/it-hilfe/[id]/edit` | Owner | ⬜ |
| 20 | Preferred technician sidebar | request detail | Owner | 🟡 |
| 21 | Match panel | request detail + API matches | Techniker | ⬜ |
| 22 | Submit offer | `/api/it-hilfe/requests/[id]/offers` | Techniker | ✅ dual-persona journey E2E |
| 23 | Accept / decline offer | API offers accept/decline | Owner | ✅ journey accept |
| 24 | Withdraw offer | API | Techniker | ⬜ |
| 25 | My requests | `/it-hilfe/my` | Requester | ✅ inventory E2E |
| 26 | My offers | `/it-hilfe/my/offers` | Techniker | ✅ inventory E2E |
| 27 | Claim request (magic link) | `/it-hilfe/accept` | Guest | ⬜ |
| 28 | Technician directory | `/it-hilfe/techniker` | Public | ✅ (E2E list load) |
| 29 | Technician public profile | `/it-hilfe/techniker/[id]` | Public | ⬜ |
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
| 38 | Listing detail | `/marketplace/[id]` | ⬜ |
| 39 | Search (Meilisearch) | `/marketplace?search=` | ✅ inventory E2E |
| 40 | Cart | `/marketplace/cart` | ✅ inventory E2E |
| 41 | Checkout (Payrexx) | `/marketplace/checkout/[listingId]` | ✅ journey E2E (full flow when Payrexx active) |
| 42 | Create / edit listing | `/marketplace/sell` | ✅ inventory E2E |
| 43 | My listings | `/dashboard/listings` | ✅ inventory E2E |
| 44 | Seller dashboard | `/dashboard/seller` | ✅ inventory E2E |
| 45 | My orders (buyer) | `/dashboard/orders`, `/dashboard/orders/[id]` | ✅ list; detail dynamic 🟡 |
| 46 | Favorites | `/dashboard/favorites` | ✅ inventory E2E |
| 47 | Seller public page | `/sellers/[id]` | 🟡 dynamic when seller exists |
| 48 | Listing reports | API | ⬜ API-only |
| 49 | Admin marketplace moderation | `/admin/marketplace` | ✅ inventory E2E |
| 50 | Legacy `/shop/*` redirects | → marketplace | ✅ inventory E2E |

---

## P1 — Workshops

| # | Feature | Route | Actor | Status |
|---|---------|-------|-------|--------|
| 51 | Workshop catalog | `/workshops` | Public | ✅ inventory E2E |
| 52 | Workshop detail + instances | `/workshops/[slug]` | Public | 🟡 dynamic when workshop exists |
| 53 | Register (free) | `/api/workshops/register` | User | ⬜ API-only |
| 54 | Register with payment | `/api/workshops/[slug]/register-with-payment` | User | 🟡 |
| 55 | My workshops | `/dashboard/workshops` | User | ✅ inventory E2E |
| 56 | Propose a workshop | `/workshops/propose` | User | ✅ inventory E2E |
| 57 | Admin workshop templates | `/admin/workshops` | Staff | ✅ inventory E2E |
| 58 | Create workshop | `/admin/workshops/new` | Staff | ✅ inventory E2E |
| 59 | Workshop instances list | `/admin/workshops/instances` | Staff | ✅ inventory E2E |
| 60 | Instance detail / edit | `/admin/workshops/instances/[id]` | Staff | ✅ (notification href) |
| 61 | Proposal review | `/admin/workshops/proposals/[id]` | Staff | ⬜ |
| 62 | Approve proposal | API approve | Staff | ⬜ |
| 63 | Registrations management | API admin registrations | Staff | ⬜ |
| 64 | Materials per workshop | API materials | Staff | ⬜ |
| 65 | Workshop reviews (public) | workshop detail | Public | ⬜ |
| 66 | Cancel registration | API | User | ⬜ |
| 67 | Notification: proposal approved | → admin workshops | User | 🟡 |

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
| 76 | Appointment booking form | AppointmentBookingForm | ⬜ |
| 77 | Pay for appointment | `/api/appointments/[id]/pay` | ✅ (return banner) |
| 78 | My appointments (list) | `/dashboard/appointments` | ✅ (user E2E) |
| 79 | Appointment detail | `/dashboard/appointments/[id]` | ✅ (was ❌ 404) |
| 80 | Repairer view appointments | `/dashboard/appointments?role=repairer` | ✅ inventory E2E |
| 81 | Inline edit/cancel on list | appointments page | ⬜ |
| 82 | My bookings (alternate UI) | `/dashboard/bookings` | ✅ → redirects to appointments |
| 83 | Booking detail | `/dashboard/bookings/[id]` | ✅ → redirects to appointments |
| 84 | Rate completed booking | appointments detail | ⬜ |
| 85 | Admin appointments queue | `/admin/appointments` | ✅ (admin E2E) |
| 86 | Admin appointment detail | `/admin/appointments/[id]` | ✅ (was ❌ 404) |
| 87 | Assign repairer to appointment | API assign | ⬜ |
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
| 98 | Admin decisions CRUD | `/admin/decisions/*` | ✅ list + new; detail dynamic 🟡 |
| 99 | Voting (standalone system) | API `decisions/*` | ⬜ |
| 100 | Create task from decision | API | ⬜ |

---

## P2 — Content & community

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 101 | Blog index | `/blog` | ✅ inventory E2E |
| 102 | Blog post | `/blog/[slug]` | 🟡 dynamic |
| 103 | Submit blog post | `/blog/submit` | ✅ inventory E2E |
| 104 | My submissions | `/dashboard/blog-submissions` | ✅ inventory E2E |
| 105 | Admin blog CMS | `/admin/content/blog/*` | ✅ inventory E2E |
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
| 124 | Products / inventory | `/admin/products`, factsheet | ✅ list; detail dynamic 🟡 |
| 125 | Intake pipeline | `/admin/intake` | ✅ inventory E2E |
| 126 | Locations | `/admin/locations/*` | ✅ inventory E2E |
| 127 | Admin services config | `/admin/services/*` | ✅ inventory E2E |
| 128 | Tasks + projects | `/admin/tasks/*` | ✅ inventory E2E |
| 129 | Protocols (AI meeting notes) | `/admin/protocols/*` | ✅ inventory E2E |
| 130 | Team HR | `/admin/team/*` | ✅ inventory E2E |
| 131 | Team approvals | `/admin/team/approvals` | ✅ inventory E2E |
| 132 | Users admin | `/admin/users/[id]` | ✅ list; detail dynamic 🟡 |
| 133 | Membership approvals | `/admin/membership` | ✅ inventory E2E |
| 134 | Timecards (staff submit) | `/dashboard/timecards` | ✅ inventory E2E |
| 135 | Timecards (admin queue) | `/admin/timecards` | ✅ inventory E2E |
| 136 | Shift view | `/dashboard/shift` | ✅ inventory E2E |
| 137 | Time off requests | API `time-off/*` | 🟡 API-only |
| 138 | Payroll | `/admin/payroll` | ✅ inventory E2E |
| 139 | Analytics | `/admin/analytics` | ✅ inventory E2E |
| 140 | Analyse | `/admin/analyse/*` | ✅ inventory E2E |
| 141 | Hirn AI admin | `/admin/hirn` | ✅ inventory E2E |
| 142 | Settings | `/admin/settings` | ✅ inventory E2E |
| 143 | Permission requests | admin team help | ✅ inventory E2E |

---

## P3 — Edge cases & integrations

| # | Feature | Notes | Status |
|---|---------|-------|--------|
| 144 | Payrexx webhooks | marketplace + workshops + appointments | 🟡 |
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
| Repairer vs Techniker labels mixed | Confusion | P1 | ❌ Open |
| Service-booking payment UI orphaned | Incomplete paid flow | P1 | ✅ Removed |
| Community techniker `is_verified=false` hidden | Profile invisible | P1 | ⬜ |
| Dev `.env.local` pointed at retired cloud DB while prod uses Hetzner | Wrong data during local ops | P0 | ✅ Fixed — Docker 5433 locally; `.env.selfhost.local` → SSH tunnel |
| Prod vs dev DB drift (butaeff unverified on Hetzner only) | Login failures on prod | P0 | ✅ Fixed ops (verify + password + lockout clear) |
| Auth smoke CI fails (MissingSecret) | CI noise | P3 | ❌ Open |
| Migration drift CI (vector ext) | CI noise | P3 | ❌ Open |
| Timecard submit 400 (TIME format) | Submit blocked | P1 | 🟡 Fixed locally |
| Timecard approver email missing | Approvers not notified | P1 | 🟡 Fixed locally |

---

## Recommended test order (next)

1. **Run dual-persona inventory on every deploy:** automatic via GitHub Actions (`post-deploy-e2e` job) when `AUTH_TEST_USER_PASSWORD` + `AUTH_TEST_ADMIN_PASSWORD` are set; manual: `npm run test:e2e:inventory:prod`.
2. **Deep journeys** (API + multi-step): workshop register — IT-Hilfe ✅ · marketplace checkout ✅ (`test:e2e:marketplace:journey`; full Payrexx payment when `PAYREXX_INSTANCE` set on prod).
3. **Phase 4 cleanup** — terminology (Techniker vs Reparateur), CI auth/migration gates, community `is_verified`.
4. **Expand matrix** — dynamic detail pages when no prod data (#38, #52, #79, #86).

**E2E commands:** `npm run test:e2e:inventory:prod` · `npm run test:e2e:it-hilfe:journey` · `npm run test:e2e:marketplace:journey` · `npm run test:e2e:user-admin`

See also: [`ARCHITECTURE_DEBT.md`](./ARCHITECTURE_DEBT.md) · [`ADMIN_UX_AUDIT.md`](./ADMIN_UX_AUDIT.md)
