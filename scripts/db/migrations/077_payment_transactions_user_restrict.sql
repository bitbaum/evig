-- Migration 077: payment_transactions.user_id → ON DELETE RESTRICT
--
-- Financial / audit-trail tables must never silently lose rows because
-- a referenced user was deleted. The original 008_payment_processing_
-- system.sql defined `user_id UUID NOT NULL REFERENCES users(id) ON
-- DELETE CASCADE` — which means deleting a user account also deletes
-- every payment_transactions row for that user. That breaks:
--
--   - tax / accounting reconciliation (we are obligated to retain
--     transaction records for a multi-year retention window per Swiss
--     financial law — see docs/LEGAL_NONPROFIT_COMPLIANCE.md)
--   - refund disputes and chargebacks (Payrexx + the bank can still
--     reference a transaction we no longer have)
--   - operational audit (admin "why was this payment processed?")
--
-- Switching to RESTRICT makes user deletion fail loudly when the user
-- has payment history. The right path going forward is GDPR-anonymize-
-- then-soft-delete (set users.email = NULL, .name = 'Deleted user',
-- mark inactive) rather than DELETE — but that's a separate change
-- coordinated with whichever endpoint(s) actually delete users.
-- Today, RESTRICT just prevents the silent data loss.

-- Find the FK constraint name dynamically — Postgres auto-named it on
-- inline definition, almost always `payment_transactions_user_id_fkey`
-- but verify before dropping. The DO block makes the migration safe to
-- re-run.
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'payment_transactions'::regclass
    AND contype = 'f'
    AND conkey = ARRAY[
      (SELECT attnum FROM pg_attribute
       WHERE attrelid = 'payment_transactions'::regclass AND attname = 'user_id')
    ]
    AND confrelid = 'users'::regclass;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE payment_transactions DROP CONSTRAINT %I', fk_name);
  END IF;

  -- Only add the RESTRICT version if it isn't already in place. The
  -- name we add here is deterministic so a second run is a no-op.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_transactions_user_id_fkey_restrict'
      AND conrelid = 'payment_transactions'::regclass
  ) THEN
    ALTER TABLE payment_transactions
      ADD CONSTRAINT payment_transactions_user_id_fkey_restrict
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;
  END IF;
END
$$;
