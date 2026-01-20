-- ============================================================================
-- RevampIT Permission Request System Migration
-- Created: 2026-01-20
-- Description: Adds permission request workflow for staff members
-- ============================================================================

-- ============================================================================
-- 1. CREATE PERMISSION REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_permission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Requester info
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Requested section(s)
    requested_sections TEXT[] NOT NULL,  -- Array of section names

    -- Request details
    reason TEXT NOT NULL,  -- Why they need access

    -- Status
    status TEXT NOT NULL DEFAULT 'pending',  -- pending, approved, rejected

    -- Review info
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_permission_requests_user_id ON staff_permission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_requests_status ON staff_permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_permission_requests_reviewed_by ON staff_permission_requests(reviewed_by);

-- ============================================================================
-- 3. ADD UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_staff_permission_requests_updated_at ON staff_permission_requests;

CREATE TRIGGER update_staff_permission_requests_updated_at
BEFORE UPDATE ON staff_permission_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

COMMENT ON TABLE staff_permission_requests IS 'Tracks staff permission requests for admin sections';
COMMENT ON COLUMN staff_permission_requests.requested_sections IS 'Array of admin section names (e.g., hirn, finances, team)';
COMMENT ON COLUMN staff_permission_requests.status IS 'pending, approved, or rejected';
