-- Migration 047: Add intake events timeline to inventory_items
-- Stores chronological audit trail for device processing

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS intake_events JSONB DEFAULT '[]';

-- Each event follows: { type, description, userId, userEmail, timestamp, metadata? }
-- Event types: created, checklist_toggled, tier_changed, field_updated, published, note_added

COMMENT ON COLUMN inventory_items.intake_events IS 'Chronological audit trail of intake processing events';
