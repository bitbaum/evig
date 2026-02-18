-- ============================================================================
-- Migration: 038_workshop_schema_enhancement.sql
-- Description: Add missing columns to workshops and workshop_instances tables
--              so the proposal approve route can copy proposal fields into them.
-- Dependencies: 001-unified-auth.sql (workshops, workshop_instances)
--               016_workshop_proposals.sql (workshop_proposals)
-- ============================================================================

-- ============================================================================
-- WORKSHOPS: Add columns that exist in workshop_proposals but not in workshops
-- ============================================================================

ALTER TABLE workshops ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS min_participants INTEGER DEFAULT 3;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS prerequisites TEXT;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS learning_objectives TEXT[] DEFAULT '{}';
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS materials_provided TEXT;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS materials_required TEXT;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS featured_image TEXT;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- WORKSHOP_INSTANCES: Add missing columns used by the approve route
-- ============================================================================

ALTER TABLE workshop_instances ADD COLUMN IF NOT EXISTS location_details TEXT;
ALTER TABLE workshop_instances ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES for new FK columns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workshops_instructor ON workshops(instructor_id);
CREATE INDEX IF NOT EXISTS idx_workshops_created_by ON workshops(created_by);
CREATE INDEX IF NOT EXISTS idx_workshop_instances_instructor ON workshop_instances(instructor_id);

-- ============================================================================
-- BACKFILL: Best-effort parse duration_minutes from existing TEXT duration
-- e.g. '2 Tage' → 960, '1 Tag' → 480, '4 Sitzungen' → 480
-- ============================================================================

UPDATE workshops
SET duration_minutes = CASE
    WHEN duration ~ '^\d+ Tag' THEN
        (regexp_replace(duration, '[^0-9]', '', 'g'))::INTEGER * 480
    WHEN duration ~ '^\d+ Sitzung' THEN
        (regexp_replace(duration, '[^0-9]', '', 'g'))::INTEGER * 120
    ELSE NULL
END
WHERE duration IS NOT NULL AND duration_minutes IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN workshops.short_description IS 'Brief summary for cards/listings';
COMMENT ON COLUMN workshops.duration_minutes IS 'Total duration in minutes (replaces TEXT duration for proposals)';
COMMENT ON COLUMN workshops.min_participants IS 'Minimum attendees for workshop to run';
COMMENT ON COLUMN workshops.prerequisites IS 'Required prior knowledge';
COMMENT ON COLUMN workshops.learning_objectives IS 'Array of learning goals';
COMMENT ON COLUMN workshops.target_audience IS 'Who this workshop is for';
COMMENT ON COLUMN workshops.materials_provided IS 'What we provide to participants';
COMMENT ON COLUMN workshops.materials_required IS 'What participants need to bring';
COMMENT ON COLUMN workshops.featured_image IS 'Hero image URL';
COMMENT ON COLUMN workshops.instructor_id IS 'Default instructor for this workshop';
COMMENT ON COLUMN workshops.created_by IS 'Admin who created this workshop';
COMMENT ON COLUMN workshops.updated_by IS 'Admin who last updated this workshop';
COMMENT ON COLUMN workshop_instances.location_details IS 'Additional venue details (JSON or text)';
COMMENT ON COLUMN workshop_instances.instructor_id IS 'Instance-level instructor override';
