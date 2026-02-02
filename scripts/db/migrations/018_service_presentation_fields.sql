-- ============================================================================
-- RevampIT Service Presentation Fields Migration
-- Created: 2026-02-02
-- Description: Adds presentation fields to service_types table for admin editing
--
-- This migration:
-- 1. Adds presentation columns (icon, hero, features, process, pricing)
-- 2. Migrates existing data from presentation.ts to database
-- 3. Enables admin UI editing of all service content
-- ============================================================================

-- ============================================================================
-- 1. ADD PRESENTATION COLUMNS
-- ============================================================================

-- Icon name (references Lucide icon component name)
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS icon_name VARCHAR(50) DEFAULT 'Wrench';

-- Hero section content
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS hero_title TEXT;
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS hero_description TEXT;

-- Features and process (JSONB arrays)
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS features_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS process_json JSONB DEFAULT '[]'::jsonb;

-- Pricing display (separate from price_cents for flexible display)
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS pricing_base TEXT;
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS pricing_details JSONB DEFAULT '[]'::jsonb;
ALTER TABLE service_types ADD COLUMN IF NOT EXISTS pricing_media_prices JSONB;

-- ============================================================================
-- 2. MIGRATE DATA FROM presentation.ts
-- ============================================================================

-- computer-repair-upgrades
UPDATE service_types SET
  icon_name = 'HardDrive',
  hero_title = 'Computerreparatur & Aufrüstungen',
  hero_subtitle = 'Vertrauensvolle Expertenreparaturen',
  hero_description = 'Wir kombinieren technische Expertise mit nachhaltigen Praktiken, um die Lebensdauer Ihrer Geräte zu verlängern. Unsere Reparaturdienste konzentrieren sich darauf zu reparieren, was andere nicht koennen, und sparen Ihnen Geld und reduzieren Elektroschrott.',
  features_json = '[
    {"title": "Bauteil-Level-Reparaturen", "description": "Wir ersetzen nicht nur Teile - wir reparieren sie. Unsere Techniker koennen Motherboards, Netzteile und andere Komponenten auf Schaltkreisebene reparieren.", "icon": "HardDrive"},
    {"title": "Hardware-Aufrüstungen", "description": "Verlängern Sie die Lebensdauer Ihres Computers mit strategischen Aufrüstungen. Wir helfen Ihnen bei der Auswahl und Installation der richtigen Komponenten für Ihre Bedürfnisse.", "icon": "Zap"},
    {"title": "Diagnosedienste", "description": "Umfassende Diagnose zur schnellen Identifizierung und Behebung von Problemen. Wir verwenden professionelle Werkzeuge und jahrelange Erfahrung, um Probleme genau zu lokalisieren.", "icon": "Database"},
    {"title": "Professionelle Bewertung", "description": "Alle Reparaturen beginnen mit einer gründlichen Bewertung, um die beste Vorgehensweise zu bestimmen und einen genauen Kostenvoranschlag zu erstellen.", "icon": "Clock"}
  ]'::jsonb,
  process_json = '[
    {"step": 1, "title": "Bewertung", "description": "Wir untersuchen Ihr Gerät und erstellen eine detaillierte Bewertung des Problems. Die CHF 30 Bewertungsgebühr wird in Ihre endgültigen Reparaturkosten einbezogen."},
    {"step": 2, "title": "Kostenvoranschlag", "description": "Sie erhalten einen transparenten Kostenvoranschlag für die Reparatur, einschliesslich Teile- und Arbeitskosten."},
    {"step": 3, "title": "Reparatur", "description": "Unsere Techniker reparieren Ihr Gerät mit hochwertigen Teilen. Die typische Reparaturzeit beträgt einige Wochen aufgrund der Teileverfügbarkeit."},
    {"step": 4, "title": "Testen", "description": "Wir testen alle Reparaturen gründlich, um sicherzustellen, dass Ihr Gerät perfekt funktioniert, bevor es zurückgegeben wird."}
  ]'::jsonb,
  pricing_base = 'CHF 70/Stunde + Teile',
  pricing_details = '["Professionelle Bewertung erforderlich", "Bauteil-Level-Reparaturen", "Hardware-Aufrüstungen verfügbar", "Qualitätsgarantie inbegriffen"]'::jsonb
