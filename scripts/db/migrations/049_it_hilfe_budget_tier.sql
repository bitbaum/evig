-- Migration 049: Add budget_tier column to IT-Hilfe requests
-- Stores the solidarity pricing tier (gratis, kulturlegi, normal, supporter)

ALTER TABLE it_hilfe_requests ADD COLUMN IF NOT EXISTS budget_tier VARCHAR(20);
