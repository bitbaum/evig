# Team Transparency — Implementation Plan

> **North star:** Nobody on the team should ever have to ask *"what is X working on?"* again.
> The answer — who is doing what right now, and what they have delivered — must live in **one place**, stay **fresh without manual upkeep**, and be **visible team-wide**.

---

## 0. Read this first (for the executing agent)

- Read `/CLAUDE.md`, `/.claude/CLAUDE.md`, and `~/.claude/CLAUDE.md` before touching anything. SSOT, DRY, SoC, design discipline, Swiss German (ss not ß, real umlauts), `TABLE_NAMES`, parameterized SQL, `logger` not `console.log` — all non-negotiable.
- **This is a WIRING + GAP-FILL task, not a greenfield build.** ~80% of the data model already exists. Do **not** create parallel tables, new status enums, or a new assignment system. Extend what's there.
- Ship in phases. **Phase 0 delivers real value with ZERO schema changes** — it's pure read-side wiring of existing data. Do it first.

---

## 1. Why "what is X working on?" keeps getting asked

Three root causes — the design must fix all three, or it fails:

1. **Not captured in one ground-truth place.** Assignments live in `tasks.assigned_to`; a free-text "current focus" lives in `team_profiles.current_focus`; delivered artifacts (reports, presentations, mockups) are loose static files (e.g. `public/presentations/`). No single surface joins them.
2. **Captured but stale.** `team_profiles.current_focus` is free-form text a person must remember to update. It has a `current_focus_updated_at` timestamp but nothing surfaces staleness, and it is decoupled from the person's actual `tasks`. So it rots.
3. **Captured but not visible team-wide.** `PersonalSection` (dashboard) shows **only your own** tasks. `TeamActivityFeed` shows recent *actions* (timecards, approvals) but **not assignments or focus**. There is no "who-is-on-what" board anyone can open.

---

## 2. What ALREADY exists — REUSE, do not rebuild

| Concern | Where it lives | Notes |
|---|---|---|
| **Identity SSOT** | `user_profiles` (`src/db/schema/auth.ts:118-182`) | `display_name`, `avatar_url`, `bio`, `is_verified` — per-person, since migrations 121/122. All roles read identity from here via join. |
| **Staff profile** | `team_profiles` (`src/db/schema/team.ts:10-89`) | `position`, `department`, `skills[]`, `availability`, `working_hours`, `work_state` (active/on_leave/unavailable/inactive), **`current_focus` + `current_focus_updated_at`**, `show_on_about`, `is_active`. |
| **Tasks (staff work)** | `tasks` + `task_projects` + `task_requests` + `task_completions` (`src/db/schema/tasks.ts`) | `assigned_to`, `current_status` (idle/needs_attention/requested/in_progress), `priority`, `due_date`, `category`, `project_id`. Full CRUD at `/admin/tasks` + `/api/tasks`. Status/priority SSOT: `src/config/tasks.ts`. |
| **Activity stream** | `activity_updates` (`src/db/schema/team.ts:123-145`) | category accomplishment/milestone/note, `visibility` team/department/public, `occurred_at`. Built for exactly this — currently underused. |
| **Help requests** | `help_requests` (`src/db/schema/team.ts:151-180`) | staff-to-staff asks; broadcast/targeted. |
| **Admin section registry** | `src/config/sections.ts` (SSOT) | Add a section here → sidebar + permissions auto-wire. `team` and `tasks` sections already exist. |
| **Admin UI primitives** | `AdminTable`, `AdminListShell`, `TaskFiltersClient`, `TaskTable`, status/priority color maps (`src/config/tasks.ts:141-163`) | Reuse for any new list/board view. |
| **Personal widget** | `PersonalSection` (`src/components/admin/dashboard/PersonalSection.tsx`) | Shows only *your* open tasks — the seed to generalize into a team view. |

**The `/admin/team` page already exists** (`src/app/admin/team/page.tsx`) with member cards, filters, and a "staff without profiles" prompt. Build on it.

---

## 3. The gap (precisely what's missing)

