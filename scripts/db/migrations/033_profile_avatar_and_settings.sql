-- ============================================================================
-- Profile Avatar and Settings Enhancement
-- Created: 2026-02-12
-- Description: Add avatar, display name, bio, visibility, and notification preferences
-- ============================================================================

-- Add public profile fields
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private'));

-- Add privacy toggles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT false;

-- Add notification preferences
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketplace_updates BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS workshop_reminders BOOLEAN DEFAULT true;

-- Add index for avatar_url lookups (if needed for CDN management)
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_url ON user_profiles(avatar_url) WHERE avatar_url IS NOT NULL;

-- Add index for display_name searches
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name) WHERE display_name IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL to user profile photo (Vercel Blob storage)';
COMMENT ON COLUMN user_profiles.display_name IS 'Public display name (can differ from first_name/last_name)';
COMMENT ON COLUMN user_profiles.bio IS 'Public profile bio/description';
COMMENT ON COLUMN user_profiles.profile_visibility IS 'Whether profile is public or private';
COMMENT ON COLUMN user_profiles.show_email IS 'Whether to show email on public profile';
COMMENT ON COLUMN user_profiles.show_phone IS 'Whether to show phone on public profile';
COMMENT ON COLUMN user_profiles.email_notifications IS 'Receive email notifications';
COMMENT ON COLUMN user_profiles.sms_notifications IS 'Receive SMS notifications';
COMMENT ON COLUMN user_profiles.marketplace_updates IS 'Receive marketplace activity updates';
COMMENT ON COLUMN user_profiles.workshop_reminders IS 'Receive workshop reminder notifications';
