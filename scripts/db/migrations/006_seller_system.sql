-- Migration: 006_seller_system
-- Description: Seller application and management system

-- ============================================================================
-- SELLER APPLICATION SYSTEM
-- ============================================================================

-- Seller applications table
CREATE TABLE IF NOT EXISTS seller_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Business information
    business_name TEXT,
    business_type TEXT NOT NULL CHECK (business_type IN ('individual', 'business')),
    tax_id TEXT,

    -- Contact information
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    phone TEXT NOT NULL,

    -- Application details
    experience TEXT,
    product_types TEXT[] NOT NULL DEFAULT '{}',
    motivation TEXT,

    -- Legal
    terms_accepted BOOLEAN NOT NULL DEFAULT false,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,

    -- Rejection/suspension details
    rejection_reason TEXT,
    suspension_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- Seller profiles table (for approved sellers)
CREATE TABLE IF NOT EXISTS seller_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Business information
    business_name TEXT,
    business_type TEXT NOT NULL CHECK (business_type IN ('individual', 'business')),
    tax_id TEXT,

    -- Contact information
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    phone TEXT NOT NULL,

    -- Seller settings
    product_types TEXT[] NOT NULL DEFAULT '{}',
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,

    -- Performance metrics
    total_sales INTEGER DEFAULT 0,
    total_revenue_cents BIGINT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    total_reviews INTEGER DEFAULT 0,

    -- Seller preferences
    auto_publish BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- ============================================================================
-- ENSURE SELLER_PROFILES HAS REQUIRED COLUMNS (if table existed from earlier migration)
-- ============================================================================
DO $$
BEGIN
    -- Add missing columns from the full schema if seller_profiles was created by earlier migration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE seller_profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'verification_date') THEN
        ALTER TABLE seller_profiles ADD COLUMN verification_date TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'average_rating') THEN
        ALTER TABLE seller_profiles ADD COLUMN average_rating DECIMAL(3,2) DEFAULT 0.0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'total_sales') THEN
        ALTER TABLE seller_profiles ADD COLUMN total_sales INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'total_revenue_cents') THEN
        ALTER TABLE seller_profiles ADD COLUMN total_revenue_cents BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'total_reviews') THEN
        ALTER TABLE seller_profiles ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'auto_publish') THEN
        ALTER TABLE seller_profiles ADD COLUMN auto_publish BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'notification_preferences') THEN
        ALTER TABLE seller_profiles ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "sms": false}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'business_name') THEN
        ALTER TABLE seller_profiles ADD COLUMN business_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'business_type') THEN
        ALTER TABLE seller_profiles ADD COLUMN business_type TEXT DEFAULT 'individual';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'tax_id') THEN
        ALTER TABLE seller_profiles ADD COLUMN tax_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_profiles' AND column_name = 'product_types') THEN
        ALTER TABLE seller_profiles ADD COLUMN product_types TEXT[] NOT NULL DEFAULT '{}';
    END IF;
END
$$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Seller applications indexes
CREATE INDEX IF NOT EXISTS idx_seller_applications_user_id ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_seller_applications_submitted_at ON seller_applications(submitted_at DESC);

-- Seller profiles indexes
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_verified ON seller_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_rating ON seller_profiles(average_rating DESC);

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
            'seller_applications', 'seller_profiles'
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
-- SELLER ROLE ASSIGNMENT FUNCTION
-- ============================================================================

-- Function to automatically create seller profile when application is approved
CREATE OR REPLACE FUNCTION create_seller_profile_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Create seller profile
        INSERT INTO seller_profiles (
            user_id,
            business_name,
            business_type,
            tax_id,
            address,
            city,
            postal_code,
            phone,
            product_types
        )
        SELECT
            user_id,
            business_name,
            business_type,
            tax_id,
            address,
            city,
            postal_code,
            phone,
            product_types
        FROM seller_applications
        WHERE id = NEW.id;

        -- Update user role to seller
        UPDATE users
        SET role = 'seller', "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create seller profile when application is approved
CREATE TRIGGER trigger_create_seller_profile_on_approval
    AFTER UPDATE OF status ON seller_applications
    FOR EACH ROW
    EXECUTE FUNCTION create_seller_profile_on_approval();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Note: Sample seller applications would be created by users through the UI