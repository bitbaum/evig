-- Migration 111: drop the dead Medusa customer-link table
--
-- Final grep (2026-07-03): medusa_customer_links is only present in the
-- original 001 migration. The application no longer has Medusa integration
-- code or schema references for it.
--
-- The similarly named `services` table is intentionally NOT dropped: it still
-- backs /api/services, /api/admin/services and the service presentation layer.

DROP TABLE IF EXISTS medusa_customer_links;
