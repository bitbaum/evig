-- Add missing columns to locations table
-- The Drizzle schema defines these but they were never migrated to the DB

ALTER TABLE locations ADD COLUMN IF NOT EXISTS accessibility_info JSONB DEFAULT '{}';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE locations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Backfill approval_status from existing is_approved boolean
UPDATE locations SET approval_status = 'approved' WHERE is_approved = true;
UPDATE locations SET approval_status = 'pending' WHERE is_approved = false;
