-- =============================================================================
-- 005_auth_hardening_and_indexes
-- Purpose: Strengthen auth/email handling and add critical indexes
-- =============================================================================

-- Enable extensions used for auth/email handling
CREATE EXTENSION IF NOT EXISTS "citext";

-- Guard: detect duplicate emails differing only by case
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM (
      SELECT lower(email) AS e, count(*)
      FROM users
      GROUP BY lower(email)
      HAVING count(*) > 1
    ) dup
  ) THEN
    RAISE EXCEPTION 'Duplicate user emails differing only by case detected. Resolve before applying CITEXT.';
  END IF;
END
$$;

-- Normalize all existing emails to lowercase
UPDATE users SET email = lower(email) WHERE email <> lower(email);

-- Convert email to case-insensitive type and keep unique constraint semantics
ALTER TABLE users
  ALTER COLUMN email TYPE CITEXT;

-- Helpful composite indexes for hot paths (only create if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_interactions') THEN
    CREATE INDEX IF NOT EXISTS idx_customer_interactions_user_created
      ON customer_interactions (user_id, created_at DESC);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_preferences') THEN
    CREATE INDEX IF NOT EXISTS idx_customer_preferences_user
      ON customer_preferences (user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_segments') THEN
    CREATE INDEX IF NOT EXISTS idx_user_segments_user_segment
      ON user_segments (user_id, segment_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshop_instances') THEN
    CREATE INDEX IF NOT EXISTS idx_workshop_instances_workshop_start
      ON workshop_instances (workshop_id, start_date);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshop_registrations') THEN
    CREATE INDEX IF NOT EXISTS idx_workshop_registrations_status
      ON workshop_registrations (status);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_appointments') THEN
    CREATE INDEX IF NOT EXISTS idx_service_appointments_user_status
      ON service_appointments (user_id, status);
  END IF;
END
$$;

-- JSONB indexes (only if columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_segments' AND column_name = 'criteria') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_customer_segments_criteria ON customer_segments USING GIN (criteria)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'social_links') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_profiles_social_links ON user_profiles USING GIN (social_links)';
  END IF;
END
$$;

-- Ensure Auth.js timestamp columns exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='createdAt'
  ) THEN
    ALTER TABLE users ADD COLUMN "createdAt" TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updatedAt'
  ) THEN
    ALTER TABLE users ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='emailVerified'
  ) THEN
    ALTER TABLE users ADD COLUMN "emailVerified" TIMESTAMPTZ;
  END IF;
END
$$;

