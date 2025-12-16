-- ============================================================================
-- Migration: Auth Security Tables
-- Description: Add tables for audit logging, account lockouts, and token management
-- Created: 2024-12-04
-- ============================================================================

-- =============================================================================
-- Security Audit Log Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address VARCHAR(45) NOT NULL,  -- IPv6 max length
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON auth_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON auth_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip_address ON auth_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON auth_audit_log(severity) WHERE severity IN ('warning', 'critical');

-- Composite index for user activity queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_event ON auth_audit_log(user_id, event_type, created_at DESC);

COMMENT ON TABLE auth_audit_log IS 'Security audit log for authentication events';
COMMENT ON COLUMN auth_audit_log.event_type IS 'Type of security event (login_success, login_failure, etc.)';
COMMENT ON COLUMN auth_audit_log.severity IS 'Event severity level: info, warning, critical';

-- =============================================================================
-- Account Lockout Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  lockout_count INTEGER NOT NULL DEFAULT 0,  -- For progressive lockout
  locked_until TIMESTAMPTZ,
  last_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lockouts_user_id ON user_lockouts(user_id);
CREATE INDEX IF NOT EXISTS idx_lockouts_locked_until ON user_lockouts(locked_until) WHERE locked_until IS NOT NULL;

COMMENT ON TABLE user_lockouts IS 'Tracks failed login attempts and account lockouts';
COMMENT ON COLUMN user_lockouts.lockout_count IS 'Number of times account has been locked (for progressive lockout)';

-- =============================================================================
-- Refresh Tokens Table (for token rotation)
-- =============================================================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA256 hash of the token
  family_id UUID NOT NULL,  -- Token family for rotation detection
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at) WHERE NOT revoked;

COMMENT ON TABLE refresh_tokens IS 'Refresh tokens for JWT rotation';
COMMENT ON COLUMN refresh_tokens.family_id IS 'Token family ID for detecting token reuse attacks';
COMMENT ON COLUMN refresh_tokens.token_hash IS 'SHA256 hash of the token (never store raw tokens)';

-- =============================================================================
-- Session Table (optional, for server-side sessions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at) WHERE is_valid;

COMMENT ON TABLE user_sessions IS 'Active user sessions for server-side session management';

-- =============================================================================
-- API Key Table (for service accounts)
-- =============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA256 hash of the API key
  key_prefix VARCHAR(10) NOT NULL,  -- First few chars for identification
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scopes TEXT[] DEFAULT '{}',
  rate_limit_per_minute INTEGER DEFAULT 60,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active;

COMMENT ON TABLE api_keys IS 'API keys for programmatic access';
COMMENT ON COLUMN api_keys.key_prefix IS 'First few characters of key for identification (e.g., "rk_live_")';
COMMENT ON COLUMN api_keys.scopes IS 'Array of permission scopes granted to this key';

-- =============================================================================
-- CSRF Tokens Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS csrf_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csrf_tokens_hash ON csrf_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_session ON csrf_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires ON csrf_tokens(expires_at);

COMMENT ON TABLE csrf_tokens IS 'CSRF tokens for form protection';

-- =============================================================================
-- Cleanup Functions
-- =============================================================================

-- Function to clean up expired tokens and old audit logs
CREATE OR REPLACE FUNCTION cleanup_auth_data() RETURNS void AS $$
BEGIN
  -- Delete expired refresh tokens
  DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '7 days';

  -- Delete revoked refresh tokens older than 30 days
  DELETE FROM refresh_tokens WHERE revoked AND revoked_at < NOW() - INTERVAL '30 days';

  -- Delete expired sessions
  DELETE FROM user_sessions WHERE expires_at < NOW();

  -- Delete expired CSRF tokens
  DELETE FROM csrf_tokens WHERE expires_at < NOW();

  -- Delete old audit logs (keep 90 days)
  DELETE FROM auth_audit_log WHERE created_at < NOW() - INTERVAL '90 days';

  -- Reset old lockout records (keep 24 hours)
  UPDATE user_lockouts
  SET failed_attempts = 0, locked_until = NULL
  WHERE last_attempt < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_auth_data IS 'Cleans up expired tokens, sessions, and old audit logs';

-- =============================================================================
-- Triggers
-- =============================================================================

-- Update timestamp trigger for lockouts
CREATE OR REPLACE FUNCTION update_lockout_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lockout_timestamp ON user_lockouts;
CREATE TRIGGER trigger_update_lockout_timestamp
  BEFORE UPDATE ON user_lockouts
  FOR EACH ROW
  EXECUTE FUNCTION update_lockout_timestamp();

-- Update timestamp trigger for API keys
DROP TRIGGER IF EXISTS trigger_update_api_key_timestamp ON api_keys;
CREATE TRIGGER trigger_update_api_key_timestamp
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_lockout_timestamp();

-- =============================================================================
-- Initial Data
-- =============================================================================

-- No initial data needed for security tables

-- =============================================================================
-- Migration Complete
-- =============================================================================

SELECT 'Auth security tables migration completed successfully' AS status;
