# Admin UX audit — first principles (Musk lens)

**Date:** 2026-06-03  
**Last Modified:** 2026-06-25  
**Last Modified Summary:** Timecard submit notifies approvers (in-app + email); submit UX hint + clearer button label; Playwright smoke tests for appointments/payment return.
**Scope:** `/admin/timecards`, `/admin/team`, `/admin/tasks`, `/admin/protocols`
**Method:** 4 parallel expert subagents, each examining one section through the lens of "make requirements less dumb → delete the process step → simplify → reduce cycle time."

## Common pattern across all four sections

1. **God components.** TimecardsClient 635 lines (post recent extraction), ProtocolDetailClient 357 lines, DecisionActions 361 lines, sidebar 700+ LOC. Each one mixes 5–15 concerns in a single file.
2. **Buried action surfaces.** "What needs me now" is always behind a filter or tab. Tasks land on "all 50" not "the 3 urgent ones." Recurring schedule is in detail page, not the list.
3. **Redundant state.** Tasks have `currentStatus` AND `isCompleted` — two signals for the same thing. Timecards: month + week views when the payroll cycle is only month.
4. **Theater steps.** 5-step protocol stepper that's never needed (linear flow). Multi-step protocol intake when one paste-box suffices. Tasks-creation form with 11 fields, most empty.
5. **Modal-per-action friction.** Mark a task done = expand a form, fill duration + notes, confirm. 3 separate inline forms in TaskActionsClient.
6. **Tabs hide good work.** Leave-periods card is the best-designed thing on /admin/team, buried in a tab.

## Verdicts per section

| Section | Verdict | Top 3 cuts |
|---|---|---|
| **Timecards** | Forces choice at every keystroke; month/week toggle is junk; AI-assist distracts | (1) Delete month/week toggle (2) Rename save buttons clearly (3) Inline day-edit, drop aside panel |
| **Team** | Conflates 3 workflows (roster + HR ops + culture); ~40% deletable; leave card is orphaned | (1) Move leave to main profile (2) Compress profile form (3) Separate team-culture from HR ops |
| **Tasks** | Scattered without hierarchy; recurring schedule hidden; broadcast vs targeted indistinguishable | (1) Default filter to needs_attention+requested (2) Add schedule column to list (3) Delete duplicate isCompleted badge |
| **Protocols** | Feature bloat defeats core value; voting/proposal pipeline = 4 API roundtrips for 1 decision | (1) Delete workflow stepper (2) Demote attendee mapping from blocking → advisory (3) Eventually: kill voting UI, collapse to single finalize |

## Highest-leverage quick wins (applying this session)

All pure deletions / SSOT additions, all bounded:

| # | Change | Effort | File |
|---|---|---|---|
| Y.1 | Timecards: delete month/week toggle (week never matches payroll cycle) | quick-win | `TimecardsClient.tsx` |
| Y.2 | Timecards: rename "Save" → "Speichern (Entwurf)" and "Einreichen" → "Zur Prüfung einreichen" | quick-win | `TimecardsClient.tsx` |
| Y.3 | Tasks: delete duplicate `isCompleted` badge in detail page (status is the SSOT) | quick-win | `admin/tasks/[id]/page.tsx` |
| Y.4 | Tasks: default landing filter to "needs_attention OR requested" — persist via localStorage | quick-win | `TaskFiltersClient.tsx` |
| Y.5 | Tasks: surface `schedule_human` in the task list table | quick-win | `admin/tasks/page.tsx` |
| Y.6 | Protocols: delete ProtocolWorkflowStepper (55 lines of theater) | quick-win | `ProtocolWorkflowStepper.tsx` |
| Y.7 | Protocols: demote attendee-mapping warning from blocking card → inline advisory | quick-win | `ProtocolDetailClient.tsx` |
| Y.8 | Team: move leave periods card from tab to main profile view | quick-win | `TeamProfileTabs.tsx`, profile page |

## Deferred (require dedicated branch + team input)

These are real wins but each is medium-to-large with risk of breaking a workflow that's actually in use. Need to validate with the actual users before swinging.

