-- Add delivered_at and completed_at timestamps to marketplace_orders
-- so the buyer confirmation and review flow can display accurate timeline data.

ALTER TABLE marketplace_orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Backfill: any order already in 'completed' state gets completed_at = updated_at
UPDATE marketplace_orders
SET completed_at = updated_at
WHERE status = 'completed' AND completed_at IS NULL;

UPDATE marketplace_orders
SET delivered_at = updated_at
WHERE status IN ('delivered', 'completed') AND delivered_at IS NULL;
