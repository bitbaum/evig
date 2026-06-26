---
created_date: 2026-01-07
last_modified_date: 2026-06-19
last_modified_summary: HR talent lifecycle — /karriere, admin vacancies/applications, hire→team_profiles
---

# Revamp-IT Shared Context (SSOT)

**Single Source of Truth** for project context used by all agent files and documentation.

---

## Project Overview

**Revamp-IT** is a Swiss non-profit organization dedicated to **enabling free exchange of technology** between individuals and groups, promoting **open-source hardware and software** as the ideal form of human collaboration.

**Location**: Birmensdorferstrasse 379, 8055 Zürich, Switzerland

**Full Mission Statement**: See `docs/MISSION_STATEMENT.md`  
**Legal Compliance**: See `docs/LEGAL_NONPROFIT_COMPLIANCE.md`

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS | Port 3000 |
| Backend | Next.js API Routes | — |
| Auth | Auth.js v5, Credentials, JWT sessions | Same login for `/dashboard` and `/admin` — see `docs/UNIFIED_AUTH.md` |
| E-commerce | Custom (inventory-based) | Integrated |
| Database/Search | PostgreSQL (prod: self-hosted Postgres 17 on Hetzner via `DATABASE_URL`; dev: Docker on port 5433), Redis (6380), Meilisearch (7700) | Drizzle ORM; auth shares the same `DATABASE_URL` pool — no separate auth DB |
| Deploy | GitHub Actions → self-hosted Hetzner app (revampit.orangecat.ch), systemd `revampit-app`; Vercel not used | See `docs/COMMANDS.md` |
| Storage | Cloudflare R2 (S3-compatible, bucket `revampit-media`) for product/listing images; `public/uploads` local fallback | Configured via `S3_*` env vars |

---

## Database Configuration

| Environment | Host | Port | Database | Notes |
|-------------|------|------|----------|-------|
| **Local dev** | `localhost` | 5433 | `revampit_cms` | `npm run services:up` (Docker) |
| **Production** | `localhost` (on box) | 5432 | `revampit` | Hetzner self-hosted; ops via SSH tunnel — see `.env.selfhost.local.example` |

**SSOT:** `DATABASE_URL` only. No `AUTH_DB_*` split.

| Service | Port |
|---------|------|
| Redis | 6380 |
| Meilisearch | 7700 |

---

## Access Points

- **Frontend**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **AI CMS Editor**: http://localhost:3000/ai-cms
- **Shop / marketplace**: http://localhost:3000/marketplace

---

## File Structure

```
src/
├── app/api/             # API routes
├── components/ui/        # Reusable UI components
├── lib/                  # Utilities (logger.ts, auth/, utils.ts)
├── config/               # Constants (database.ts, urls.ts)
└── types/                # TypeScript definitions

scripts/db/migrations/    # Migration scripts (PROTECTED)
```

---

## Customer journeys (public IA)

People come to RevampIT for two jobs — SSOT: `src/config/customer-journeys.ts`

| Journey | Entry | Routes |
|---------|--------|--------|
| **Hardware** | Marktplatz → Kaufen & verkaufen | `/marketplace`, `/marketplace/sell` (`/shop/*` redirects here) |
| **IT help** | Marktplatz → IT-Hilfe hub | `/it-hilfe` (hub), `/it-hilfe/create`, `/it-hilfe/techniker`, `/it-hilfe/anfragen` |

**Technician → request flow:** From a public profile (`/it-hilfe/techniker/[id]`), “Anfrage stellen” opens `/it-hilfe/create?technician=<profileId>`. The request stores `preferred_technician_id` (migration `092_it_hilfe_preferred_technician.sql`); that technician is notified directly and listed first on the request detail match panel. Direct selection uses the same visibility rules as the public directory (`canAcceptDirectItHilfeRequest` in `src/lib/domain/technician-visibility.ts` — community active profiles need not be `is_verified`). The request stays open to other offers until one is accepted.

**Technician onboarding:** `/profil/techniker` shows a completeness banner until skills, canton, and location (PLZ or city) are set (`src/lib/domain/technician-profile.ts`). Same banner appears on `/it-hilfe/anfragen` for logged-in technicians with incomplete profiles.

**Browse requests (`/it-hilfe/anfragen`):** Filters include category, canton, urgency, budget, skill, service type, and (for match-ready technicians) “match my skills” — API param `matchMySkills=true` overlaps the requester's `skills_needed` with the logged-in user's `user_skills`.

**Technician profile SSOT (unified 2026-06):**

