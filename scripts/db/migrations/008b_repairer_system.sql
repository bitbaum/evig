-- Migration: 008_repairer_system
-- Description: Repair person registration and management system

-- ============================================================================
-- REPAIRER SYSTEM
-- ============================================================================

-- Extend user roles (this updates the role check constraint)
-- Note: We'll handle this in the application code instead of DB constraints

-- Repairer profiles table
CREATE TABLE IF NOT EXISTS repairer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Business information
    business_name TEXT,
    business_type TEXT NOT NULL DEFAULT 'individual' CHECK (business_type IN ('individual', 'business', 'freelance')),
    description TEXT,
    years_experience INTEGER DEFAULT 0,

    -- Contact information
    phone TEXT NOT NULL,
    website TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    -- Services offered
    services_offered TEXT[] NOT NULL DEFAULT '{}',
    specializations TEXT[] DEFAULT '{}', -- e.g., ['laptops', 'smartphones', 'tablets']
    certifications TEXT[] DEFAULT '{}', -- Professional certifications

    -- Service areas
    service_radius_km INTEGER DEFAULT 50, -- How far they're willing to travel
    remote_services BOOLEAN DEFAULT false, -- Can they provide remote repair?

    -- Pricing
    hourly_rate_cents INTEGER,
    emergency_fee_cents INTEGER,
    home_visit_fee_cents INTEGER,

    -- Availability
    availability_schedule JSONB DEFAULT '{}', -- Weekly schedule
    response_time_hours INTEGER DEFAULT 24, -- How quickly they respond
    typical_turnaround_days INTEGER DEFAULT 3,

    -- Verification and ratings
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    verification_documents TEXT[] DEFAULT '{}',

    -- Performance metrics
    total_jobs_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.0, -- Percentage of jobs completed on time

    -- Status
    is_active BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'active', 'suspended', 'inactive')),

    -- Metadata
    portfolio_images TEXT[] DEFAULT '{}',
    insurance_info TEXT,
    warranty_offered BOOLEAN DEFAULT false,
    warranty_duration_months INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- Repairer services table (detailed service offerings)
CREATE TABLE IF NOT EXISTS repairer_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repairer_id UUID NOT NULL REFERENCES repairer_profiles(id) ON DELETE CASCADE,

    -- Service details
    service_category TEXT NOT NULL, -- e.g., 'laptop_repair', 'phone_repair'
    service_name TEXT NOT NULL, -- e.g., 'Screen Replacement', 'Battery Replacement'
    description TEXT,

    -- Pricing
    base_price_cents INTEGER,
    hourly_rate_cents INTEGER,
    parts_included BOOLEAN DEFAULT false,

    -- Time estimates
    estimated_hours DECIMAL(4,1),
    estimated_days INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(repairer_id, service_category, service_name)
);

-- Repairer availability slots
CREATE TABLE IF NOT EXISTS repairer_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repairer_id UUID NOT NULL REFERENCES repairer_profiles(id) ON DELETE CASCADE,

    -- Time slot
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(4,1),

    -- Availability type
    availability_type TEXT DEFAULT 'available' CHECK (availability_type IN ('available', 'booked', 'blocked')),

    -- Booking reference (if booked)
    booking_id UUID, -- References service_appointments(id)

    -- Notes
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(repairer_id, date, start_time)
);

