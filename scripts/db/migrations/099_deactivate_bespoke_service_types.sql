-- Migration 099: Deactivate bespoke service_types (rendered by static pages, not the DB template route)
--
-- hardware-recycling, linux-open-source and web-design-development are presented
-- by bespoke static pages under src/app/[locale]/services/*. Their service_types
-- rows (seeded by migration 017) were dead duplicates: the static folders shadow
-- the dynamic [service] route, so the DB-driven detail page never rendered, yet
-- getAllServiceSlugs() still generated shadowed routes for them and editing the
-- rows changed nothing visible (a content trap).
--
-- Soft-deactivate (is_active=false) rather than DELETE — service_appointments
-- references service_types with ON DELETE CASCADE, so deleting would destroy any
-- historical appointments. Deactivation drops them from getAllServiceSlugsFromDb
-- (which filters is_active=true), is reversible, and preserves all history.
-- getAdminServices() still returns inactive rows, so they remain visible/restorable
-- in admin.

UPDATE service_types
SET is_active = false,
    is_bookable = false,
    updated_at = now()
WHERE slug IN ('hardware-recycling', 'linux-open-source', 'web-design-development');
