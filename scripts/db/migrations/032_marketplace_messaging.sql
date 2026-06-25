-- Migration 032: Marketplace messaging support
-- Legacy: some DBs renamed conversations.type → context_type; fresh installs use type (005c).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'context_type'
  ) THEN
    BEGIN
      ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_context_type_check;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    BEGIN
      ALTER TABLE conversations ADD CONSTRAINT conversations_context_type_check
        CHECK (context_type IN ('appointment', 'general', 'it_hilfe', 'marketplace'));
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    CREATE INDEX IF NOT EXISTS idx_conversations_marketplace
      ON conversations (context_type, context_id)
      WHERE context_type = 'marketplace';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'type'
  ) THEN
    -- 005c already includes 'marketplace' in type CHECK; add partial index for lookups.
    CREATE INDEX IF NOT EXISTS idx_conversations_marketplace
      ON conversations (type, context_id)
      WHERE type = 'marketplace';
  END IF;
END $$;
