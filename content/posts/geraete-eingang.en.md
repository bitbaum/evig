---
title: "Device Intake: one photo instead of fifteen minutes"
excerpt: "Getting a used device into the system used to mean a spreadsheet, a CSV export, and a chain of hand-offs all the way into Kivitendo — and the shop still showed nothing. How we turned that into a flow that takes seconds, how the systems talk to each other over APIs, and which piece is still missing."
author: "RevampIT Team"
featuredImage: "/blog/geraete-eingang-hero.svg"
category: "Technik"
tags:
  - geraete-eingang
  - ki
  - erfassung
  - kivvi
  - kivitendo
  - architektur
  - automatisierung
publishedAt: "2026-07-21"
published: true
---

Every device that gets a second life at Revamp-IT first has to get *into the system*. Sounds trivial. It wasn't. This unremarkable step — intake — is where the workshop lost the most time for years, and it's where there is the least value to add: a laptop doesn't get better because someone types out its specs. This is the story of how we turned fifteen minutes of manual work into an intake that takes seconds — and what's underneath it, technically.

## The problem: intake was a chore

In the beginning there was a spreadsheet. To record a device, you did the following, in order: **weigh** it, take its **dimensions** with a tape measure, snap a **photo**, then **google together** the specs and a plausible price — model number, CPU, RAM, sale price, all typed by hand into a private spreadsheet (copy-pasted, mostly).

Then the hand-off chain began. Heinz merged the individual sheets into one **master spreadsheet** and exported it as **CSV**. Cem uploaded that CSV into **Kivitendo**, our Perl-based ERP and compliant book of record. And even then the device was visible nowhere: it did **not** appear in the shop automatically — that was yet another separate, manual step.

![The old intake workflow: weigh, measure, photograph and google specs flowed into a private spreadsheet, which Heinz merged into a master sheet, exported as CSV and handed to Cem, who uploaded it into Kivitendo; nothing appeared in the shop automatically — 5 to 15 minutes of pure manual work per device.](/blog/geraete-eingang-alt.svg)

Five to fifteen minutes of pure manual work — **per device**, spread across several people. The outcome was predictable: everyone on the team was supposed to do intake, but only a few did. Not out of ill will, but because the barrier was too high. A process nobody enjoys becomes the bottleneck — and a pile of unrecorded devices grows in the warehouse.

## The vision: drive intake practically to zero

The goal was deliberately radical: cut the time it takes to get a product into the system by **99.9 %**. Not "a bit faster" — a different order of magnitude.

The reasoning: a photo of a device already contains almost everything we need to know — make, model, often even condition. A written name ("Lenovo ThinkPad T450 i5") likewise. With AI that turns this raw material into structured fields, and with carefully built systems that **talk to each other over APIs**, one gesture should be enough: photograph or type — and the device lands where it belongs. Linked to a storage location in the database, or published directly as a listing in the shop.

## How it works today

![The new path: a name, a photo, a spoken sentence or a CSV row go to AI extraction (Qwen Vision, Groq, Whisper), which returns structured fields with category and confidence; a single function createErfassungProduct writes the record and branches to storage, QC or the marketplace, while syncing to Kivvi in parallel.](/blog/geraete-eingang-neu.svg)

### One intake, four channels

The `Geräte-Eingang` (device intake, `erfassung` in the code) has a deliberately plain interface with four input channels: **text**, **photo**, **file** (CSV/Excel) and **voice**. The design decision behind it matters — these are *channels*, not four separate workflows. However the data comes in, it converges on the same product record.

The text channel is clever: it detects automatically whether a line is a single device or a whole list. One line goes to `/api/admin/erfassung/text`, several lines to `/api/admin/erfassung/bulk-text` — so you can paste a whole pallet of devices at once and get a bulk review table back. CSV and Excel files run through `bulk-upload`, voice through `voice`.

### The AI cascade

The heart sits in `src/lib/erfassung/ai-extraction.ts`. `extractProductFromText` sends the text through a **fallback cascade** of three providers (`callWithFallback`): **Groq** first (`llama-3.3-70b-versatile`), then **OpenRouter**, then a local **Ollama**. If everything fails, a regex parser (`fastParseProductText`) is the last net — intake never hard-fails, it just gets less precise.

For photos, `extractProductFromImage` takes over. A small story from the engine room is worth telling here: Groq retired its previous vision model (Llama 4 Scout) — requests suddenly came back as `404 model_not_found`, and photo analysis was dead in production. The replacement today is **`qwen/qwen3.6-27b`**, the only currently available image-capable Groq model. But Qwen3 is a *reasoning* model: it thinks out loud in a `<think>…</think>` block before answering. A naive "grab the first `{…}`" parser promptly fished example JSON out of that thinking block and failed. The fix is a small, unspectacular function, `extractJsonObject`, that strips the reasoning blocks and the `json` code fences before the JSON is read. Voice, in turn, is transcribed with Groq's `whisper-large-v3-turbo` and then goes through the same text extraction.

