---
created_date: 2026-06-19
last_modified_date: 2026-06-25
last_modified_summary: Phase 2 IT-Hilfe E2E coverage and inventory status updates
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

**Route SSOT:** `src/config/service-appointments.ts` · Notification hrefs: `src/config/notifications.ts`

---

## Phase tracker

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Appointment 404s, bookings redirect, notification hrefs | ✅ Done (deployed `9dcd3ab3`); href smoke test in `tests/e2e/notification-hrefs.spec.ts` |
| **2** | IT-Hilfe, marketplace, workshops, services E2E | 🟡 IT-Hilfe hub/browse/journey specs in `tests/e2e/it-hilfe.spec.ts` |
| **3** | Staff: protocols, tasks, decisions, intake, CMS | ⬜ Not started |
| **4** | Cleanup: dead code, terminology, CI, timecard notify | 🟡 Local (timecard + Playwright infra uncommitted) |

---

## P0 — Auth & account

| # | Feature | Route / API | Status |
|---|---------|-------------|--------|
| 1 | Register | `/auth/register` | ⬜ |
| 2 | Login (credentials) | `/auth/login` | ✅ |
| 3 | Email verification | `/auth/verify-email`, `/api/auth/verify-code` | ⬜ |
| 4 | Forgot / reset password | `/auth/forgot-password` | ⬜ |
| 5 | Logout | session | ✅ |
| 6 | Profile (personal) | `/dashboard/profile` | ⬜ |
| 7 | Settings (notifications, privacy) | `/dashboard/settings` | ⬜ |
| 8 | Export my data (GDPR) | `/api/user/export-data` | ⬜ |
| 9 | Onboarding checklist | `/dashboard` (OnboardingChecklist) | ⬜ |
| 10 | Invite friends / referral | `/invite`, `/api/referral/invite` | ⬜ |
| 11 | Membership application | `/mitglied-werden`, `/dashboard/membership` | ⬜ |
| 12 | Staff vs user same login | `/dashboard` + `/admin` | ✅ |

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
| 22 | Submit offer | `/api/it-hilfe/requests/[id]/offers` | Techniker | 🟡 (journey E2E API) |
| 23 | Accept / decline offer | API offers accept/decline | Owner | 🟡 (journey E2E accept) |
| 24 | Withdraw offer | API | Techniker | ⬜ |
| 25 | My requests | `/it-hilfe/my` | Requester | ⬜ |
| 26 | My offers | `/it-hilfe/my/offers` | Techniker | ⬜ |
| 27 | Claim request (magic link) | `/it-hilfe/accept` | Guest | ⬜ |
| 28 | Technician directory | `/it-hilfe/techniker` | Public | ✅ (E2E list load) |
| 29 | Technician public profile | `/it-hilfe/techniker/[id]` | Public | ⬜ |
| 30 | Technician self-service profile | `/profil/techniker` | Techniker | ⬜ |
| 31 | Completeness banner | profil + anfragen | Techniker | ⬜ |
| 32 | Dashboard techniker overview | `/dashboard/techniker` | Techniker | ⬜ |
| 33 | Reviews after completion | API confirm-review | Both | 🟡 (journey E2E review) |
| 34 | Notifications (new offer, match, etc.) | bell → `/it-hilfe/[id]` | Both | ✅ |
| 35 | Admin IT-Hilfe moderation | `/admin/it-hilfe` | Staff | ⬜ |
| 36 | Legacy `/techniker` redirect | → `/it-hilfe/techniker` | Public | ✅ (E2E) |

---

## P0 — Marketplace (hardware)

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 37 | Browse listings | `/marketplace` | ✅ |
| 38 | Listing detail | `/marketplace/[id]` | ⬜ |
| 39 | Search (Meilisearch) | `/marketplace?search=` | ⬜ |
| 40 | Cart | `/marketplace/cart` | 🟡 |
| 41 | Checkout (Payrexx) | `/marketplace/checkout/[listingId]` | 🟡 (payment return banner) |
| 42 | Create / edit listing | `/marketplace/sell` | ⬜ |
| 43 | My listings | `/dashboard/listings` | ⬜ |
| 44 | Seller dashboard | `/dashboard/seller` | ⬜ |
| 45 | My orders (buyer) | `/dashboard/orders`, `/dashboard/orders/[id]` | ⬜ |
| 46 | Favorites | `/dashboard/favorites` | ⬜ |
| 47 | Seller public page | `/sellers/[id]` | ⬜ |
| 48 | Listing reports | API | ⬜ |
| 49 | Admin marketplace moderation | `/admin/marketplace` | ⬜ |
| 50 | Legacy `/shop/*` redirects | → marketplace | ⬜ |

