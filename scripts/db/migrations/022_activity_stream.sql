-- =============================================
-- TEAM ACTIVITY STREAM SYSTEM
--
-- Activity tracking for team profiles:
-- - Current focus status (what someone is working on)
-- - Manual activity updates (accomplishments, milestones)
-- - Help requests (broadcast or targeted)
--
-- Trust-based, voluntary sharing. No proof required.
--
-- Created: 2026-02-05
-- =============================================

-- Extend team_profiles with current focus
ALTER TABLE team_profiles
ADD COLUMN IF NOT EXISTS current_focus TEXT,
ADD COLUMN IF NOT EXISTS current_focus_updated_at TIMESTAMPTZ;

-- Activity updates table (manual entries: accomplishments, milestones, notes)
CREATE TABLE IF NOT EXISTS activity_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    update_type TEXT NOT NULL DEFAULT 'accomplishment'
        CHECK (update_type IN ('accomplishment', 'milestone', 'note', 'announcement')),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    visibility TEXT NOT NULL DEFAULT 'team'
        CHECK (visibility IN ('team', 'department', 'public')),
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help requests table (general, non-task help)
CREATE TABLE IF NOT EXISTS help_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    urgency TEXT NOT NULL DEFAULT 'normal'
        CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
    requested_user_id UUID REFERENCES users(id),  -- NULL = broadcast to all
    is_broadcast BOOLEAN GENERATED ALWAYS AS (requested_user_id IS NULL) STORED,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_activity_updates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_help_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop first if exists)
DROP TRIGGER IF EXISTS activity_updates_timestamp_trigger ON activity_updates;
CREATE TRIGGER activity_updates_timestamp_trigger
BEFORE UPDATE ON activity_updates
FOR EACH ROW
EXECUTE FUNCTION update_activity_updates_timestamp();

DROP TRIGGER IF EXISTS help_requests_timestamp_trigger ON help_requests;
CREATE TRIGGER help_requests_timestamp_trigger
BEFORE UPDATE ON help_requests
FOR EACH ROW
EXECUTE FUNCTION update_help_requests_timestamp();

-- Indexes for activity_updates
CREATE INDEX IF NOT EXISTS idx_activity_updates_user ON activity_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_updates_type ON activity_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_activity_updates_occurred ON activity_updates(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_updates_visibility ON activity_updates(visibility);
CREATE INDEX IF NOT EXISTS idx_activity_updates_category ON activity_updates(category) WHERE category IS NOT NULL;

-- Indexes for help_requests
CREATE INDEX IF NOT EXISTS idx_help_requests_requester ON help_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_help_requests_requested ON help_requests(requested_user_id) WHERE requested_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_help_requests_broadcast ON help_requests(is_broadcast) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON help_requests(urgency) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_help_requests_created ON help_requests(created_at DESC);

-- Index for team_profiles current_focus
CREATE INDEX IF NOT EXISTS idx_team_profiles_current_focus ON team_profiles(current_focus_updated_at DESC)
WHERE current_focus IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE activity_updates IS 'Manual activity updates: accomplishments, milestones, notes, announcements';
COMMENT ON TABLE help_requests IS 'General help requests (not task-specific), can be broadcast or targeted';
COMMENT ON COLUMN activity_updates.update_type IS 'accomplishment=completed something, milestone=major achievement, note=general update, announcement=team-wide message';
COMMENT ON COLUMN activity_updates.visibility IS 'team=all staff, department=same department, public=visible externally';
COMMENT ON COLUMN help_requests.requested_user_id IS 'NULL = broadcast to all staff';
COMMENT ON COLUMN help_requests.is_broadcast IS 'Auto-computed: true when requested_user_id is NULL';
COMMENT ON COLUMN team_profiles.current_focus IS 'Current work focus status (what the person is working on)';
COMMENT ON COLUMN team_profiles.current_focus_updated_at IS 'When current_focus was last updated';
