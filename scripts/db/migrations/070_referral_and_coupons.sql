-- Migration 070: Referral codes and coupons
-- Enables user-to-user invitations with CHF discount incentives.

-- One referral code per user (lazy-created on first view).
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(16) NOT NULL,
  uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT referral_codes_code_unique UNIQUE (code),
  CONSTRAINT referral_codes_user_unique UNIQUE (user_id)
);

CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);

-- Invitations sent via a referral code.
CREATE TABLE IF NOT EXISTS referral_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registered_at TIMESTAMPTZ,
  rewarded_at TIMESTAMPTZ,
  CONSTRAINT referral_invitations_unique UNIQUE (referral_code_id, invited_email)
);

CREATE INDEX idx_referral_invitations_code ON referral_invitations(referral_code_id);

-- Discount coupons issued to users (both welcome and referral rewards).
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  code VARCHAR(32) NOT NULL,
  amount_cents INTEGER NOT NULL,
  -- 'referral_welcome' = invitee joins via referral link
  -- 'referral_reward'  = inviter gets reward when invitee completes first purchase
  source VARCHAR(32) NOT NULL,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coupons_code_unique UNIQUE (code)
);

CREATE INDEX idx_coupons_user ON coupons(user_id);
CREATE INDEX idx_coupons_code ON coupons(code);