WHERE slug = 'computer-repair-upgrades';

-- data-recovery-transfer
UPDATE service_types SET
  icon_name = 'HardDrive',
  hero_title = 'Datenrettung & Transfer',
  hero_subtitle = 'Zugang zu Ihren Daten, Bewahrung Ihrer Geschichte',
  hero_description = 'Ob Sie Daten von einem nicht funktionierenden Gerät wiederherstellen, Daten zwischen Computern übertragen oder auf Daten von alten Speichermedien zugreifen müssen - wir haben die Expertise und Ausrüstung, um zu helfen.',
  features_json = '[
    {"title": "Medienunterstützung", "description": "Unser Dino-Server verfügt über 14 frontzugängliche Laufwerke und mehrere Schnittstellen, bereit für fast jede Datenübertragungsaufgabe.", "icon": "Server"},
    {"title": "Datenübertragung", "description": "Übertragen Sie Daten zwischen Computern, migrieren Sie Einstellungen oder erstellen Sie Backups. Wir koennen grosse Datenmengen effizient verarbeiten.", "icon": "FolderInput"},
    {"title": "Zugang zu alten Medien", "description": "Zugang zu Daten von jedem Speichermedium, auch wenn Sie das erforderliche Laufwerk nicht mehr haben. Wir unterstützen alle Formate einschliesslich Disketten, ZIP-Laufwerke, MO-Laufwerke und mehr.", "icon": "Disc"},
    {"title": "Massgeschneiderte Lösungen", "description": "Benötigen Sie eine ähnliche Server-Einrichtung für Ihren Standort? Wir koennen eine massgeschneiderte Lösung erstellen, die auf Ihre spezifischen Bedürfnisse zugeschnitten ist.", "icon": "Database"}
  ]'::jsonb,
  process_json = '[
    {"step": 1, "title": "Assessment", "description": "Wir bewerten Ihre Speichermedien und bestimmen den besten Ansatz für Datenübertragung oder -wiederherstellung."},
    {"step": 2, "title": "Transfer", "description": "Mit unserer spezialisierten Ausrüstung übertragen wir Ihre Daten auf das Medium Ihrer Wahl."},
    {"step": 3, "title": "Verification", "description": "Wir überprüfen die Integrität der übertragenen Daten, um sicherzustellen, dass alles korrekt kopiert wurde."},
    {"step": 4, "title": "Lieferung", "description": "Ihre Daten werden Ihnen auf dem Medium Ihrer Wahl zurückgegeben, bereit zur Verwendung."}
  ]'::jsonb,
  pricing_base = 'CHF 30 pro Auftrag + Medienkosten',
  pricing_details = '["Grundgebühr: CHF 30 pro Auftrag", "Medienkosten zusätzlich, falls nicht bereitgestellt", "Unterstützung für alte Medien verfügbar", "Massgeschneiderte Lösungen auf Anfrage"]'::jsonb,
  pricing_media_prices = '["Disketten (3.5\" und 5.25\"): CHF 10 pro Diskette", "ZIP/Syquest/EZ Drive/Jazz: CHF 20 pro Diskette", "MO-Laufwerke (3.5\"-5.25\"): CHF 30 pro Diskette", "Festplatten: CHF 40 pro Festplatte", "Bandlaufwerke: CHF 50 pro Band", "VHS/Schallplatten: Preis auf Anfrage"]'::jsonb
WHERE slug = 'data-recovery-transfer';

