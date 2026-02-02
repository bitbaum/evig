-- ============================================================================
-- RevampIT Service Types Alignment Migration
-- Created: 2026-02-02
-- Description: Aligns service_types table with marketing services (SSOT unification)
--
-- This migration:
-- 1. Adds category and is_bookable columns
-- 2. Updates existing slugs to match marketing data
-- 3. Inserts missing services from marketing
-- 4. Marks operational-only services as bookable but not in marketing
-- ============================================================================

-- ============================================================================
-- 1. ADD NEW COLUMNS
-- ============================================================================

-- Category for grouping services (repair, data, recycling, software, web)
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS category TEXT;

-- is_bookable: true = can be booked via appointments, false = marketing/informational only
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS is_bookable BOOLEAN DEFAULT TRUE;

-- is_featured: show on main services page
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

-- display_order: for sorting on public pages
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 100;

-- updated_at for tracking changes
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 2. UPDATE EXISTING SERVICES - Align slugs with marketing data
-- ============================================================================

-- computer-repair → computer-repair-upgrades (combines repair + upgrades)
UPDATE service_types
SET slug = 'computer-repair-upgrades',
    name = 'Computerreparatur & Aufrüstungen',
    description = 'Expertenreparaturen für alle Arten von Computern und Komponenten. Wir spezialisieren uns darauf zu reparieren, was andere nicht koennen, einschliesslich Motherboard-Reparaturen und Bauteil-Level-Fixes.',
    category = 'repair',
    is_featured = TRUE,
    display_order = 10,
    price_cents = 7000,  -- CHF 70/hour
    duration_minutes = 60
WHERE slug = 'computer-repair';

-- data-recovery → data-recovery-transfer (expanded scope)
UPDATE service_types
SET slug = 'data-recovery-transfer',
    name = 'Datenrettung & Transfer',
    description = 'Professionelle Datenübertragung und Wiederherstellungsdienste für alle Arten von Speichermedien. Wir helfen Ihnen dabei, Ihre wertvollen Daten von jedem Gerät oder Format zu erreichen und zu übertragen.',
    category = 'data',
    is_featured = TRUE,
    display_order = 20,
    price_cents = 3000,  -- CHF 30 base
    duration_minutes = 60
WHERE slug = 'data-recovery';

-- hardware-upgrade → merge into computer-repair-upgrades (will be deleted)
-- Mark as not active, will be superseded by computer-repair-upgrades
UPDATE service_types
SET is_active = FALSE,
    is_bookable = FALSE,
    category = 'repair'
WHERE slug = 'hardware-upgrade';

-- linux-installation → linux-open-source (expanded scope)
UPDATE service_types
SET slug = 'linux-open-source',
    name = 'Linux & Open Source',
    description = 'Professionelle Linux-Installation, Support und Schulung. Wir helfen Ihnen beim Übergang zu Open-Source-Software und bieten fortlaufenden Support.',
    category = 'software',
    is_featured = TRUE,
    display_order = 40,
    price_cents = 7000,  -- CHF 70/hour
    duration_minutes = 60
WHERE slug = 'linux-installation';

-- consultation → keep as bookable but not featured
UPDATE service_types
SET category = 'general',
    is_bookable = TRUE,
    is_featured = FALSE,
    display_order = 90
WHERE slug = 'consultation';

-- custom-build → keep as bookable but not featured (coming soon feature)
UPDATE service_types
SET category = 'repair',
    is_bookable = TRUE,
    is_featured = FALSE,
    display_order = 80
WHERE slug = 'custom-build';

-- ============================================================================
-- 3. INSERT MISSING SERVICES FROM MARKETING
-- ============================================================================

-- Hardware-Recycling (free service, featured)
INSERT INTO service_types (slug, name, description, category, duration_minutes, price_cents, requires_approval, is_active, is_bookable, is_featured, display_order)
VALUES (
    'hardware-recycling',
    'Hardware-Recycling',
    'Verantwortungsvolles Recycling und Aufarbeitung von IT-Ausrüstung. Wir geben Ihren alten Geräten ein neues Leben und sorgen gleichzeitig für sichere Datenlöschung.',
    'recycling',
    30,
    0,  -- Free
    FALSE,
    TRUE,
    TRUE,
    TRUE,
    30
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

-- Web Design & Development (featured)
INSERT INTO service_types (slug, name, description, category, duration_minutes, price_cents, requires_approval, is_active, is_bookable, is_featured, display_order)
VALUES (
    'web-design-development',
    'Webdesign & Entwicklung',
    'Modern web design and development using open-source technologies. Fast, responsive websites built with Next.js, Headless CMS, and sustainable practices.',
    'web',
    60,
    7000,  -- CHF 70/hour
    TRUE,  -- Requires quote/consultation first
    TRUE,
    TRUE,
    TRUE,
    50
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order;

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_service_types_category ON service_types(category);
CREATE INDEX IF NOT EXISTS idx_service_types_is_bookable ON service_types(is_bookable);
CREATE INDEX IF NOT EXISTS idx_service_types_is_featured ON service_types(is_featured);
CREATE INDEX IF NOT EXISTS idx_service_types_display_order ON service_types(display_order);

-- ============================================================================
-- 5. ADD UPDATED_AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_service_types_updated_at ON service_types;
CREATE TRIGGER update_service_types_updated_at
    BEFORE UPDATE ON service_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. COMMENTS
-- ============================================================================

COMMENT ON COLUMN service_types.category IS 'Service category: repair, data, recycling, software, web, general';
COMMENT ON COLUMN service_types.is_bookable IS 'Whether this service can be booked via appointments';
COMMENT ON COLUMN service_types.is_featured IS 'Whether to show on main public services page';
COMMENT ON COLUMN service_types.display_order IS 'Sort order for public display (lower = first)';

-- ============================================================================
-- SUMMARY: After this migration, service_types will contain:
--
-- FEATURED (is_featured = true, shown on /services):
--   1. computer-repair-upgrades  (repair)     - CHF 70/h
--   2. data-recovery-transfer    (data)       - CHF 30 base
--   3. hardware-recycling        (recycling)  - Free
--   4. linux-open-source         (software)   - CHF 70/h
--   5. web-design-development    (web)        - CHF 70/h
--
-- BOOKABLE BUT NOT FEATURED:
--   - consultation               (general)    - Free
--   - custom-build               (repair)     - Quote required
--
-- INACTIVE (superseded):
--   - hardware-upgrade           (merged into computer-repair-upgrades)
-- ============================================================================
