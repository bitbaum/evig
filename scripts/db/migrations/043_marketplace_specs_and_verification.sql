-- 043: Marketplace Specs, Verification & Category SSOT Migration
--
-- This migration adds:
-- 1. listing_specs table for structured technical specifications
-- 2. Verification columns on listings for RevampIT-tested items
-- 3. condition_checks JSONB for category-specific condition criteria
-- 4. Data migration: category string labels → KATEGORIEN numeric IDs
--
-- All changes are additive and safe to run multiple times (IF NOT EXISTS).

BEGIN;

-- ============================================================================
-- 1. listing_specs table — structured tech specs per listing
-- ============================================================================

CREATE TABLE IF NOT EXISTS listing_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  spec_key TEXT NOT NULL,
  spec_value TEXT NOT NULL,
  spec_unit TEXT,
  normalized_value NUMERIC,
  UNIQUE(listing_id, spec_key)
);

CREATE INDEX IF NOT EXISTS idx_listing_specs_listing ON listing_specs(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_specs_filter ON listing_specs(spec_key, normalized_value);

-- ============================================================================
-- 2. Verification columns on listings — RevampIT-tested items
-- ============================================================================

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- ============================================================================
-- 3. condition_checks JSONB — category-specific condition criteria
-- ============================================================================

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS condition_checks JSONB;

-- ============================================================================
-- 4. Category data migration — string labels → numeric IDs (from KATEGORIEN)
--
-- Maps existing marketplace category strings to erfassung numeric IDs.
-- This is safe to run multiple times; already-migrated rows won't match.
-- ============================================================================

UPDATE listings SET category = '10' WHERE category = 'Laptops';
UPDATE listings SET category = '20' WHERE category = 'Desktop PCs';
UPDATE listings SET category = '30' WHERE category = 'Monitore';
UPDATE listings SET category = '50' WHERE category = 'Smartphones';
UPDATE listings SET category = '40' WHERE category = 'Tablets';
UPDATE listings SET category = '60' WHERE category = 'Drucker & Scanner';
UPDATE listings SET category = '90' WHERE category = 'Netzwerk & Router';
UPDATE listings SET category = '70' WHERE category = 'Komponenten';
UPDATE listings SET category = '80' WHERE category = 'Zubehör';
UPDATE listings SET category = '99' WHERE category = 'Sonstiges';

-- Note: 'Zubehör' maps to '80' (Peripherie) as the closest match.
-- 'Sonstiges' gets '99' as a catch-all (not in KATEGORIEN but preserved for data).

COMMIT;
