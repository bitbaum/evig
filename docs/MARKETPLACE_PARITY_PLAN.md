# Marketplace / Seller / Listing parity

**2026-07-13.** Selectively closed the real gaps against Ricardo + Refurbed that
serve the mission (affordable rehomed tech, sustainability trust, discoverability),
from first principles — reusing existing SSOT, config-driven, KISS/YAGNI. We did
**not** copy their feature lists; most of it is anti-mission or needs data we don't
honestly have.

## Shipped

- **Phase 1 — server-render listing detail + JSON-LD.** The detail page was fully
  `'use client'` (zero SEO). Refactored to server shell + client island:
  `src/lib/marketplace/listing-detail.ts` (SSOT data layer, `React.cache`),
  `generateMetadata` (title/desc/OG/canonical, noindex for non-active/sold),
  JSON-LD Product/Offer/AggregateRating/BreadcrumbList
  (`src/lib/seo/listing-json-ld.ts` + `safeJsonLd`), breadcrumb trail. API GET
  reuses the shared fetch (DRY). Prod-verified (2 ld+json blocks, OG, breadcrumb).
- **Phase 2 — CO₂ per card.** Compact `CO2Badge` variant on `ListingCard`, honest
  config-driven `estimateCO2Savings` (null when undefensible). Ricardo shows the
  same signal; on-brand for a non-profit refurbisher.
- **Phase 3 — seller reputation.** `GET /api/sellers/[id]` returns a 5★…1★
  histogram + recent reviews (verified-purchase flag from the stored column +
  seller responses). New shared `RatingBreakdown` + `SellerReviews` render on the
  profile (was: star average only).
- **Phase 4 — refurbished guarantee.** is_revampit stock shows the org's STATED
  policy (sourced, not invented): 6-month warranty (intake warranty label) + 14-day
  online return (AGB §5), one config constant `REVAMPIT_GUARANTEE`. P2P shows
  nothing (AGB §6). Added to `RevampitTrustStrip` + JSON-LD Offer
  (WarrantyPromise / MerchantReturnPolicy).

## Deliberately NOT done (first-principles / YAGNI)

- **Auctions/bidding** (Ricardo core) — anti-mission (affordable rehoming, no
  price maximisation).
- **"Savings % vs new price"** (Refurbed) — no honest reference price; inventing
  one violates the no-fake-numbers rule.
- **Phase 5 (deferred):** brand facet — `listings.brand` is free-text seller
  input, so exact-match filtering is unreliable and clean options need
  normalisation + a facet query. Favourite-on-card — per-card auth/optimistic for
  marginal value over the detail-page favourite. Revisit after brand normalisation
  / on demand.
- **Save-searches / follow-seller / watch-alerts / live chat** — need notification
  infra; defer.
- **Per-facet counts** — needs new aggregation; the list API doesn't return them
  today. Defer.

## Follow-ups

- Translate the new DE keys (registered in `messages/_missing/*`) — `i18n:apply`.
- Dynamic OG images (Satori) if link-preview quality matters — currently the
  first listing image is used (KISS).
