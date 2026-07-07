# Shopware → Marketplace Migration & Product-Lifecycle Hardening — Plan

**Status:** Proposal / pre-implementation
**Author:** Investigation session 2026-07-06
**Scope:** (1) Migrate the live catalogue from the legacy Shopware 6 shop
(`shop.revamp-it.ch`) into the unified `listings` store rendered at
`revampit.orangecat.ch/marketplace`; (2) verify and harden the two product-add
paths (user-submitted + admin) plus edit/delete; (3) fix the code debt and
best-practice violations found in the listing subsystem along the way.

> This document is the plan. **No code or data has been changed.** Sections
> marked **DECISION** need a call from the team before execution.

> **Decisions locked (2026-07-06):**
> - **A. Extraction = Admin CSV export.** The team exports the "Product" profile
>   from Shopware Admin → Import/Export and hands over the CSV (+ media). (I
>   cannot log into the admin panel myself — credential entry is off-limits — so
>   the export is a team step; I build the importer around the CSV shape.)
> - **E. Import only, decide later.** One-shot import now; the old shop is left
>   untouched, its decommission/redirect decided separately. No ongoing sync
>   built yet.
> - **B, C, D still open** — proposed defaults stand unless changed: items =
>   RevampIT shop stock (`is_revampit=true`); condition default `good`; specs
>   left empty on first pass.

---

## 1. Executive summary

- The old shop is **Shopware 6** (PHP 8.3, Apache, CHF, SwagPayPal, custom
  `revamp-theme`). It currently exposes **~192 live products** in its "Alles"
  category. Product URLs follow `/{slug}/{6-digit-number}`, and those numbers
  (`003879`–`019268`) are **ERP article numbers** in the same scheme as
  Kivitendo — an important dedup/linkage key.
- The target already has **exactly the two ingestion pipelines the request
  asks for** — they exist and work today:
  - **User-submitted** (P2P): `/marketplace/sell` → `POST /api/listings`
    (`is_revampit=false`).
  - **Admin**: `/admin/erfassung` → `inventory_items` →
    `publishRevampitListing()` (`is_revampit=true`).
  So this is *not* a "build two add flows" job — it's a "migrate data through
  the correct existing flow, then polish both flows" job.
- **Recommended load path:** import each Shopware product as **RevampIT shop
  stock** by mirroring the erfassung writer (`ai_extracted_products` +
  `inventory_items` + `product_images`) and calling the idempotent
  `publishRevampitListing(tx, inventoryItemId)`. This reuses the single SSOT
  insertion point, sets `is_revampit=true`, the system seller, delivery/payment
  defaults, image projection, and Meilisearch indexing in one place.
- The listing subsystem is **healthier than expected**: no arbitrary hex, no
  dead `marketplace_listings`/`/api/shop/inventory` references, parameterized
  SQL, `is_revampit` never derived from email. The real debt is a handful of
  **SSOT/taxonomy divergences** (two `CATEGORY_ICONS`, an AI-camera category
  list that bypasses `KATEGORIEN`, a dead `config/shop.ts`) plus some god files.
- **Biggest open risks:** category + condition mapping is lossy (Shopware
  categories are coarse German buckets; there is **no structured condition or
  spec field** on the source — specs live only in free-text descriptions), and
  the extraction method depends on what access we're given (admin login / Store
  API key / scrape).

---

## 2. Source analysis — the Shopware shop

### 2.1 Platform (verified)

| Fact | Evidence |
|---|---|
| Shopware **6** | `/store-api/*` returns `FRAMEWORK__API_INVALID_ACCESS_KEY`; `/admin` SPA responds 200; `/theme/<hash>/…` asset layout; `swag-pay-pal` bundle; `window.salesChannelId`/`activeNavigationId` globals |
| PHP 8.3, Apache 2.4 (Debian) | `Server` / `X-Powered-By` headers |
| Currency CHF, PayPal (PPCP) | inline storefront config |
| ~**192** live products | "192 Produkte" count on `/Alles/` |
| Category buckets ≈ 19 top-level | homepage nav (see 2.3) |
| Product URL = `/{slug}/{ERP#}` | e.g. `/Acer-Aspire-E5-575/006644`, `/AMD-Ryzen-5-9600/019076` |
| Media at `/media/…` + `/thumbnail/…` (400/800/1920) | image URLs in HTML, publicly fetchable over HTTP |
| **No sitemap** | `/sitemap.xml` index is empty |

### 2.2 What data is available per product

