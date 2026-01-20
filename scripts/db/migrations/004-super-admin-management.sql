-- ============================================================================
-- RevampIT Super Admin Management Migration
-- Created: 2026-01-20
-- Description: Adds is_super_admin column for database-managed super admins
-- ============================================================================

-- ============================================================================
-- 1. ADD IS_SUPER_ADMIN COLUMN TO USERS TABLE
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 2. SYNC EXISTING SUPER ADMINS FROM PERMISSIONS.TS
-- Set is_super_admin = true for emails that are in the hardcoded list
-- ============================================================================

UPDATE users
SET is_super_admin = TRUE
WHERE email IN (
    'andreas@revamp-it.ch',
    'veronica@revamp-it.ch',
    'daniel@revamp-it.ch',
    'georgy@revamp-it.ch',
    'georgy.butaev@revamp-it.ch'
);

-- ============================================================================
-- 3. CREATE INDEX
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_is_super_admin ON users(is_super_admin);

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

COMMENT ON COLUMN users.is_super_admin IS 'True if user is a super admin. Can be managed by other super admins.';
