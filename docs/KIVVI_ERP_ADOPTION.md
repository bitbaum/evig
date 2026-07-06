# Dogfooding Kivvi from Revamp-IT — Adopting Kivvi as the canonical ERP

**Status:** Playbook / proposal
**Author:** Investigation session 2026-07-06 (Kivvi deep-dive agent)
**Companion docs:** [`SYSTEM_MIGRATION_STRATEGY.md`](./SYSTEM_MIGRATION_STRATEGY.md)
(the Kivitendo→Kivvi + Shopware retirement strategy), [`SHOPWARE_MIGRATION_PLAN.md`](./SHOPWARE_MIGRATION_PLAN.md).

How Revamp-IT runs on **Kivvi** (`/home/g/dev/kivvi`) as its real ERP —
replacing Kivitendo — integrating via the existing caller
(`src/lib/kivvi/client.ts`). This is dogfooding: Revamp-IT becomes a real
customer of Kivvi. Evidence is from Kivvi's v1 API (`apps/web/app/api/v1/*`),
domain layer (`packages/core/src/domain/*`), and schema.

---

## Prerequisite — stand up one canonical Revamp-IT company in Kivvi

1. **Onboard the Revamp-IT tenant** (Kivvi onboarding wizard) → seeds the
   227-account Swiss KMU Kontenrahmen, number sequences, a default warehouse, and
   the current fiscal year.
2. **Migrate Kivitendo history** with `kivvi/scripts/import-kivitendo.ts` +
   `import-mappings.ts`, fed by the already-prepared `kivvi/kivitendo-export/`.
   `--dry-run` first; verify the trial balance matches
   `kivitendo-export/generated/`.
3. **Mint a scoped API token** (`kv_` prefix) and set `KIVVI_API_URL`,
   `KIVVI_API_TOKEN`, `KIVVI_DEFAULT_WAREHOUSE_ID` in RevampIT env.

**Kivvi becomes authoritative for accounting only after opening balances
reconcile** in its balance sheet / trial balance.

---

## 1. Capability adoption order (de-risking sequence)

Identity/master data → transactions → accounting → automation:

1. **Contacts / CRM** — one customer/vendor master (`K-#####`), dedup.
2. **Inventory / stock** — already pushed one-way today; adds condition grading,
   repair cost, warehouse stock, data-erasure certs.
3. **QR-bill invoicing** — legally-required Swiss QR invoices, `RE-YYYY-#####`,
   PDF + QR reference.
4. **Double-entry accounting + auto journal entries** — GL auto-created from
   documents; atomic.
5. **Payments / AR** — payment posts `Debit Bank / Credit AR`, closes invoice,
   feeds VAT.
6. **MWST / VAT reporting** — MWST-Abrechnung straight from posted documents.
7. **Banking / CAMT reconciliation** — import CAMT.053/054, auto-match by QR ref.
8. **Dunning** — automatic overdue detection + tiered Mahnungen.
9. **Purchasing** — vendor POs + ER invoices with GL integration.
10. **Recurring invoices** — memberships/subscriptions automation.

**Steps 1–5 make the shop's sell-side canonical in Kivvi. 6–8 make
accounting/compliance canonical. 9–10 retire the last Kivitendo use cases.**

---

## 2. Data ownership model (who is authoritative)

Avoid dual-writing the same field from both systems — pick one owner per entity.

| Entity | Direction | Authoritative | Mechanism |
|---|---|---|---|
| Inventory item (intake) | RevampIT → Kivvi (create) | RevampIT for physical intake; **Kivvi for ERP state** | `POST /inventory-items`, then `PATCH` on regrade/price/status |
| Item status (repair→ready→sold) | RevampIT → Kivvi (update) | **Kivvi** | `PATCH /inventory-items/{id}` |
| Contacts / buyers | RevampIT → Kivvi | **Kivvi** | auto via `contactName`/`contactEmail` in `POST /documents`, or `POST /contacts` |
| Sales invoice | RevampIT → Kivvi | **Kivvi** | `POST /documents {type:"invoice"}` → `PUT {status:"sent"}` |
| Payment | RevampIT → Kivvi | **Kivvi** | `POST /documents/{id}/payments` |
| **Product catalog / price / stock** | **Kivvi → RevampIT (pull)** | **Kivvi** | shop reads `GET /products` / `GET /inventory-items` |
| GL / VAT / dunning | Kivvi-internal | **Kivvi** | auto-generated, no external writes |

**Two highest-value additions beyond today's one-way push:** (a) make Kivvi the
**price/stock source of truth** and have the shop *pull* it; (b) complete the
**sale-side accounting loop** (invoice → sent → payment), already coded in
`payment-webhook.ts:syncOrderToKivvi` but needing §3 fixes.

---

## 3. "Make dogfooding trustworthy" fix sprint (prioritized)

