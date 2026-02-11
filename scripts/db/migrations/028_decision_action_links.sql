-- Wire up decisions ↔ protocol_action_links
-- Add FK constraint now that the decisions table exists (idempotent)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_protocol_action_links_decision'
      AND table_name = 'protocol_action_links'
  ) THEN
    ALTER TABLE protocol_action_links
      ADD CONSTRAINT fk_protocol_action_links_decision
      FOREIGN KEY (linked_decision_id) REFERENCES decisions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_protocol_action_links_decision_id
  ON protocol_action_links(linked_decision_id)
  WHERE linked_decision_id IS NOT NULL;

-- Create index for looking up action links by decision
CREATE INDEX IF NOT EXISTS idx_protocol_action_links_protocol_id
  ON protocol_action_links(protocol_id);
