# Architecture Debt — Parallel Implementations + Spaghetti Patterns

**Last updated:** 2026-06-04 (after spaghetti subagent audit on commit `a8d7d225`)

The codebase has three significant parallel-implementation patterns that
should be merged. Each requires careful migration work — listing them
here as actionable roadmaps so future sessions can execute methodically
instead of starting cold.

Pattern of work for each: investigate → write migration plan → land
preparatory changes (additive schema, feature flag, dual-write) →
gradual migration → flip the switch → delete the old path.

---

## #1 — Two decision/voting systems (highest priority)

**The problem:**

- **Protocol-embedded:** `protocol_decision_votes` + `protocol_decision_outcomes`
  tables. Routes at `/api/protocols/[id]/decisions/{vote,close,propose,create-tasks}`.
  Services: `src/lib/services/protocols-voting.ts`. Vote shape: thumbs
  up/down per `action_item_id` (string ID from the AI-extracted action
  items in `meeting_protocols.structured_notes`).
- **Standalone:** `decisions` + `decision_votes` tables. Routes at
  `/api/decisions/[id]/{votes,transition,comments,send-invitations}`.
  Services: `src/lib/services/decisions-*.ts`. Vote shape: flexible
  `voteData` jsonb supporting 6+ voting methods (single choice, ranked,
  range, dot points, etc.) with options stored on the decision.

These are conceptually the same thing — a team votes on a proposal —
but evolved as two systems because the standalone one was too heavyweight
to embed in a meeting protocol's "let's quick-vote on this action item"
moment.

**The fix (proposed):**

Make protocol decisions create *standalone* decisions linked back via
new `protocol_id` + `action_item_id` columns on the `decisions` table.
The protocol UI surfaces them inline using the existing standalone
voting widget. Eventually drop the `protocol_decision_*` tables once
the data is migrated.

**Migration plan:**

1. **Schema (additive):** new migration adds nullable `protocol_id` (uuid
   FK to `meeting_protocols.id`) and `action_item_id` (text) to
   `decisions`. Index on `(protocol_id, action_item_id)`.
2. **Voting method:** add `'thumbs_up_down'` to `VOTING_METHODS` in
   `src/config/decisions.ts`. The standalone tally logic in
   `decisions-voting.ts` learns to compute it from `voteData` shape
   `{ choice: 'up' | 'down' }`.
3. **Protocol UI:** in `ProtocolDetailClient.tsx`, replace the
   `DecisionActions` component (lines around 230) with a thin wrapper
   that:
     - When user clicks "Propose as decision" on an action item → creates
       a standalone decision via `POST /api/decisions` with
       `protocol_id`, `action_item_id`, `voting_method='thumbs_up_down'`,
       title from action item description.
     - Renders the existing standalone voting widget for any decision
       FK-linked to this protocol.
4. **Data migration:** SQL migrating existing `protocol_decision_votes`
   rows into `decision_votes` rows (with new `decisions` rows for each
   distinct `(protocol_id, action_item_id)`).
5. **Cutover:** the four endpoints
   `/api/protocols/[id]/decisions/{vote,close,propose,create-tasks}`
   become thin proxies to the standalone equivalents. (Or are deleted
   if all UI callers update to the standalone routes.)
6. **Cleanup:** drop `protocol_decision_votes` and
   `protocol_decision_outcomes` tables. Remove `protocols-voting.ts`.

**Estimated effort:** 6-10 hours single focused session. Risk: data
migration. Mitigation: dual-write phase + read from new path with old
as fallback.

---

## #2 — Two notification pipelines (IT-Hilfe bypasses the central one)

**The problem:**

- **Central:** `src/lib/services/notifications.ts` — `notifyUsers`,
  `notifyAllStaff`, `createNotification`, `fireNotification`. Sends
  in-app row to `notifications` table + email via the unified `sendEmail`
  pipeline based on user preferences.
- **IT-Hilfe-specific:** `src/lib/it-hilfe/notifications.ts` — calls
  `sendCustomEmail()` directly + uses a different helper
  `createInAppNotifications` from `task-helpers.ts`. Both create in-app
  rows and send emails, but via uncoordinated code paths.