-- hardware-recycling
UPDATE service_types SET
  icon_name = 'Archive',
  hero_title = 'Hardware-Recycling',
  hero_subtitle = 'Ein neues Leben für Ihre alte Ausrüstung',
  hero_description = 'Wir nehmen Ihre alte IT-Ausrüstung und geben ihr ein zweites Leben. Durch unsere verantwortungsvollen Recycling-Praktiken reduzieren wir Elektroschrott und machen Technologie für alle zugänglich.',
  features_json = '[
    {"title": "Verantwortungsvolle Entsorgung", "description": "Wir arbeiten nur mit zertifizierten Recycling-Partnern zusammen, die strenge Umweltstandards einhalten.", "icon": "Archive"},
    {"title": "Sichere Datenlöschung", "description": "Alle Geräte werden vor der Entsorgung oder dem Verkauf professionell von Daten befreit.", "icon": "Shield"},
    {"title": "Aufbereitung und Verkauf", "description": "Funktionsfähige Geräte werden aufbereitet und zu erschwinglichen Preisen verkauft.", "icon": "CheckCircle2"},
    {"title": "Abholservice", "description": "Für grössere Mengen bieten wir einen kostenlosen Abholservice in der Region Zürich an.", "icon": "Clock"}
  ]'::jsonb,
  pricing_base = 'Kostenlos',
  pricing_details = '["Kostenlose Annahme für die meisten Artikel", "Für grössere Mengen Abholservice verfügbar", "Spezielle Geräte: Bitte kontaktieren Sie uns"]'::jsonb
WHERE slug = 'hardware-recycling';

-- linux-open-source
UPDATE service_types SET
  icon_name = 'Server',
  hero_title = 'Linux & Open Source Lösungen',
  hero_subtitle = 'Experten Open Source Support',
  hero_description = 'Wir helfen Ihnen beim Übergang zu und der Wartung von Linux- und Open-Source-Software-Lösungen und bieten fachkundige Unterstützung und Schulung.',
  features_json = '[
    {"title": "Linux-Installation", "description": "Von Desktop-Umgebungen bis zu Server-Konfigurationen - wir installieren und konfigurieren Linux-Systeme für alle Anwendungsfälle.", "icon": "Server"},
    {"title": "Migration-Unterstützung", "description": "Hilfe beim Übergang von Windows zu Linux, einschliesslich Datenmigration und Software-Alternativen.", "icon": "FolderInput"},
    {"title": "Schulung und Support", "description": "Umfassende Schulung und laufender Support, um sicherzustellen, dass Sie das Beste aus Ihrem Linux-System herausholen.", "icon": "Clock"},
    {"title": "Open Source Software", "description": "Wir empfehlen und implementieren Open-Source-Alternativen zu proprietärer Software.", "icon": "Code"}
  ]'::jsonb,
  pricing_base = 'CHF 70/Stunde',
  pricing_details = '["Kostenlose Erstberatung", "Individuelle Linux-Distributionen", "Migrations-Unterstützung", "Laufender Support verfügbar"]'::jsonb
WHERE slug = 'linux-open-source';

-- web-design-development
UPDATE service_types SET
  icon_name = 'Globe',
  hero_title = 'Webdesign & Entwicklung',
  hero_subtitle = 'Moderne, nachhaltige Web-Lösungen',
  hero_description = 'Wir erstellen schnelle, schöne und funktionale Websites mit den neuesten Open-Source-Technologien. Von Landing Pages bis zu komplexen Webanwendungen liefern wir skalierbare Lösungen, die Performance und Nachhaltigkeit priorisieren.',
  features_json = '[
    {"title": "Moderner Stack", "description": "Next.js 14+, React 18, TypeScript, Tailwind CSS - wir verwenden modernste Technologien für optimale Performance.", "icon": "Code"},
    {"title": "Open Source CMS", "description": "Headless CMS-Lösungen mit Strapi, Payload oder TinaCMS für flexibles Content-Management.", "icon": "Database"},
    {"title": "Responsive Design", "description": "Mobile-first-Ansatz, der sicherstellt, dass Ihre Website auf allen Geräten grossartig aussieht.", "icon": "Palette"},
    {"title": "Laufender Support", "description": "Umfassende Wartung und Support, um Ihre Website sicher, aktuell und leistungsfähig zu halten.", "icon": "Shield"}
  ]'::jsonb,
  pricing_base = 'CHF 70/Stunde',
  pricing_details = '["Kostenlose Erstberatung", "Open-Source-Technologien", "Responsive Design inklusive", "SEO-Optimierung", "Laufender Support verfügbar"]'::jsonb