---

## P1 — Workshops

| # | Feature | Route | Actor | Status |
|---|---------|-------|-------|--------|
| 51 | Workshop catalog | `/workshops` | Public | ⬜ |
| 52 | Workshop detail + instances | `/workshops/[slug]` | Public | ⬜ |
| 53 | Register (free) | `/api/workshops/register` | User | ⬜ |
| 54 | Register with payment | `/api/workshops/[slug]/register-with-payment` | User | 🟡 |
| 55 | My workshops | `/dashboard/workshops` | User | ⬜ |
| 56 | Propose a workshop | `/workshops/propose` | User | ⬜ |
| 57 | Admin workshop templates | `/admin/workshops` | Staff | ⬜ |
| 58 | Create workshop | `/admin/workshops/new` | Staff | ⬜ |
| 59 | Workshop instances list | `/admin/workshops/instances` | Staff | ⬜ |
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
| 68 | Services landing | `/services` | ⬜ |
| 69 | Service category pages | `/services/[service]` | ⬜ |
| 70 | Book repair for device type | `/services/[service]/repair` | ⬜ |
| 71 | Open-source solutions subsite | `/services/open-source-solutions` | ⬜ |
| 72 | Book via repairer profile | `/api/repairers/[id]/book` | 🟡 Legacy API |
| 73 | Repairer availability | `/api/repairers/[id]/availability` | ⬜ |
| 74 | Repairer ratings | `/api/repairers/[id]/ratings` | ⬜ |
| 75 | Unified technician list | `/api/technicians` | ✅ SSOT |
| 76 | Appointment booking form | AppointmentBookingForm | ⬜ |
| 77 | Pay for appointment | `/api/appointments/[id]/pay` | ✅ (return banner) |
| 78 | My appointments (list) | `/dashboard/appointments` | ✅ |
| 79 | Appointment detail | `/dashboard/appointments/[id]` | ✅ (was ❌ 404) |
| 80 | Repairer view appointments | `/dashboard/appointments?role=repairer` | ⬜ |
| 81 | Inline edit/cancel on list | appointments page | ⬜ |
| 82 | My bookings (alternate UI) | `/dashboard/bookings` | ✅ → redirects to appointments |
| 83 | Booking detail | `/dashboard/bookings/[id]` | ✅ → redirects to appointments |
| 84 | Rate completed booking | appointments detail | ⬜ |
| 85 | Admin appointments queue | `/admin/appointments` | ✅ |
| 86 | Admin appointment detail | `/admin/appointments/[id]` | ✅ (was ❌ 404) |
| 87 | Assign repairer to appointment | API assign | ⬜ |
| 88 | Repairer applications | `/admin/repairer-applications` | ⬜ |
| 89 | Orphan paid booking UI | `components/payments/service-booking/` | ✅ Removed |
| 90 | Orphan book-with-payment API | `/api/appointments/book-with-payment` | ✅ Removed |

---

## P1 — Messaging & notifications

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 91 | Messages inbox | `/dashboard/messages` | ⬜ |
| 92 | Send message | `/api/messages` | ⬜ |
| 93 | Notification bell | all pages | ✅ |
| 94 | Notification deep links | `RELATED_TYPE_HREFS` | ✅ (smoke test + membership/listing query fix) |
| 95 | Email notifications | SMTP | 🟡 |

---

## P2 — Governance (member-facing)

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 96 | Decisions list (dashboard) | `/dashboard/decisions` | ⬜ |
| 97 | Decision detail + vote | `/dashboard/decisions/[id]` | ⬜ |
| 98 | Admin decisions CRUD | `/admin/decisions/*` | ⬜ |
| 99 | Voting (standalone system) | API `decisions/*` | ⬜ |
| 100 | Create task from decision | API | ⬜ |

---

