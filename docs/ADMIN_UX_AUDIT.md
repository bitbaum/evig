# Admin UX audit — first principles (Musk lens)

**Date:** 2026-06-03
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
| Timecards inline day-edit (delete aside panel) | medium | Layout rewrite; risk of breaking mobile flow |
| Tasks form: 11 fields → 5 | medium | Need to know which fields admin actually uses |
| Protocols input wizard → single form | medium | Need to verify staff actually have raw content ready (vs benefit from guided flow) |
| Protocols decision voting → "approve + create tasks" 2-button | large | 4 API routes to consolidate; deep workflow change |
| ProtocolDetailClient split by state | large | 357-line refactor; should follow a test-first approach |
| Team form compression (compensation/talent/availability sections) | medium | HR adoption signal needed before cutting fields |

## Things that are actually well-done (don't regress)

- **Status sorting hierarchy** on tasks (needs_attention → requested → in_progress → idle) — first-principles correct
- **Task completion history** with who/when/duration/notes — auditable
- **Timecards status workflow** (draft → submitted → approved/rejected) — clean
- **Team list** scannable initialed avatars
- **Protocol review checklist** (`getProtocolReviewChecklist`) — compact signal
- **Permission-based field gating** on team profile — super-admin fields properly gated

---

## Execution log (Phase Y, this session)

(filled in after the quick wins land — see commit)