| Layer | SSOT |
|-------|------|
| DB table | `repairer_profiles` (+ `user_skills`) — `helper_profiles` merged by migration 061, dropped by 073 |
| Public list/detail | `GET /api/technicians`, `GET /api/technicians/[id]` — **`id` = `repairer_profiles.id` (profile UUID)** |
| Self-service edit | `GET/PUT /api/user/technician-profile` |
| Profile tier | `REPAIRER_PROFILE_TIER` in `src/config/repairer-status.ts` (`community` \| `professional`) |
| Domain logic | `src/lib/services/technician-service.ts`, `src/lib/domain/technician-profile.ts` |
| Legacy (410 Gone) | List routes `/api/it-hilfe/helpers`, `/api/repairers`, `/api/it-hilfe/helper/*` — use successors in `IT_HILFE.api`; `/api/it-hilfe/helpers/[id]` still proxies detail |

Migration `095_backfill_repairer_profiles_from_user_skills.sql` creates missing `repairer_profiles` rows for users with `user_skills` only (safe after 073).

Legacy `/techniker` redirects to `/it-hilfe/techniker`. Do not add separate nav entries for “Hilfe suchen” vs “Techniker finden” — one hub, three paths inside.

**HR / careers (talent lifecycle):**

| Layer | SSOT |
|-------|------|
| Public | `/karriere`, `/karriere/[slug]` — `ROUTES.public.careers` |
| Admin | `/admin/hr/vacancies`, `/admin/hr/applications` — permission: `team` |
| Config | `src/config/hr-vacancies.ts`, `src/config/hr-application-status.ts` |
| DB | `job_postings`, `job_applications`, `job_application_events` (migration 097) |
| Hire bridge | `POST /api/admin/hr/applications/[id]/hire` → `team_profiles` |
| Runbook | `docs/HR_RUNBOOK.md` |

Get-involved pages (volunteer, intern, reintegration) link to filtered `/karriere?track=…`. Team roster stays internal; About may show `show_on_about` leads only.

---

- **Language**: Swiss High German ("ss" not "ß", "Velo" not "Fahrrad")
- **Currency**: CHF (Swiss Francs)
- **Postal Codes**: 4-digit format (e.g., 8048)
- **Error Messages**: Use German for user-facing, English for logs

**Detailed Rules**: See `.cursor/rules/swiss-context.mdc`

---

## Feature inventory (audit SSOT)

- **`docs/FEATURE_INVENTORY.md`** — 155-item route/capability matrix with status (✅/🟡/❌/⬜), phase tracker, known broken links. Update when fixing or verifying a surface.

---

## Auth & onboarding (pointers)

- **SSOT:** `docs/UNIFIED_AUTH.md` — registration, verify-code, password reset, staff permissions
- **Live onboarding:** `OnboardingChecklist` on `/dashboard` (`src/lib/domain/onboarding.ts`)
- **Notifications:** central `notifyUsers()` pipeline — see `docs/ARCHITECTURE_DEBT.md` (#2 closed)

---

## Service appointments vs IT-Hilfe vs workshops

Three separate booking domains (intentional SoC):

| Domain | User routes | Payment |
|--------|-------------|---------|
| **Service appointments** (org repair) | `/dashboard/appointments/*` — SSOT: `src/config/service-appointments.ts` | Book: `POST /api/appointments`; pay after quote: `POST /api/appointments/[id]/pay` |
| **IT-Hilfe** (peer help) | `/it-hilfe/*`, `/dashboard/techniker` | No Payrexx on request flow |
| **Workshops** | `/workshops/[slug]`, `/dashboard/workshops` | Free: `POST /api/workshops/register`; paid: `register-with-payment` |

Legacy `/dashboard/bookings/*` → permanent redirect to `/dashboard/appointments/*`.

**User-facing label SSOT:** `src/config/terminology.ts` — always **Techniker** in UI/messages (DB may still use `repairer_*`).

Payrexx: config SSOT `src/config/payrexx.ts` · setup `docs/operations/PAYREXX_SETUP.md`. Return banners: `PaymentReturnBanner` + `src/lib/payments/payment-return.ts`.

**Marketplace RevampIT stock:** add to cart → `/marketplace/cart` → `POST /api/marketplace/cart/checkout`. P2P listings use direct checkout per listing.

---

## Monitor-Upcycling mini-site

Public sub-site at `/projects/upcycling/*`. Routes, reading flow, gallery, business plan i18n, and scripts: **`docs/projects/upcycling.md`**.

Nav dropdown labels for projects live under **`nav.items.*`** in locale files; use `nav-i18n.ts` helpers in header components.

**Last Updated**: 2026-06-25