## P2 — Content & community

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 101 | Blog index | `/blog` | ⬜ |
| 102 | Blog post | `/blog/[slug]` | ⬜ |
| 103 | Submit blog post | `/blog/submit` | ⬜ |
| 104 | My submissions | `/dashboard/blog-submissions` | ⬜ |
| 105 | Admin blog CMS | `/admin/content/blog/*` | ⬜ |
| 106 | Static pages CMS | `/admin/content/pages/*` | ⬜ |
| 107 | Categories | `/admin/content/categories/*` | ⬜ |
| 108 | Media library | `/admin/content/media` | ⬜ |
| 109 | Content submissions queue | `/admin/content/submissions` | ⬜ |
| 110 | Approvals hub | `/admin/approvals` | ⬜ |
| 111 | Reviews moderation | `/admin/reviews` | ⬜ |
| 112 | Donate hardware | `/get-involved/donate` | ⬜ |
| 113 | My donations | `/dashboard/donations` | ⬜ |
| 114 | Admin donations | `/admin/donations` | ⬜ |
| 115 | Projects (admin) | `/admin/projects`, `[slug]` | ⬜ |
| 116 | Upcycling mini-site | `/projects/upcycling/*` | ⬜ |
| 117 | Get involved pages | `/get-involved/*` | ⬜ |
| 118 | Legal pages | impressum, datenschutz, agb, transparenz | ⬜ |
| 119 | FAQ, contact, support | `/faq`, `/contact`, `/support` | ⬜ |
| 120 | Changelog | `/changelog` | ⬜ |
| 121 | Newsletter subscribe | API | ⬜ |

---

## P2 — Admin operations (staff)

| # | Feature | Route | Status |
|---|---------|-------|--------|
| 122 | Admin dashboard | `/admin` | ⬜ |
| 123 | Device intake / Erfassung | `/admin/erfassung` | ⬜ |
| 124 | Products / inventory | `/admin/products`, factsheet | ⬜ |
| 125 | Intake pipeline | `/admin/intake` | ⬜ |
| 126 | Locations | `/admin/locations/*` | ⬜ |
| 127 | Admin services config | `/admin/services/*` | ⬜ |
| 128 | Tasks + projects | `/admin/tasks/*` | ⬜ |
| 129 | Protocols (AI meeting notes) | `/admin/protocols/*` | ⬜ |
| 130 | Team HR | `/admin/team/*` | ⬜ |
| 131 | Team approvals | `/admin/team/approvals` | 🟡 (timecard review href) |
| 132 | Users admin | `/admin/users/[id]` | ⬜ |
| 133 | Membership approvals | `/admin/membership` | ⬜ |
| 134 | Timecards (staff submit) | `/dashboard/timecards` | 🟡 (HH:MM fix local) |
| 135 | Timecards (admin queue) | `/admin/timecards` | 🟡 (approver notify local) |
| 136 | Shift view | `/dashboard/shift` | ⬜ |
| 137 | Time off requests | API `time-off/*` | 🟡 |
| 138 | Payroll | `/admin/payroll` | ⬜ |
| 139 | Analytics | `/admin/analytics` | ⬜ |
| 140 | Analyse | `/admin/analyse/*` | ⬜ |
| 141 | Hirn AI admin | `/admin/hirn` | ⬜ |
| 142 | Settings | `/admin/settings` | ⬜ |
| 143 | Permission requests | admin team help | ⬜ |

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
| Auth smoke CI fails (MissingSecret) | CI noise | P3 | ❌ Open |
| Migration drift CI (vector ext) | CI noise | P3 | ❌ Open |
| Timecard submit 400 (TIME format) | Submit blocked | P1 | 🟡 Fixed locally |
| Timecard approver email missing | Approvers not notified | P1 | 🟡 Fixed locally |

---

## Recommended test order (next)

1. **Commit + deploy** Phase 4 local work (timecards, Playwright, migration 094).
2. **Phase 2 — IT-Hilfe E2E** (#13–36): `npm run test:e2e:it-hilfe` — journey needs `AUTH_TEST_TECHNICIAN_EMAIL` + password (distinct from requester).
3. **Phase 2 — Marketplace + workshops** smoke matrix.
4. **Phase 3 — Staff surfaces** (protocols, tasks, decisions).
5. **Phase 4 cleanup** — terminology pass (Techniker vs Reparateur), CI fixes.

See also: [`ARCHITECTURE_DEBT.md`](./ARCHITECTURE_DEBT.md) · [`ADMIN_UX_AUDIT.md`](./ADMIN_UX_AUDIT.md)