1. **No team-wide "who is on what" surface.** `PersonalSection` is self-only.
2. **`current_focus` is manual free-text, decoupled from real tasks** → goes stale, no freshness signal.
3. **No home for delivered artifacts** (reports, presentations, mockups). They're loose files with no owner, no link to the task/person, and no way to browse "what has George delivered."

---

## 4. Design

### 4.1 Transparency has two halves — capture both

- **In‑progress** (what someone is doing *now*): active `tasks` assigned to them + a one‑line narrative "focus" headline.
- **Delivered** (what they *produced*): a browsable list of deliverables (report / presentation / mockup / doc / link), each owned by a person and optionally linked to a task or task-project.

A person's profile and the team board must show **both**. In-progress answers "what are you doing"; delivered answers "what have you done" — together they end the question for good.

### 4.2 Current focus = ground truth + narrative + freshness (fixes root cause #2)

Do **not** rely on manual free-text alone. Show, per member, in priority order:

1. **Active tasks** (auto, ground truth): `SELECT ... FROM tasks WHERE assigned_to = $1 AND is_completed = false AND current_status != 'idle'`. This is always accurate because it comes from real work, not memory.
2. **Focus headline** (manual, narrative): the existing `team_profiles.current_focus`, one line, big-picture (e.g. *"Kivi-API-Recherche + Marketplace-Weiterentwicklung"*). Surface `current_focus_updated_at` as a **freshness badge** — subtle "aktualisiert vor 3 Tagen" / a muted "veraltet" pill after N days (config constant, e.g. 14). One-click inline edit so updating is frictionless.
3. **Recent activity** (auto): last few `activity_updates` for that user (visibility team+).

Net effect: even if someone never updates their headline, their **active tasks still reveal what they're doing.** There is always a ground-truth source.

### 4.3 Member profile (internal) — one screen per person

Route: extend the existing team detail page (`/admin/team/[id]`), or add `/admin/team/[id]` if only a card exists. Sections:
- **Header**: avatar + display_name (from `user_profiles`), position + department + work_state (from `team_profiles`), availability / working_hours.
- **Fokus**: the 3-layer focus block from §4.2.
- **Aktive Aufgaben**: their open tasks (reuse `TaskTable`, filtered by assignee — link to existing task detail pages).
- **Skills**: `team_profiles.skills[]`.
- **Deliverables**: their delivered artifacts (§4.6).
- **Aktivität**: their `activity_updates` feed.

### 4.4 Team board — "Wer macht was" (fixes root cause #3)

New admin page under the existing `team` section (or a sub-route `/admin/team/board`). One screen, everyone visible:
- A card per active staff member: avatar, name, work_state, focus headline (+ freshness), active-task count, top 1–2 active tasks, last activity.
- Filter by department / work_state / has-stale-focus.
- Click a card → member profile (§4.3).
- This is the page you open in the IT‑Sitzung to walk the team through current work.

### 4.5 Dashboard widget — generalize `PersonalSection`

Add a **"Team aktuell"** widget to the admin dashboard (`src/app/admin/page.tsx`) beside the existing personal section: compact per-member active-task counts + focus, linking to the board. Keep `PersonalSection` (personal view) as-is; this is the team view it never had.

### 4.6 Deliverables — a small new table (fixes root cause #3, delivered half)

This is the one genuinely new entity. It answers "store presentations/reports/mockups properly and show them" (a need raised repeatedly). Keep it minimal (KISS/YAGNI):

```
deliverables
  id            uuid pk
  owner_user_id uuid  fk -> users.id        (who produced it)
  title         text  not null
  description   text
  type          text  not null              -- report | presentation | mockup | document | link | other  (SSOT enum in src/config/deliverables.ts, validated by zod at the write boundary — NOT a SQL CHECK, per CLAUDE.md §DB)
  url           text                          -- link or stored file path (see §4.6 storage)
  task_id       uuid  fk -> tasks.id  null    (optional link to the work)
  task_project_id uuid fk -> task_projects.id null
  status        text  not null default 'delivered'  -- draft | delivered
  visibility    text  not null default 'team'        -- team | public
  delivered_at  timestamptz
  created_at / updated_at
```

