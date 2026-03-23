-- Migration 051: Connect IT-Hilfe offers to Repairer profiles
-- Phase 1 of unifying IT-Hilfe and Repairers systems.
-- Adds a soft reference from it_hilfe_offers to repairer_profiles so
-- offers made by registered repairers are visibly linked.

-- Add repairer_profile_id to it_hilfe_offers
ALTER TABLE it_hilfe_offers
  ADD COLUMN IF NOT EXISTS repairer_profile_id UUID
    REFERENCES repairer_profiles(id) ON DELETE SET NULL;

-- Index for efficient lookups (find offers by repairer, or check if repairer has offered)
CREATE INDEX IF NOT EXISTS idx_it_hilfe_offers_repairer_profile
  ON it_hilfe_offers(repairer_profile_id)
  WHERE repairer_profile_id IS NOT NULL;

-- Backfill: Link existing offers to repairer profiles where the helper has one
UPDATE it_hilfe_offers o
SET repairer_profile_id = rp.id
FROM repairer_profiles rp
WHERE o.helper_id = rp.user_id
  AND o.repairer_profile_id IS NULL
  AND rp.is_active = true;
