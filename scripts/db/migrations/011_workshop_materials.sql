-- Migration: Workshop Materials System
-- Description: Adds support for workshop materials (PDFs, documents, links) that can be shared with participants

-- Workshop Materials Table
CREATE TABLE IF NOT EXISTS workshop_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  instance_id UUID REFERENCES workshop_instances(id) ON DELETE SET NULL, -- NULL = available for all instances
  title VARCHAR(200) NOT NULL,
  description TEXT,
  material_type VARCHAR(50) NOT NULL, -- 'pdf', 'document', 'link', 'video', 'archive'
  url TEXT NOT NULL, -- Can be external URL or internal upload path
  file_size_bytes INTEGER, -- For uploaded files
  access_type VARCHAR(20) DEFAULT 'registered', -- 'public', 'registered', 'attended'
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workshop_materials_workshop ON workshop_materials(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_materials_instance ON workshop_materials(instance_id);
CREATE INDEX IF NOT EXISTS idx_workshop_materials_active ON workshop_materials(is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE workshop_materials IS 'Materials (PDFs, documents, links) for workshops';
COMMENT ON COLUMN workshop_materials.material_type IS 'Type of material: pdf, document, link, video, archive';
COMMENT ON COLUMN workshop_materials.access_type IS 'Who can access: public (everyone), registered (registered participants), attended (only those who attended)';
COMMENT ON COLUMN workshop_materials.instance_id IS 'NULL means available for all instances of this workshop';
