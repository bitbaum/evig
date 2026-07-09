-- 115_promo_codes.sql
-- Admin-issued discount + gift-card codes (redeemable at checkout across flows).
-- Distinct from the referral `coupons` table (per-user auto-issued rewards):
-- promo_codes are shareable, multi-use, typed, scoped, and limit-controlled.
--
-- Type/scope are app-level enums validated via zod/config (src/config/promo-codes.ts),
-- NOT SQL CHECK lists (per the repo rule — hand-synced CHECK enums drift). Only
-- true invariants (ranges, money non-negativity) are enforced here.

CREATE TABLE IF NOT EXISTS promo_codes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              varchar(64)  NOT NULL UNIQUE,
  type              varchar(20)  NOT NULL,                 -- 'percent' | 'fixed' | 'gift_card'
  percent           integer,                               -- type=percent: 1..100
  amount_cents      integer,                               -- type=fixed/gift_card: value in cents
  balance_cents     integer,                               -- gift_card: remaining balance
  scope             varchar(20)  NOT NULL DEFAULT 'all',   -- all|marketplace|membership|workshop|service
  min_order_cents   integer      NOT NULL DEFAULT 0,
  max_redemptions   integer,                               -- null = unlimited
  per_user_limit    integer,                               -- null = unlimited
  redeemed_count    integer      NOT NULL DEFAULT 0,
  valid_from        timestamptz,
  valid_until       timestamptz,
  is_active         boolean      NOT NULL DEFAULT true,
  created_by        uuid         REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT promo_percent_range      CHECK (percent IS NULL OR (percent >= 1 AND percent <= 100)),
  CONSTRAINT promo_amount_nonneg      CHECK (amount_cents IS NULL OR amount_cents >= 0),
  CONSTRAINT promo_balance_nonneg     CHECK (balance_cents IS NULL OR balance_cents >= 0),
  CONSTRAINT promo_min_order_nonneg   CHECK (min_order_cents >= 0),
  CONSTRAINT promo_redeemed_nonneg    CHECK (redeemed_count >= 0)
);

CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id            uuid NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id                  uuid REFERENCES users(id) ON DELETE SET NULL,
  order_ref                varchar(128),                   -- order / registration / appointment id
  scope                    varchar(20) NOT NULL,
  amount_discounted_cents  integer NOT NULL,
  created_at               timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT promo_redemption_amount_nonneg CHECK (amount_discounted_cents >= 0)
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_code_redemptions(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_user ON promo_code_redemptions(user_id);

-- Default codes: revamp100p = 100% off, revamp100 = CHF 100 off (capped at total).
INSERT INTO promo_codes (code, type, percent, is_active)
VALUES ('revamp100p', 'percent', 100, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO promo_codes (code, type, amount_cents, is_active)
VALUES ('revamp100', 'fixed', 10000, true)
ON CONFLICT (code) DO NOTHING;
