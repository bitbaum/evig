-- Migration 104: profile column cleanup (debt #5 phase 4)
--
-- Phase 4 of the profile audit found that the role-profile "contact" fields are
-- NOT mirror-duplicates of user_profiles — they hold legitimately-distinct
-- business data (seller storefront, repairer service location/contact via the
-- application flow, team HR phone). The only real cleanup is the dead/placeholder
-- columns; the broad "consolidate contact into user_profiles" idea was dropped.
--
-- 1. repairer_profiles.phone/address were NOT NULL, which forced self-service
--    community technicians (who never enter business contact) to store ''
--    placeholders. Make them nullable and normalize the '' placeholders to NULL.
ALTER TABLE repairer_profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE repairer_profiles ALTER COLUMN address DROP NOT NULL;
UPDATE repairer_profiles SET phone = NULL WHERE phone = '';
UPDATE repairer_profiles SET address = NULL WHERE address = '';

-- 2. seller_profiles.phone/address/postal_code are never written by any code path
--    (always NULL) — drop the dead columns. The seller form only collects
--    city/canton; storefront contact lives elsewhere.
ALTER TABLE seller_profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE seller_profiles DROP COLUMN IF EXISTS address;
ALTER TABLE seller_profiles DROP COLUMN IF EXISTS postal_code;
