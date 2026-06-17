-- 089: Cart support for the marketplace (P3).
--
-- A marketplace order can now hold MULTIPLE items (RevampIT shop cart). Items
-- live in marketplace_order_items (distinct from the legacy Medusa `order_items`
-- which references the separate `orders` table). Single-item P2P orders keep
-- using marketplace_orders.listing_id directly; cart orders set listing_id NULL
-- and list their items here.

CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  listing_id    uuid NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  title         text NOT NULL,
  unit_price_chf numeric(10,2) NOT NULL,
  quantity      integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order ON marketplace_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_listing ON marketplace_order_items(listing_id);

-- Cart orders aggregate many items, so listing_id is no longer mandatory at the
-- order level. Existing single-item orders are unaffected.
ALTER TABLE marketplace_orders ALTER COLUMN listing_id DROP NOT NULL;
