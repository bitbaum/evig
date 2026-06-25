-- Migration: 035_org_numbers
-- Creates org_numbers table for shared organizational metrics (SSOT)
-- Both revampit and revamp-info share this table via the same Postgres DB

CREATE TABLE IF NOT EXISTS org_numbers (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  numeric_value NUMERIC,
  label TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('impact', 'social', 'economic', 'operations')),
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'estimated', 'target')),
  methodology TEXT,
  calculation TEXT,
  source_document TEXT,
  external_link TEXT,
  last_verified DATE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for category-based queries
CREATE INDEX IF NOT EXISTS idx_org_numbers_category ON org_numbers(category);
