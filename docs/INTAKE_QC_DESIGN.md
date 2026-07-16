# Intake & Quality Control — System Design

**Status**: Implemented end to end (single intake home, fast capture, kanban, verdicts, QC gate, buyer-facing results, local QR labels, Vier-Augen-Prinzip, mobile workflow, Kivvi sync)
**Last Updated**: 2026-07-16

---

## The problem

Devices arrive at RevampIT (donations, drop-offs), get captured into the system,
and — if sellable — must pass quality control before they appear in the shop.
The pipeline mirrors the physical workshop:

```
Empfang → Triage (Stufe) → Werkbank (Tests/Aufbereitung) → Datenlöschung
        → Qualitätskontrolle → Fotos/Inserat → Shop → verkauft
```

Before this design landed, the digital pipeline had six gaps:

1. **Schnellerfassung bypassed QC entirely.** A laptop captured via the quick
   form with "publish" went live in the shop with zero tests.
2. **A checklist item could only be checked or unchecked.** The most important
   QC outcome — a FAILED test — was inexpressible. Failed devices silently
   rotted in "In Bearbeitung" with no recorded reason and no decision path.
3. **No pipeline state for "stuck".** Staff had no way to see which devices
   were blocked and needed a decision (fix & retest vs. re-tier).
4. **Two competing entry points.** "Geräte-Eingang" and "Produkt aufnehmen"
   looked like equal destinations, although staff were trying to complete one
   job: get an incoming item into the system and, where appropriate, the shop.
5. **The common path carried exceptional detail.** A workshop intake required
   navigating a full product editor instead of entering the two facts normally
   visible on the device: manufacturer and model.
6. **The overview was a dense table.** It described rows, but did not show the
   flow of work or make blocked and ready products operationally obvious.

## Design principles

- **The checklist is the QC model** (`src/config/intake-checklist.ts` is SSOT).
  No parallel QC table, no second workflow. Verdicts, gates, and the
  QC-required rule all derive from the one item list.
- **QC is a stage, not a place.** No new admin section; the pipeline
  (`/admin/intake`, "Geräte-Eingang") gains a `failed` bucket.
- **Fail is a first-class outcome.** ~40% of devices don't make it to the shop
  (parts/recycling tiers). A recorded fail with a reason and a re-tier decision
  is the audit trail of the value cascade, not an error case.
- **One job, one home.** `/admin/intake` owns capture, pipeline, device
  workbench and publish. `/admin/erfassung` remains a hidden advanced editor,
  not a competing navigation concept.
- **Progressive disclosure.** The normal intake asks for manufacturer and
  product/model. Tier, category and donation are available when needed; the
  complete product catalogue is one explicit advanced step away.
- **The URL is the view state.** `/admin/intake`, `/admin/intake/capture` and
  `/admin/intake?detail=<id>` are linkable and survive refreshes and QR scans.

## Target interaction budget

- **Digital capture:** manufacturer + model + Enter, designed and tested to
  complete in under five seconds once the operator has read the device label.
- **Physical QC:** intentionally not reduced to five seconds. Required tests,
  data erasure and final QA remain real safety and trust gates.
- **Publish after QC:** price and publish action are placed at the top of the
  ready workbench, so a completed product can enter the shop without scrolling.

## Information architecture and operational UI

`Geräte-Eingang` is the only sidebar and mobile-navigation destination for the
workflow. Its four lanes are derived from the same intake status SSOT used by
the API:

```
In Prüfung  |  Blockiert  |  Bereit  |  Im Shop
```

Cards are oldest-first within each lane, show checklist progress, tier and
category, and flag products older than the shared stuck threshold. On small
screens the same information becomes a touch-friendly card list without
horizontal scrolling. `Produkt aufnehmen` is still directly addressable for
advanced fields and AI extraction, but is deliberately absent from primary
navigation.

The capture screen is a sub-route of this home. Its default path has only two
required fields and sensible defaults (`refurbish`, `good`); less common intake
metadata is collapsed. Saving creates the inventory item, initializes its
checklist, syncs Kivvi after commit, and immediately offers the local label or
the pipeline. The form resets and restores keyboard focus for the next item.

---

## Phase 1 — shipped in this change

### Checklist verdicts (pass / fail / n.a.)

