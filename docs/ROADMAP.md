# RevampIT Build Roadmap

Living queue of what we're building. Updated 2026-07-09. Keep in sync as items ship.

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

## 📋 Queue (priority order)

1. **Freigaben full unification** — one `/admin/freigaben` queue driven by the SSOT; **per-type polished review UX** (article ≠ timecard ≠ permission request); reconcile the DASHBOARD's second count engine (`getDashboardStats`/`buildActionItems` still read the dead table) onto the SSOT; filter chips; mobile-first; test every element.

2. **Zeiterfassung de-frankenstein** — it's inconsistent: **day view ≠ month view** logic/behaviour, hardcoded values, ignores design tokens, barely config-driven. Also: the **3 view/entry modes should be first-class options that switch easily** and work as one integrated tool. Fix SSOT/SoC/DRY/config-driven until perfect; mobile-first; test.

2b. **Geräte-Eingang / erfassung intake (NEW)** — `/admin/erfassung` (Geräte-Eingang) looks bad + doesn't work as intended; bring to a normal, polished state. Related: **AI-entry SSOT** — there are multiple AI-quick-entry elements scattered across the site (erfassung KI-Schnelleingabe Text/Sprache/Foto→Analysieren, protocol, intake voice…); consolidate into ONE beautiful reusable SSOT component. Verify **photo + voice entry actually work** (models must be wired via Groq + OpenRouter, not just text). Also: **bulk adding** + **CSV / other-DB migration** paths (does it exist, what are the options).

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
