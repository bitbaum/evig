# System Migration Strategy — Off Kivitendo + Shopware, onto Kivvi + RevampIT

**Status:** Strategy proposal
**Author:** Investigation session 2026-07-06
**Question posed:** Can Revamp-IT move its whole stack off the legacy **Kivitendo**
(Perl ERP, `revamp.kivitendo.ch`) and **Shopware 6** shop (`shop.revamp-it.ch`)
onto **Kivvi** (our ERP, `kivvi.orangecat.ch`) + the **new RevampIT site**
(`revampit.orangecat.ch`)? The team believes migration is impossible.

> Scope of this doc: the *strategic* picture and a phased path. The product
> catalogue import has its own detailed plan in
> [`SHOPWARE_MIGRATION_PLAN.md`](./SHOPWARE_MIGRATION_PLAN.md); this doc places
> it inside the larger two-system move and adds the ERP/accounting half.

---

## 1. Verdict up front

**"Migration is impossible" is not true — but it is pointing at something
real.** The claim conflates two very different tasks:

1. **Getting the data out** of Kivitendo and Shopware — *genuinely easy*.
   Kivitendo is an open-source Perl app on a plain, fully-readable PostgreSQL
   database you can `SELECT` from directly; Shopware 6 has CSV import/export + a
   bulk Admin/Sync API. No proprietary lock-in.
2. **Replacing the accounting engine with legally-compliant Swiss
   double-entry software** (MWST reporting, QR-bill, 10-year audit-proof
   retention, ledger integrity) — *this* is the hard, respect-worthy part.

The decisive fact the "impossible" verdict misses: **most of the hard part is
already built.** Kivvi is not a prototype — it is a working Swiss ERP that
already does QR-bill invoicing, double-entry accounting, MWST reporting, and
Swiss bank-statement (CAMT) import. And the Kivitendo→Kivvi migration is
**already partly built and trialled with Revamp-IT's own data**. So the real
question isn't "is this possible" — it's "which specific gaps remain, and how do
we sequence the cut-over safely."

**Recommendation: yes, proceed — as two independent tracks on different clocks.**
The store migration is a quick win to do now; the ERP cut-over is a planned
fiscal-year-boundary exercise. Freeze Kivitendo as the legal archive rather than
replaying its ledger.

---

## 2. Ground truth — what already exists (the "impossible" myth vs. the repo)

Evidence gathered from `/home/g/dev/kivvi`, `/home/g/dev/revampit`, and the
open-source Kivitendo project:

**Kivvi is a real, substantial Swiss ERP** (`/home/g/dev/kivvi`) — Next.js 14 +
Drizzle/PostgreSQL, **38 tables**, ~100 dashboard pages, 44 domain modules, 47
test files, active CI. It already implements:
- **Swiss QR-bill invoicing** (`swissqrbill`, `domain/documents.ts` QR-reference
  gen, `domain/pdf-generation.ts`).
- **Double-entry accounting with automatic journal entries** on document events
  (`domain/accounting-integration.ts`), chart of accounts, journal, fiscal years
  — seeded with **227 Swiss KMU Kontenrahmen accounts**.
- **MWST/VAT report** (`domain/reports.ts` `getVatReport`, `reports/vat` page).
- **CAMT.053/054 bank import + auto-reconciliation** against invoice QR
  references (`domain/camt-parser.ts`, `domain/banking.ts`).
- Sales cycle (quote→order→invoice→credit note→delivery note→dunning),
  purchasing, inventory (warehouses/stock/serials), condition-graded secondhand
  items, data-erasure certificates, POS, recurring invoices, reports
  (balance sheet / P&L / aging / impact).
- A **versioned REST API** (`apps/web/app/api/v1/{contacts,products,inventory-items,documents}`,
  documented in `docs/openapi.yaml`) with Bearer-token auth — built for exactly
  this kind of external integration.