Each product-detail page is **server-rendered with schema.org microdata**
(`itemprop`): `name`, `description`, `sku`, `productID`, `price`,
`priceCurrency`, `brand`, `image` (multiple), `weight`, `width/height/depth`,
`releaseDate`. There is **no `product-detail-properties-table`** on the pages
sampled → **structured specs do not exist on the source**; any spec-like data
(RAM, CPU, storage) is embedded in the free-text `description` only.

**Consequence:** `listing_specs` cannot be populated by a direct field map. We
either (a) leave specs empty, or (b) run the existing AI extraction pipeline
over each description to synthesise specs. See DECISION-D.

### 2.3 Category taxonomy (source)

Homepage buckets (coarse, German, some multi-concept):

```
Computer und Komplettsysteme · Laptop und Zubehör · Drucker, Fax, Scanner …
Monitor, Beamer, Kamera · Tastatur, Maus, Spielsteuerung, VR ·
Mainboard, CPU, Ram · Steckkarten · Gehäuse/Netzteile/USB-Hubs/USV/Serverracks ·
Festplatten, Flashcards, Sticks · Laufwerke für Medien · Medien ·
Externe Netzwerkgeräte · Soundgeräte, Multimedia · Kühlung · Verbrauchsmaterial ·
Kabel, Adapter, Montage · Kleinteile · Spielekonsolen/Telefone/ext. Geräte ·
Elektronik Komponenten · Non-IT & Gadgets · Gutscheine · Alles
```

Per-category live counts (sampled): Festplatten 68, Computer 57, Laptop 51,
Drucker 23, Monitor 14, Kabel 11, Mainboard 10. (Categories overlap; "Alles" =
192 unique.)

### 2.4 Extraction options (**DECISION-A**)

| Option | How | Pros | Cons |
|---|---|---|---|
| **A1. Admin CSV export** (recommended) | Shopware Admin → Settings → Import/Export → export "Product" profile | Complete: number, name, description, price, stock, manufacturer, categories, active flag, media refs. Authoritative SSOT. One click. | Needs admin login (team has it); one manual step; media referenced, downloaded separately |
| **A2. Store API** | `GET /store-api/product` with the sales-channel **access key** (Admin → Sales Channels → API access, one field) | Clean paginated JSON; repeatable/automatable for re-syncs | Needs the key; only sales-channel-visible fields; still 192 items |
| **A3. Scrape microdata** | Fetch the 192 detail pages, parse `itemprop` | No credentials; we proved the data is present | Fragile; misses hidden fields (cost price, internal stock); slowest; must respect the site |

**Recommendation:** A1 (admin CSV) as the source of truth, with A3 microdata
scrape only to backfill image URLs / verify. A2 is the better choice **if** we
also want an ongoing sync rather than a one-shot import (see §7 phase 5).

---

## 3. Target analysis — how products live in the marketplace today

One store: the **`listings`** table (`src/db/schema/marketplace.ts:12`) +
`listing_images` (`:86`) + `listing_specs` (`:107`). `is_revampit` (stored
column, `:45`) is the SSOT that separates RevampIT shop stock from P2P. **No
`slug` column** — detail URLs are the UUID (`/marketplace/{id}`).

### 3.1 The two add paths (both already exist)

**User-submitted (P2P):**
`/marketplace/sell` (`MarketplaceSellPageClient.tsx`) → `useListingSellForm.ts`
→ images to `POST /api/uploads` → `POST /api/listings`
(`src/app/api/listings/route.ts:210`). Validates `CreateListingSchema`
(`src/lib/schemas/marketplace.ts:76`), **hardcodes `is_revampit=false`**
(`route.ts:226`), one transaction inserts listing + images + specs, auto-creates
`seller_profiles`, indexes Meilisearch, sends email.

**Admin:**
`/admin/erfassung` → `POST /api/admin/erfassung`
(`src/app/api/admin/erfassung/route.ts:19`) → `createErfassungProduct`
(`src/lib/erfassung/create-product.ts:114`) writes `ai_extracted_products` +
`inventory_items` + `product_images`, then (on publish)
`publishRevampitListing(tx, inventoryItemId)`
(`src/lib/marketplace/publish-revampit-listing.ts:82`). That helper is
**idempotent per inventory item**, sets `is_revampit=true`, system seller
`shop@revamp-it.ch`, `paymentMode='secure'`, delivery defaults, `status='active'`,
projects the primary image into `listing_images`, and indexes search.

### 3.2 Edit / delete (verified present)

- **P2P edit:** `PATCH /api/listings/[id]` (`[id]/route.ts:154`) — owner-gated,
  status transitions limited to `{draft, active}`, replaces images+specs.
