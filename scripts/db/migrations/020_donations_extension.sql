-- ============================================================================
-- Migration: 020_donations_extension.sql
-- Description: Extend donations table to support both monetary and device donations
-- Date: 2026-02-05
-- ============================================================================

-- Add donation_type column (discriminator)
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS donation_type TEXT DEFAULT 'monetary';

-- Device-specific fields
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS device_category TEXT;

ALTER TABLE donations
ADD COLUMN IF NOT EXISTS device_description TEXT;

ALTER TABLE donations
ADD COLUMN IF NOT EXISTS device_brand TEXT;

ALTER TABLE donations
ADD COLUMN IF NOT EXISTS device_model TEXT;

ALTER TABLE donations
ADD COLUMN IF NOT EXISTS device_condition TEXT;

ALTER TABLE donations
ADD COLUMN IF NOT EXISTS device_age_years INTEGER;

ALTER TABLE donations
ADD COLUMN IF NOT EXISTS estimated_value_cents INTEGER;

-- Donation status tracking
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'recorded';

-- Who recorded this donation (staff member)
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Ensure updated_at exists (may already exist from original migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'donations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE donations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Make amount_cents nullable for device donations
-- (device donations may not have a monetary amount)
ALTER TABLE donations
ALTER COLUMN amount_cents DROP NOT NULL;

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_donations_type ON donations(donation_type);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_recorded_by ON donations(recorded_by);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS donations_updated_at ON donations;
CREATE TRIGGER donations_updated_at
    BEFORE UPDATE ON donations
    FOR EACH ROW
    EXECUTE FUNCTION update_donations_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN donations.donation_type IS 'Type of donation: monetary or device';
COMMENT ON COLUMN donations.device_category IS 'Category for device donations: laptop, desktop, monitor, etc.';
COMMENT ON COLUMN donations.device_description IS 'Detailed description of donated device';
COMMENT ON COLUMN donations.device_brand IS 'Brand/manufacturer of donated device';
COMMENT ON COLUMN donations.device_model IS 'Model name/number of donated device';
COMMENT ON COLUMN donations.device_condition IS 'Condition of donated device: excellent, good, fair, poor, parts_only';
COMMENT ON COLUMN donations.device_age_years IS 'Approximate age of device in years';
COMMENT ON COLUMN donations.estimated_value_cents IS 'Estimated value of device donation in cents';
COMMENT ON COLUMN donations.status IS 'Donation status: recorded, thanked, receipt_sent';
COMMENT ON COLUMN donations.recorded_by IS 'Staff member who recorded this donation';