- **SSOT for type/status/visibility enums:** new `src/config/deliverables.ts` (labels, options, colors) — mirror the shape of `src/config/tasks.ts`. Validate with zod at the API boundary. No SQL CHECK constraints (see CLAUDE.md DB rules — enums live in config+zod).
- **Storage — two layers (SoC):**
  - **Source of truth (editable, versioned):** the `deliverables/` folder in the repo, one dated slug per deliverable (`deliverables/<YYYY-MM-DD>-<slug>/` + a short README). This is where the programmer creates/edits the work product as code. See `deliverables/README.md`.
  - **Shareable record (the DB row):** `url` points at whichever rendering fits the audience — an uploaded file via `/api/uploads` (R2), a hosted preview link (Claude Artifact), a public path (`public/presentations/*`), or the git source path. Existing static `public/presentations/*` can be registered as `type='presentation'` rows pointing at their public path (backfill script or a one-time admin action). Presentations stay physically in `public/` (web-served) but are indexed here so everything is browsable in one place.
- **Admin CRUD:** follow the tasks pattern exactly — `/admin/deliverables` (list + filters), `/admin/deliverables/new`, `/admin/deliverables/[id]`; `/api/deliverables` (`withAdmin('deliverables')`) + `/api/deliverables/[id]`. Register a `deliverables` section in `src/config/sections.ts`.
- Creating a deliverable optionally emits an `activity_updates` row (category `accomplishment`) so it also shows in the activity feed — one write, two surfaces.

> **Leaner alternative if you want to defer the table:** add `link_url` + `link_type` to `activity_updates` and treat a "delivered" activity as a deliverable. Cheaper, but you lose easy browse/filter-by-type and an ownable lifecycle. **Recommendation: build the small table** — browsing "all reports" / "George's deliverables" is a stated need and passes the clarity test.

### 4.7 Adoption — the system is only as good as its data

Transparency dies if nobody logs work. Bake in low friction:
- **Seed real data on day one** (see §9) so the board is populated and useful immediately, not an empty shell.
- **One-click focus edit** and **quick "log activity" / "add deliverable"** actions from the dashboard, so updating takes seconds.
- **Freshness nudge**: on the personal dashboard, if `current_focus` is stale (> N days) show a gentle "Aktualisiere deinen Fokus" prompt. No nagging, one dismiss.
- Walk the board in the recurring IT‑Sitzung — social reinforcement beats tooling.

### 4.8 Review, feedback & the agent loop

The deliverable **detail page** (`/admin/deliverables/[id]`) is the review hub and the thing you share. Design feedback to be **agent-ready from day one** so iteration can eventually be automated without a rebuild.

**Sharing (two audiences):**
- **Internal staff** → the in-app detail page (logged in; feedback lands directly in the store).
- **External recipient** (partner, or an external recipient who consumes the output in another system) → a **tokenized share link** (`share_token`): read + comment, no login. Preferred over an Artifact here because it captures feedback back into the structured store. (An Artifact remains fine for a pure throwaway preview.)

**Feedback model (lightweight, not a tracker):** a thread of `deliverable_feedback` items with two verbs —
- `comment` — free text.
- `change_request` — structured: `target` (which part) + `body` (requested change) + rationale, with `status` open/addressed/wontfix.
- plus an overall per-reviewer `approval` (approve / request-revision).
Notify the owner via existing `createNotification`. External comments (via share link) or transcribed IRC/email both land as the same structured items.

**The agent brief — the whole bridge.** An agent needs exactly three things; store exactly those and expose them from one endpoint `GET /api/deliverables/[id]/agent-brief`:
1. **What to change** — the open `change_request` items.
2. **Where** — the deliverable's `source_path` (its `deliverables/<slug>/` git folder).
3. **Context** — deliverable meta (title, type, description, current_version).

