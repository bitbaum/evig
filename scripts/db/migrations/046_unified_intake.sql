-- Migration 046: Unified Device Intake System
--
-- Links donations → inventory and adds checklist-driven intake workflow.
-- Devices CANNOT be published to marketplace until all required checklist items are completed.
--
-- Depends on:
--   - 004_erfassung_tables.sql (inventory_items, ai_extracted_products)
--   - donations table (from earlier migrations)

-- Add intake workflow columns to inventory_items
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS intake_tier VARCHAR(20),
  ADD COLUMN IF NOT EXISTS intake_checklist JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS checklist_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_donation_id UUID REFERENCES donations(id);

-- Add source tracking to ai_extracted_products
ALTER TABLE ai_extracted_products
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'erfassung';

-- Index for pipeline queries (intake items only)
CREATE INDEX IF NOT EXISTS idx_inventory_intake_tier ON inventory_items (intake_tier)
  WHERE intake_tier IS NOT NULL;

-- Index for donation lookups
CREATE INDEX IF NOT EXISTS idx_inventory_donation ON inventory_items (source_donation_id)
  WHERE source_donation_id IS NOT NULL;

-- Index for checklist readiness queries
CREATE INDEX IF NOT EXISTS idx_inventory_checklist_complete ON inventory_items (checklist_complete)
  WHERE intake_tier IS NOT NULL;

COMMENT ON COLUMN inventory_items.intake_tier IS 'Intake processing tier: refurbish, parts, or recycle. NULL = legacy item (not created via intake)';
COMMENT ON COLUMN inventory_items.intake_checklist IS 'JSONB checklist state: { itemId: { completed, completedBy, completedAt, notes } }';
COMMENT ON COLUMN inventory_items.checklist_complete IS 'Derived flag: true when all required checklist items are completed. Gates marketplace publishing.';
COMMENT ON COLUMN inventory_items.source_donation_id IS 'Link to donation record if this item came from a device donation';
COMMENT ON COLUMN ai_extracted_products.source_type IS 'How this product was created: intake, erfassung, bulk_import';