Risk: email-preference checks, retries, and logging differ between the
two. Users who opted out of emails may still get IT-Hilfe ones (or vice
versa). Maintenance burden: a change to "how we notify someone" has to
touch two files.

**The fix:**

Replace direct `sendCustomEmail()` calls in IT-Hilfe with the central
`notifyUsers()` / `notifyAllStaff()` API. The central API already
supports a `metadata` field for type-specific email-template selection
— IT-Hilfe templates plug in via `getEmailContent()` in the central
service (already there for decision-specific templates, just needs the
IT-Hilfe types added).

**Migration plan:**

1. In `src/lib/services/notifications.ts:getEmailContent()`, add cases
   for the IT-Hilfe notification types (`it_hilfe_new_offer`,
   `it_hilfe_offer_accepted`, etc.) returning the existing template
   functions from `src/lib/email/templates/it-hilfe.ts`.
2. Refactor `src/lib/it-hilfe/notifications.ts` — replace each
   `sendCustomEmail(...)` block with `notifyUsers(...)` call carrying
   the type + metadata needed for the template.
3. Verify in-app rows still land via the central service.
4. Delete the now-unused parts of `it-hilfe/notifications.ts`.

**Estimated effort:** 3-4 hours focused. Risk: email content drift if
template signatures don't quite match — testable via the existing
notification tests.

---

## #3 — Three booking/appointment status enums

**The problem:**

- `src/config/booking-status.ts` — repair appointments
  (`requested → accepted → quoted → quote_approved → in_progress → completed`,
  plus rejected/cancelled). 9 states + 2 aliases.
- `src/config/appointment-status.ts` — service appointments / generic
  bookings (`pending_approval → requested → confirmed → in_progress → completed`,
  plus cancelled). 6 states.
- IT-Hilfe — request/offer/matches state lives in its own module
  (`src/config/it-hilfe.ts`), no shared enum.

The three describe similar lifecycles but with subtly different states
and label maps. Code that crosses paths (e.g. an email template that
displays an appointment status) has to know which enum to use.

**The fix:**

Probably not a full merge — these *are* conceptually different (repair
booking ≠ generic service appointment ≠ peer-help request). What's
needed is a shared **status taxonomy** at a higher level:

```
LifecycleStage: pending | active | completed | cancelled
```

Each subsystem maps its specific states to a lifecycle stage. Code that
doesn't care about the specifics (badges, generic "is this done?" checks)
operates on lifecycle stage; code that does care (e.g. the quote
approval flow in repair bookings) keeps its specific enum.

**Estimated effort:** 2-3 hours. Risk: minimal — additive layer, doesn't
change existing enums.

---

## Other findings (minor)

- **Permission system** correctly migrated from ROLES to permissions.ts;
  no duplication. Old ROLES marked deprecated. Clean.
- **Marketplace listings split** (`inventory.marketplace_listings` vs
  `marketplace.listings`) is intentional — RevampIT shop vs P2P
  marketplace are two storefronts by design. Documented in CLAUDE.md.
- **Repairer profiles vs IT-Hilfe helpers** are separate by design —
  different verification/payment models. Could be documented better.
- **Escaped-bracket directory artifact** at
  `src/app/api/admin/repairer-applications/\[id\]/` is a filesystem
  ghost from a past `cp`/git operation. Contains empty `reject/` and
  `request-changes/` folders, no route.ts. Manual cleanup needed
  (`rm -rf 'src/app/api/admin/repairer-applications/\[id\]'`) — the
  sandboxed agent shell rejects the deletion. Harmless to leave.

---

## Execution order recommendation

If picking up this work in a future session:

1. **#1 first** (decision systems) — the user has explicitly called this
   out and the data shape is well-understood. Migration is bounded.
2. **#2 next** (notifications) — smaller, mechanical, no schema changes.
3. **#3 last** (status taxonomy) — additive, lowest urgency.

Each can be a separate session ending in a deployable commit. Don't try
to do more than one of these in a single session — each has enough
edge cases that focused attention matters.