| Item | Effort | Why defer |
|---|---|---|
| ~~Timecards inline day-edit (delete aside panel)~~ | ~~medium~~ | **Done** — Phase AC (`TimecardDayEditor` inline) |
| ~~Tasks form: 11 fields → 5~~ | ~~medium~~ | **Done** — Phase AE |
| Protocols input wizard → single form | medium | Need to verify staff actually have raw content ready (vs benefit from guided flow) |
| ~~Protocols decision voting → inline thumbs UI~~ | ~~large~~ | **Done (UI)** — `DecisionBridge` + standalone decisions (Phase AF); legacy API routes remain |
| ProtocolDetailClient split by state | large | 357-line refactor; should follow a test-first approach |
| ~~Team form compression (default collapse secondary sections)~~ | ~~medium~~ | **Done (UX)** — Phase AF; field removal still needs HR input |

## Things that are actually well-done (don't regress)

- **Status sorting hierarchy** on tasks (needs_attention → requested → in_progress → idle) — first-principles correct
- **Task completion history** with who/when/duration/notes — auditable
- **Timecards status workflow** (draft → submitted → approved/rejected) — clean
- **Team list** scannable initialed avatars
- **Protocol review checklist** (`getProtocolReviewChecklist`) — compact signal
- **Permission-based field gating** on team profile — super-admin fields properly gated

---

## Execution log (Phase Y — commit `93db2e89`)

| # | Change | Result |
|---|---|---|
| Y.1 | Timecards: deleted month/week toggle UI; mode dormant at 'month' | ✓ |
| Y.2 | Timecards: submit button → "Zur Prüfung einreichen"; save already clear | ✓ |
| Y.3 | Tasks detail: removed duplicate `is_completed` badge (status = SSOT) | ✓ |
| Y.5 | Tasks list: replaced "Typ" column with "Zeitplan" (surfaces `schedule_human`) | ✓ |
| Y.6 | Protocols: deleted `ProtocolWorkflowStepper` (dead code, grep-verified) | ✓ |
| Y.7 | Protocols: attendee-mapping warning → neutral advisory | ✓ |
| Y.4 | Tasks: localStorage default filter | **done** (Phase AB — `action_needed` preset = needs_attention ∪ requested; persisted in localStorage) |
| Y.8 | Team: leave card to main profile | **done** (Z.3 + Phase AA persistent profile header) |
| — | Audit hotfix: extended `AuditEventType` union (Phase W.5 helpers) | ✓ (unblocked DB deploy) |

### What's deferred to a dedicated branch

Per the audit reports, the highest-leverage further changes are non-trivial and warrant their own focused session:

| Item | Effort | Why dedicated |
|---|---|---|
| ~~Timecards: drop aside panel, inline day-edit grid~~ | ~~medium~~ | **Done** — `01b59d93` (`TimecardDayEditor` inline below month grid) |
| ~~Tasks: delete standalone analytics page~~ | ~~medium~~ | **Done** — Phase AD redirect; stats on tasks list + `/admin/analytics` |
| ~~Tasks: collapse new-task form 11 → 5 fields~~ | ~~medium~~ | **Done** — Phase AE: 5 core fields + Erweitert disclosure |
| ~~Protocols: kill DecisionActions inline voting~~ | ~~large~~ | **Done (UI)** — Phase AF: `DecisionBridge` promotes to `/admin/decisions/[id]`; legacy `/api/protocols/.../decisions/*` routes remain for API compat until removal |
| Protocols: kill DecisionActions voting flow → "approve + create tasks" 2-button | large | Superseded by DecisionBridge + standalone decisions UX; legacy API cleanup still open |
| Protocols: split ProtocolDetailClient (357 lines) by lifecycle state | large | Refactor; test-first approach |
| ~~Team form compression (compensation/talent/availability sections)~~ | ~~medium~~ | **Done (UX)** — Phase AF: create shows Grunddaten only; edit auto-expands populated sections |
| Team: separate "team roster" from "team culture" | large | New route + IA decision |

---

## Execution log (Phase Z — second batch of Musk cuts)