WHERE slug = 'web-design-development';

-- consultation (non-featured)
UPDATE service_types SET
  icon_name = 'Clock',
  hero_title = 'Beratung',
  hero_subtitle = 'Technische Expertise für Ihre Fragen',
  hero_description = 'Persönliche Beratung zu Linux, Open-Source oder Hardware-Themen.',
  features_json = '[
    {"title": "Individuelle Beratung", "description": "Persönliche Beratung zu Ihren spezifischen Fragen und Anforderungen.", "icon": "Clock"}
  ]'::jsonb
WHERE slug = 'consultation';

-- custom-build (non-featured)
UPDATE service_types SET
  icon_name = 'Wrench',
  hero_title = 'Massgeschneiderter PC',
  hero_subtitle = 'Ihr Traumcomputer, von Experten gebaut',
  hero_description = 'Wir bauen Ihren individuellen Computer nach Ihren Spezifikationen und Bedürfnissen.',
  features_json = '[
    {"title": "Individuelle Konfiguration", "description": "Wir beraten Sie bei der Auswahl der besten Komponenten für Ihre Bedürfnisse.", "icon": "Wrench"},
    {"title": "Professioneller Zusammenbau", "description": "Erfahrene Techniker bauen Ihren PC mit Sorgfalt und Präzision.", "icon": "HardDrive"}
  ]'::jsonb
WHERE slug = 'custom-build';

-- ============================================================================
-- 3. CREATE INDEXES FOR JSON FIELDS
-- ============================================================================

-- GIN indexes for JSONB columns (enables efficient querying)
CREATE INDEX IF NOT EXISTS idx_service_types_features_json ON service_types USING GIN (features_json);
CREATE INDEX IF NOT EXISTS idx_service_types_process_json ON service_types USING GIN (process_json);

-- ============================================================================
-- 4. COMMENTS
-- ============================================================================

COMMENT ON COLUMN service_types.icon_name IS 'Lucide icon component name (e.g., HardDrive, Server, Archive)';
COMMENT ON COLUMN service_types.hero_title IS 'Main title displayed on service detail page hero section';
COMMENT ON COLUMN service_types.hero_subtitle IS 'Subtitle/tagline for hero section';
COMMENT ON COLUMN service_types.hero_description IS 'Longer description for hero section';
COMMENT ON COLUMN service_types.features_json IS 'JSONB array of features: [{title, description, icon}]';
COMMENT ON COLUMN service_types.process_json IS 'JSONB array of process steps: [{step, title, description}]';
COMMENT ON COLUMN service_types.pricing_base IS 'Base pricing display text (e.g., "CHF 70/Stunde")';
COMMENT ON COLUMN service_types.pricing_details IS 'JSONB array of pricing detail strings';
COMMENT ON COLUMN service_types.pricing_media_prices IS 'JSONB array of media-specific prices (for data services)';

-- ============================================================================
-- SUMMARY:
-- After this migration, all presentation data is stored in the database.
-- The admin UI can now edit:
--   - Icon selection (from curated list)
--   - Hero section (title, subtitle, description)
--   - Features list (dynamic add/remove)
--   - Process steps (dynamic add/remove)
--   - Pricing display (base + details + media prices)
--
-- The code (presentation.ts) will serve as fallback for null DB values.
-- Category styling (colors, gradients) remains in code for visual consistency.
-- ============================================================================
