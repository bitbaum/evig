# Intake & Quality Control — System Design

**Status**: Implemented end to end (one capture contract, multi-channel AI input, explicit destinations, kanban, verdicts, QC gate/bypass audit, buyer-facing results, local QR labels, Vier-Augen-Prinzip, mobile workflow, Kivvi sync)
**Last Updated**: 2026-07-17

---

## The problem

Devices arrive at RevampIT (donations, drop-offs), get captured into the system,
and — if sellable — must pass quality control before they appear in the shop.
The pipeline mirrors the physical workshop:

```
Empfang → Triage (Stufe) → Werkbank (Tests/Aufbereitung) → Datenlöschung
        → Qualitätskontrolle → Fotos/Inserat → Shop → verkauft
```

Before this design landed, the digital pipeline had seven gaps:

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
5. **Input channels were presented as workflows.** “Physische Annahme” and
   “Schnellerfassung” forced an operational decision before any product facts
   were known. Text, photo, file and speech were scattered across those modes.
6. **The overview was a dense table.** It described rows, but did not show the
   flow of work or make blocked and ready products operationally obvious.
7. **Page explanations drifted from AI context.** Staff saw short descriptive
   copy, while Hirn had a different mental model of the same route.

## Design principles

- **The checklist is the QC model** (`src/config/intake-checklist.ts` is SSOT).
  No parallel QC table, no second workflow. Verdicts, gates, and the
  QC-required rule all derive from the one item list.
- **QC is a stage, not a place.** No new admin section; the pipeline
  (`/admin/intake`, "Geräte-Eingang") gains a `failed` bucket.
- **Fail is a first-class outcome.** ~40% of devices don't make it to the shop
  (parts/recycling tiers). A recorded fail with a reason and a re-tier decision
  is the audit trail of the value cascade, not an error case.
- **Input method is not process state.** Text, photo, CSV/Excel and speech all
  normalize into the same product schema. There is no “quick” versus
  “physical” product type.
- **One job, one home.** `/admin/intake` owns the pipeline and workbench;
  `/admin/intake/capture` is its only capture page. `/admin/erfassung` remains
  a render-compatible legacy URL, not a second product.
- **Decide late.** Staff first enter and review facts, then choose the real
  destination: quality process, inventory only, parts, recycling, or the
  exceptional audited untested publication path.
- **Progressive disclosure.** Only manufacturer and product/model are required
  to create a record. Technical data, storage and donation provenance remain
  available without competing with the normal path.
- **One explanation contract.** `HirnPageContext.guide` supplies both the
  page-level `?` guide and the assistant context, so instructions cannot drift.
- **The URL is the view state.** `/admin/intake`, `/admin/intake/capture` and
  `/admin/intake?detail=<id>` are linkable and survive refreshes and QR scans.

## Target interaction budget

- **Digital capture:** text/photo/speech can let AI fill the record; direct
  manufacturer + model entry remains the deterministic fast lane. With the
  recommended quality destination already selected, capture is one action and
  is E2E-budgeted below five seconds after the fields are known.
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
horizontal scrolling. `Produkt aufnehmen` is an action inside this workflow,
not another top-level admin area.

The capture screen is a three-step, single-page flow:

1. Enter data by text, photo, file or speech. CSV/Excel becomes a reviewable
   batch and enters inventory only; a file cannot prove physical quality.
2. Review AI-filled product data. Manufacturer and product/model are required;
   all richer catalogue facts are optional at intake.
3. Choose the next physical/business destination. Quality is recommended.
   Parts and recycling initialize their own checklist. Inventory-only creates
   no checklist. Direct untested publication requires both a positive price
   and a written reason of at least ten characters.

Every outcome uses `POST /api/admin/intake` and `createErfassungProduct()`.
Donation provenance, technical fields, storage and the image traverse the same
contract. Successful capture immediately offers the local QR label and the
pipeline/device view.

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

Untested listings (no completed checklist) get no stamp — verification means
something precisely because it is not handed out for free. They carry an
explicit warning badge and trust-strip disclosure linking to the public process
page. Listings published
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

### Phase 5 — one guided capture contract + open process (SHIPPED)

- Deleted the competing quick-capture component and physical/quick mode toggle.
- `CAPTURE_DESTINATIONS` is the SSOT for the only consequential capture choice.
- `/admin/intake/capture` is canonical; old `/admin/erfassung` bookmarks render
  the same component and all dashboard/Hirn links point to the canonical route.
- A documented QC bypass is schema-gated, price-gated, published without
  verification, and written atomically with its reason into `intake_events`.
- The global admin `?` guide resolves the same page context Hirn receives.
- `/so-funktionierts` is the single public process page; it links the open
  source and explains how another local circular workshop can reproduce the
  process. No duplicate “refurbishment process” page was introduced.
- All new UI uses semantic design tokens. The repository SSOT audit now reports
  zero raw-color warnings; remaining standalone HTML/SVG colors live in
  `src/config/ui-colors.ts`.

### Kivvi ERP — canonical capture sync (SHIPPED)

`syncProductToKivvi()` (`src/lib/kivvi/sync-product.ts`) is the SSOT for the
fire-and-forget post-commit ERP push. The canonical `/api/admin/intake` route
uses it; the legacy `/api/admin/erfassung` endpoint retains it while older API
clients migrate.

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


---

## Addendum 2026-07-17 — journey-audit fixes (shipped)

Findings from clicking the full staff journey on prod, all deployed:

- **Atomic checklist writes.** Verdict PATCHes used to read-modify-write the
  whole `intake_checklist` JSONB; parallel requests silently dropped each
  other's items ("Alles in Ordnung" needed 4 clicks; swallowed clicks caused
  duplicate audit events). Writes now serialize in a `SELECT … FOR UPDATE`
  transaction, repeats are idempotent no-ops, and bulk marking is ONE request
  (`item_ids[]`) producing ONE timeline event. Bulk never signs the
  Vier-Augen item.
- **One-click publish without QC.** `POST …/publish` accepts `qc_skip` +
  audited reason (`QC_SKIP_ONE_CLICK_NOTE` in `src/config/intake-checklist.ts`).
  Surfaced on the capture success screen, the detail publish box and the
  quick-capture QC gate. A recorded FAIL still blocks — skip means
  "not tested", never "tested and failed". The listing publishes without the
  Prüfsiegel (no `condition_checks`, `verified_at` NULL) and buyers see the
  untested trust-strip state.
- **Vier-Augen stays, friction goes.** Solo shift = one click
  (`SECOND_PERSON_SOLO_OVERRIDE_NOTE`); when only final QA remains open, the
  progress card surfaces "Als Zweitperson bestätigen" / "Allein im Dienst —
  übersteuern" directly, and the publish gate names the open items.
- **"Im Shop" is the listings table.** Pipeline/detail derive the shop state
  from `listings` (LEFT JOIN: id + status). Removing a listing resets the
  inventory item to `draft` (device returns to the pipeline, republishable)
  with an `unpublished` timeline event.
- **Truthful stepper** (Erfasst → Qualitätsprüfung → Im Shop, finished state
  supported) and a fast lane on capture ("Direkt aufnehmen & Prüfung
  starten") plus the AIFormAssist refine loop on the review step.
