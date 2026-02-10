-- =============================================
-- MEETING PROTOCOLS SYSTEM
--
-- Structured meeting minutes with AI processing:
-- - Paste transcript → AI structures it → review → finalize
-- - Action items link to tasks and (future) decisions
-- - Configurable visibility per protocol
--
-- Created: 2026-02-10
-- =============================================

-- Meeting protocols table
CREATE TABLE IF NOT EXISTS meeting_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_type TEXT NOT NULL CHECK (meeting_type IN ('team_weekly', 'project_review', 'retro', 'board', 'ad_hoc')),
    visibility TEXT NOT NULL DEFAULT 'team' CHECK (visibility IN ('team', 'attendees')),
    attendees JSONB DEFAULT '[]'::jsonb,
    raw_transcript TEXT,
    structured_notes JSONB,
    processing_model TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'review', 'finalized')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protocol action links (tracks tasks/decisions created from action items)
CREATE TABLE IF NOT EXISTS protocol_action_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID NOT NULL REFERENCES meeting_protocols(id) ON DELETE CASCADE,
    action_item_id TEXT NOT NULL,
    link_type TEXT NOT NULL CHECK (link_type IN ('task', 'decision')),
    linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    linked_decision_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_meeting_protocols_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS meeting_protocols_timestamp_trigger ON meeting_protocols;
CREATE TRIGGER meeting_protocols_timestamp_trigger
BEFORE UPDATE ON meeting_protocols
FOR EACH ROW
EXECUTE FUNCTION update_meeting_protocols_timestamp();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_protocols_meeting_date ON meeting_protocols(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_protocols_meeting_type ON meeting_protocols(meeting_type);
CREATE INDEX IF NOT EXISTS idx_protocols_status ON meeting_protocols(status);
CREATE INDEX IF NOT EXISTS idx_protocols_created_by ON meeting_protocols(created_by);
CREATE INDEX IF NOT EXISTS idx_protocol_action_links_protocol ON protocol_action_links(protocol_id);

-- Comments for documentation
COMMENT ON TABLE meeting_protocols IS 'Meeting minutes with AI-processed structured notes';
COMMENT ON TABLE protocol_action_links IS 'Links between protocol action items and tasks/decisions';
COMMENT ON COLUMN meeting_protocols.attendees IS 'JSONB array of user UUIDs who attended';
COMMENT ON COLUMN meeting_protocols.structured_notes IS 'AI-processed structured output (topics, action items, etc.)';
COMMENT ON COLUMN meeting_protocols.visibility IS 'team = all staff can see, attendees = only attendees + creator + super admins';
COMMENT ON COLUMN protocol_action_links.action_item_id IS 'UUID within the structured_notes JSONB action_items array';