`intake_checklist` JSONB item states changed shape (migration 135 rewrites
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
| `publishProduct` (admin inventory PATCH) | Same three gates, thrown as `QcGateError` → 400; `marketplace_status` is only flipped after the gate passes. |
| Detail view (tier-NULL quick capture, QC category) | Publish box replaced by a "Prüfung starten" action (assigns `refurbish` tier via `PATCH`). |

### Files

- Config/SSOT: `src/config/intake-checklist.ts`, `src/config/intake-status.ts`
- Migration: `scripts/db/migrations/135_intake_checklist_verdicts.sql`
  (+ Drizzle `src/db/schema/inventory.ts`)
- API: `src/app/api/admin/intake/**`, `src/lib/erfassung/create-product.ts`,
  `src/app/api/admin/erfassung/route.ts`
- UI: `src/app/admin/intake/**` (tri-state `ChecklistGroup`, failed
  alert/badge/hero), `src/components/erfassung/SuccessScreen.tsx`

---

## Completed phases

### Phase 2 — QR labels (SHIPPED)

`/admin/intake/[id]/label` renders a 62mm label-printer format label
(item_uuid, device, tier, condition, date) with a QR encoding
`/admin/intake?detail=<id>` — scanning at any workstation opens the device's
checklist. QR images are generated locally as data URLs with `qrcode`; internal
admin URLs are never sent to an external QR service. Reachable from the intake detail header
("Etikett") and the erfassung success screen ("Etikett drucken").

### Phase 3 — buyer-facing test results (SHIPPED)

`publishRevampitListing` now attaches QC provenance when the device went
through the pipeline (tier set + checklist complete):

- **`condition_checks`**: every PASSED item from the buyer-visible categories
  (`BUYER_VISIBLE_CHECK_CATEGORIES` = testing, security, refurbishment,
  quality — intake bookkeeping and listing prep are excluded), derived via
  `getBuyerVisibleChecks()` in the checklist SSOT. Same `{key,label,checked}`
  shape the P2P sell form writes — one column contract, two writers. Labels are
  snapshotted at publish time on purpose: the listing is a historical record.
- **`verified_at` / `verified_by`**: set automatically (publisher = verifier),
  lighting up the existing "Geprüft von Revamp-IT" badge; the Meilisearch doc
  indexes `is_verified` correctly (incl. the `verified_only` filter). A
  re-publish never *clears* a manual verification.
- **Listing detail page**: the verification box lists the performed checks
  ("Durchgeführte Prüfungen" + ✓ items) — works for QC provenance and any
  future verified P2P checks alike.

Quick-published accessories (no checklist) get no stamp — verification means
something precisely because it is not handed out for free. Listings published
before this change carry no checks; they gain them on their next re-publish
(no backfill: the historical checklists exist on `inventory_items`, so a
backfill script is possible later if wanted).

### Phase 4 — two-person QA + mobile pipeline (SHIPPED)

- **Vier-Augen-Prinzip**: `final_qa` carries `requiresSecondPerson: true` in
  the checklist SSOT. `violatesSecondPersonRule()` blocks the person who owns
  a strict majority of the other completed required work (and a sign-off made
  before any other work). A generic note cannot bypass the rule: the operator
  must select an explicit exception and enter a reason of at least ten
  characters. That choice and reason are written to the audit trail. Recording
  a FAIL is never blocked; "Alles in Ordnung" deliberately skips second-person
  items.
- **Responsive pipeline**: desktop uses the four-lane `IntakeKanban`; `< md`
  uses a card list (`IntakePipelineCards`). Whole cards are tappable, the hero
  stacks safely, there is no horizontal scroll at 320px, and checklist verdict
  controls remain 44px touch targets on phones.
- **Immutable published QC**: once a product is published, its checklist is
  read-only in both UI and API. This prevents the audit record from drifting
  away from the buyer-visible `condition_checks` snapshot. Published groups
  collapse by default; the shop confirmation and price are shown first.

### Kivvi ERP — both capture doors sync (SHIPPED)

`syncProductToKivvi()` (`src/lib/kivvi/sync-product.ts`) is the SSOT for the
fire-and-forget post-commit ERP push, used by BOTH `/api/admin/erfassung`
(Schnellerfassung) and `/api/admin/intake` (Physische Annahme). Previously
only the erfassung door synced — Annahme devices never reached Kivvi.

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
