-- ============================================================================
-- Migration 009: Repair Booking Enhancements
--
-- Adds repairer assignment and enhanced repair tracking to service_appointments
-- ============================================================================

-- Add repairer_id to service_appointments to link appointments to repairers
ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS repairer_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add additional repair-specific fields
ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS repairer_profile_id UUID REFERENCES repairer_profiles(id) ON DELETE SET NULL;

-- Estimated repair time and quoted price
ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS estimated_duration_hours DECIMAL(5,2);

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS quoted_price_chf DECIMAL(10,2);

-- Customer approval tracking
ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS quote_approved BOOLEAN DEFAULT false;

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS quote_approved_at TIMESTAMPTZ;

-- Repair progress tracking
ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS diagnosis_notes TEXT;

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS parts_needed TEXT[];

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS parts_ordered_at TIMESTAMPTZ;

-- Completion details
ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Customer rating
ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5);

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS customer_review TEXT;

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Communication tracking
ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS messages_count INTEGER DEFAULT 0;

-- Location details (for home visits)
ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS is_home_visit BOOLEAN DEFAULT false;

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS visit_address TEXT;

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS visit_postal_code TEXT;

ALTER TABLE service_appointments
ADD COLUMN IF NOT EXISTS visit_city TEXT;

-- Create index for repairer lookup
CREATE INDEX IF NOT EXISTS idx_service_appointments_repairer_id
ON service_appointments(repairer_id);

CREATE INDEX IF NOT EXISTS idx_service_appointments_repairer_profile_id
ON service_appointments(repairer_profile_id);

-- Create index for status queries by repairer
CREATE INDEX IF NOT EXISTS idx_service_appointments_repairer_status
ON service_appointments(repairer_id, status);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_service_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_service_appointment_timestamp ON service_appointments;

CREATE TRIGGER trigger_update_service_appointment_timestamp
    BEFORE UPDATE ON service_appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_service_appointment_timestamp();

-- ============================================================================
-- Add SERVICE_APPOINTMENTS to TABLE_NAMES constant reminder
-- Note: Ensure src/config/database.ts has SERVICE_APPOINTMENTS defined
-- ============================================================================

COMMENT ON COLUMN service_appointments.repairer_id IS 'User ID of the assigned repairer';
COMMENT ON COLUMN service_appointments.repairer_profile_id IS 'Reference to repairer_profiles for detailed repairer info';
COMMENT ON COLUMN service_appointments.estimated_duration_hours IS 'Estimated time to complete the repair';
COMMENT ON COLUMN service_appointments.quoted_price_chf IS 'Price quoted to customer for the repair';
COMMENT ON COLUMN service_appointments.quote_approved IS 'Whether customer has approved the quote';
COMMENT ON COLUMN service_appointments.diagnosis_notes IS 'Repairer notes from initial diagnosis';
COMMENT ON COLUMN service_appointments.parts_needed IS 'Array of parts needed for repair';
COMMENT ON COLUMN service_appointments.is_home_visit IS 'Whether this is an on-site repair at customer location';
