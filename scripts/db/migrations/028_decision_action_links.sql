-- Wire up decisions ↔ protocol_action_links
-- Add FK constraint now that the decisions table exists

ALTER TABLE protocol_action_links
  ADD CONSTRAINT fk_protocol_action_links_decision
  FOREIGN KEY (linked_decision_id) REFERENCES decisions(id) ON DELETE SET NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_protocol_action_links_decision_id
  ON protocol_action_links(linked_decision_id)
  WHERE linked_decision_id IS NOT NULL;

-- Create index for looking up action links by decision
CREATE INDEX IF NOT EXISTS idx_protocol_action_links_protocol_id
  ON protocol_action_links(protocol_id);
