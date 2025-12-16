-- Migration: 003_comprehensive_schema_enhancement
-- Description: Comprehensive database schema enhancement for scalability and extensibility

-- ============================================================================
-- USER ROLES AND PERMISSIONS SYSTEM
-- ============================================================================

-- Create user_roles table for extensible role definitions
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table for granular access control
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- e.g., 'blog', 'workshops', 'admin', 'profile'
    action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'publish'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- ENHANCED USER SYSTEM
-- ============================================================================

-- Update role constraint to allow new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
-- Include legacy roles to avoid migration failures on existing data (e.g., 'seller')
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
    role IN (
        'admin', 'editor', 'user', 'customer', 'volunteer', 'participant', 'moderator', 'seller'
    )
) NOT VALID;

-- Add new columns to users table for enhanced functionality
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES user_roles(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS medusa_customer_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'individual'
    CHECK (account_type IN ('individual', 'business', 'organization'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- ENHANCED USER PROFILES
-- ============================================================================

-- Enhance user_profiles table with additional fields
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20)
    CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say', 'other'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS expertise_areas TEXT[] DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS customer_segment VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS purchase_history JSONB DEFAULT '[]';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- WORKSHOP SYSTEM ENHANCEMENT
-- ============================================================================

-- Create workshops table if it doesn't exist
CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    short_description TEXT,
    category VARCHAR(100),
    duration_minutes INTEGER,
    level VARCHAR(20) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    max_participants INTEGER,
    min_participants INTEGER DEFAULT 1,
    price_cents INTEGER DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'CHF',
    prerequisites TEXT,
    learning_objectives TEXT[],
    target_audience TEXT,
    materials_provided TEXT,
    materials_required TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    allow_waitlist BOOLEAN NOT NULL DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    featured_image TEXT,
    gallery_images TEXT[] DEFAULT '{}',
    instructor_id UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create workshop_instances table if it doesn't exist
CREATE TABLE IF NOT EXISTS workshop_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(500),
    location_details JSONB DEFAULT '{}',
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    instructor_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workshop_id, start_date)
);

-- Create workshop_registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS workshop_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workshop_instance_id UUID NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'waitlisted', 'cancelled', 'attended', 'no_show')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
    payment_amount_cents INTEGER,
    payment_reference VARCHAR(255),
    attended BOOLEAN DEFAULT false,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    notes TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, workshop_instance_id)
);

-- ============================================================================
-- CUSTOMER DATA AND PREFERENCES
-- ============================================================================

-- Create customer_preferences table for storing user preferences
CREATE TABLE IF NOT EXISTS customer_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- Create customer_interactions table for tracking user interactions
CREATE TABLE IF NOT EXISTS customer_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'page_view', 'button_click', 'form_submit', etc.
    interaction_data JSONB DEFAULT '{}',
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create customer_segments table for segmentation
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    criteria JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_segments junction table
CREATE TABLE IF NOT EXISTS user_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    segment_id UUID NOT NULL REFERENCES customer_segments(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    notes TEXT,
    UNIQUE(user_id, segment_id)
);

-- ============================================================================
-- SERVICE APPOINTMENTS ENHANCEMENT
-- ============================================================================

-- Create service_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price_cents INTEGER,
    currency VARCHAR(3) DEFAULT 'CHF',
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_advance_booking_days INTEGER DEFAULT 90,
    buffer_time_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create service_appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS service_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE RESTRICT,
    preferred_date DATE,
    confirmed_date TIMESTAMP WITH TIME ZONE,
    preferred_time_slots JSONB DEFAULT '[]',
    description TEXT,
    device_info TEXT,
    urgency VARCHAR(20) NOT NULL DEFAULT 'normal'
        CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested', 'approved', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    outcome_notes TEXT,
    price_charged_cents INTEGER,
    currency VARCHAR(3) DEFAULT 'CHF',
    technician_id UUID REFERENCES users(id),
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

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
            'user_roles', 'permissions', 'role_permissions',
            'user_profiles', 'workshops', 'workshop_instances', 'workshop_registrations',
            'customer_preferences', 'customer_interactions', 'customer_segments', 'user_segments',
            'service_types', 'service_appointments'
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
-- DEFAULT DATA INSERTION
-- ============================================================================

-- Insert default user roles
INSERT INTO user_roles (id, slug, name, description, is_default) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'customer', 'Customer', 'Regular customer with access to purchase products and services', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'volunteer', 'Volunteer', 'Community volunteer with special access and privileges', false),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'participant', 'Participant', 'Active participant in workshops and community activities', false),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'admin', 'Administrator', 'Full system administrator access', false),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'editor', 'Editor', 'Content editor with publishing rights', false),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'moderator', 'Moderator', 'Community moderator with oversight capabilities', false)
ON CONFLICT (slug) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (slug, name, description, resource, action) VALUES
    -- Blog permissions
    ('blog.create', 'Create Blog Posts', 'Can create new blog posts', 'blog', 'create'),
    ('blog.read', 'Read Blog Posts', 'Can view blog posts', 'blog', 'read'),
    ('blog.update', 'Update Blog Posts', 'Can edit blog posts', 'blog', 'update'),
    ('blog.delete', 'Delete Blog Posts', 'Can delete blog posts', 'blog', 'delete'),
    ('blog.publish', 'Publish Blog Posts', 'Can publish blog posts', 'blog', 'publish'),

    -- Workshop permissions
    ('workshops.create', 'Create Workshops', 'Can create new workshops', 'workshops', 'create'),
    ('workshops.read', 'Read Workshops', 'Can view workshops', 'workshops', 'read'),
    ('workshops.update', 'Update Workshops', 'Can edit workshops', 'workshops', 'update'),
    ('workshops.delete', 'Delete Workshops', 'Can delete workshops', 'workshops', 'delete'),
    ('workshops.manage_registrations', 'Manage Registrations', 'Can manage workshop registrations', 'workshops', 'manage_registrations'),

    -- Profile permissions
    ('profile.read', 'Read Profile', 'Can view user profiles', 'profile', 'read'),
    ('profile.update', 'Update Profile', 'Can update own profile', 'profile', 'update'),
    ('profile.update_others', 'Update Other Profiles', 'Can update other users profiles', 'profile', 'update_others'),

    -- Admin permissions
    ('admin.users', 'User Management', 'Can manage users', 'admin', 'users'),
    ('admin.roles', 'Role Management', 'Can manage user roles and permissions', 'admin', 'roles'),
    ('admin.system', 'System Administration', 'Full system administration access', 'admin', 'system')
