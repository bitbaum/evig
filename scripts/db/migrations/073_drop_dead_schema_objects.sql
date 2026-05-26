-- Migration 073: Drop schema objects already removed at the TypeScript layer
--
-- Two distinct removals batched into one migration because they're
-- both pure-deletion + were verified non-consumer in prior commits:
--
-- 1. helper_profiles table + helper_profiles_v view (TS removed 2efa25e2).
--    Phase 2 migration 061 unified helper_profiles into repairer_profiles
--    (profile_tier='community'). The Drizzle definition was kept as a
--    deprecated stub "so existing Drizzle migrations compile" — but
--    Drizzle migrations are SQL files that don't reference the TS
--    schema, so the justification didn't hold. Removed at the TS layer
--    in 2efa25e2 after grep verification (only 7 self-references in
--    comments + the schema file itself; no production code, no API
--    routes, no tests imported the symbol).
--
-- 2. Five Medusa integration columns (TS removed 15e443fb). Medusa was
--    an e-commerce framework integration that never fully shipped; the
--    columns sat unused. Removed at the TS layer in 15e443fb after
--    grep verified zero consumers.
--
-- All TS-layer removals already shipped without DB drops because:
--   - Removing the Drizzle declaration doesn't generate a DROP COLUMN.
--   - The columns/tables stayed in the DB as historical preservation.
-- This migration finishes the cleanup at the DB layer. After it runs,
-- the schema is fully consistent with the TS code.

-- ============================================================================
-- helper_profiles (and its read-only view)
-- ============================================================================

DROP VIEW IF EXISTS helper_profiles_v;
DROP TABLE IF EXISTS helper_profiles;

-- ============================================================================
-- Medusa columns
-- ============================================================================

-- ai_extracted_products
ALTER TABLE ai_extracted_products
  DROP COLUMN IF EXISTS medusa_product_id;

-- inventory_items
ALTER TABLE inventory_items
  DROP COLUMN IF EXISTS medusa_product_id,
  DROP COLUMN IF EXISTS medusa_variant_id;

-- orders
ALTER TABLE orders
  DROP COLUMN IF EXISTS medusa_order_id,
  DROP COLUMN IF EXISTS medusa_cart_id;

-- order_items
ALTER TABLE order_items
  DROP COLUMN IF EXISTS medusa_variant_id;
