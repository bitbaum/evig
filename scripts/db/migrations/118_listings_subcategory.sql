-- Migration 118: subcategory on listings for real component part-matching
--
-- `listings.category` holds only the MAIN KATEGORIEN code (e.g. 70 Komponenten),
-- so the granular component codes (701 Grafikkarten, 702 RAM, 703 SSDs, 704 CPUs,
-- 705 Netzteile, 706 Mainboards) never reached the storefront — a build tool
-- couldn't tell a GPU from a CPU. The data already exists upstream on
-- ai_extracted_products.subcategory (captured at erfassung); this surfaces it on
-- the listing so the marketplace/build tool can filter by component type.

ALTER TABLE listings ADD COLUMN IF NOT EXISTS subcategory text;

CREATE INDEX IF NOT EXISTS idx_listings_subcategory ON listings (subcategory);

-- Backfill existing RevampIT listings from their source product's subcategory.
UPDATE listings l
SET subcategory = aep.subcategory
FROM inventory_items ii
JOIN ai_extracted_products aep ON aep.id = ii.ai_product_id
WHERE l.inventory_item_id = ii.id
  AND l.is_revampit = true
  AND l.subcategory IS NULL
  AND aep.subcategory IS NOT NULL
  AND aep.subcategory <> '';
