-- Migration: 020_team_profiles.sql
-- Description: Create team_profiles table for Team & HR management
-- Author: RevampIT
-- Date: 2026-02-05

-- =============================================================================
-- TEAM PROFILES TABLE
-- =============================================================================
-- Extended profile information for staff members
-- Supports talent development, availability tracking, and HR management
-- =============================================================================

CREATE TABLE IF NOT EXISTS team_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Employment Information
    position TEXT,
    department TEXT,
    employment_type TEXT DEFAULT 'volunteer',
    start_date DATE,
    contract_hours INTEGER,

    -- Talent Development
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    goals TEXT,
    strengths TEXT,
    development_areas TEXT,

    -- Availability & Contact
    availability TEXT,
    working_hours TEXT,
    preferred_contact TEXT DEFAULT 'email',
    phone TEXT,

    -- Emergency Contact
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relation TEXT,

    -- HR Notes (restricted to super admins)
    hr_notes TEXT,

    -- Status & Timestamps
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_team_profiles_user_id ON team_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_team_profiles_department ON team_profiles(department);
CREATE INDEX IF NOT EXISTS idx_team_profiles_employment_type ON team_profiles(employment_type);
CREATE INDEX IF NOT EXISTS idx_team_profiles_is_active ON team_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_team_profiles_skills ON team_profiles USING GIN(skills);

-- =============================================================================
-- TRIGGER: Auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_team_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_team_profiles_updated_at ON team_profiles;
CREATE TRIGGER trigger_team_profiles_updated_at
    BEFORE UPDATE ON team_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_team_profiles_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE team_profiles IS 'Extended profile information for team members and staff';
COMMENT ON COLUMN team_profiles.user_id IS 'References users table - one profile per user';
COMMENT ON COLUMN team_profiles.employment_type IS 'employee, volunteer, intern, contractor';
COMMENT ON COLUMN team_profiles.skills IS 'Array of skill tags for the team member';
COMMENT ON COLUMN team_profiles.hr_notes IS 'Private HR notes - visible only to super admins';
COMMENT ON COLUMN team_profiles.preferred_contact IS 'email, phone, slack, or other';
