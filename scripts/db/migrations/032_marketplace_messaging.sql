-- Migration 032: Marketplace messaging support
-- Adds 'marketplace' to conversation context types

-- Update conversations check constraint to include 'marketplace'
-- First drop existing constraint, then re-add with marketplace
DO $$
BEGIN
  -- Try to drop the existing check constraint (name may vary)
  BEGIN
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_context_type_check;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Constraint doesn't exist, that's fine
  END;

  -- Add updated check constraint including marketplace
  BEGIN
    ALTER TABLE conversations ADD CONSTRAINT conversations_context_type_check
      CHECK (context_type IN ('appointment', 'general', 'it_hilfe', 'marketplace'));
  EXCEPTION WHEN OTHERS THEN
    -- If constraint already includes marketplace or table has no constraint, continue
    NULL;
  END;
END $$;

-- Index for finding marketplace conversations by context_id (listing_id)
CREATE INDEX IF NOT EXISTS idx_conversations_marketplace
  ON conversations (context_type, context_id)
  WHERE context_type = 'marketplace';
