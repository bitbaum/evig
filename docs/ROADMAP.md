# RevampIT Build Roadmap

Living queue of what we're building. Updated 2026-07-09. Keep in sync as items ship.

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

1. **Freigaben full unification** — one `/admin/freigaben` queue driven by the SSOT; **per-type polished review UX** (article ≠ timecard ≠ permission request); reconcile the DASHBOARD's second count engine (`getDashboardStats`/`buildActionItems` still read the dead table) onto the SSOT; filter chips; mobile-first; test every element.

2. **Zeiterfassung de-frankenstein** — it's inconsistent: **day view ≠ month view** logic/behaviour, hardcoded values, ignores design tokens, barely config-driven. Also: the **3 view/entry modes should be first-class options that switch easily** and work as one integrated tool. Fix SSOT/SoC/DRY/config-driven until perfect; mobile-first; test.

2b. **Geräte-Eingang / erfassung intake** — the AI-entry page. ✅ **Photo/vision fixed** (2026-07-09): analysis now cascades Groq (Llama 4 Scout) → OpenRouter → Ollama instead of the dead direct-to-localhost Ollama call, so the Foto tab works on prod (`callVisionWithFallback`); text ✅ + voice ✅ (Groq whisper) already worked. **Still to do:** the page itself (`/admin/intake` = the pipeline+tabs page; `/admin/erfassung` = Schnellerfassung — two doors, god-components ~350-420 lines) needs polish + de-frankensteining; **AI-entry SSOT** — audio recording is reimplemented 4× + image-capture 2× + near-dup routes + a fully DEAD `src/components/voice/*` module — consolidate into ONE `<AiQuickEntry text|voice|photo>` primitive routed through one `/api/ai/extract`; the erfassung Sprache/Foto tabs are "coming soon" stubs (wire them). **Bulk/CSV:** `import-csv` (API-only, Kivitendo) + erfassung `bulk-upload` (UI, CSV/XLSX) coexist (SSOT smell → consolidate); Shopware = docs-only.

2c. **Product location + multi-location on erfassung (NEW)** — when erfassing a product, mark exactly WHERE it physically is; choose among multiple locations (main storage, shop, secondary storage, a team member's possession…) + ability to ADD a location. Verify it's SSOT/SoC/DRY.

2d. **Category SSOT review + build-your-computer (NEW)** — are product categories the best for helping people find the right part / build a machine? Review the `KATEGORIEN` SSOT; likely needs richer/better categories. Ties to **`/services/build-your-computer`** — "looks absolutely atrocious but has so much potential": the AI build-tool page (requirements → inventory scan → optimise → assemble + "Revamped" cert). Redesign it to x.ai discipline + make the categories power real part-matching.

3. **Role-aware onboarding (partial — shipped staff-aware checklist)** — ✅ staff (`@revamp-it.ch`) now get a DISTINCT onboarding checklist (verify email · set schedule→Zeiterfassung · complete team profile skills/goals), DB-derived from `team_profiles`, surfaced on `/admin` + `/dashboard`, self-hiding when done. **Still to do:** a **staff self-service team-profile editor** (today the profile edit is under `/admin/team/[id]/edit`, gated on the `team` section — regular staff may lack access); AI-assisted profile fill; skills/interests **taxonomy** (config SSOT) to power dev-paths + interest-based task assignment.

4. **Profiles overhaul (NEW)** — audit + improve all profile types (team/staff, technician, seller, customer/people/organization). Public profiles should rival/beat **Ricardo/Amazon** (trust signals, ratings, verified badges, listing galleries, member-since, response time, activity). Staff profiles rich enough for dev-paths + task matching (skills taxonomy, interests, seniority, schedule). *(Audit running.)*

5. **Promo Slice 2** — admin issuance UI (`/admin/promo-codes`) + checkout redemption across marketplace/workshop/appointment, incl. **100%-off → skip Payrexx gateway → mark paid** (no flow supports zero-total today).

6. **Gift cards Phase 2** — purchasable, depleting balance, **sold in the marketplace**, recipient delivery. On the same promo_codes rail.

7. **Reparaturbonus ZH** — research the Stadt Zürich repair-bonus program (+ George's `dev/reparaturbonus-zh` repo; city didn't select us but we're building it anyway) and integrate bonus redemption so customers can use it on our site.

8. **Remove orphaned pro-repairer flow** (~40 files: `/api/repairer/apply`, admin review UI, approve/reject/request-changes, certifications/documents sub-flows, schema) — also removes the Freigaben "Techniker" tab remnants + dashboard action-item.

9. **Email follow-ups** (in `docs/EMAILS.md`) — paid-workshop + paid-appointment webhook confirmations, marketplace double-emails (apply `skipEmail`), time-off requester ack, `task_assigned` SSOT drift.

10. **GNU Taler + other payment rails** — wire as far as possible NOW (adapter registry already exists) so they're ready the moment external deps (creds/backend/store) are provided. Don't wait on things needing the team.

11. **AI email assistant** — inbox copilot on the HIRN RAG assistant + IMAP (Thunderbird/shared inbox, credential via user, never plaintext to Claude) + Nextcloud Talk. Spec as its own initiative.

12. **Deliverability (ops, user's task)** — authenticate `revampit.ch` in Brevo (SPF/DKIM/DMARC) so external emails actually land. Until then, prefer in-app notifications.
