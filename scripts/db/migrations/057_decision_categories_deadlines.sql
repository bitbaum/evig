-- 057: Add category column to decisions (Verein governance)
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'operativ';
