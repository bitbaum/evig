-- Migration: 012_customer_profiles_erfassung
-- Description: Customer profiles for product recommendations and enhanced Erfassung

-- ============================================================================
-- CUSTOMER PROFILES SYSTEM
-- ============================================================================

-- Customer profiles lookup table
CREATE TABLE IF NOT EXISTS customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    name_de VARCHAR(100) NOT NULL,
    description TEXT,
    description_de TEXT,

    -- Profile characteristics
    icon TEXT,
    color VARCHAR(7), -- hex color

    -- Hardware requirements (1-5 scale)
    hw_requirement_min INTEGER DEFAULT 1 CHECK (hw_requirement_min >= 1 AND hw_requirement_min <= 5),
    hw_requirement_max INTEGER DEFAULT 3 CHECK (hw_requirement_max >= 1 AND hw_requirement_max <= 5),

    -- Use case tags
    use_cases TEXT[] DEFAULT '{}',
    recommended_os TEXT[] DEFAULT '{}',

    -- Sorting and display
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link products to customer profiles (many-to-many)
CREATE TABLE IF NOT EXISTS product_customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,  -- References ai_extracted_products(id)
    profile_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,

    -- Suitability score (0-100)
    suitability_score INTEGER DEFAULT 80 CHECK (suitability_score >= 0 AND suitability_score <= 100),

    -- How it was assigned
    assigned_by TEXT DEFAULT 'manual' CHECK (assigned_by IN ('manual', 'ai', 'rule')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(product_id, profile_id)
);

-- ============================================================================
-- ENHANCED INVENTORY FIELDS
-- ============================================================================

-- Add missing fields to ai_extracted_products if not exists
DO $$
BEGIN
    -- Short description field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_extracted_products' AND column_name = 'short_description') THEN
        ALTER TABLE ai_extracted_products ADD COLUMN short_description TEXT;
    END IF;

    -- Box ID for physical storage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'inventory_items' AND column_name = 'box_id') THEN
        ALTER TABLE inventory_items ADD COLUMN box_id TEXT;
    END IF;

    -- Item UUID (human-readable format like I-YYMMDD-NNNN)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'ai_extracted_products' AND column_name = 'item_uuid') THEN
        ALTER TABLE ai_extracted_products ADD COLUMN item_uuid TEXT UNIQUE;
    END IF;
END $$;

-- ============================================================================
-- DEFAULT CUSTOMER PROFILES
-- ============================================================================

INSERT INTO customer_profiles (slug, name, name_de, description, description_de, icon, color, hw_requirement_min, hw_requirement_max, use_cases, recommended_os, sort_order) VALUES
    ('oma', 'Senior', 'Oma/Opa',
     'Simple, reliable computing for everyday tasks like email, browsing, and video calls',
     'Einfache, zuverlässige Computer für alltägliche Aufgaben wie E-Mail, Web-Surfen und Video-Anrufe',
     'heart', '#EC4899', 1, 2,
     ARRAY['email', 'web-browsing', 'video-calls', 'photos'],
     ARRAY['Linux Mint', 'Zorin OS Lite'],
     1),

    ('buero', 'Office', 'Büro',
     'Reliable workstations for professional use with office applications and productivity tools',
     'Zuverlässige Arbeitsplätze für den professionellen Einsatz mit Office-Anwendungen und Produktivitätstools',
     'briefcase', '#3B82F6', 2, 3,
     ARRAY['office', 'email', 'spreadsheets', 'presentations', 'web-apps'],
     ARRAY['MX Linux', 'Linux Mint', 'Ubuntu LTS'],
     2),

    ('chiller', 'Media & Streaming', 'Chiller',
     'Entertainment-focused setup for streaming, media consumption, and casual use',
     'Unterhaltungs-Setup für Streaming, Medienkonsum und entspannte Nutzung',
     'tv', '#8B5CF6', 2, 3,
     ARRAY['streaming', 'media-center', 'music', 'movies', 'casual-gaming'],
     ARRAY['LibreELEC', 'Ubuntu', 'Pop!_OS'],
     3),

    ('gamer', 'Gamer', 'Gamer',
     'High-performance systems for gaming with dedicated graphics and fast components',
     'Hochleistungssysteme für Gaming mit dedizierter Grafik und schnellen Komponenten',
     'gamepad', '#EF4444', 4, 5,
     ARRAY['gaming', 'steam', 'high-fps', 'vr-ready'],
     ARRAY['SteamOS', 'Pop!_OS', 'Nobara', 'Garuda Linux'],
     4),

    ('kreativ', 'Creative', 'Kreativ-Kopf',
     'Powerful machines for creative work: graphics, video editing, music production',
     'Leistungsstarke Maschinen für kreative Arbeit: Grafik, Videobearbeitung, Musikproduktion',
     'palette', '#F59E0B', 3, 5,
     ARRAY['graphics', 'video-editing', 'music-production', 'photo-editing', '3d-modeling'],
     ARRAY['Ubuntu Studio', 'Fedora Design Suite', 'Pop!_OS'],
     5),

    ('dev', 'Developer', 'Entwickler',
     'Development workstations with good RAM, fast storage, and Linux compatibility',
     'Entwickler-Arbeitsplätze mit gutem RAM, schnellem Speicher und Linux-Kompatibilität',
     'code', '#10B981', 3, 4,
     ARRAY['programming', 'docker', 'vms', 'compiling', 'web-dev'],
     ARRAY['Fedora', 'Arch Linux', 'Ubuntu', 'Pop!_OS'],
     6),

    ('student', 'Student', 'Student',
     'Portable, affordable laptops for studying, note-taking, and research',
     'Tragbare, erschwingliche Laptops für Studium, Notizen und Recherche',
     'graduation-cap', '#06B6D4', 2, 3,
     ARRAY['studying', 'note-taking', 'research', 'presentations', 'portable'],
     ARRAY['Linux Mint', 'Ubuntu', 'Fedora'],
     7)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    name_de = EXCLUDED.name_de,
    description = EXCLUDED.description,
    description_de = EXCLUDED.description_de,
    hw_requirement_min = EXCLUDED.hw_requirement_min,
    hw_requirement_max = EXCLUDED.hw_requirement_max,
    use_cases = EXCLUDED.use_cases,
    recommended_os = EXCLUDED.recommended_os;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_customer_profiles_active ON customer_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_product_profiles_product ON product_customer_profiles(product_id);
CREATE INDEX IF NOT EXISTS idx_product_profiles_profile ON product_customer_profiles(profile_id);

-- ============================================================================
-- SEQUENCE FOR ITEM UUID GENERATION
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS item_uuid_seq START 1;

-- Function to generate human-readable Item UUID
CREATE OR REPLACE FUNCTION generate_item_uuid()
RETURNS TEXT AS $$
DECLARE
    date_part TEXT;
    seq_part TEXT;
BEGIN
    date_part := TO_CHAR(CURRENT_DATE, 'YYMMDD');
    seq_part := LPAD(NEXTVAL('item_uuid_seq')::TEXT, 4, '0');
    RETURN 'I-' || date_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- Reset sequence daily (optional - run via cron)
-- SELECT setval('item_uuid_seq', 1, false);
