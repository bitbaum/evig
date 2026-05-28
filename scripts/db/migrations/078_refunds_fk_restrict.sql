-- Migration 078: refunds → payment_transactions FK as ON DELETE RESTRICT
--
-- Sister of 077 (payment_transactions.user_id RESTRICT). The original
-- 008_payment_processing_system.sql defined refunds.original_transaction_id
-- and refunds.refund_transaction_id without an explicit ON DELETE policy
-- — so the default (NO ACTION) sort-of-protects them, but only at the
-- statement level. A `SET CONSTRAINTS ... DEFERRED` or any future change
-- to CASCADE on payment_transactions would silently nuke refund records.
--
-- Making the policy explicit + RESTRICT closes that door: a transaction
-- with refunds cannot be deleted, period. Refund history is the audit
-- trail used by Payrexx + bank dispute workflows; losing it is the kind
-- of operational disaster that takes weeks to reconcile.

DO $$
DECLARE
  fk_name TEXT;
BEGIN
  -- original_transaction_id
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'refunds'::regclass
    AND contype = 'f'
    AND confrelid = 'payment_transactions'::regclass
    AND conkey = ARRAY[
      (SELECT attnum FROM pg_attribute
       WHERE attrelid = 'refunds'::regclass AND attname = 'original_transaction_id')
    ];

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE refunds DROP CONSTRAINT %I', fk_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'refunds_original_transaction_id_fkey_restrict'
      AND conrelid = 'refunds'::regclass
  ) THEN
    ALTER TABLE refunds
      ADD CONSTRAINT refunds_original_transaction_id_fkey_restrict
      FOREIGN KEY (original_transaction_id) REFERENCES payment_transactions(id) ON DELETE RESTRICT;
  END IF;

  -- refund_transaction_id (nullable — the row that records the refund payment itself)
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'refunds'::regclass
    AND contype = 'f'
    AND confrelid = 'payment_transactions'::regclass
    AND conkey = ARRAY[
      (SELECT attnum FROM pg_attribute
       WHERE attrelid = 'refunds'::regclass AND attname = 'refund_transaction_id')
    ];

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE refunds DROP CONSTRAINT %I', fk_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'refunds_refund_transaction_id_fkey_restrict'
      AND conrelid = 'refunds'::regclass
  ) THEN
    ALTER TABLE refunds
      ADD CONSTRAINT refunds_refund_transaction_id_fkey_restrict
      FOREIGN KEY (refund_transaction_id) REFERENCES payment_transactions(id) ON DELETE RESTRICT;
  END IF;
END
$$;