**The Kivitendo→Kivvi migration is already scaffolded and trialled:**
- `kivvi/scripts/import-kivitendo.ts` — "Comprehensive Kivitendo → Kivvi Import
  Script… designed for revamp-it migration."
- `kivvi/packages/core/src/domain/import-mappings.ts` + `import-bulk.ts` —
  Kivitendo CSV column profiles, Swiss number/date handling.
- `kivvi/kivitendo-export/` — **Revamp-IT's actual Kivitendo data already
  exported to CSV**: customers, vendors, products, quotes, orders, AR/AP
  invoices, delivery notes, GL journal, chart of accounts, warehouse stock,
  taxes, tax zones, posting groups, payment terms, projects, trial balance +
  financial profiles back to 2007.
- In-app onboarding has a "Import from kivitendo" step.

**RevampIT ↔ Kivvi is already wired live:**
- RevampIT's `src/lib/kivvi/client.ts` `syncToKivvi()` pushes inventory to
  Kivvi's `/api/v1` after erfassung (`src/app/api/admin/erfassung/route.ts:34`);
  RevampIT stores `kivvi_inventory_item_id` / `kivvi_sync_status`
  (`src/db/schema/inventory.ts`, migration `113_*`).
- Kivvi's code explicitly names RevampIT as an external caller
  (`api/v1/documents` contact-resolution, inventory webhooks "so connected
  systems (RevampIT) know…").

**Conclusion:** the target architecture is not hypothetical — it is the current
direction of travel, already ~2/3 wired. The move is a *finishing* job, not a
green-field one.

---

## 3. The two-track framing (why "impossible" happened)

The two halves of the stack have **completely different difficulty profiles**.
Treating them as one monolithic "migrate everything" project is what makes it
feel impossible. Split them:

| | **Track A — Store** | **Track B — ERP / Accounting** |
|---|---|---|
| From → to | Shopware 6 → RevampIT `listings` | Kivitendo → Kivvi |
| Data difficulty | Easy (192 products, CSV) | Master data easy; ledger history hard |
| Real risk | Low (cosmetic, re-runnable) | High (legal accounting correctness) |
| Clock | **Now** | **Next fiscal-year boundary** |
| Reversibility | Fully (soft-delete, re-import) | Cut-over is a one-way close |
| Legal exposure | None | MWST, QR-bill, 10-yr retention |

They connect only at one seam: **Kivvi is the canonical record for a product/
item; RevampIT is the storefront that displays and sells it.** That seam already
exists (`syncToKivvi`). So the tracks can proceed in parallel without blocking
each other.

---

## 4. Target architecture (end state)

```
                    ┌─────────────────────────────────────────┐
                    │  Kivvi  (kivvi.orangecat.ch)             │
                    │  CANONICAL ERP + ACCOUNTING              │
                    │  articles · contacts · inventory items   │
                    │  invoices · QR-bill · double-entry ledger│
                    │  MWST report · CAMT bank import          │
                    └───────────────▲───────────┬─────────────┘
                        /api/v1 push │           │ /api/v1 pull
                     (syncToKivvi)   │           │ (canonical data)
                    ┌───────────────┴───────────▼─────────────┐
                    │  RevampIT site (revampit.orangecat.ch)   │
                    │  PUBLIC STOREFRONT + COMMUNITY           │
                    │  /marketplace · /admin/erfassung (intake)│
                    │  listings (is_revampit + P2P) · Payrexx  │
                    └──────────────────────────────────────────┘

  RETIRED:  Shopware 6 shop        → redirect to /marketplace
  FROZEN:   Kivitendo (read-only)  → 10-year legal archive (OR 958f)
```

- **Kivvi owns the money and the master record.** Every sale, invoice, VAT
  posting, and bank reconciliation lives there. It is the system auditors look
  at.
- **RevampIT owns the public experience.** Intake (erfassung), the marketplace,
  P2P listings, workshops, IT-Hilfe, content. It pushes items to Kivvi and
  reads canonical data back.
- **Shopware is retired** — its one job (a storefront) is done better by
  `/marketplace`. Legacy URLs redirect.
- **Kivitendo is frozen, not deleted** — kept as a read-only appliance (or a
  `pg_dump` + rendered PDF/CSV exports) to satisfy the 10-year retention window,
  then decommissioned when that window expires for the last open fiscal year.

---

## 5. Track A — Store: Shopware → RevampIT marketplace

Fully specified in [`SHOPWARE_MIGRATION_PLAN.md`](./SHOPWARE_MIGRATION_PLAN.md).
Summary in this context:

- **~192 live products**, exported via Shopware Admin CSV (decided), imported as
  RevampIT shop stock (`is_revampit=true`) through the existing idempotent
  `publishRevampitListing()` pipeline.
- **Do NOT use raw Shopware MySQL** — Shopware stores binary(16) UUID keys and
  JSON-encoded prices/translations; the CSV Import/Export (or Admin/Sync API) is
  the correct, decoded path.
- **Architectural note for the end state:** once Kivvi is the canonical ERP, new
  shop stock should originate in **erfassung → Kivvi**, and the marketplace
  should display it. The Shopware import is a **one-time backfill** of the
  current catalogue, not a new ingestion pattern. Where possible, imported items
  should also land in Kivvi as inventory items (via the same `syncToKivvi` seam)
  so the store and the ERP agree from day one.
- **Status:** Phase-1 SSOT prep already shipped (category resolver, ai-camera
  fix, dead-config removal). Awaiting the CSV export to build the importer.

This track is low-risk and can ship independently and immediately.

---

## 6. Track B — ERP: Kivitendo → Kivvi

### 6.1 Data extraction — easy

Kivitendo is *your* PostgreSQL database. The whole catalogue and ledger are
plain relational tables (SQL-Ledger heritage — `parts`, `customer`, `vendor`,
`oe`/`orderitems`, `ar`/`ap`/`invoice`, `chart`, `acc_trans`, `gl`, `tax`,
`inventory`, `warehouse`). Extract via `pg_dump` / `COPY … TO CSV` / direct
`SELECT`. Kivvi's `import-kivitendo.ts` + `import-mappings.ts` already consume
these, and Revamp-IT's data is **already exported** in `kivvi/kivitendo-export/`.
Master data (articles + contacts) is a field-mapping exercise — a weekend, not a
research problem.

### 6.2 The accounting cut-over — the real work (do NOT replay the ledger)

The standard, safe pattern — and the reason "impossible" is wrong:

1. **Pick a cut-over date at a fiscal-year boundary.** Clean VAT/fiscal periods,
   no mid-period split.
2. **Close the books in Kivitendo** up to that date (final MWST filing, final
   statements).
3. **Migrate fully:** master data (articles, customers, vendors) + open items
   (unpaid `ar`/`ap`, open `oe` orders) + **opening balances per account**
   (trial balance → Kivvi opening journal entries). *Not* years of historical
   postings.
4. **Freeze Kivitendo read-only** as the legal archive for the 10-year window
   (OR 958f). Historical detail is looked up there, not in Kivvi.
5. **Run Kivvi live** from the cut-over date forward.

This is routine ERP-migration practice. The hard parts are all *ledger
integrity* concerns, not extraction: double-entry balance per `trans_id`,
opening-balance accuracy, and exact `taxkey`→Kivvi-MWST-code mapping so VAT
reconciles.

### 6.3 Kivvi gap analysis vs. what a full Kivitendo replacement needs

What Kivvi **already covers** (verified in code): sales cycle, QR-bill
invoicing, double-entry auto-postings, Swiss KMU chart of accounts, MWST report,
CAMT import + reconciliation, dunning, purchasing, inventory, financial reports,
Kivitendo import tooling, integrable API.

**Gaps to close before relying on Kivvi for statutory accounting** (each is
scoped work, not a blocker to *starting*):

| # | Gap | Impact | Action before cut-over |
|---|---|---|---|
| G1 | **Tax-code / posting-group model is flattened** (VAT is a per-line decimal; no tax-zone/Buchungsgruppe table). Kivitendo exports `steuerzonen`/`buchungsgruppen`. | Historical VAT may not map 1:1; net-tax-rate (Saldosteuersatz) method unclear. | Map Kivitendo taxkeys → Kivvi MWST codes explicitly; confirm the org's VAT method; validate a period's MWST report against Kivitendo's. |
| G2 | **No outgoing payment-file generation (pain.001 / DTA).** Kivvi imports CAMT (incoming) but doesn't emit vendor-payment orders. | AP payment runs stay manual. | Decide: manual e-banking (acceptable at this volume) or build pain.001 export. |
| G3 | **Year-end close / retained-earnings rollover** not fully evidenced (flags exist; automation unverified). | First statutory close on Kivvi needs to be correct. | Functional-test a full close with the bookkeeper on a copy before cut-over. |
| G4 | **10-year retention / GeBüV-compliant archival** — export routes exist but formal audit-proof archival isn't evidenced. | Legal (OR 958f / OLICO, in force 1 Jan 2025: integrity, readability, accessibility). | Freeze Kivitendo as the archive of record for pre-cutover years; define Kivvi's own retention/export for post-cutover years. |
| G5 | **Multi-currency is cosmetic** (CHF label, no FX). | Only matters if EUR purchases/donations are booked. | Confirm CHF-only; if not, scope FX. |
| G6 | No payroll, fixed-asset/depreciation register, cost-center dimension beyond `projects`. | Kivitendo also lacks full payroll; verify none are in active use. | Confirm not needed; else keep in a dedicated tool. |

**Key insight:** because Kivitendo is *already* Swiss- and Verein-ready (it ships
`Switzerland-deutsch-Verein-2024-chart.sql`), and Kivvi already reproduces
QR-bill + double-entry + MWST, the replacement does **not** have to re-earn Swiss
compliance from scratch — it has to *match* a working reference and close the six
gaps above. That is a finite checklist, not an open-ended research risk.

---

## 7. Swiss compliance checklist (the bar the end state must clear)

- **MWST (VAT):** rates since 2024 — 8.1% standard / 2.6% reduced / 3.8%
  accommodation; produce the periodic MWST-Abrechnung. *Verify Revamp-IT's VAT
  status* (non-profit may be under the CHF 100k threshold or on a net-tax-rate
  method — changes G1).
- **QR-bill:** SIX Swiss QR standard, mandatory since Oct 2022. ✔ Kivvi
  implements it.
- **Double-entry bookkeeping:** OR 957ff. ✔ Kivvi implements it.
- **10-year retention:** OR 958f + OLICO (from 1 Jan 2025) — integrity,
  readability, accessibility; signed printed annual report. → Freeze Kivitendo
  (G4).
- **Chart of accounts:** Swiss KMU / Verein variant. ✔ Kivvi seeds Swiss KMU;
  confirm the Verein variant fits the non-profit.

---

## 8. Feasibility matrix

| Task | Difficulty | Notes |
|---|---|---|
| Export Shopware catalogue | Easy | CSV / Admin API (not raw MySQL) |
| Export Kivitendo master data + ledger | Easy | Own Postgres; already exported |
| Import store catalogue → `listings` | Easy | Existing `publishRevampitListing` |
| Import ERP master data → Kivvi | Easy–Moderate | `import-kivitendo.ts` exists |
| Migrate open items + opening balances | Moderate | Fiscal-boundary close with bookkeeper |
| Replay historical ledger as live books | **Avoid** | Freeze Kivitendo instead |
| Close Kivvi accounting gaps G1–G4 | Moderate–Hard | Finite checklist; needs diligence |
| Retire Shopware / freeze Kivitendo | Easy | Redirects + read-only archive |

Overall: **tractable and largely underway.** The single largest real cost is
accounting diligence (G1, G3, G4), not engineering volume.

---

## 9. Phased roadmap

**Track A (Store) — start now, independent:**
- A1. Shopware CSV export → build importer → dry-run → dev → prod (per
  `SHOPWARE_MIGRATION_PLAN.md`). Backfill items into Kivvi via `syncToKivvi`
  where feasible so store + ERP agree.
- A2. Retire Shopware: redirect `shop.revamp-it.ch` → `/marketplace`.

**Track B (ERP) — plan against next fiscal-year boundary:**
- B0. **Diligence sprint (do first, cheap):** confirm VAT status/method,
  CHF-only, no payroll/fixed-assets in use; map Kivitendo taxkeys → Kivvi MWST
  codes (G1, G5, G6).
- B1. **Dress rehearsal on a copy:** run `import-kivitendo.ts` with the real
  export into a Kivvi staging tenant; reconcile a chosen period's MWST report +
  trial balance against Kivitendo (G1, G3).
- B2. **Close gaps** G2 (decide manual vs pain.001), G3 (year-end close test),
  G4 (retention/archive plan).
- B3. **Cut-over** at the fiscal boundary: close Kivitendo, load opening
  balances + open items, go live on Kivvi.
- B4. **Freeze Kivitendo** read-only as the legal archive; decommission when the
  retention window closes.

**Sequencing:** A1–A2 can ship in weeks. B0–B1 can run in parallel now
(read-only, no commitment). B3 waits for the fiscal boundary + green diligence.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| VAT history doesn't reconcile after mapping (G1) | Validate a full period MWST report on staging before cut-over; involve the bookkeeper |
| First Kivvi year-end close is wrong (G3) | Rehearse a close on a copy; don't cut over until it ties out |
| Retention non-compliance (G4) | Keep Kivitendo frozen as archive of record for pre-cutover years |
| Cut-over mid-period corrupts periods | Only cut over at a fiscal-year boundary |
| Store & ERP disagree on an item | Single seam: Kivvi canonical, RevampIT displays; backfill Shopware items into Kivvi |
| Scope creep into rebuilding accounting from scratch | Match Kivvi to Kivitendo's *working* Swiss behaviour; close a finite gap list, don't reinvent |
| "Big bang everything at once" | Two tracks, two clocks; store now, ERP at boundary |

---

## 11. Decisions needed

- **D1. VAT status & method** — is Revamp-IT MWST-registered? Effective vs.
  net-tax-rate (Saldosteuersatz)? (Drives G1 and the whole tax-mapping effort.)
- **D2. Currency** — CHF-only, or are EUR transactions booked? (G5)
- **D3. Unused modules** — any payroll / fixed-assets / cost-centre use in
  Kivitendo today? (G6)
- **D4. AP payments** — acceptable to keep vendor payments manual in e-banking,
  or is pain.001 generation required? (G2)
- **D5. Fiscal boundary** — target close/cut-over date for Track B.
- **D6. Ownership** — who is the bookkeeper/auditor sign-off on the accounting
  cut-over? (Non-negotiable gate for B3.)

---

## 12. One-paragraph answer to "the team says it's impossible"

The impossible-sounding part — rebuilding Swiss-legal double-entry accounting
with MWST and QR-bill — is **already largely built in Kivvi and already
integrated with RevampIT**, and Revamp-IT's Kivitendo data is **already
exported**. Kivitendo's database is wide open, and Shopware exports cleanly via
CSV. What remains is not a research miracle but disciplined ERP-migration
practice: split the store move (easy, now) from the accounting move (a planned
fiscal-boundary close), migrate master data + opening balances rather than
replaying the ledger, freeze Kivitendo as the legal archive, and close a finite
list of six accounting gaps with the bookkeeper before flipping the switch. It is
very much possible — most of it is already done.
