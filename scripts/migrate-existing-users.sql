-- Migration script to mark all existing users as email verified
-- Run this after migrating databases to production

-- Update all users to be email verified (since we removed email verification requirement)
UPDATE users
SET "emailVerified" = CURRENT_TIMESTAMP
WHERE "emailVerified" IS NULL;

-- Log the migration
INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, created_at)
SELECT
    id,
    'user_migration',
    '{"migration": "email_verification_removal", "action": "marked_all_users_verified"}'::jsonb,
    'system',
    'migration_script',
    CURRENT_TIMESTAMP
FROM users
WHERE "emailVerified" = CURRENT_TIMESTAMP;

-- Optional: Clean up any old verification tokens (no longer needed)
-- DELETE FROM email_verification_tokens WHERE expires < CURRENT_TIMESTAMP;

COMMIT;