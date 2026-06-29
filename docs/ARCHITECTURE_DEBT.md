# Architecture Debt — Parallel Implementations + Spaghetti Patterns

**Created:** 2026-06-04  
**Last Modified:** 2026-06-29  
**Last Modified Summary:** #4 — race-safe lifecycle transition guard (`src/lib/lifecycle`) adopted by IT-Hilfe + orders + appointments (Phase 1)

**Last updated:** 2026-06-15 (auth/onboarding cleanup + notification pipeline closed)

**Session progress (QQ + RR commits, 2026-06-04/05):**
- #1 (decision systems): ✓ DONE. Migration 086 applied (protocol FK on
  `decisions`). `DecisionBridge` + standalone voting cut over in QQ.6.
  **Phase AG (2026-06-15):** `POST /api/decisions/[id]/create-task`
  closes the loop to linked follow-up tasks. **RR.3 (2026-06-15):**
  removed legacy `/api/protocols/[id]/decisions/*` routes,
  `protocols-voting.ts`, and Drizzle schemas; apply migration
  `087_drop_protocol_decision_legacy.sql` on each environment.
- #2 (IT-Hilfe notifications): ✓ DONE (2026-06-15). `src/lib/it-hilfe/notifications.ts`
  routes all per-user sends through `notifyUsers()`. Central
  `getEmailContent()` dispatches IT-Hilfe types to rich HTML templates.
  The only remaining direct `sendCustomEmail()` is the admin shared inbox
  alert (`REVAMPIT_NOTIFICATION_EMAIL`) — intentional; not a per-user path.
- #3 (status taxonomy): ✓ DONE. Additive `LifecycleStage` layer in
  `src/config/lifecycle-stage.ts`. Maps booking + appointment + IT-Hilfe
  statuses to `pending | active | completed | cancelled`. No existing
  enum changes. Adoption opt-in.

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

## #2 — Two notification pipelines (IT-Hilfe bypasses the central one) — ✓ RESOLVED

**Was the problem:**

- **Central:** `src/lib/services/notifications.ts` — `notifyUsers`,
  `notifyAllStaff`, `createNotification`, `fireNotification`. Sends
  in-app row to `notifications` table + email via the unified `sendEmail`
  pipeline based on user preferences.
- **IT-Hilfe-specific:** `src/lib/it-hilfe/notifications.ts` — previously
  called `sendCustomEmail()` directly + used a different helper
  `createInAppNotifications` from `task-helpers.ts`.

**Resolution (2026-06-15):**

`src/lib/it-hilfe/notifications.ts` now wraps `notifyUsers()` for all
per-user lifecycle events. `getEmailContent()` in the central service
dispatches `NOTIFICATION_TYPES.IT_HILFE_*` to templates in
`src/lib/email/templates/it-hilfe.ts`. `sendItHilfeNotification()` is a
thin wrapper for generic SYSTEM-type alerts.

**Intentional exception:** admin shared inbox (`REVAMPIT_NOTIFICATION_EMAIL`)
still uses `sendCustomEmail()` — one email to `info@…`, not per-user rows.

**Tests:** `src/lib/it-hilfe/__tests__/notifications.test.ts`

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

## #4 — Lifecycle transition engine (request→accept→complete→review)

**Status:** Phase 1 ✓ DONE (2026-06-29). Phase 2 deferred.

The three flows — IT-Hilfe peer-repair, service appointments, marketplace
orders — are each "a row with a `status` column moving through role-gated
actions". They independently re-implemented the read-validate-write step, and
only IT-Hilfe did it race-safely (and duplicated that 3×). Decided model:
**"shared core, separate flows"** — share the engine, keep the three
transition tables + side-effects distinct.

**Phase 1 — race-safe transition guard (`src/lib/lifecycle/guardedTransition`):**
`SELECT … FOR UPDATE` → re-check the precondition under the lock → run the
flow's writes in the same transaction. `check(row, tx)` can read a second
entity in the same tx (IT-Hilfe re-reads offer status — without `FOR UPDATE`,
serializing on the request row). All three flows route through it:
- IT-Hilfe (`accept-offer.ts`, `complete`, `confirm-review`) — collapsed the 3×
  hand-rolled lock blocks; behavior-preserving (`createReview` stays post-commit).
- Marketplace orders (`PATCH` + `confirm-receipt`) — both lock the same order
  row, fixing a latent **double Payrexx-capture / double `total_sold`** on
  concurrent or double-clicked completion. `captureTransaction` runs inside the
  lock (relies on Payrexx idempotency by transaction id).
- Appointments (`executeAppointmentUpdate`) — now takes `expectedStatus`;
  generalized the `rate`-only compare-and-set to all transitions.

**Phase 2 — deferred:** a declarative transition-table validator to replace the
orders `STATUS_TRANSITIONS` matrix + appointments `buildActionUpdate` switch.
IT-Hilfe's `VALID_REQUEST_TRANSITIONS` stays as-is (its OPEN→MATCHED is a
two-entity offer acceptance, not a single-row transition).

---

## Other findings (minor)

- **Permission system** correctly migrated from ROLES to permissions.ts;
  no duplication. Old ROLES marked deprecated. Clean.
- **Marketplace listings split** (`inventory.marketplace_listings` vs
  `marketplace.listings`) is intentional — RevampIT shop vs P2P
  marketplace are two storefronts by design. Documented in CLAUDE.md.
- **Service appointment dashboard routes** — unified under
  `src/config/service-appointments.ts` (`/dashboard/appointments/*`).
  Legacy `/dashboard/bookings/*` permanent-redirects; notification bell
  and customer emails deep-link to `/dashboard/appointments/[id]`.
  Admin detail at `/admin/appointments/[id]`. Pay flow:
  `POST /api/appointments` → quote → `POST /api/appointments/[id]/pay`.
  Payrexx return UX via `PaymentReturnBanner` + `usePaymentReturnBanner`.
- **Marketplace RevampIT checkout** — cart is the primary path;
  listing detail no longer shows a duplicate “buy now” for shop stock.
- **IT-Hilfe browse link** — technician dashboards use
  `IT_HILFE.routes.browseRequests` (not deprecated `browse` alias).
- **Escaped-bracket directory artifact** at
  `src/app/api/admin/repairer-applications/\[id\]/` is a filesystem
  ghost from a past `cp`/git operation. Contains empty `reject/` and
  `request-changes/` folders, no route.ts. Manual cleanup needed
  (`rm -rf 'src/app/api/admin/repairer-applications/\[id\]'`) — the
  sandboxed agent shell rejects the deletion. Harmless to leave.

---

## Execution order recommendation

All three items are resolved as of 2026-06-15. Re-open this doc when a
new parallel-implementation pattern is discovered.
