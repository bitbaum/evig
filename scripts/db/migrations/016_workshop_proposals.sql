-- ============================================================================
-- Migration: 016_workshop_proposals.sql
-- Description: Add workshop proposals system for user-submitted workshop ideas
-- Dependencies: 001-unified-auth.sql (users, workshops tables)
-- ============================================================================

-- ============================================================================
-- LOCATIONS TABLE
-- Required for workshop venue management
-- ============================================================================

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('venue', 'home', 'online', 'community_center', 'business')),
    description TEXT,

    -- Address information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    postal_code VARCHAR(10),
    city VARCHAR(100) NOT NULL,
    canton VARCHAR(50),
    country VARCHAR(100) DEFAULT 'Switzerland',

    -- Geographic coordinates (for mapping)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Capacity and facilities
    max_capacity INTEGER,
    facilities TEXT[] DEFAULT '{}',

    -- Contact information
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for locations
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;

-- ============================================================================
-- WORKSHOP PROPOSALS TABLE
-- User-submitted workshop ideas for admin review
-- ============================================================================

CREATE TABLE IF NOT EXISTS workshop_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    category VARCHAR(100),
    duration_minutes INTEGER NOT NULL,
    level VARCHAR(20) NOT NULL DEFAULT 'beginner'
        CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    max_participants INTEGER NOT NULL DEFAULT 10,
    min_participants INTEGER NOT NULL DEFAULT 3,
    price_cents INTEGER NOT NULL DEFAULT 0,
    prerequisites TEXT,
    learning_objectives TEXT[] DEFAULT '{}',
    target_audience TEXT,
    materials_provided TEXT,
    materials_required TEXT,
    location_type VARCHAR(20) NOT NULL DEFAULT 'venue'
        CHECK (location_type IN ('venue', 'online', 'home')),
    selected_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    proposed_location TEXT,
    proposed_date DATE,
    proposed_time TIME,
    special_requirements TEXT,
    terms_accepted BOOLEAN NOT NULL DEFAULT false,

    -- Review status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'requires_changes')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Unique index to prevent duplicate proposals same day (use date_trunc which is IMMUTABLE for 'day')
CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_proposals_unique_per_day
    ON workshop_proposals(user_id, title, (date_trunc('day', created_at AT TIME ZONE 'UTC')));

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_workshop_proposals_user ON workshop_proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_proposals_status ON workshop_proposals(status);
CREATE INDEX IF NOT EXISTS idx_workshop_proposals_category ON workshop_proposals(category);
CREATE INDEX IF NOT EXISTS idx_workshop_proposals_created ON workshop_proposals(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_workshop_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_workshop_proposals_updated_at ON workshop_proposals;
CREATE TRIGGER trigger_workshop_proposals_updated_at
    BEFORE UPDATE ON workshop_proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_workshop_proposals_updated_at();

-- Trigger for locations updated_at
DROP TRIGGER IF EXISTS trigger_locations_updated_at ON locations;
CREATE TRIGGER trigger_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_workshop_proposals_updated_at();

-- ============================================================================
-- SEED DATA: Default locations
-- ============================================================================

INSERT INTO locations (name, type, city, address_line1, postal_code, is_active, is_approved)
VALUES
    ('RevampIT Verkaufsstelle', 'venue', 'Zürich', 'Birmensdorferstr. 379', '8055', true, true),
    ('RevampIT Lager', 'venue', 'Zürich', 'Badenerstr. 816', '8048', true, true),
    ('Online (Jitsi/BBB)', 'online', 'Online', NULL, NULL, true, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE locations IS 'Workshop and service venue locations';
COMMENT ON TABLE workshop_proposals IS 'User-submitted workshop ideas pending admin approval';
COMMENT ON COLUMN workshop_proposals.status IS 'pending: awaiting review, approved: converted to workshop, rejected: declined, requires_changes: needs revision';
