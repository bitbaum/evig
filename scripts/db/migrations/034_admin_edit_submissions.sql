-- ============================================================================
-- Migration: 034_admin_edit_submissions.sql
-- Description: Add edit tracking for admin modifications to workshop proposals
--              and blog submissions before approval
-- Dependencies: 016_workshop_proposals.sql, 019_blog_submissions.sql
-- ============================================================================

-- ============================================================================
-- WORKSHOP PROPOSALS: Add Edit Tracking
-- ============================================================================

-- Add edit history columns
ALTER TABLE workshop_proposals
  ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- Indexes for edit queries
CREATE INDEX IF NOT EXISTS idx_workshop_proposals_last_edited
  ON workshop_proposals(last_edited_at DESC NULLS LAST)
  WHERE last_edited_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workshop_proposals_edited_by
  ON workshop_proposals(last_edited_by)
  WHERE last_edited_by IS NOT NULL;

-- ============================================================================
-- BLOG SUBMISSIONS: Add Edit Tracking
-- ============================================================================

-- Add edit history columns
ALTER TABLE blog_submissions
  ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMPTZ;

-- Indexes for edit queries
CREATE INDEX IF NOT EXISTS idx_blog_submissions_last_edited
  ON blog_submissions(last_edited_at DESC NULLS LAST)
  WHERE last_edited_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_submissions_edited_by
  ON blog_submissions(last_edited_by)
  WHERE last_edited_by IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN workshop_proposals.edit_history IS 'JSONB array of edit snapshots: [{timestamp, editor_id, editor_name, fields_changed, snapshot}]';
COMMENT ON COLUMN workshop_proposals.last_edited_by IS 'Last admin who edited this proposal (NULL if never edited)';
COMMENT ON COLUMN workshop_proposals.last_edited_at IS 'Timestamp of last admin edit (NULL if never edited)';

COMMENT ON COLUMN blog_submissions.edit_history IS 'JSONB array of edit snapshots: [{timestamp, editor_id, editor_name, fields_changed, snapshot}]';
COMMENT ON COLUMN blog_submissions.last_edited_by IS 'Last admin who edited this submission (NULL if never edited)';
COMMENT ON COLUMN blog_submissions.last_edited_at IS 'Timestamp of last admin edit (NULL if never edited)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify columns exist
DO $$
BEGIN
  -- Check workshop_proposals columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workshop_proposals'
    AND column_name IN ('edit_history', 'last_edited_by', 'last_edited_at')
  ) THEN
    RAISE EXCEPTION 'workshop_proposals edit tracking columns not created';
  END IF;

  -- Check blog_submissions columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_submissions'
    AND column_name IN ('edit_history', 'last_edited_by', 'last_edited_at')
  ) THEN
    RAISE EXCEPTION 'blog_submissions edit tracking columns not created';
  END IF;

  RAISE NOTICE 'Migration 034 completed successfully';
END $$;