- **Admin edit:** `PATCH /api/admin/marketplace/[id]` (any listing incl.
  RevampIT); source-product edit `PUT /api/admin/inventory/[id]`.
- **Delete:** all listing deletes are **soft** (`status='removed'`); the
  inventory source delete `DELETE /api/admin/inventory/[id]` is **hard** and
  cascades to the listing.

### 3.3 Target config SSOTs (mapping targets)

- **Categories:** `KATEGORIEN` (`src/config/erfassung/categories.ts:61`) — numeric
  IDs `10` Laptops, `20` Desktop PCs, `30` Monitore, `40` Tablets, `50`
  Smartphones, `60` Drucker & Scanner, `70` Komponenten, `80` Peripherie, `90`
  Netzwerk; marketplace adds `99` Sonstiges (`src/config/marketplace.ts:24`).
- **Conditions:** `{new, like_new, good, fair, poor, defect}`
  (`src/config/erfassung/conditions.ts:28`). ⚠️ `ai_extracted_products.condition`
  CHECK uses `damaged` not `defect` (`inventory.ts:39`); `publishRevampitListing`
  falls back unknowns to `good`.
- **Status:** `LISTING_STATUS` `{active, sold, reserved, draft, removed}`
  (`src/config/marketplace.ts:57`).
- **Limits:** `MAX_IMAGES=8`, `MAX_PRICE=50000` (`src/config/marketplace.ts:180`).

### 3.4 Image storage

S3-compatible (Cloudflare R2 in prod) via `src/lib/storage/image-upload.ts`
(`uploadImageBuffer`, `generateImageFilename` → `I-YYMMDD-NNNN.jpg`), folders
`products/` (RevampIT) and `users/{id}/` (P2P). The migration will fetch each
Shopware media URL → `uploadImageBuffer(..., 'products')` → `product_images`,
then let `publishRevampitListing` project it into `listing_images`.

---

## 4. Transformation & mapping (**DECISIONS B–D**)

### 4.1 Seller identity — **DECISION-B**

Migrated Shopware items are **RevampIT shop stock**, so `is_revampit=true`,
seller = system `shop@revamp-it.ch`. (They are *not* P2P community items.) This
matches CLAUDE.md's storefront model. Confirm this is the intent.

### 4.2 Category map (source bucket → `KATEGORIEN`) — proposed, review

| Shopware bucket | → target | ID |
|---|---|---|
| Computer und Komplettsysteme | Desktop PCs | `20` |
| Laptop und Zubehör | Laptops | `10` |
| Monitor, Beamer, Kamera | Monitore | `30` |
| Drucker, Fax, Scanner | Drucker & Scanner | `60` |
| Mainboard, CPU, Ram / Steckkarten / Kühlung / Laufwerke | Komponenten | `70` |
| Festplatten, Flashcards, Sticks | Komponenten (storage) | `70` |
| Tastatur, Maus, VR / Soundgeräte, Multimedia | Peripherie | `80` |
| Externe Netzwerkgeräte | Netzwerk | `90` |
| Spielekonsolen, **Telefone**, ext. Geräte | Smartphones/Sonstiges | `50`/`99` |
| Gehäuse/Netzteile/USV / Kabel/Adapter / Kleinteile / Verbrauchsmaterial / Medien / Elektronik / Non-IT & Gadgets | Sonstiges | `99` |
| **Gutscheine (vouchers)** | **EXCLUDE** | — |

Unmapped or ambiguous → `99` Sonstiges (never crash). A product living in
multiple Shopware categories picks the most specific mapped bucket.

### 4.3 Condition — **DECISION-C**

Source has no structured condition. Options: (a) default everything to `good`
and let staff refine; (b) parse condition hints from the description
("neuwertig", "gebraucht", "defekt") into `{like_new, good, defect}`. Proposal:
default `good`, flag for later review. Refurb items are realistically `good`/
`like_new`.

### 4.4 Specs — **DECISION-D**

No structured specs on source. Options: (a) leave `listing_specs` empty
(fastest, honest); (b) run the existing AI extraction over each description to
synthesise specs (richer, but costs AI calls and needs a QA pass). Proposal:
(a) for the first pass; (b) as an optional enrichment phase.

### 4.5 Direct field map

| Shopware | → target |
|---|---|
| `name` | `ai_extracted_products.name` → `listings.title` |
| `description` (HTML→sanitised text) | `description` |
| `price` (CHF) | `price_chf` (decimal string; clamp ≤ 50000) |
| `brand`/manufacturer | `brand` |
| `sku`/product number (6-digit) | `kivitendo_article_number` (read-only historical link) + dedup key |
| category (see 4.2) | `category` |
| `image` URLs | fetch → R2 → `product_images` → `listing_images` |
| stock | `inventory_items.marketplaceStatus` (`published` if >0 & active) |

