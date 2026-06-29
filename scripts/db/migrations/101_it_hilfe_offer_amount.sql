-- Migration 101: structured compensation on IT-Hilfe offers
--
-- proposed_compensation is a free-text varchar (e.g. "CHF 40", "gratis", "nach
-- Absprache") — unqueryable and unverifiable. Add a structured amount in cents
-- so the agreed compensation (the accepted offer's amount) is recorded as data,
-- not prose. The free-text field stays for optional context. (Money may still
-- settle off-platform for the solidarity model — this just records the figure.)
ALTER TABLE it_hilfe_offers ADD COLUMN IF NOT EXISTS proposed_amount_cents integer;
