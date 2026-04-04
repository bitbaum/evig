-- Migration: 004_ai_inventory_system
-- Description: AI-powered inventory management system with automated data extraction

-- ============================================================================
-- AI PRODUCT EXTRACTION SYSTEM
-- ============================================================================

-- Create table for AI-extracted product data
CREATE TABLE IF NOT EXISTS ai_extracted_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_image_url TEXT,
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Basic product information
    product_name TEXT,
    product_name_confidence DECIMAL(3,2) CHECK (product_name_confidence >= 0 AND product_name_confidence <= 1),
    brand TEXT,
    brand_confidence DECIMAL(3,2) CHECK (brand_confidence >= 0 AND brand_confidence <= 1),
    model TEXT,
    model_confidence DECIMAL(3,2) CHECK (model_confidence >= 0 AND model_confidence <= 1),

    -- Categorization
    category TEXT,
    category_confidence DECIMAL(3,2) CHECK (category_confidence >= 0 AND category_confidence <= 1),
    subcategory TEXT,
    subcategory_confidence DECIMAL(3,2) CHECK (subcategory_confidence >= 0 AND subcategory_confidence <= 1),

    -- Pricing and condition
    estimated_price_chf DECIMAL(10,2),
    price_confidence DECIMAL(3,2) CHECK (price_confidence >= 0 AND price_confidence <= 1),
    condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor', 'damaged')),
    condition_confidence DECIMAL(3,2) CHECK (condition_confidence >= 0 AND condition_confidence <= 1),

    -- Technical specifications
    specifications JSONB DEFAULT '{}',
    specs_confidence DECIMAL(3,2) CHECK (specs_confidence >= 0 AND specs_confidence <= 1),

    -- Additional metadata
    color TEXT,
    color_confidence DECIMAL(3,2) CHECK (color_confidence >= 0 AND color_confidence <= 1),
    material TEXT,
    material_confidence DECIMAL(3,2) CHECK (material_confidence >= 0 AND material_confidence <= 1),
    dimensions JSONB DEFAULT '{}', -- {width: 10, height: 20, depth: 5, unit: 'cm'}
    weight_grams INTEGER,
    weight_confidence DECIMAL(3,2) CHECK (weight_confidence >= 0 AND weight_confidence <= 1),

    -- AI processing metadata
    ai_provider TEXT DEFAULT 'openai', -- 'openai', 'anthropic', 'google', etc.
    ai_model TEXT DEFAULT 'gpt-4-vision-preview',
    processing_time_ms INTEGER,
    total_confidence DECIMAL(3,2) CHECK (total_confidence >= 0 AND total_confidence <= 1),

    -- Raw AI response for debugging/analysis
    raw_ai_response JSONB DEFAULT '{}',

    -- User and processing status
    created_by UUID REFERENCES users(id),
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'processed')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,

    -- Integration fields
    kivitendo_article_number TEXT,
    medusa_product_id TEXT,
    marketplace_listing_id TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SUSTAINABILITY SCORING SYSTEM
-- ============================================================================

-- Create sustainability scoring table
CREATE TABLE IF NOT EXISTS sustainability_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES ai_extracted_products(id) ON DELETE CASCADE,

    -- Overall sustainability score (0-100)
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

    -- Component scores
    environmental_score INTEGER CHECK (environmental_score >= 0 AND environmental_score <= 100),
    social_score INTEGER CHECK (social_score >= 0 AND social_score <= 100),
    economic_score INTEGER CHECK (economic_score >= 0 AND economic_score <= 100),

    -- Detailed factors
    factors JSONB DEFAULT '{}', -- {recyclability: 85, energy_efficiency: 70, fair_trade: 60, ...}

    -- AI analysis
    ai_analysis JSONB DEFAULT '{}',
    ai_provider TEXT DEFAULT 'openai',
    ai_model TEXT,

    -- Recommendations
    recommendations TEXT[],
    improvement_suggestions TEXT[],

    -- Metadata
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assessed_by TEXT DEFAULT 'ai', -- 'ai', 'expert', 'user'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PRODUCT CATEGORIES AND ATTRIBUTES
-- ============================================================================

-- Enhanced product categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    level INTEGER DEFAULT 1, -- 1 = main category, 2 = subcategory, etc.

    -- Display and SEO
    icon TEXT,
    color VARCHAR(7), -- hex color
    seo_title TEXT,
    seo_description TEXT,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    ai_detection_keywords TEXT[], -- Keywords for AI recognition

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product attributes (for structured data)
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES product_categories(id),
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    data_type VARCHAR(20) DEFAULT 'text' CHECK (data_type IN ('text', 'number', 'boolean', 'select', 'multiselect', 'date')),
    unit VARCHAR(20), -- 'cm', 'kg', 'GB', etc.
    is_required BOOLEAN DEFAULT false,
    is_filterable BOOLEAN DEFAULT false,
    options TEXT[] DEFAULT '{}', -- For select/multiselect types

    -- AI extraction
    ai_extraction_prompt TEXT,
    ai_confidence_threshold DECIMAL(3,2) DEFAULT 0.7,

    -- Display
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(category_id, name)
);

