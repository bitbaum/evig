-- Migration 113: baseline Kivvi inventory sync columns
--
-- src/db/schema/inventory.ts writes these columns when creating intake
-- inventory rows, but fresh migration replays never created them. Production
-- has them from schema push drift; CI E2E caught the missing columns when the
-- intake journey inserted into inventory_items.

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS kivvi_inventory_item_id UUID,
  ADD COLUMN IF NOT EXISTS kivvi_sync_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kivvi_synced_at TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS inventory_items_kivvi_inventory_item_id_key
  ON inventory_items (kivvi_inventory_item_id)
  WHERE kivvi_inventory_item_id IS NOT NULL;
