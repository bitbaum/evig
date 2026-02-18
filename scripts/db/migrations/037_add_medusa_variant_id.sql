-- Add medusa_variant_id to inventory_items
-- The Medusa cart API requires a variant_id to add items to cart.
-- Previously only medusa_product_id was stored.
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS medusa_variant_id TEXT;
