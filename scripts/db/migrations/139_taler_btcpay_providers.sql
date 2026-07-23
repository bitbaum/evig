-- 139_taler_btcpay_providers.sql
-- Seed the two new payment rails so the multi-rail gateway can charge on them:
--   • taler  — GNU Taler (regulated digital cash, CHF settlement)
--   • btcpay — BTCPay Server (on-chain Bitcoin + Lightning)
--
-- Both are CAPTURE-ON-PAY (no authorize-then-capture hold) → offered for
-- non-escrow flows only; the escrow rule is enforced in app code
-- (src/config/payment-providers.ts + src/lib/payments/payment-flow.ts), NOT here.
--
-- The `type` column carried a hand-synced CHECK (extended for 'payrexx' in
-- migration 050). Per the repo rule — app-level enums live in src/config/* + zod,
-- NOT in SQL CHECK lists that drift — we DROP the CHECK for good instead of
-- extending it a third time. Provider rows are seeded by migration only (no user
-- write path), so the discriminator needs no DB-level enum guard.

ALTER TABLE payment_providers DROP CONSTRAINT IF EXISTS payment_providers_type_check;

-- GNU Taler — zero platform fee (the exchange/merchant handles its own).
INSERT INTO payment_providers (slug, name, type, is_active, supported_currencies, fee_percentage, fee_fixed_cents)
VALUES ('taler', 'GNU Taler', 'taler', true, ARRAY['CHF', 'EUR'], '0.0000', 0)
ON CONFLICT (slug) DO UPDATE SET is_active = true, name = 'GNU Taler', fee_percentage = '0.0000', fee_fixed_cents = 0;

-- BTCPay Server (Bitcoin) — zero platform fee; network fees are the buyer's.
INSERT INTO payment_providers (slug, name, type, is_active, supported_currencies, fee_percentage, fee_fixed_cents)
VALUES ('btcpay', 'Bitcoin', 'btcpay', true, ARRAY['CHF'], '0.0000', 0)
ON CONFLICT (slug) DO UPDATE SET is_active = true, name = 'Bitcoin', fee_percentage = '0.0000', fee_fixed_cents = 0;
