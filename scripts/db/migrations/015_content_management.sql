-- Content Management System Tables
-- Connects admin content creation to public website display
-- Migration: 015_content_management.sql
-- Date: 2026-01-28

-- ============================================
-- BLOG CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#16a34a', -- Green default
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO blog_categories (slug, name, description, sort_order) VALUES
  ('nachhaltigkeit', 'Nachhaltigkeit', 'Artikel über nachhaltige Technologie und Umweltschutz', 1),
  ('reparatur', 'Reparatur', 'Tipps und Anleitungen zur Gerätereparatur', 2),
  ('open-source', 'Open Source', 'News und Tutorials zu Open Source Software', 3),
  ('community', 'Community', 'Geschichten aus unserer Community', 4),
  ('news', 'News', 'Neuigkeiten von RevampIT', 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- BLOG POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL, -- Markdown content
  featured_image TEXT,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',

  -- Publishing status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  -- SEO metadata
  seo_title TEXT,
  seo_description TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for blog posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_by ON blog_posts(created_by);

-- ============================================
-- SERVICES (for public display)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Hero section
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_description TEXT,

  -- Rich content
  content TEXT, -- JSON or Markdown for features, process, etc.
  icon TEXT DEFAULT 'HardDrive',

  -- Pricing
  price_display TEXT, -- e.g., "CHF 70/Stunde"
  price_details TEXT[], -- Array of pricing details

  -- Publishing
  is_active BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for services
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_sort ON services(sort_order);

-- Seed services from existing config
INSERT INTO services (slug, name, description, hero_title, hero_subtitle, hero_description, icon, price_display, price_details, is_active, sort_order) VALUES
  (
    'computer-repair-upgrades',
    'Computerreparatur & Aufrüstungen',
    'Expertenreparaturen für alle Arten von Computern und Komponenten.',
    'Computerreparatur & Aufrüstungen',
    'Vertrauensvolle Expertenreparaturen',
    'Wir kombinieren technische Expertise mit nachhaltigen Praktiken, um die Lebensdauer Ihrer Geräte zu verlängern.',
    'HardDrive',
    'CHF 70/Stunde + Teile',
    ARRAY['Professionelle Bewertung erforderlich', 'Bauteil-Level-Reparaturen', 'Hardware-Aufrüstungen verfügbar', 'Qualitätsgarantie inbegriffen'],
    true,
    1
  ),
  (
    'data-recovery-transfer',
    'Datenrettung & Transfer',
    'Professionelle Datenübertragung und Wiederherstellungsdienste für alle Arten von Speichermedien.',
    'Datenrettung & Transfer',
    'Zugang zu Ihren Daten, Bewahrung Ihrer Geschichte',
    'Ob Sie Daten von einem nicht funktionierenden Gerät wiederherstellen oder auf alte Speichermedien zugreifen müssen - wir haben die Expertise.',
    'HardDrive',
    'CHF 30 pro Auftrag + Medienkosten',
    ARRAY['Grundgebühr: CHF 30 pro Auftrag', 'Medienkosten zusätzlich', 'Unterstützung für alte Medien', 'Massgeschneiderte Lösungen auf Anfrage'],
    true,
    2
  ),
  (
    'hardware-recycling',
    'Hardware-Recycling',
    'Verantwortungsvolles Recycling und Aufarbeitung von IT-Ausrüstung.',
    'Hardware-Recycling',
    'Ein neues Leben für Ihre alte Ausrüstung',
    'Wir nehmen Ihre alte IT-Ausrüstung und geben ihr ein zweites Leben durch verantwortungsvolle Recycling-Praktiken.',
    'Archive',
    'Kostenlos',
    ARRAY['Kostenlose Annahme für die meisten Artikel', 'Abholservice verfügbar', 'Spezielle Geräte: Bitte kontaktieren Sie uns'],
    true,
    3
  ),
  (
    'linux-open-source',
    'Linux & Open Source',
    'Professionelle Linux-Installation, Support und Schulung.',
    'Linux & Open Source Lösungen',
    'Experten Open Source Support',
    'Wir helfen Ihnen beim Übergang zu und der Wartung von Linux- und Open-Source-Software-Lösungen.',
    'Server',
    'CHF 70/Stunde',
    ARRAY['Kostenlose Erstberatung', 'Custom Linux distributions', 'Migration-Unterstützung', 'Laufender Support verfügbar'],
    true,
    4
  ),
  (
    'web-design-development',
    'Webdesign & Entwicklung',
    'Moderne Webentwicklung mit Open-Source-Technologien.',
    'Webdesign & Entwicklung',
    'Moderne, nachhaltige Web-Lösungen',
    'Wir erstellen schnelle, schöne und funktionale Websites mit modernsten Open-Source-Technologien.',
    'Globe',
    'CHF 70/Stunde',
    ARRAY['Kostenlose Erstberatung', 'Open Source Technologien', 'Responsive Design', 'SEO-Optimierung', 'Laufender Support'],
    true,
    5
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  hero_title = EXCLUDED.hero_title,
  hero_subtitle = EXCLUDED.hero_subtitle,
  hero_description = EXCLUDED.hero_description,
  icon = EXCLUDED.icon,
  price_display = EXCLUDED.price_display,
  price_details = EXCLUDED.price_details,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================
-- STATIC PAGES
-- ============================================
CREATE TABLE IF NOT EXISTS static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown or HTML

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Index for static pages
CREATE INDEX IF NOT EXISTS idx_static_pages_slug ON static_pages(slug);
CREATE INDEX IF NOT EXISTS idx_static_pages_published ON static_pages(is_published);

-- ============================================
-- UPDATE TIMESTAMPS TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all content tables
DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON blog_categories;
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_static_pages_updated_at ON static_pages;
CREATE TRIGGER update_static_pages_updated_at
  BEFORE UPDATE ON static_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
