-- Fix marketplace_orders status constraint to accept 'pending_payment' instead of 'pending'
-- The application code uses 'pending_payment' to distinguish orders awaiting payment
-- from other states. The original migration (031) used 'pending' which doesn't match.

-- Drop the old constraint
ALTER TABLE marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_status_check;

-- Add updated constraint with 'pending_payment' instead of 'pending'
ALTER TABLE marketplace_orders ADD CONSTRAINT marketplace_orders_status_check
  CHECK (status IN ('pending_payment', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'));

-- Update any existing rows that have 'pending' to 'pending_payment'
UPDATE marketplace_orders SET status = 'pending_payment' WHERE status = 'pending';
