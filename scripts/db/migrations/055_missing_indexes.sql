-- Migration 055: Add missing indexes for common query patterns
--
-- Idempotent: skip when table/column missing (002 renames users.created_at → "createdAt").

DO $$
BEGIN
  IF to_regclass('public.listings') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'verified_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_listings_verified_at ON listings (verified_at)
      WHERE verified_at IS NOT NULL;
  END IF;

  IF to_regclass('public.listings') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'price_chf'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_listings_price_chf ON listings (price_chf);
  END IF;

  IF to_regclass('public.users') IS NOT NULL AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_staff'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'createdAt'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_users_staff_created ON users (is_staff, "createdAt" DESC)
        WHERE is_staff = true;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_users_staff_created ON users (is_staff, created_at DESC)
        WHERE is_staff = true;
    END IF;
  END IF;
END $$;