Two things make the result usable rather than merely impressive. First, **per-field confidence**: every extracted field carries a certainty; the review form highlights only the fields that genuinely need a second look (a condition the text never stated, say), instead of plastering every value with a percentage. Second, **categorization**: `detectCategory` is an ordered pattern table mapping onto the existing category codes. The order is intentional — accessory, printer, monitor and network patterns match *before* the laptop brands, and internal components *last*, so a device name always wins. That way "Dockingstation Lenovo ThinkPad" is correctly filed as *Network* and not as a laptop.

### A single source of truth for writes

However different the channels are, writing happens in exactly one place: `createErfassungProduct()` in `src/lib/erfassung/create-product.ts`. This function is the *single source of truth* for "a device comes into being." In one transaction it assigns a human-readable item number (`I-YYMMDD-NNNN`), writes the extraction record (`ai_extracted_products`), creates the inventory entry (`inventory_items`, with location, box and quantity), links customer profiles, uploads the image to **R2** (object storage) and links it — and optionally publishes a listing straight away.

Because everything runs through this one function, the same invariants hold everywhere. That's also why we could later migrate **197 products from the old Shopware shop** in one pass (more on that below): the import calls exactly `createErfassungProduct`, instead of inventing a second, subtly different way to write.

### The quality gate

After review comes the only real operational decision: *where to next?* The `CAPTURE_DESTINATIONS` — quality, inventory, parts, recycling or "shop untested" — map onto intake tiers. A device of a check-required category that you want to publish directly is intercepted by a safety gate and lands instead as a draft in the refurbishment pipeline with a QC checklist — unless someone makes an explicitly logged "publish without check" decision. Whether a category requires a check isn't maintained separately but *derived from the checklist itself*: check-required means it has a required test or security item for that device class.

### Onto the marketplace

When a device is published, `publishRevampitListing` turns it into an active listing (`is_revampit` flag), carries the R2 image into the listing images, and indexes the entry in **Meilisearch** for search. The transition from "recorded" to "visible in the shop" is thus an API call, not a second person with a second form.

### The stress test: 197 products from the old shop

The best confirmation that the flow holds was the catalogue migration. The old Shopware shop had no usable API — but clean Open Graph metadata per product page. A small scraper walked the `/Alles/` listing, pulled name, brand, price, description and image URL, and a one-off migration endpoint created **each of the 197 products as a draft** — via `createErfassungProduct`, with the image downloaded server-side and re-hosted to R2. Categories were inferred via `detectCategory`, duplicates prevented via the stored Shopware number (idempotent, repeatable at will). What would have taken days by hand was a matter of minutes — exactly the point.

## Systems that talk to each other

Intake is only half the job. A device also has to arrive where stock and accounting live. And this is where it gets architecturally interesting, because two very different worlds hang off it.

![Integration architecture: the device intake writes inventory_items locally and syncs upward to Kivvi over its ready-made REST API with a bearer token and idempotency key, and receives status webhooks back; the path to the Perl legacy Kivitendo goes through a separate Node translation layer that imitates a browser.](/blog/geraete-eingang-integration.svg)

### Kivvi: a clean membrane

**Kivvi** is the modern, Swiss cloud ERP (TypeScript, Drizzle/Postgres) we sync devices to. It makes things easy because it offers exactly what an integration partner needs: a versioned REST API under `/api/v1/`. Our `syncToKivvi` (`src/lib/kivvi/client.ts`) does a `POST /api/v1/inventory-items` with a bearer token (`kv_…`) held server-side as a SHA-256 hash.

Three properties are decisive here — and in Kivvi's code they're even named for Revamp-IT:

- **Idempotency.** The call carries an `Idempotency-Key`; a double push creates no duplicate. That's precisely why we may retry without worry.
- **Non-blocking, after commit.** The sync is fire-and-forget: it starts *after* the intake's database transaction and never blocks the recording. Afterwards we write `kivvi_inventory_item_id` and `kivvi_sync_status` back onto the inventory entry. If Kivvi isn't configured (no `KIVVI_API_URL`), the client cleanly returns `{ success: false }` instead of throwing — in dev, simply no sync.
- **Bidirectional.** Kivvi sends signed webhooks back (`inventory_item.status_changed`, etc.). When a device is sold there, we learn about it — without polling.

A small but important translation step: RevampIT's condition vocabulary is mapped onto Kivvi's enum (`new → like_new`, `defect → parts_only`, unknown → `untested`). Without this mapping Kivvi's validation rejects the record with HTTP 400. Small contracts, kept clearly.

