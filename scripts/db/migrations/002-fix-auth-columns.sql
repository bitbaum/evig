-- ============================================================================
-- Fix Auth.js Column Names
-- The @auth/pg-adapter expects camelCase column names
-- ============================================================================

-- Drop existing auth tables (they're empty anyway)
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- Rename columns in users table to match Auth.js expectations
ALTER TABLE users RENAME COLUMN email_verified TO "emailVerified";
ALTER TABLE users RENAME COLUMN created_at TO "createdAt";
ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";

-- Recreate sessions table with correct column names
CREATE TABLE IF NOT EXISTS sessions (
    "sessionToken" TEXT PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);

-- Recreate accounts table with correct column names
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, "providerAccountId")
);

-- Recreate verification_tokens table with correct column names
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY(identifier, token)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts("userId");

-- Update user_profiles to reference the renamed column
-- (No changes needed as it references user_id which is still the same)

COMMENT ON TABLE sessions IS 'Active user sessions (Auth.js managed)';
COMMENT ON TABLE accounts IS 'OAuth provider accounts (Auth.js managed)';
COMMENT ON TABLE verification_tokens IS 'Email verification and password reset tokens';