### 4.6 Idempotency & dedup — **critical**

Re-running the import must **not** create duplicates. Key on the Shopware
**product number** stored in `kivitendo_article_number`: before insert, look up
an existing `ai_extracted_products`/`inventory_items` by that number; if found,
update instead of insert. `publishRevampitListing` is already idempotent per
`inventory_item_id`, so the listing layer is safe once the inventory layer is
keyed correctly.

---

## 5. Code-debt findings & remediation (from the audit)

**Verified clean (do not spend time here):** no `[#` hex, no `shadow-lg/xl`, no
gradients/inline-color in marketplace UI; no live `marketplace_listings` /
`/api/shop/inventory` references; `/shop/*` is thin redirects; `is_revampit`
never email-derived; parameterized SQL; no TODO/FIXME; clean git tree.

### HIGH — fix before/with the add-flow work (SSOT landmines)

1. **Duplicate divergent `CATEGORY_ICONS`.** `src/config/marketplace.ts:42`
   (keyed by numeric `KATEGORIEN`) vs
   `src/components/marketplace/ai-camera/config.ts:26` (keyed by hardcoded German
   names). → Delete the second; derive from `KATEGORIEN`.
2. **AI-camera bypasses the category SSOT.**
   `src/components/marketplace/ai-camera/ProductSuggestionCard.tsx:20` looks up
   the hardcoded name list; this is live in the sell flow. → Map AI labels to
   `KATEGORIEN` IDs.
3. **`src/config/shop.ts` is mostly dead + hardcoded** (`SHOP_CATEGORIES` with
   placeholder counts `24/18/12`, `POPULAR_SEARCHES`, `MEGA_MENU_COLUMNS`,
   test-only `getCategoryUrl/getSearchUrl`). Only `MARKETPLACE_LISTING_PLATFORM`
   has real importers. → Delete the dead block; keep the one live export.

### MEDIUM

4. Hardcoded German copy bypassing i18n —
   `src/components/marketplace/ai-camera/config.ts:58` `generateProductDescription()`.
5. Non-semantic badge palette without dark variants —
   `src/config/marketplace-status.ts:61` `PRODUCT_STATUS_BADGES`
   (`bg-orange-100…`). → Use `warning-*` + `dark:`.
6. Two review forms (`ReviewForm.tsx` + `OrderReviewForm.tsx`) — extract shared
   `StarRatingInput`.
7. Two spec editors (`marketplace-sell/SpecFields.tsx` +
   `erfassung/ProductSpecFields.tsx`) — extract shared row editor on next touch.
8. Legacy redirect URL builders disagree on slug→value format
   (`shop/category/[slug]/page.tsx` numeric map vs `config/shop.ts` slug map).

### LOW — god files (>300 lines, split as touched)

`erfassung/DataEntryTabs.tsx` (423) · `api/listings/[id]/route.ts` (399, extract
column-map + Meili sync to `lib/`) · `api/listings/route.ts` (361) ·
`api/marketplace/orders/route.ts` (356) · `erfassung/ImageCapture.tsx` (328) ·
`marketplace-sell/ListingFormFields.tsx` (306) · `lib/erfassung/create-product.ts`
(306, genuine domain — lowest priority).

---

## 6. Migration architecture

Build a **standalone, re-runnable import script** (not an API route) under
`scripts/migrations/shopware-import/`:

```
shopware-import/
  1-extract.ts     # read the admin CSV (or Store-API/scrape) → normalised JSON
  2-map.ts         # apply category/condition/field maps → intermediate records
  3-load.ts        # per record: fetch images → R2, upsert inventory (keyed on
                   #   Shopware number), call publishRevampitListing() in a tx
  mapping.ts       # category + condition maps (importable, testable SSOT)
  report.ts        # dry-run diff + post-run summary (created/updated/skipped)
```

Principles:
- **Reuse, don't reinvent:** load through `createErfassungProduct`-style writes
  + `publishRevampitListing`, not raw `listings` inserts.
- **Dry-run first:** `--dry-run` prints the mapped records + would-be
  create/update/skip counts, downloads nothing, writes nothing.
- **Idempotent:** keyed on `kivitendo_article_number` = Shopware number.
- **Targets prod DB via migration discipline:** the import is data, not schema —
  it runs against the Hetzner prod `DATABASE_URL` (per CLAUDE.md, prod = Hetzner
  Postgres, **not** Neon). Any *schema* change (unlikely needed) goes through
  `scripts/db/migrations/` only, never `drizzle-kit push`.