### Kivitendo: a translator, not a second brain

The other neighbour is **Kivitendo** — a Perl MVC ERP, our legally compliant book of record, which we deliberately *keep*. The catch: Kivitendo has **no API**. Its "interface" is the *View* — HTML forms for humans — and the controller is coupled to those forms. Every request is a POST of flat form fields to `controller.pl?action=Part/save`, which Kivitendo reassembles into one global structure, `$::form`.

A write there follows the pattern **load → overlay → save**, always on the *whole* object. That has a treacherous consequence: scalars are preserved when omitted — but **collections (prices, suppliers) are delete-and-replace**. Send a subset, and you lose the rest. So you cannot "just change one field" without having loaded the complete state first.

How do you connect a modern system to that? Not by rebuilding Kivitendo's logic, but with a thin **translation layer** — a Node service that imitates a browser. Its single flow: `receive → load (SELECT) → map inward → merge → send as a $::form POST → map outward → return`. The layer **never writes SQL** itself; writing happens exclusively through Kivitendo's own controller, so its validation, history and transaction stay in exactly *one* place. The guiding principle: **the business logic lives in Kivitendo — we are a translator, not a second brain.**

The elegant part: the per-entity mappings needed (which external field is called what internally, which form keys, which custom variables) are **generated by small, local LLMs** — extracted from Kivitendo's Perl ORM and controllers, round-trip-checked against a *real, captured* form POST. A mapping is correct if and only if it reproduces a POST Kivitendo accepted, parameter for parameter. Nothing is guessed. This piece is still experimental (the `Part` entity stands; it hasn't been hardened against a live instance yet), but the path is clear: a clean, versioned contract on the outside, Kivitendo's unchanged truth on the inside.

The honest caveat: much of this is *inferred* from a few captures and reading the source, not *observed* under controlled conditions. The least confirmed thing is, of all things, the most important — how Kivitendo signals success versus failure (a redirect carrying `&id=…` versus a 200 response with an error body). That belongs verified against a running instance first. Honest architecture names its open assumptions.

## The missing piece: storage and logistics

And here comes the part that isn't finished yet — named on purpose, because it's the planned work to round the product off.

![The missing middle: intake today registers a single device with an item number and a pointer to location and box; between it and Kivvi's ready-made warehouses, stock levels and movement ledger sits the absent storage-and-logistics management — real stock movements, picking, multi-warehouse, transfers.](/blog/geraete-eingang-lager.svg)

Today the device intake is essentially a **single-unit register with a QC checklist and a "where is it" pointer**. There's a lean table `storage_locations` (name, kind: main storage / shop / secondary storage / member possession / …), and the inventory entry carries a `storage_location_id`, a free `box_id` and a legacy `location` field. That answers: *"which shelf holds this one device?"*

What's **missing** is everything beyond that — and that, honestly, is the actual storage *management*:

- **No stock-movement ledger.** The counters `quantity_reserved`/`quantity_sold` exist as columns but are written nowhere. There are no in/out postings, no movement history.
- **No multi-warehouse, no transfers.** A flat location list, no hierarchy, no per-warehouse stock.
- **No picking, no goods receipt, no replenishment.** In short: no warehouse management, just a "where is what."

The good news: the docking point already exists. **Kivvi brings exactly the stock primitives we lack** — `warehouses`, `stockLevels` (stock per product and warehouse) and an append-only `stockMovements` ledger with signed quantities. Though at **accounting**, not **operational**, granularity: Kivvi knows warehouses as a name and address, but no bins, no pick routes, no carrier. A future RevampIT storage module therefore has two clean options — either drive Kivvi's `warehouseId` + `location` directly, or model the operational layer (bins, movements, picking) itself and run Kivvi as the *stock book of record* behind it. Thanks to the bidirectional webhooks, both sides stay in sync.

And Kivitendo? In principle the warehouse could be mirrored there too — via the same translation layer sketched above. Kivitendo has a warehouse/stock concept in its model; a stock movement would then be one more entity taking the same path: load, merge, send as a `$::form` POST to the appropriate controller. The larger effort lies not in the concept but in the care — stock is accounting-relevant, and Kivitendo's "collections get replaced" semantics demand that you always send the complete state. For a book of record, exactly that caution is warranted.

## Outlook

Intake is solved: from a photo or a written name, a clean, categorized, illustrated record appears in seconds — located in storage or published in the shop, and synced to Kivvi. The barrier that meant hardly anyone did intake is gone.

What remains is its physical counterpart: **knowing where every device is, and booking every movement cleanly.** That's the next piece — the bridge between our single-unit register and Kivvi's stock ledger, and, where needed, all the way into Kivitendo. Once it stands, the circle closes: from the gesture that records a device to the shelf it's sold from — without anyone having to keep a spreadsheet in between.
