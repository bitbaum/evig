-- ============================================================================
-- RevampIT Simplified Auth System Migration
-- Created: 2026-01-20
-- Description: Simplifies the role system to staff + permissions
-- ============================================================================

-- ============================================================================
-- 1. ADD NEW COLUMNS TO USERS TABLE
-- ============================================================================

-- Add is_staff flag (auto-determined by email domain)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_staff BOOLEAN DEFAULT FALSE;

-- Add staff_permissions array (sections they can access)
ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_permissions TEXT[] DEFAULT '{}';

-- ============================================================================
-- 2. MIGRATE EXISTING DATA
-- ============================================================================

-- Set is_staff = true for all @revamp-it.ch emails
UPDATE users
SET is_staff = TRUE
WHERE email LIKE '%@revamp-it.ch';

-- Migrate existing admin/super_admin roles to full permissions
UPDATE users
SET staff_permissions = ARRAY['*']
WHERE role IN ('revampit_super_admin', 'revampit_admin', 'admin', 'REVAMPIT_ADMIN')
   OR email LIKE '%@revamp-it.ch';

-- Migrate editor roles
UPDATE users
SET staff_permissions = ARRAY['dashboard', 'content', 'products', 'workshops', 'approvals']
WHERE role = 'revampit_editor';

-- Migrate support roles
UPDATE users
SET staff_permissions = ARRAY['dashboard', 'users', 'reviews', 'approvals']
WHERE role = 'revampit_support';

-- Migrate hirn_admin roles
UPDATE users
SET staff_permissions = ARRAY['dashboard', 'hirn', 'finances', 'analytics']
WHERE role = 'hirn_admin';

-- Migrate hirn_user roles
UPDATE users
SET staff_permissions = ARRAY['dashboard', 'hirn', 'analytics']
WHERE role = 'hirn_user';

-- ============================================================================
-- 3. CREATE TECHNICIAN PROFILES TABLE (replaces repairer concept)
-- ============================================================================

CREATE TABLE IF NOT EXISTS technician_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Profile info
    display_name TEXT NOT NULL,
    bio TEXT,

    -- Skills and expertise
    skills TEXT[] DEFAULT '{}',  -- e.g., ['linux', 'hardware_repair', 'data_recovery']
    certifications TEXT[] DEFAULT '{}',
    experience_years INTEGER,

    -- Service details
    service_types TEXT[] DEFAULT '{}',  -- e.g., ['repair', 'installation', 'consulting']
    hourly_rate_cents INTEGER,  -- NULL = "auf Anfrage"
    availability TEXT,  -- e.g., 'Mo-Fr 9-17', 'Flexibel'
    service_area TEXT,  -- e.g., 'Zürich und Umgebung', 'Remote'

    -- Contact preferences
    contact_email TEXT,
    contact_phone TEXT,
    preferred_contact TEXT DEFAULT 'platform',  -- platform, email, phone

    -- Location
    city TEXT,
    canton TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ============================================================================
-- 4. CREATE SELLER PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Profile info
    display_name TEXT NOT NULL,
    bio TEXT,

    -- Seller details
    seller_type TEXT DEFAULT 'individual',  -- individual, business
    company_name TEXT,

    -- Location
    city TEXT,
    canton TEXT,

    -- Contact
    contact_email TEXT,
    contact_phone TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Stats (denormalized for performance)
    total_sales INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ============================================================================
-- 5. CREATE USER CONTENT TABLE (unified pending content)
-- ============================================================================

-- This tracks all user-submitted content that needs approval
CREATE TABLE IF NOT EXISTS user_content_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Content type and reference
    content_type TEXT NOT NULL,  -- 'product', 'service', 'workshop', 'blog_post'
    content_id UUID,  -- Reference to the actual content table

    -- Submission details
    title TEXT NOT NULL,
    summary TEXT,

    -- Status
    status TEXT DEFAULT 'pending',  -- draft, pending, approved, rejected

    -- Review info
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,

    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_is_staff ON users(is_staff);
CREATE INDEX IF NOT EXISTS idx_users_staff_permissions ON users USING GIN(staff_permissions);
CREATE INDEX IF NOT EXISTS idx_technician_profiles_user_id ON technician_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_technician_profiles_skills ON technician_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_submissions_user_id ON user_content_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_submissions_status ON user_content_submissions(status);
CREATE INDEX IF NOT EXISTS idx_user_content_submissions_content_type ON user_content_submissions(content_type);

-- ============================================================================
-- 7. ADD UPDATED_AT TRIGGERS
-- ============================================================================

-- Apply trigger to new tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN VALUES ('technician_profiles'), ('seller_profiles'), ('user_content_submissions')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON COLUMN users.is_staff IS 'True if user is RevampIT staff (auto-set by @revamp-it.ch email)';
COMMENT ON COLUMN users.staff_permissions IS 'Array of admin sections this staff member can access. ["*"] = full access.';
COMMENT ON TABLE technician_profiles IS 'Profiles for users offering technical services (repairs, installations, consulting)';
COMMENT ON TABLE seller_profiles IS 'Profiles for users selling products on the marketplace';
COMMENT ON TABLE user_content_submissions IS 'Tracks all user-submitted content requiring admin approval';

-- ============================================================================
-- NOTE: The old 'role' column is kept for backward compatibility during migration.
-- It can be removed in a future migration once all code is updated.
-- ============================================================================
