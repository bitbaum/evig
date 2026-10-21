# Refurbishment mission: evig → Kivvi intake identity (first reliability slice)

**Status:** Implemented on a draft branch; no tenant secrets or production data
were used. This is an existing integration, not a new end-to-end Mission engine.

## Existing ownership (verified against both repositories)

- **evig** owns the captured physical item, its intake checklist and its public
  marketplace listing.
- **Kivvi** owns the corresponding ERP inventory record and accounting events.
- **DataCat** can enrich a captured item with photo/OCR observations in a later
  adapter; it does not own inventory, consent or execution.
- **Loki** will coordinate work orders referencing these source identifiers,
  without copying the underlying ERP and intake databases.

Kivvi's `POST /api/v1/inventory-items` already accepts the
`Idempotency-Key` header and returns the original response on a completed
replay. The previous evig caller omitted the key, even though it had the local
inventory ID it needed. If a request was retried after the ERP succeeded but
before the returned ID was stored, it could create a duplicate ERP item.

## Implemented here

- The post-intake caller now provides
  `evig:inventory:create:v1:<evig-inventory-id>` as the CREATE key.
- The server-side client forwards that header unchanged through `syncToKivvi`
  and `createKivviInventoryItem`.
- The sync worker checks that the local item still exists and has **no Kivvi ID**
  before making a CREATE call.
- It only writes a returned ERP ID/error state while the local Kivvi link is
  still absent, avoiding accidental replacement of an existing link.
- Client and adapter tests cover the exact header, absence of invented headers
  in legacy callers, already-linked records, missing records and network errors.

## What this does not solve

Kivvi's idempotency records currently have a **24-hour retention**. The
stable key protects normal retries while the Kivvi record is retained, and
evig's local-ID check protects any already-linked item. But if Kivvi created
the remote record and evig never stored its ID, a **late retry after retention
has expired can still create a duplicate**. Operators must reconcile such
orphaned cases before rerunning creation. Do not market this as permanent
exactly-once delivery.

The current `syncProductToKivvi` is still a detached best-effort action,
not a durable outbox. Errors are recorded on the local item, but a process
crash can leave an item pending without retry. No accounting cutover can rely
on this slice alone.

**Next production-safe step:** add a transactional intake outbox with lease,
backoff and dead-letter inspection, plus a Kivvi-side
`(companyId, sourceSystem, sourceId)` unique mapping or lookup endpoint with
permanent identity. Only then enable routine replay/backfill without
risking long-delayed duplicate inventory.

## The first mission's acceptance checks

For one real donated laptop:

1. evig intake returns exactly one local inventory ID.
2. The Kivvi create request carries the stable source key.
3. A request replay within the key-retention window returns the same ERP ID.
4. The evig record stores that Kivvi ID without replacing an existing one.
5. QC failures keep the item off the public shop; the operator verifies the
   result and only then authorizes publication.
6. Loki may observe and summarize the links; it may not claim physical
   inspection or payment has completed without evidence from the owning
   systems.

Real tenant credentials, preexisting records, provider errors and failover
must be tested in staging before treating this as a live end-to-end mission.
