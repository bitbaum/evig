-- Migration 040: Add Payrexx columns to marketplace_orders
-- Supports Payrexx reservation-based escrow alongside existing Stripe columns.

ALTER TABLE marketplace_orders
  ADD COLUMN IF NOT EXISTS payrexx_gateway_id TEXT,
  ADD COLUMN IF NOT EXISTS payrexx_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'payrexx';

-- Index for webhook lookups by transaction ID
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_payrexx_tx
  ON marketplace_orders (payrexx_transaction_id)
  WHERE payrexx_transaction_id IS NOT NULL;