| # | Change | Result |
|---|---|---|
| Z.1 | Tasks: SQL subqueries for `open_request_count` + `has_open_broadcast`; 📢/👤 emoji badges next to title | ✓ |
| Z.2 | Protocols: deleted `ExternalAIPanel` (`handleImportExternal` was the only caller — same `/process-notes` endpoint is reachable from in-app flow) | ✓ |
| Z.3 | Team: hoisted `TeamLeavePeriodsCard` above the tab strip — HR sees who's away regardless of active tab | ✓ |
| Z.4 | Tasks: top stat cards are now Links (`Gesamt`, `Braucht Aufmerksamkeit`, `Angefragt`) — 1-click filter; `AdminStatsGrid` got optional `href` prop | ✓ |
| Z.5 | Protocols: collapsed wizard gate (`{setupComplete && ...}`) — Inhalt section always visible; `canSubmit` still validates. Deleted 4 orphan step components (`MeetingTypeStep`, `ProtocolDetailsStep`, `InputMethodStep`, `ContentInputStep`) — only re-exported by `index.ts`, no actual consumers | ✓ |

## Execution log (Phase AA — admin contrast & interactive SSOT)

**Date:** 2026-06-15  
**Scope:** Malformed Tailwind opacity utilities, low-contrast active/hover states across admin nav, HR, protocols, tasks, dashboard queue.

| # | Change | Result |
|---|---|---|
| AA.1 | Added `adminInteractive` tokens to `src/lib/admin-ui.ts` (row hover/selected, nav active, avatars, command palette) | ✓ |
| AA.2 | Extended `adminTable.tr` with admin-surface dark hover (replaces broken `/[0.06]/50` strings) | ✓ |
| AA.3 | Team profile: persistent header uses i18n + phone meta; inactive avatar contrast via `adminInteractive.avatarInactive` | ✓ |
| AA.4 | Fixed missed table/list hovers: protocols list, tasks table, dashboard `UnifiedQueue`, command palette | ✓ |
| AA.5 | Public nav: `Projekte` direct link (no dropdown) — matches `navigation.tsx` SSOT comment | ✓ (prior session) |
| AA.6 | Batch-migrated ~70 admin files: all table/list/icon hovers now use `adminInteractive.*` or `adminTable.tr`; zero raw `hover:bg-surface-raised` left under `src/app/admin` and `src/components/admin` | ✓ |

**Last modified:** 2026-06-15 — Phase AB tasks default filter (Y.4).

---

## Execution log (Phase AB — tasks default filter, Y.4)

**Date:** 2026-06-15  
**Scope:** `/admin/tasks` landing experience — show actionable work first, not all tasks.

| # | Change | Result |
|---|---|---|
| AB.1 | Added `TASK_LIST_FILTERS` + `TASK_LIST_DEFAULT_FILTER` preset in `src/config/tasks.ts` | ✓ |
| AB.2 | `getTasks()` applies `action_needed` as `needs_attention ∪ requested` when URL has no status | ✓ |
| AB.3 | `TaskFiltersClient` seeds/syncs `localStorage` (`admin.tasks.statusFilter`) and normalizes bare URL | ✓ |
| AB.4 | Gesamt stat card links to `?status=all` for explicit full list | ✓ |

**Last modified:** 2026-06-15 — Phase AC documents prior timecards inline editor; smoke-tested push.

---

## Execution log (Phase AC — timecards inline editor, audit closure)

**Date:** 2026-06-15  
**Scope:** Close deferred audit item — inline day editing (no aside panel).

| # | Change | Result |
|---|---|---|
| AC.1 | Verified `TimecardDayEditor` inline below `TimecardMonthGrid` (landed in `01b59d93`) | ✓ (already in main) |
| AC.2 | Updated stale `/dashboard/timecards` doc comment (removed month/week toggle reference) | ✓ |
| AC.3 | Smoke: `/` 200, `/admin/tasks` + `/admin/erfassung` → login redirect, typecheck + Y.4 tests pass | ✓ |

**Last modified:** 2026-06-15 — Phase AE tasks form + analytics cleanup.

---

## Execution log (Phase AD — remove standalone task analytics)

**Date:** 2026-06-15

| # | Change | Result |
|---|---|---|
| AD.1 | Replaced `/admin/tasks/analytics` with redirect to tasks list | ✓ |
| AD.2 | Removed redundant Statistiken button from tasks page header | ✓ |
| AD.3 | `/admin/analytics` drill-down now links to tasks list | ✓ |

---

## Execution log (Phase AE — task form compression)

**Date:** 2026-06-15

