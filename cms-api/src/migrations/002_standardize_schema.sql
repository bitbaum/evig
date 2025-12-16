-- Migration: 002_standardize_schema
-- Description: Standardize database schema and add missing authentication features

-- Add missing columns to users table if they don't exist
DO $$
BEGIN
    -- Add email_verified if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add image column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'image') THEN
        ALTER TABLE users ADD COLUMN image TEXT;
    END IF;

    -- Make password_hash nullable for NextAuth compatibility
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

    -- Note: Role constraints will be updated in the comprehensive schema migration
    -- For now, just ensure existing roles are valid
    ALTER TABLE users DISABLE TRIGGER update_users_updated_at;
    UPDATE users SET role = 'user' WHERE role NOT IN ('admin', 'editor', 'user') OR role IS NULL;
    ALTER TABLE users ENABLE TRIGGER update_users_updated_at;
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
END $$;

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user sessions table for better session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit log table for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at triggers for new tables
DO $$
BEGIN
    -- Add triggers for new tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_verification_tokens_updated_at') THEN
            CREATE TRIGGER update_email_verification_tokens_updated_at BEFORE UPDATE ON email_verification_tokens
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_password_reset_tokens_updated_at') THEN
            CREATE TRIGGER update_password_reset_tokens_updated_at BEFORE UPDATE ON password_reset_tokens
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_sessions_updated_at') THEN
            CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_audit_logs_updated_at') THEN
            CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON audit_logs
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END IF;
END $$;

-- Create function to clean up expired tokens (call this periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM email_verification_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM password_reset_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    DELETE FROM user_sessions WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') THEN
        CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);
    END IF;
END $$;

-- Indexes for new tables (conditional)
DO $$
BEGIN
    -- Email verification tokens indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verification_tokens') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_verification_tokens' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_verification_tokens' AND column_name = 'token') THEN
            CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_verification_tokens' AND column_name = 'expires_at') THEN
            CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires_at ON email_verification_tokens(expires_at);
        END IF;
    END IF;

    -- Password reset tokens indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_reset_tokens') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'password_reset_tokens' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'password_reset_tokens' AND column_name = 'token') THEN
            CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'password_reset_tokens' AND column_name = 'expires_at') THEN
            CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
        END IF;
    END IF;

    -- User sessions indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_sessions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'session_token') THEN
            CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_sessions' AND column_name = 'expires_at') THEN
            CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
        END IF;
    END IF;

    -- Audit logs indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'action') THEN
            CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'resource_type') THEN
            CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'created_at') THEN
            CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
        END IF;
    END IF;
END $$;
