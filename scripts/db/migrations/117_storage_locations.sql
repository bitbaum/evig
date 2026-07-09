-- Migration 117: structured storage locations for inventory
--
-- Replaces the free-text inventory_items.location with a runtime-addable list of
-- physical storage locations (staff pick one when erfassing a product, and can
-- add new ones from the picker). The old free-text `location` column is KEPT for
-- backfill/compat — new entries write storage_location_id.
--
-- Distinct from the public `locations` table (workshop/service venues). `kind`
-- is validated at the app layer (STORAGE_LOCATION_KINDS) — no SQL CHECK, per the
-- migration-110 policy (app enums live in config + zod, not DB constraints).

CREATE TABLE IF NOT EXISTS storage_locations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  kind            text NOT NULL DEFAULT 'other',
  holder_user_id  uuid REFERENCES users(id) ON DELETE SET NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storage_locations_active ON storage_locations (is_active);
CREATE INDEX IF NOT EXISTS idx_storage_locations_kind ON storage_locations (kind);

-- Seed the standard locations (idempotent on name).
INSERT INTO storage_locations (name, kind)
SELECT v.name, v.kind
FROM (VALUES
  ('Hauptlager', 'main_storage'),
  ('Laden', 'shop'),
  ('Nebenlager', 'secondary_storage')
) AS v(name, kind)
WHERE NOT EXISTS (SELECT 1 FROM storage_locations sl WHERE sl.name = v.name);

-- Link inventory items to a storage location (nullable; free-text `location` stays).
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS storage_location_id uuid REFERENCES storage_locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_storage_location
  ON inventory_items (storage_location_id);
