-- =============================================================================
-- 042_newsletter_confirm_token
-- Purpose: Add confirm_token column for email confirmation flow
-- =============================================================================

ALTER TABLE newsletter_subscriptions
  ADD COLUMN IF NOT EXISTS confirm_token TEXT;

CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_confirm_token
  ON newsletter_subscriptions (confirm_token)
  WHERE confirm_token IS NOT NULL;