- **Batched + polite:** if scraping/Store-API, throttle; images fetched
  sequentially with retry.

---

## 7. Phased execution plan

**Phase 0 — Decisions & access (blocks everything).** Resolve DECISIONS A–D;
obtain the chosen extraction access (admin CSV export *or* Store-API key).

**Phase 1 — SSOT debt fixes (HIGH items 1–3). ✅ DONE (2026-07-06).**
- Added `resolveCategoryValue()` to the marketplace SSOT
  (`src/config/marketplace.ts`) — resolves any KATEGORIEN value / German label /
  free-text-AI label to a canonical category value, fallback `'99'`.
- Rewrote the ai-camera icon layer (`components/marketplace/ai-camera/config.ts`)
  to key off KATEGORIEN values (lucide components) via the resolver; removed the
  divergent German-name `CATEGORY_ICONS`. Updated `ProductSuggestionCard` +
  barrel.
- **Fixed a latent correctness bug:** `useAICamera` now normalizes the AI's
  free-text category (`'Electronics'`, etc.) to a KATEGORIEN value *before* it
  flows into the sell form — previously AI-detected listings got an
  invalid/blank category.
- Deleted dead `src/config/shop.ts` (+ its test + 3 stale `jest.mock` blocks +
  a shop section in `remaining-config.test.ts`).
- Verified: `tsc` clean, eslint clean, `lint:umlauts` clean, 27 marketplace-config
  tests (incl. new `resolveCategoryValue` suite) + 107 affected tests green.

**Phase 2 — Extraction + mapping, dry-run.** Build `1-extract`/`2-map`/`mapping`;
produce a mapped-records report for all ~192 items; **team reviews the category
+ condition assignments** before any write.

**Phase 3 — Load to staging/dev, verify.** Run `3-load` against a dev DB; verify
listings render at `/marketplace`, images resolve from R2, categories/filters
work, search indexes, no duplicates on a second run.

**Phase 4 — Load to prod.** Dry-run against prod → review diff → real run →
post-run report. Spot-check on `revampit.orangecat.ch/marketplace`. Keep the old
shop read-only until sign-off.

**Phase 5 — Deferred (DECISION-E = import only).** No ongoing sync or
decommission built now. The old shop is left running and untouched; its
freeze/redirect is a separate later decision. Revisit if the two catalogues
start to drift.

**Phase 6 (opportunistic) — MEDIUM/LOW debt.** Items 4–8 and god-file splits as
those files are touched; not blocking.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Lossy category mapping (coarse German buckets → numeric IDs) | Review table in §4.2 pre-load (Phase 2); default `99`, never crash |
| No structured condition/specs on source | Default `good`; optional AI enrichment (D); staff refine later |
| Duplicate products on re-run | Idempotent upsert keyed on Shopware number in `kivitendo_article_number` |
| Image fetch failures / hotlink limits | Sequential fetch + retry; report missing; listings still valid without image |
| Price/stock drift while both systems live | Freeze shop or Phase-5 sync; import stamps a source-of-truth date |
| Vouchers/non-stock items imported as products | Exclude `Gutscheine`; review "Non-IT & Gadgets" |
| Wrong DB target | Prod = Hetzner Postgres via `DATABASE_URL` (not Neon); data-only, no `drizzle-kit push` |
| HTML descriptions carry markup/scripts | Sanitise (same sanitiser the P2P POST path uses) before store |

---

## 9. Decisions needed (summary)

- **A. Extraction method** — admin CSV export (recommended) / Store-API key /
  scrape?
- **B. Item identity** — confirm migrated items = RevampIT shop stock
  (`is_revampit=true`, system seller).
- **C. Condition** — default all to `good`, or parse from description?
- **D. Specs** — leave empty first pass, or AI-enrich descriptions?
- **E. Shop lifecycle** — one-shot import, ongoing sync, or decommission &
  redirect the old shop?

---

## 10. Definition of done

- All in-scope Shopware products present as `listings` (`is_revampit=true`) with
  correct category, price (CHF), brand, and at least the primary image on R2.
- Re-running the import creates **zero** duplicates.
- Both add paths (P2P `POST /api/listings`, admin erfassung →
  `publishRevampitListing`) verified working; edit + soft-delete verified.
- Phase-1 SSOT debt fixed; `npm run lint`, `npm run typecheck`,
  `npm run lint:umlauts` green.
- Old shop frozen/redirected per DECISION-E; docs updated in the same change.