-- ============================================================================
-- INVENTORY MANAGEMENT
-- ============================================================================

-- Inventory items table (links AI extraction to physical inventory)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_product_id UUID REFERENCES ai_extracted_products(id),

    -- Legacy system integration
    kivitendo_article_number TEXT UNIQUE,
    legacy_csv_data JSONB DEFAULT '{}',

    -- Physical inventory tracking
    location TEXT, -- Warehouse location
    quantity_available INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,

    -- Status tracking
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'damaged', 'missing')),
    condition_override TEXT CHECK (condition_override IN ('new', 'like_new', 'good', 'fair', 'poor', 'damaged')),
    condition_notes TEXT,

    -- Pricing
    acquisition_cost_chf DECIMAL(10,2),
    selling_price_chf DECIMAL(10,2),
    min_selling_price_chf DECIMAL(10,2),

    -- Marketplace integration
    medusa_product_id TEXT UNIQUE,
    marketplace_status TEXT DEFAULT 'draft' CHECK (marketplace_status IN ('draft', 'published', 'sold', 'archived')),

    -- User assignments
    assigned_to UUID REFERENCES users(id), -- Who is responsible for this item
    assigned_at TIMESTAMP WITH TIME ZONE,
    assignment_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PRODUCT IMAGES AND MEDIA
-- ============================================================================

-- Enhanced product images table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES ai_extracted_products(id) ON DELETE CASCADE,

    -- File information
    filename TEXT NOT NULL,
    original_filename TEXT,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER,
    mime_type TEXT,

    -- AI analysis
    ai_description TEXT,
    ai_tags TEXT[],
    is_primary BOOLEAN DEFAULT false,

    -- Image metadata
    width INTEGER,
    height INTEGER,
    dominant_colors TEXT[], -- ['#FF0000', '#00FF00', etc.]
    image_quality DECIMAL(3,2), -- AI-assessed quality score

    -- Processing status
    upload_status TEXT DEFAULT 'processing' CHECK (upload_status IN ('uploading', 'processing', 'ready', 'failed')),
    processed_at TIMESTAMP WITH TIME ZONE,

    -- User and permissions
    uploaded_by UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AI PROCESSING LOGS AND ANALYTICS
-- ============================================================================

-- AI processing logs for debugging and improvement
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES ai_extracted_products(id),

    -- Request details
    request_type TEXT NOT NULL, -- 'image_analysis', 'text_extraction', 'sustainability_scoring'
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    input_data JSONB DEFAULT '{}',

    -- Response details
    response_data JSONB DEFAULT '{}',
    processing_time_ms INTEGER,
    tokens_used INTEGER,
    cost_cents DECIMAL(8,4),

    -- Quality metrics
    confidence_score DECIMAL(3,2),
    accuracy_rating DECIMAL(3,2), -- User-provided feedback
    error_message TEXT,

    -- Metadata
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MARKETPLACE INTEGRATION
-- ============================================================================