Returns a ready-to-run prompt (+ the structured JSON). Automation is then a **maturity ladder**, not a redesign — the brief is identical at every rung:
- **L0 (build now, manual):** a **"Copy agent brief"** button on the detail page. Paste into Claude Code → agent edits `deliverables/<slug>/` → commits v+1 → status → `revising`→`in_review`.
- **L1 (later, semi-auto):** an **"An Agent senden"** action fires the brief at a FleetCrown agent (RemoteTrigger / SendMessage / job queue); agent edits, opens a branch/new version, sets status back to review; human approves.
- **L2 (future, auto):** "Request revision" with ≥1 open change_request auto-enqueues the agent; it produces v+1 and pings reviewers. Human in the loop only at final approve.

Build L0 in Phase 1. L1/L2 change only *who calls the endpoint and what happens after* — no data/brief changes.

---

## 5. Data-model changes (keep minimal)

- **No new status enums** — reuse `src/config/tasks.ts`.
- **No new assignment table** — reuse `tasks.assigned_to`.
- **No change to identity** — `user_profiles` stays the identity SSOT; join for name/avatar/verification.
- **New:** `deliverables` table + `src/config/deliverables.ts` (§4.6). Beyond the §4.6 columns, add for the review/agent loop (§4.8): `source_path` (git folder), `status` (draft/in_review/revising/approved), `share_token` (nullable, external link), `current_version` (int).
- **New:** `deliverable_feedback` table (§4.8): `id`, `deliverable_id` FK, `author_user_id` FK (nullable for external), `kind` (comment/change_request/approval), `target` (nullable text), `body`, `status` (open/addressed/wontfix/approved), `created_at`. Enums in `src/config/deliverables.ts` + zod, **no SQL CHECK**.
- One migration in `scripts/db/migrations/` (next sequential number) for both tables. **Do NOT `drizzle-kit push`** — write the `.sql`, replay from zero in a throwaway pgvector container, then let the self-host deploy apply it.
- **New read queries/aggregations only** for the board/widget (grouped by `assigned_to`). No writes to existing tables beyond the optional `activity_updates` emit.
- Add `deliverables` to `TABLE_NAMES` (`src/config/database.ts`).

---

## 6. Phased implementation (each phase independently shippable)

### Phase 0 — Team board + widget (READ-ONLY, zero schema change) ⭐ do first — ✅ SHIPPED (2026-07-13)
Pure wiring of existing `tasks` + `team_profiles` + `activity_updates`.
- ✅ `src/app/admin/team/board/page.tsx` — the "Wer macht was" board (§4.4). Server component; active tasks grouped by assignee + `current_focus` (+ freshness) + latest activity. Server-side filters (Abteilung / Status / Fokus veraltet) via search params, no client JS. Non-sensitive `team-board` section (`alwaysForStaff: true`) so every staff member can read it; drill-in to `[id]` stays gated by the sensitive `team` section.
- ✅ Member profile (§4.3): the `[id]` detail already had Aufgaben + Aktivität tabs and an editable `CurrentFocusInput` (§4.2 one-click edit). Added the **freshness badge** ("vor 3 Tagen" / "veraltet") to `CurrentFocusInput`, fed by `current_focus_updated_at`.
- ✅ `src/components/admin/dashboard/TeamCurrentWidget.tsx` — "Team aktuell" dashboard widget (§4.5), mounted in `src/app/admin/page.tsx` under `PersonalSection`. One query, excludes the viewer, self-hides when empty, links to the board.
- ✅ Freshness SSOT: `src/lib/team/focus-freshness.ts` (`FOCUS_STALE_DAYS = 14`, `focusFreshness()`), unit-tested. Also added the missing `WORK_STATE_*` label/colour SSOT to `src/config/team.ts`.
- **Value delivered:** the question is answerable from existing data, immediately.
- **Verification:** `tsc` 0 errors · ESLint clean · `lint:umlauts` clean · `focus-freshness` jest suite green. Not yet deployed (deploy is user-gated).