**Do NOT rely on Kivvi for accounting until P0/P1 are closed.** Items marked
`[RevampIT]` are fixable in this repo; `[Kivvi]` need Kivvi changes.

**P0 — correctness:**
1. `[RevampIT]` **VAT double-count** — ✅ FIXED 2026-07-06 (`payment-webhook.ts`,
   `grossToNetChf` sends net; Kivvi adds VAT). Regression test added.
2. `[Kivvi]` + `[RevampIT]` **No idempotency / dedup** — Kivvi mints a new
   `IT-#####` on every create (no external-ref column). Interim RevampIT guard:
   skip `syncToKivvi` if `kivviInventoryItemId` is already set. Real fix: Kivvi
   adds a unique `externalRef`/`sourceId` per company.

**P1 — data fidelity:**
3. `[RevampIT]` **`inventoryItemId` field-name mismatch** — RevampIT sends
   `kivviInventoryItemId` on invoice lines; Kivvi expects `inventoryItemId`
   (silently stripped). Rename at `payment-webhook.ts` invoice-line build.
4. `[RevampIT]` **`new` condition rejected** — RevampIT `zustand='new'` isn't in
   Kivvi's `ITEM_CONDITION_VALUES`; the item 400s → `kivviSyncStatus='error'`.
   Add a mapping layer (`new → like_new`) in `src/lib/kivvi/client.ts`.
5. `[RevampIT]` **Dropped intake fields** — also send `estimatedValue` (cost
   basis → margin/impact), `serialNumber`, `category`, and images
   (`photoBase64`). Kivvi already accepts all of these.

**P2 — reliability/ops:**
6. `[RevampIT]` **No retry/queue/backfill** — both flows are fire-and-forget,
   log-only. Add a durable outbox + retry worker; add `kivviSyncStatus` to the
   **orders** table (only inventory has it today) to detect/replay
   paid-but-not-in-GL orders.
7. `[RevampIT]` **Flow B not atomic** — the 4 calls (create→sent→payment→sold)
   can leave dangling open AR mid-failure; make replay-safe (needs #2).
8. `[Kivvi]` **Webhooks not emitted on API-created items** — `dispatchWebhookEvent`
   fires only from the UI action, not the v1 route. Needed for any Kivvi→RevampIT
   feedback.

---

## 4. Step-by-step to run shop + accounting through Kivvi

1. **Setup** — onboard tenant → seed CoA/sequences/warehouse/fiscal year → import
   Kivitendo history → reconcile opening trial balance.
2. **Master data** — make Kivvi authoritative for contacts + catalog; backfill
   items via `POST /inventory-items` (after P0/P1); switch shop to **pull**
   price/stock.
3. **Intake** — keep RevampIT erfassung as the physical-capture UI; each erfassung
   `POST`s the item to Kivvi (with cost basis, serial, category, photo); store
   `kivviInventoryItemId`; `PATCH` on regrade/repair/price change.
4. **Sale** — on Payrexx-paid order: `POST /documents {type:invoice}` (net line
   prices, correct `inventoryItemId`) → `PUT {status:"sent"}` → `POST …/payments`
   → `PATCH /inventory-items/{id} {status:"sold"}`.
5. **Banking** — import bank CAMT.053 monthly; auto-reconcile by QR reference.
6. **Compliance** — run VAT (MWST) + dunning from Kivvi; enable the crons
   (guard with `CRON_SECRET`).
7. **Purchasing** — move vendor POs / ER invoices into Kivvi.
8. **Cutover** — once a full month reconciles end-to-end (sales → GL → VAT →
   bank), freeze Kivitendo writes; keep it read-only for archive.
9. **Ongoing** — monitor `kivviSyncStatus`, replay `error`/`pending`, reconcile
   Kivvi bank balance monthly.

---

## 5. What Kivvi should build for Revamp-IT (feedback to the Kivvi project)

- **Idempotency keys on writes** (`inventory-items`, `documents`) — unique
  `externalRef`/`sourceSystem` column. *The single most important change.*
- **Emit webhooks from the v1 API path**, not just the UI action → enables
  bidirectional sync.
- **`.strict()` / reject unknown keys** on API schemas → field-name mismatches
  fail loudly instead of silently dropping data.
- **Condition vocabulary alignment** — add `new` + a documented mapping table.
- **Gross / tax-inclusive line-item mode** (`priceIncludesVat` flag) — marketplaces
  price gross; forcing net conversion at the caller was the root cause of the VAT
  bug.
- **Bulk/batch endpoints** (POST arrays) for practical initial backfill.
- **A storefront read model** — stable `GET /products` / `GET /inventory-items`
  contract (price, stock-by-warehouse, availability) for shop consumption.
- **Multi-currency** — CHF-only today; only relevant if Revamp-IT bills in EUR.