| # | Change | Result |
|---|---|---|
| AE.1 | Create form shows 5 core fields: Titel, Typ, Kategorie, Beschreibung, Priorität | ✓ |
| AE.2 | Zuweisung, Anleitung, Dauer, Fälligkeit, Tags moved to collapsed Erweitert section | ✓ |
| AE.3 | Edit mode auto-expands Erweitert when any advanced field is populated | ✓ |

---

## Execution log (Phase AF — dependabot + team form compression)

**Date:** 2026-06-15  
**Scope:** Close open Dependabot alerts; compress team profile create flow (fields unchanged).

| # | Change | Result |
|---|---|---|
| AF.1 | npm overrides: `shell-quote@1.8.4` (CVE-2026-9277), `esbuild@0.28.1`, `uuid` → root `$uuid` (exceljs nested 8.3.2) | ✓ |
| AF.2 | Team create form: only **Grunddaten** open by default; Vergütung/Talent/Verfügbarkeit/Notfall collapsed | ✓ |
| AF.3 | Team edit form: auto-expands sections with existing data (mirrors Phase AE task form) | ✓ |
| AF.4 | Audit: document `DecisionBridge` (QQ.6) as replacement for inline `DecisionActions` voting UI | ✓ |

**Last modified:** 2026-06-15 — Phase AG tasks ↔ protocols ↔ decisions bridge.

---

## Execution log (Phase AG — tasks ↔ protocols ↔ decisions bridge)

**Date:** 2026-06-15  
**Scope:** Close the loop from protocol action item → vote → follow-up task.

| # | Change | Result |
|---|---|---|
| AG.1 | `POST /api/decisions/[id]/create-task` — one-click follow-up task linked via `protocol_action_links` | ✓ |
| AG.2 | `DecisionBridge` — closed approved decisions show inline **Aufgabe erstellen**; linked tasks show **Aufgabe verknüpft** | ✓ |
| AG.3 | Decision detail — protocol link badge; one-click create when protocol-linked; **Folgeaufgabe öffnen** when linked | ✓ |
| AG.4 | Task detail — **Aus Protokoll** provenance banner with link back to source protocol | ✓ |
| AG.5 | Finalize dialog warns when accepted decisions lack follow-up tasks | ✓ |

---

## Execution log (Phase AH — legacy protocol decision cleanup, RR.3)

**Date:** 2026-06-15  
**Scope:** Remove dead `protocol_decision_*` code path after QQ.6 + Phase AG bridge.

| # | Change | Result |
|---|---|---|
| AH.1 | Deleted `/api/protocols/[id]/decisions/*` (vote, close, propose, create-tasks, GET) | ✓ |
| AH.2 | Removed `protocols-voting.ts` + tests; Drizzle schemas; `TABLE_NAMES` entries | ✓ |
| AH.3 | Migration `087_drop_protocol_decision_legacy.sql` — drops legacy tables (apply per env) | ✓ |

**Last modified:** 2026-06-15 — Phase AH legacy cleanup + Phase AG bridge.

---

## Execution log (Phase 4 — timecard notifications + E2E smoke)

**Date:** 2026-06-25

| # | Change | Result |
|---|---|---|
| 4.1 | `submitTimecard` → `notifyUsers` to staff with `timecards` / `timecard-approvals` permission (in-app + email) | ✓ |
| 4.2 | `reviewTimecard` → typed `timecard_reviewed` notification + email to submitter | ✓ |
| 4.3 | Time-off approver fan-out aligned with same approver SSOT (was super-admin emails only) | ✓ |
| 4.4 | Submit UX: «Zur Prüfung einreichen», hint text, success copy | ✓ |
| 4.5 | Playwright: `/dashboard/appointments`, payment return banners, admin appointments | ✓ |
| 4.6 | Migration `094_timecard_notification_types.sql` | ✓ |
| 4.7 | Phase 1 closure: `tests/e2e/notification-hrefs.spec.ts` smoke-tests every `RELATED_TYPE_HREFS` base (no HTTP 404) | ✓ |
| 4.8 | `docs/FEATURE_INVENTORY.md` — living 155-item audit SSOT | ✓ |
| 4.9 | Phase 2 IT-Hilfe: hub/anfragen E2E split, full journey spec, Techniker terminology in complete/review APIs | ✓ |

---