-- Marketplace listings table
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,

    -- Listing details
    title TEXT NOT NULL,
    description TEXT,
    price_chf DECIMAL(10,2) NOT NULL,

    -- Platform integration
    platform TEXT NOT NULL, -- 'medusa', 'external_api', etc.
    platform_listing_id TEXT,
    platform_url TEXT,

    -- Status and visibility
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sold', 'paused', 'expired')),
    is_featured BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,

    -- Sales tracking
    sold_at TIMESTAMP WITH TIME ZONE,
    sold_price_chf DECIMAL(10,2),
    buyer_info JSONB DEFAULT '{}', -- Anonymized buyer data

    -- Metadata
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- AI extracted products indexes
CREATE INDEX IF NOT EXISTS idx_ai_products_status ON ai_extracted_products(status);
CREATE INDEX IF NOT EXISTS idx_ai_products_brand ON ai_extracted_products(brand);
CREATE INDEX IF NOT EXISTS idx_ai_products_category ON ai_extracted_products(category);
CREATE INDEX IF NOT EXISTS idx_ai_products_created_by ON ai_extracted_products(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_products_kivitendo ON ai_extracted_products(kivitendo_article_number);

-- Inventory items indexes
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory_items(location);
CREATE INDEX IF NOT EXISTS idx_inventory_kivitendo ON inventory_items(kivitendo_article_number);
CREATE INDEX IF NOT EXISTS idx_inventory_assigned_to ON inventory_items(assigned_to);

-- Product categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent ON product_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON product_categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_active ON product_categories(is_active);

-- Marketplace listings indexes
CREATE INDEX IF NOT EXISTS idx_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_platform ON marketplace_listings(platform);
CREATE INDEX IF NOT EXISTS idx_listings_created_by ON marketplace_listings(created_by);

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
            'ai_extracted_products', 'sustainability_scores', 'product_categories',
            'product_attributes', 'inventory_items', 'product_images',
            'ai_processing_logs', 'marketplace_listings'
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

-- Insert default product categories
INSERT INTO product_categories (slug, name, description, level, icon, color, ai_detection_keywords) VALUES
    ('electronics', 'Elektronik', 'Computer, Smartphones, Tablets und Zubehör', 1, 'computer', '#3B82F6', ARRAY['computer', 'laptop', 'smartphone', 'tablet', 'elektronik', 'electronic']),
    ('components', 'Computer-Komponenten', 'CPUs, RAM, Festplatten, Mainboards', 2, 'cpu', '#10B981', ARRAY['ram', 'cpu', 'motherboard', 'ssd', 'hdd', 'grafikkarte', 'graphics card']),
    ('peripherals', 'Peripheriegeräte', 'Monitore, Tastaturen, Mäuse, Drucker', 2, 'monitor', '#F59E0B', ARRAY['monitor', 'keyboard', 'mouse', 'printer', 'tastatur', 'maus', 'bildschirm']),
    ('networking', 'Netzwerk', 'Router, Switches, Netzwerkkarten', 2, 'wifi', '#8B5CF6', ARRAY['router', 'switch', 'network', 'netzwerk', 'wifi', 'ethernet']),
    ('audio', 'Audio', 'Lautsprecher, Kopfhörer, Mikrofone', 2, 'headphones', '#EF4444', ARRAY['speaker', 'headphone', 'microphone', 'audio', 'lautsprecher', 'kopfhörer']),
    ('office', 'Büroartikel', 'Büromaterial, Organisation, Büroelektronik', 1, 'briefcase', '#6B7280', ARRAY['office', 'büro', 'printer', 'scanner', 'kopierer'])
ON CONFLICT (slug) DO NOTHING;

-- Insert default product attributes for electronics category
INSERT INTO product_attributes (category_id, name, display_name, data_type, unit, is_required, is_filterable, options, ai_extraction_prompt) VALUES
    ((SELECT id FROM product_categories WHERE slug = 'electronics'), 'brand', 'Marke', 'text', NULL, true, true, '{}', 'Extract the brand/manufacturer name from the product image and text'),
    ((SELECT id FROM product_categories WHERE slug = 'electronics'), 'model', 'Modell', 'text', NULL, false, true, '{}', 'Extract the model number or name from the product'),
    ((SELECT id FROM product_categories WHERE slug = 'electronics'), 'color', 'Farbe', 'text', NULL, false, true, '{}', 'Identify the primary color of the product'),
    ((SELECT id FROM product_categories WHERE slug = 'electronics'), 'condition', 'Zustand', 'select', NULL, true, true, ARRAY['new', 'like_new', 'good', 'fair', 'poor'], 'Assess the physical condition of the product'),
    ((SELECT id FROM product_categories WHERE slug = 'electronics'), 'weight_grams', 'Gewicht', 'number', 'g', false, false, '{}', 'Estimate the weight of the product in grams')
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert attributes for computer components
INSERT INTO product_attributes (category_id, name, display_name, data_type, unit, is_required, is_filterable, ai_extraction_prompt) VALUES
    ((SELECT id FROM product_categories WHERE slug = 'components'), 'capacity', 'Kapazität', 'number', 'GB', false, true, 'Extract storage capacity for drives or memory size for RAM'),
    ((SELECT id FROM product_categories WHERE slug = 'components'), 'speed', 'Geschwindigkeit', 'text', NULL, false, true, 'Extract speed specifications (MHz, GHz, etc.)'),
    ((SELECT id FROM product_categories WHERE slug = 'components'), 'interface', 'Schnittstelle', 'text', NULL, false, true, 'Extract interface type (SATA, PCIe, DDR4, etc.)'),
    ((SELECT id FROM product_categories WHERE slug = 'components'), 'form_factor', 'Formfaktor', 'text', NULL, false, false, 'Identify the physical form factor (2.5", DIMM, etc.)')
ON CONFLICT (category_id, name) DO NOTHING;