---
created_date: 2026-06-19
last_modified_date: 2026-07-21
last_modified_summary: added Zeiterfassung & Monatsrapport section (Arbeitsplan=Soll, today marker, honest interim reports, social-worker share link)
---

# HR & Talent Lifecycle Runbook

Volunteer guide for posting roles, reviewing applications, and hiring into the team roster.

## Overview

| Surface | Path | Who |
|---------|------|-----|
| Public careers | `/karriere` | Everyone |
| Admin vacancies | `/admin/hr/vacancies` | Staff with **Team** permission |
| Application inbox | `/admin/hr/applications` | Staff with **Team** permission |
| Team profiles (post-hire) | `/admin/team` | Staff with **Team** permission |

**Config SSOT:** `src/config/hr-vacancies.ts`, `src/config/hr-application-status.ts`

**Migrations:** `097_hr_vacancies.sql`, `098_hr_notification_types.sql`

---

## Publish a vacancy (< 3 minutes)

1. Admin → **Personen** → **Offene Stellen** → **Neue Stelle**
2. Fill: title, role track, description (Markdown ok)
3. Click **Veröffentlichen** (or save draft first)
4. Use **Link kopieren** or **Teilen** on the list card
5. Public URL: `/karriere/[slug]`

### Status semantics

| Status | Public list | Apply |
|--------|-------------|-------|
| Entwurf | Hidden | No |
| Veröffentlicht | Yes | Yes |
| Pausiert | Yes (banner) | No |
| Besetzt | Yes (badge) | No |
| Geschlossen | Hidden | No |

---

## Review applications

1. **Personen** → **Bewerbungen**
2. Filter by pipeline stage (Neu → Sichtung → Gespräch → Angebot) or by vacancy (`?job_posting_id=…` from the vacancy card)
3. Expand a row for track-specific answers and CV reference
4. **Nächste Stufe**, **Ablehnen** (with reason), or **Einstellen**
5. After hire: use **Team-Profil öffnen** in the success banner or on the application card

### Cross-links

| From | To |
|------|-----|
| Vacancy card (Bewerbungen count) | Filtered application inbox |
| Hired application | Team profile (`/admin/team/[id]`) |
| Team profile → **Aufgaben** tab | Onboarding tasks + link to `/admin/tasks?assigned_to=…` |
| Team profile → **Zeiterfassung** | Timecards + approvals queue |
| Admin dashboard | New applications + pending timecard approvals |

### Hire action

**Einstellen** will:

- Create or link a `users` row (guest applicants)
- Create `team_profiles` with employment type from posting track
- Copy skills/goals from application where possible
- Mark application **Eingestellt**
- Mark vacancy **Besetzt**
- Spawn onboarding tasks from `ONBOARDING_TASK_TEMPLATES` (config)

---

## Role tracks

| Track | Public form extras |
|-------|-------------------|
| Freiwilligenarbeit | Hours/week |
| Praktikum | School, duration, learning goals |
| Anstellung | Experience, work permit, CV (PDF) |
| Wiedereinstieg | Situation, support needs |
| Auftrag | Portfolio, project interest |

Get-involved pages link to filtered `/karriere?track=…`.

---

## About page — named leads only

On **Team-Profil bearbeiten**, enable **Auf About-Seite anzeigen** for leadership names only. No full staff directory.

---

## Zeiterfassung & Monatsrapport

Time tracking for supported/employed staff. The month-end report doubles as the
document sent to a referring social worker (Arbeitsintegration).

### Surfaces

| Surface | Path | Who |
|---------|------|-----|
| Self-service timecard | `/admin/zeiterfassung` | The staff member (own card) |
| Approval queue | `/admin/team/approvals` | Staff with **timecards** permission (or super-admin) |
| Monatsrapport (printable) | `/admin/team/report/[userId]/[month]` | Owner or timecard approver |
| Public report (no login) | `/r/[token]` | Anyone with the link (social worker) |

**SSOT:** engine `src/lib/team/saldo.ts` · service `src/lib/services/saldo.ts` ·
report `src/lib/services/report.ts` · share tokens `src/lib/services/report-shares.ts` ·
categories/status `src/config/timecards.ts` · holidays `src/config/holidays.ts`.
**Migrations:** `136_zeiterfassung_ledger_foundation.sql`, `137_report_shares.sql`.

### Arbeitsplan drives Soll — Pensum must reconcile

The **Arbeitsplan** (`team_profiles.working_hours` — which weekdays, which hours)
defines the expected working time. Soll per scheduled day = the person's Pensum
(`employment_periods.weekly_minutes`) split across the scheduled days, so **the plan
and the Pensum must agree**: if the plan sums to 21 h/week the Pensum must be 21 h,
or every filled day shows a phantom deficit. A mismatch surfaces as a warning in the
Saldo strip ("Arbeitsplan weicht vom Pensum ab") — fix it by adjusting the plan
(`#arbeitsplan`) or the Pensum (`/admin/team/me`). Public holidays on scheduled days
reduce Soll automatically; paid absences (Ferien/Krank/…) count as Ist.

The calendar marks **today** (green "Heute" badge, Europe/Zurich). "Monat aus Plan
füllen" fills the month from the Arbeitsplan; the person reviews and submits.

### Approving (four-eyes)

1. **Freigaben** → **Zeitkarten & Abwesenheit** → **Offen** tab
2. **Prüfen** opens the review drawer: see the days, **Bearbeiten** to correct,
   **Genehmigen** / **Zurückweisen** (reason optional), or **Wieder öffnen** an
   approved card back to draft. Each action shows a confirmation and stays on the
   card; a **Monatsrapport öffnen** link is the next step.
3. You cannot approve your own card unless you are a super-admin.

### Monatsrapport → social worker

Open the report, then **Drucken / PDF** (target: "Als PDF speichern"). A **running
month** reports *as of today* ("Zwischenstand per …") and never shows unworked future
days — the numbers match the live dashboard; a finished month reports its closing
state. Months **before the tracking-opening date** (`time_opening_date`) still show
their real Ist/Soll (the month balance, labelled "(Monat)") — never a fake 0.

**Delivery:** the app can't reliably email the PDF (the sending domain is not
SPF/DKIM-authenticated) and social workers can't log in, so use **Freigabe-Link
erstellen** on the report to mint a public `/r/<token>` link — view + print, no login.
**Link deaktivieren** revokes it immediately. Share the link out-of-band.

---

## Retention (GDPR)

Open applications older than **365 days** (`HR_APPLICATION_RETENTION_DAYS`) can be closed by:

```bash
npx tsx scripts/maintenance/hr-application-retention.ts
```

Schedule via cron on production if desired.

---

## Analytics

`GET /api/admin/hr/stats` — counts by status, track, and source (admin session required).

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Apply returns “pausiert” | Vacancy status must be **Veröffentlicht**; deadline not passed |
| Hire fails “Profil existiert” | User already has `team_profiles` — open existing profile |
| HR menu missing | Staff needs `team` permission (or super-admin) |
| Notifications missing | Migration `098_hr_notification_types.sql` applied |

---

## E2E verification

```bash
npm run test -- src/lib/schemas/__tests__/hr-vacancies.test.ts
# Full journey (needs auth env + DB):
npm run test:e2e -- tests/e2e/hr-vacancy-journey.spec.ts
```