-- Repairer reviews and ratings
CREATE TABLE IF NOT EXISTS repairer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repairer_id UUID NOT NULL REFERENCES repairer_profiles(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Review details
    appointment_id UUID REFERENCES service_appointments(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    pros TEXT[],
    cons TEXT[],

    -- Service quality ratings
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),

    -- Response from repairer
    repairer_response TEXT,
    repairer_response_date TIMESTAMP WITH TIME ZONE,

    -- Status
    is_verified BOOLEAN DEFAULT false, -- Was this a real appointment?
    is_public BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(repairer_id, customer_id, appointment_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Repairer profiles indexes
CREATE INDEX IF NOT EXISTS idx_repairer_profiles_user_id ON repairer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_repairer_profiles_verified ON repairer_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_repairer_profiles_active ON repairer_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_repairer_profiles_rating ON repairer_profiles(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_repairer_profiles_location ON repairer_profiles(city, postal_code);
CREATE INDEX IF NOT EXISTS idx_repairer_profiles_services ON repairer_profiles USING GIN(services_offered);
CREATE INDEX IF NOT EXISTS idx_repairer_profiles_specializations ON repairer_profiles USING GIN(specializations);

-- Repairer services indexes
CREATE INDEX IF NOT EXISTS idx_repairer_services_repairer_id ON repairer_services(repairer_id);
CREATE INDEX IF NOT EXISTS idx_repairer_services_category ON repairer_services(service_category);

-- Repairer availability indexes
CREATE INDEX IF NOT EXISTS idx_repairer_availability_repairer_id ON repairer_availability(repairer_id);
CREATE INDEX IF NOT EXISTS idx_repairer_availability_date ON repairer_availability(date);
CREATE INDEX IF NOT EXISTS idx_repairer_availability_type ON repairer_availability(availability_type);

-- Repairer reviews indexes
CREATE INDEX IF NOT EXISTS idx_repairer_reviews_repairer_id ON repairer_reviews(repairer_id);
CREATE INDEX IF NOT EXISTS idx_repairer_reviews_customer_id ON repairer_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_repairer_reviews_rating ON repairer_reviews(rating);

-- ============================================================================
-- UPDATED AT TRIGGERS
-- ============================================================================

-- Add updated_at triggers for new tables
DO $$
DECLARE
    tbl_name text;
    trigger_name text;
BEGIN
    -- List of tables that need updated_at triggers
    FOR tbl_name IN
        SELECT unnest(ARRAY[
            'repairer_profiles', 'repairer_services', 'repairer_availability', 'repairer_reviews'
        ])
    LOOP
        trigger_name := 'update_' || tbl_name || '_updated_at';

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name) AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = tbl_name AND column_name = 'updated_at') THEN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = trigger_name) THEN
                EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', trigger_name, tbl_name);
            END IF;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- REPAIRER PROFILE MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to update repairer rating when new review is added
CREATE OR REPLACE FUNCTION update_repairer_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    total_reviews INTEGER;
BEGIN
    -- Calculate new average rating
    SELECT
        AVG(rating)::DECIMAL(3,2),
        COUNT(*)::INTEGER
    INTO avg_rating, total_reviews
    FROM repairer_reviews
    WHERE repairer_id = NEW.repairer_id AND is_verified = true;

    -- Update repairer profile
    UPDATE repairer_profiles
    SET
        average_rating = avg_rating,
        total_reviews = total_reviews,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.repairer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update repairer rating when reviews are added/updated
CREATE TRIGGER trigger_update_repairer_rating
    AFTER INSERT OR UPDATE OF rating ON repairer_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_repairer_rating();

-- Function to check if point is within repairer's service radius
CREATE OR REPLACE FUNCTION is_within_service_radius(
    repairer_lat DECIMAL,
    repairer_lng DECIMAL,
    customer_lat DECIMAL,
    customer_lng DECIMAL,
    radius_km INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    distance DECIMAL;
BEGIN
    -- Haversine formula for distance calculation
    -- This is a simplified version - in production, you'd want a more accurate calculation
    distance := 111.32 * SQRT(
        POWER(customer_lat - repairer_lat, 2) +
        POWER((customer_lng - repairer_lng) * COS((repairer_lat + customer_lat) / 2 / 57.29577951), 2)
    );

    RETURN distance <= radius_km;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Sample repairer profile (uncomment to test)
-- INSERT INTO repairer_profiles (
--     user_id,
--     business_name,
--     business_type,
--     description,
--     phone,
--     address,
--     city,
--     postal_code,
--     services_offered,
--     specializations,
--     hourly_rate_cents,
--     service_radius_km,
--     is_verified,
--     status
-- ) VALUES (
--     (SELECT id FROM users WHERE role = 'repairer' LIMIT 1),
--     'TechFix Zurich',
--     'business',
--     'Professional repair service specializing in laptops and smartphones',
--     '+41 79 123 45 67',
--     'Technoparkstrasse 1',
--     'Zurich',
--     '8005',
--     ARRAY['laptop_repair', 'phone_repair', 'tablet_repair'],
--     ARRAY['apple_products', 'screen_replacement', 'battery_replacement'],
--     7000, -- CHF 70/hour
--     30,
--     true,
--     'active'
-- );