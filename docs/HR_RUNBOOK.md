---
created_date: 2026-06-19
last_modified_date: 2026-06-26
last_modified_summary: HR admin cohesion — stats grid, hire→profile links, team tasks tab, dashboard timecard queue
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
