# Intake & Quality Control — System Design

**Status**: Phase 1 shipped (checklist verdicts, failed state, QC publish gate) · Phases 2–4 planned
**Last Updated**: 2026-07-15

---

## The problem

Devices arrive at RevampIT (donations, drop-offs), get captured into the system,
and — if sellable — must pass quality control before they appear in the shop.
The pipeline mirrors the physical workshop:

```
Empfang → Triage (Stufe) → Werkbank (Tests/Aufbereitung) → Datenlöschung
        → Qualitätskontrolle → Fotos/Inserat → Shop → verkauft
```

Before this design landed, the digital pipeline had three gaps:

1. **Schnellerfassung bypassed QC entirely.** A laptop captured via the quick
   form with "publish" went live in the shop with zero tests.
2. **A checklist item could only be checked or unchecked.** The most important
   QC outcome — a FAILED test — was inexpressible. Failed devices silently
   rotted in "In Bearbeitung" with no recorded reason and no decision path.
3. **No pipeline state for "stuck".** Staff had no way to see which devices
   were blocked and needed a decision (fix & retest vs. re-tier).

## Design principles

- **The checklist is the QC model** (`src/config/intake-checklist.ts` is SSOT).
  No parallel QC table, no second workflow. Verdicts, gates, and the
  QC-required rule all derive from the one item list.
- **QC is a stage, not a place.** No new admin section; the pipeline
  (`/admin/intake`, "Geräte-Eingang") gains a `failed` bucket.
- **Fail is a first-class outcome.** ~40% of devices don't make it to the shop
  (parts/recycling tiers). A recorded fail with a reason and a re-tier decision
  is the audit trail of the value cascade, not an error case.

---

## Phase 1 — shipped in this change

### Checklist verdicts (pass / fail / n.a.)

`intake_checklist` JSONB item states changed shape (migration 132 rewrites
existing rows):

```
before: { completed: boolean,              completedBy, completedAt, notes }
after:  { result: 'pass'|'fail'|'na'|null, completedBy, completedAt, notes }
```

- `pass` / `na` count as done; `na` satisfies a required item (e.g. a webcam
  test on a device without webcam that the category filter didn't catch).
- `fail` **requires a reason** (zod-enforced in `ChecklistUpdateSchema`) and
  blocks publishing.
- `null` = open. Legacy `completed: true` snapshots are still readable via
  `getItemResult()`.

### `failed` pipeline state

- `inventory_items.checklist_failed` — cached derivation (same pattern as
  `checklist_complete`), recomputed by `PATCH /api/admin/intake/[id]/checklist`,
  reset by tier change. True when any **required** item has a `fail` verdict;
  optional-item failures are recorded defects but don't block.
- Derived intake status ladder is now `in_progress | failed | ready | published`
  (`src/config/intake-status.ts`; SQL predicates in
  `src/app/api/admin/intake/route.ts`).
- Pipeline hero treats `failed` as the highest-severity state (urgent tone);
  the detail view shows a decision box: fix & retest, or change tier
  (parts/recycling via the existing `change-tier` route, which resets the
  checklist and records the reason in the timeline).

### QC publish gate (closes the Schnellerfassung loophole)

`requiresQualityControl(category)` — derived from the checklist itself: a main
category requires QC when any **required testing or data-security** item
targets it. Today that resolves to categories 10–60 (Laptops, Desktops,
Monitore, Tablets, Smartphones, Drucker); accessories (70 Komponenten,
80 Peripherie, 90 Netzwerk) and uncategorized items stay direct-publishable.
Adding a required test for a category in the config automatically brings that
category under the gate — no second list to maintain.

Enforced at every publish path:

| Path | Behaviour |
|---|---|
| `createErfassungProduct` with `action='publish'` | QC-required category without tier → intercepted: device gets `refurbish` tier + initialized checklist, stays `draft`, lands in the pipeline. Response carries `qc_required: true`; the erfassung success screen says so honestly. |
| `POST /api/admin/intake/[id]/publish` | 400 `INTAKE_QC_REQUIRED` for tier-NULL devices of QC categories; 400 `INTAKE_CHECKLIST_FAILED` when a required item failed; 400 `INTAKE_CHECKLIST_INCOMPLETE` otherwise unfinished. |
| Detail view (tier-NULL quick capture, QC category) | Publish box replaced by a "Prüfung starten" action (assigns `refurbish` tier via `PATCH`). |

### Files

- Config/SSOT: `src/config/intake-checklist.ts`, `src/config/intake-status.ts`
- Migration: `scripts/db/migrations/132_intake_checklist_verdicts.sql`
  (+ Drizzle `src/db/schema/inventory.ts`)
- API: `src/app/api/admin/intake/**`, `src/lib/erfassung/create-product.ts`,
  `src/app/api/admin/erfassung/route.ts`
- UI: `src/app/admin/intake/**` (tri-state `ChecklistGroup`, failed
  alert/badge/hero), `src/components/erfassung/SuccessScreen.tsx`

---

## Roadmap — next phases (in value-per-effort order)

### Phase 2 — QR labels (physical ↔ digital link)

Every item already gets a human-readable `item_uuid` (`I-YYMMDD-NNNN`) and the
erfassung flow already has a printable factsheet. Add a small QR label
(item_uuid encoded as URL to `/admin/intake?detail=<id>`) printed at capture
time; scanning at any workstation opens the device's checklist. Highest-leverage
workshop UX: no searching, no mismatched devices.

### Phase 3 — buyer-facing test results

`listings.verified_at/verified_by` and `listings.condition_checks` (jsonb,
migration 043) exist but are disconnected from intake. On
`publishRevampitListing`, copy the passed checklist verdicts into
`condition_checks` and set `verified_at`. The marketplace listing then shows
"✓ Geprüft: Akku-Test bestanden, Daten gelöscht (NIST 800-88), Linux
installiert" — the buyer-visible payoff of the whole pipeline and a real
differentiator vs. untested P2P listings.

### Phase 4 — two-person QA + board view

- `final_qa` must be completed by a different staff member than the majority of
  the other checklist items (compare `completedBy`); enforce in the checklist
  route.
- Optional: pipeline as kanban columns (Eingang → In Prüfung → Bereit → Im
  Shop) with "stuck > X days" indicators, mobile-first (320px+).

### Explicitly not planned

- A stored lifecycle-status column duplicating what
  `marketplace_status + intake_tier + checklist_complete + checklist_failed`
  already express — the derived `INTAKE_STATUS` stays the single derivation
  (SSOT: predicates in the intake list route).
- A separate QC admin section or QC table — QC remains checklist items in the
  existing pipeline.

## Related reading

- `docs/archive/ERFASSUNG_INTAKE_AUDIT.md` — original audit that framed
  Intake as the QA pipeline.
- `src/config/intake-checklist.ts` header — the three-tier value cascade
  (Refurbishing ~60% / Ersatzteile ~25% / Recycling ~15%).