### Phase 1 — Deliverables + review hub + agent brief (L0)
- Migration: `deliverables` + `deliverable_feedback` tables. Config: `src/config/deliverables.ts`. `TABLE_NAMES` entries.
- Section in `src/config/sections.ts` (`deliverables`, grouped with `tasks` + team board — a "Team & Arbeit" cluster).
- CRUD pages + API (tasks pattern). Zod schema `src/lib/schemas/deliverables.ts`.
- **Detail page = review hub** (§4.8): preview/download, meta, version, structured feedback thread (comment / change_request / approval), owner notification via `createNotification`.
- **Tokenized external share link** (`share_token`): read + comment, no login — for external recipients.
- **Agent brief endpoint** `GET /api/deliverables/[id]/agent-brief` + a **"Copy agent brief"** button (L0). This is the whole automation bridge; L1/L2 reuse it unchanged.
- Backfill existing `public/presentations/*` as deliverable rows.
- Surface deliverables on member profile + optionally the board.

### Phase 2 — Freshness, self-service polish & agent trigger (L1)
- Stale-focus nudge on personal dashboard (§4.7).
- Inline one-click `current_focus` edit from the profile/board.
- Quick "activity" / "deliverable" add actions.
- **"An Agent senden" (L1, §4.8):** fire the agent-brief endpoint at a FleetCrown agent (RemoteTrigger / SendMessage / job queue); agent edits `deliverables/<slug>/`, opens a branch/new version, sets status back to `in_review`. (L2 auto-enqueue is future — no data changes needed.)
- (Optional) public team page `/[locale]/team` + `/[locale]/team/[id]` — mirror the technician public-profile pattern (join users + user_profiles + team_profiles where `show_on_about=true`). Only if outward-facing team visibility is wanted; not required for the internal north star.

---

## 7. Guardrails for the executing agent

- Identity ALWAYS from `user_profiles` via join — never duplicate name/avatar/verification onto `team_profiles` or `deliverables`.
- Status/type/priority/visibility enums live in `src/config/*` + zod at the write boundary. **No SQL CHECK constraints** for app enums (CLAUDE.md DB rules).
- SQL: `TABLE_NAMES` + parameterized only. Drizzle `sql` tag → `sql.raw(TABLE_NAMES.X)` for identifiers.
- Permissions: gate every API with `withAdmin('<section>')`; the `team` section is **sensitive** (super-admin/explicit grant) — decide whether the board is `team`-sensitive or a new less-sensitive `team-board` id. Recommend: board readable by any staff (transparency is the point), HR/compensation stays in the sensitive `team` detail.
- Design: semantic tokens + shared primitives (`Card`, `Button`, `Heading`, `IconBadge`, `Section`, `AdminTable`). No arbitrary hex, no `shadow-lg/xl` on cards, green only for CTA/focus/sustainability. `grep -rn '\[#' src/` stays empty.
- i18n: all user-facing strings → message keys (DE canonical). Structure/enums → config, not messages. Run `npm run compliance:i18n`.
- Migrations reach PROD via `scripts/db/migrations/` only; replay from zero locally first.
- Before done: `npm run typecheck`, `npm run lint`, `npm run lint:umlauts`, relevant tests.

---

## 8. Non-goals (do not do these)

- No new `assignments` / `staff_work` / `todos` table — `tasks` already does this.
- No duplicate status system — reuse `src/config/tasks.ts`.
- No mixing with the **public** `/projects` domain (`projects`, `project_needs`) — that's resource-matching, a different concern. Internal work-grouping is `task_projects`.
- No per-role verification/identity — it's per-person on `user_profiles`.
- No public team page in Phase 0/1 — internal transparency first.

---

## 9. Seed data (dogfood — do this so the board isn't empty)

Create real `task_projects` / `tasks` / `deliverables` for the current team so the board is immediately useful and George's own work is transparent (this is the concrete thing that ends "what is George working on"):

- **task_project:** "Kivi/Kivitendo API-Recherche & Integration" (status `active`) — the Veronica/Dani deliverable, due end of month. Tasks under it: *Kivitendo-API-Recherche*, *Shopware-6-Ist-Zustand aufnehmen*, *Bericht schreiben*.
- **task:** "Kivitendo Sales-Order-Intake UI-Mockup + CSS" (category `it`, assigned George) → on completion, a **deliverable** (type `mockup`) linked to it.
- **task_project:** "Marketplace / Kivvi" — ongoing platform dev.
- Register the API report and any decks as **deliverables** (type `report` / `presentation`) as they're produced.

Once these exist, `George's profile` and the board answer the question by construction.
