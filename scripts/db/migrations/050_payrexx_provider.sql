-- Migration: Add Payrexx as payment provider, deactivate Stripe
-- This migration supports the full switch from Stripe to Payrexx-only payments.

-- Add 'payrexx' to payment provider type constraint (if it uses a check constraint)
ALTER TABLE payment_providers DROP CONSTRAINT IF EXISTS payment_providers_type_check;
ALTER TABLE payment_providers ADD CONSTRAINT payment_providers_type_check
  CHECK (type IN ('stripe', 'paypal', 'bank_transfer', 'crypto', 'payrexx'));

-- Deactivate Stripe provider
UPDATE payment_providers SET is_active = false WHERE slug = 'stripe';

-- Insert Payrexx provider (or reactivate if it already exists)
INSERT INTO payment_providers (slug, name, type, is_active, supported_currencies, fee_percentage, fee_fixed_cents)
VALUES ('payrexx', 'Payrexx', 'payrexx', true, ARRAY['CHF', 'EUR'], '0.0290', 30)
ON CONFLICT (slug) DO UPDATE SET is_active = true, name = 'Payrexx';