ON CONFLICT (slug) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT ur.id, p.id
FROM user_roles ur
CROSS JOIN permissions p
WHERE
    -- Customer permissions
    (ur.slug = 'customer' AND p.slug IN ('blog.read', 'workshops.read', 'profile.read', 'profile.update'))
    OR
    -- Volunteer permissions
    (ur.slug = 'volunteer' AND p.slug IN ('blog.read', 'blog.create', 'blog.update', 'workshops.read', 'workshops.create', 'workshops.update', 'profile.read', 'profile.update'))
    OR
    -- Participant permissions
    (ur.slug = 'participant' AND p.slug IN ('blog.read', 'blog.create', 'workshops.read', 'workshops.create', 'workshops.manage_registrations', 'profile.read', 'profile.update'))
    OR
    -- Admin permissions
    (ur.slug = 'admin' AND p.slug IN ('blog.create', 'blog.read', 'blog.update', 'blog.delete', 'blog.publish', 'workshops.create', 'workshops.read', 'workshops.update', 'workshops.delete', 'workshops.manage_registrations', 'profile.read', 'profile.update', 'profile.update_others', 'admin.users', 'admin.roles', 'admin.system'))
    OR
    -- Editor permissions
    (ur.slug = 'editor' AND p.slug IN ('blog.create', 'blog.read', 'blog.update', 'blog.publish', 'workshops.read', 'profile.read', 'profile.update'))
    OR
    -- Moderator permissions
    (ur.slug = 'moderator' AND p.slug IN ('blog.read', 'blog.update', 'blog.publish', 'workshops.read', 'workshops.manage_registrations', 'profile.read', 'profile.update_others'))
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Insert default customer segments
INSERT INTO customer_segments (slug, name, description) VALUES
    ('new_customer', 'New Customer', 'Recently registered customers'),
    ('returning_customer', 'Returning Customer', 'Customers who have made multiple purchases'),
    ('vip_customer', 'VIP Customer', 'High-value customers with special privileges'),
    ('inactive_customer', 'Inactive Customer', 'Customers who haven''t engaged recently'),
    ('volunteer', 'Volunteer', 'Active community volunteers'),
    ('workshop_participant', 'Workshop Participant', 'Regular workshop attendees')
ON CONFLICT (slug) DO NOTHING;

-- Insert default service types (commented out for now to avoid conflicts)
-- INSERT INTO service_types (slug, name, description, category, duration_minutes, price_cents, requires_approval) VALUES
--     ('device_repair', 'Device Repair', 'General device repair and maintenance', 'repair', 60, 5000, false),
--     ('software_installation', 'Software Installation', 'Install and configure software', 'technical_support', 30, 2500, false),
--     ('data_recovery', 'Data Recovery', 'Recover lost or corrupted data', 'data_services', 90, 10000, true),
--     ('training_session', 'Training Session', 'Personal training on software/hardware', 'education', 60, 7500, false),
--     ('consultation', 'Technical Consultation', 'Expert technical advice', 'consulting', 30, 5000, false)
-- ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Migrate existing users to new role system
UPDATE users
SET role_id = ur.id
FROM user_roles ur
WHERE users.role = ur.slug
  AND users.role_id IS NULL;

-- Set default role for users without role_id
UPDATE users
SET role_id = (SELECT id FROM user_roles WHERE slug = 'customer' LIMIT 1)
WHERE role_id IS NULL;

-- Migrate existing role column to new status for backward compatibility
-- (existing roles remain as-is for now, but new system uses role_id)

-- Update existing user_profiles with timestamps if they exist
UPDATE user_profiles
SET created_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL OR updated_at IS NULL;

-- Insert default categories (now that admin user exists)
INSERT INTO categories (id, slug, name, description, color, created_by, updated_by) VALUES
    ('11111111-1111-1111-1111-111111111111', 'uncategorized', 'Uncategorized', 'Default category for posts', '#6B7280', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('22222222-2222-2222-2222-222222222222', 'news', 'News', 'Latest news and updates', '#3B82F6', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('33333333-3333-3333-3333-333333333333', 'tutorials', 'Tutorials', 'Step-by-step guides and tutorials', '#10B981', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('44444444-4444-4444-4444-444444444444', 'projects', 'Projects', 'Project updates and showcases', '#F59E0B', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (slug) DO NOTHING;
