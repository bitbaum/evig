-- Migration 103: drop the legacy `marketplace_listings` table
--
-- `marketplace_listings` was RevampIT's internal-shop listing table, served by
-- the now-removed /api/shop/inventory routes. It has been dead for writes for
-- some time: RevampIT shop stock is published into the unified `listings` table
-- (is_revampit=true, inventory_item_id set) via lib/marketplace/publishRevampitListing,
-- and the public storefront is /marketplace + /api/listings.
--
-- All readers were repointed to `listings` before this migration:
--   - /api/stats/community  (active listing count)
--   - /api/stats/impact     (sold count — also fixed a double-count: RevampIT
--                            sold items were counted in BOTH listings and here)
--   - /api/admin/search-index (recent listings)
--   - /api/user/donations   (donation journey — now uses inventory_items.marketplace_status)
--
-- The table held orphan rows only; dropping it loses no live data. The FK from
-- marketplace_listings → inventory_items is removed with the table; no other
-- table references marketplace_listings.

DROP TABLE IF EXISTS marketplace_listings;
