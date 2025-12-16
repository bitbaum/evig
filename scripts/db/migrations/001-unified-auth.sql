-- ============================================================================
-- RevampIT Unified Authentication Database Schema
-- Created: 2025-12-02
-- Description: Core auth tables for unified customer/supporter accounts
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE AUTH TABLES (Auth.js compatible)
-- ============================================================================

-- Users table (central identity)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    email_verified TIMESTAMPTZ,
    password_hash TEXT,  -- For credentials login (bcrypt)
    image TEXT,
    role TEXT DEFAULT 'user',  -- user, supporter, admin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (database sessions for security)
CREATE TABLE IF NOT EXISTS sessions (
    session_token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);

-- Accounts (for OAuth providers - future use)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, provider_account_id)
);

-- Verification tokens (for email verification, password reset)
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    PRIMARY KEY(identifier, token)
);

-- ============================================================================
-- USER PROFILE (Extended user data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Personal info
    first_name TEXT,
    last_name TEXT,
    company_name TEXT,
    
    -- Contact
    phone TEXT,
    mobile TEXT,
    
    -- Address (Swiss format)
    address_line1 TEXT,
    address_line2 TEXT,
    postal_code TEXT,
    city TEXT,
    canton TEXT,
    country TEXT DEFAULT 'Schweiz',
    
    -- Preferences
    interests TEXT[],  -- e.g., ['linux', 'hardware', 'workshops']
    preferred_language TEXT DEFAULT 'de',
    newsletter_subscribed BOOLEAN DEFAULT false,
    newsletter_frequency TEXT DEFAULT 'monthly',  -- weekly, monthly, never
    
    -- Supporter info
    is_supporter BOOLEAN DEFAULT false,
    supporter_since TIMESTAMPTZ,
    supporter_type TEXT,  -- donor, volunteer, partner, technical_expert
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- WORKSHOPS
-- ============================================================================

-- Workshop definitions (admin managed)
CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,  -- e.g., 'linux-workshop', 'computer-repair'
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,  -- e.g., 'Betriebssysteme', 'Hardware', 'Entwicklung'
    duration TEXT,  -- e.g., '2 Tage', '4 Sitzungen'
    level TEXT,  -- 'Anfänger', 'Fortgeschrittene', 'Alle Stufen'
    max_participants INTEGER DEFAULT 12,
    price_cents INTEGER DEFAULT 0,  -- 0 = free
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop instances (specific dates)
CREATE TABLE IF NOT EXISTS workshop_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT DEFAULT 'RevampIT, Birmensdorferstr. 379, 8055 Zürich',
    instructor TEXT,
    max_participants INTEGER,  -- Override workshop default
    notes TEXT,
    status TEXT DEFAULT 'scheduled',  -- scheduled, cancelled, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workshop registrations
CREATE TABLE IF NOT EXISTS workshop_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workshop_instance_id UUID NOT NULL REFERENCES workshop_instances(id) ON DELETE CASCADE,
    
    status TEXT DEFAULT 'pending',  -- pending, confirmed, waitlist, attended, cancelled, no_show
    
    -- Payment (if applicable)
    payment_status TEXT DEFAULT 'not_required',  -- not_required, pending, paid, refunded
    payment_amount_cents INTEGER,
    payment_reference TEXT,
    
    -- Feedback
    attended BOOLEAN DEFAULT false,
    rating INTEGER,  -- 1-5
    feedback TEXT,
    
    -- Admin
    notes TEXT,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, workshop_instance_id)
);

-- ============================================================================
-- SERVICE APPOINTMENTS
-- ============================================================================

-- Service types
CREATE TABLE IF NOT EXISTS service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER DEFAULT 60,
    price_cents INTEGER,  -- NULL = "auf Anfrage"
    requires_approval BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service appointments
CREATE TABLE IF NOT EXISTS service_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES service_types(id) ON DELETE CASCADE,
    
    -- Scheduling
    preferred_date TIMESTAMPTZ,
    confirmed_date TIMESTAMPTZ,
    
    -- Details
    description TEXT,  -- What the customer needs
    device_info TEXT,  -- What device/equipment
    urgency TEXT DEFAULT 'normal',  -- low, normal, high
    
    -- Status
    status TEXT DEFAULT 'requested',  -- requested, confirmed, in_progress, completed, cancelled
    
    -- Outcome
    outcome_notes TEXT,
    price_charged_cents INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DONATIONS & SUPPORT
-- ============================================================================

CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- Can be anonymous
    
    -- Donation details
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'CHF',
    
    -- Payment
    payment_method TEXT,  -- bank_transfer, twint, paypal, cash
    payment_reference TEXT,
    payment_date TIMESTAMPTZ,
    
    -- Type
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency TEXT,  -- monthly, quarterly, yearly
    
    -- For non-logged-in donors
    donor_name TEXT,
    donor_email TEXT,
    donor_address TEXT,
    
    -- Tax receipt
    receipt_requested BOOLEAN DEFAULT false,
    receipt_sent BOOLEAN DEFAULT false,
    receipt_sent_at TIMESTAMPTZ,
    
    -- Admin
    notes TEXT,
    thank_you_sent BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- VOLUNTEER/INTERN APPLICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Application type
    type TEXT NOT NULL,  -- volunteer, internship, work_reintegration, technical_expert, partnership
    
    -- Application details
    motivation TEXT,
    availability TEXT,  -- e.g., "Montags nachmittags", "Vollzeit", "Flexibel"
    skills TEXT[],
    experience TEXT,
    start_date DATE,
    
    -- For work reintegration
    referring_organization TEXT,  -- e.g., 'AOZ', 'HEKS'
    case_manager_contact TEXT,
    
    -- Status workflow
    status TEXT DEFAULT 'submitted',  -- submitted, reviewing, interview_scheduled, accepted, rejected, withdrawn
    
    -- Admin handling
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    interview_date TIMESTAMPTZ,
    decision_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NEWSLETTER SUBSCRIPTIONS (for non-users too)
-- ============================================================================

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Preferences
    frequency TEXT DEFAULT 'monthly',  -- weekly, monthly
    topics TEXT[],  -- e.g., ['workshops', 'offers', 'news']
    language TEXT DEFAULT 'de',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    confirmed_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    
    -- Tracking
    source TEXT,  -- e.g., 'website', 'workshop', 'shop'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEDUSA CUSTOMER LINK (for shop integration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS medusa_customer_links (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    medusa_customer_id TEXT UNIQUE NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_registrations_user_id ON workshop_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_registrations_instance_id ON workshop_registrations(workshop_instance_id);
CREATE INDEX IF NOT EXISTS idx_workshop_instances_workshop_id ON workshop_instances(workshop_id);
CREATE INDEX IF NOT EXISTS idx_service_appointments_user_id ON service_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);

-- ============================================================================
-- SEED DATA: Service Types
-- ============================================================================

INSERT INTO service_types (slug, name, description, duration_minutes, price_cents, requires_approval)
VALUES
    ('computer-repair', 'Computerreparatur', 'Diagnose und Reparatur von Hardware-Problemen', 60, NULL, false),
    ('linux-installation', 'Linux-Installation', 'Installation und Einrichtung von Linux auf Ihrem Gerät', 90, 5000, false),
    ('data-recovery', 'Datenrettung', 'Wiederherstellung von Daten von beschädigten Festplatten', 120, NULL, true),
    ('hardware-upgrade', 'Hardware-Aufrüstung', 'RAM, SSD, oder andere Hardware-Upgrades', 60, NULL, false),
    ('consultation', 'Beratung', 'Technische Beratung zu Linux, Open-Source oder Hardware', 30, 0, false),
    ('custom-build', 'Massgeschneiderter PC', 'Zusammenstellung eines individuellen Computers', 120, NULL, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEED DATA: Workshops
-- ============================================================================

INSERT INTO workshops (slug, title, description, category, duration, level, max_participants, price_cents)
VALUES
    ('linux-workshop', 'Linux Workshop', 'Meistern Sie das Linux-Betriebssystem von den Grundlagen bis zu fortgeschrittenen Themen.', 'Betriebssysteme', '2 Tage', 'Anfänger bis Fortgeschrittene', 12, 0),
    ('open-source-software', 'Open-Source-Software', 'Entdecken Sie die Welt der Open-Source-Software-Entwicklung.', 'Entwicklung', '1 Tag', 'Alle Stufen', 15, 0),
    ('computer-repair', 'Computerreparatur', 'Lernen Sie grundlegende Hardware-Reparatur- und Wartungsfähigkeiten.', 'Hardware', '2 Tage', 'Anfänger', 10, 0),
    ('bitcoin-blockchain', 'Bitcoin & Blockchain', 'Verstehen Sie die Grundlagen von Bitcoin und Blockchain-Technologie.', 'Blockchain', '1 Tag', 'Anfänger', 20, 0),
    ('ai-workshop', 'Künstliche Intelligenz', 'Tauchen Sie ein in die Welt der KI und des maschinellen Lernens.', 'KI & ML', '2 Tage', 'Fortgeschrittene', 15, 0),
    ('creative-coding', 'Kreatives Programmieren', 'Verwandeln Sie Ideen in funktionierende Prototypen mit KI-gestützten Workflows.', 'Kreativ', '4 Sitzungen', 'Anfänger bis Fortgeschrittene', 12, 0)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE users IS 'Central user accounts for RevampIT unified auth';
COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON TABLE workshops IS 'Workshop definitions (admin managed)';
COMMENT ON TABLE workshop_instances IS 'Specific workshop dates/sessions';
COMMENT ON TABLE workshop_registrations IS 'User registrations for workshops';
COMMENT ON TABLE service_appointments IS 'Service appointment bookings';
COMMENT ON TABLE donations IS 'Donation records';
COMMENT ON TABLE applications IS 'Volunteer/intern/partnership applications';








