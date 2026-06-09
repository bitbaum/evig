-- Migration 088: Add i18n JSONB columns to workshops + project_needs
--
-- Problem: workshop.title / workshop.description / project_needs.title /
-- project_needs.description are TEXT columns holding GERMAN-ONLY content.
-- Non-DE visitors see German prose mixed with the otherwise-translated
-- site chrome — credibility-damaging for a multilingual product.
--
-- Solution (chosen for KISS + zero-rewrite of existing reads):
--   - Keep the canonical TEXT column as the DE source.
--   - Add a sibling JSONB column `<field>_i18n` of shape
--     { "en": "…", "fr": "…", "es": "…", "it": "…", "ja": "…", "ko": "…", "ru": "…" }
--   - A frontend helper `pickI18n(canonical, jsonb, locale)` returns the
--     localised string (or falls back to canonical when key is missing).
--
-- Why JSONB and not a translations table?
--   1. Small number of rows × small number of locales → no scale issue.
--   2. Single SELECT keeps fetch helpers simple — no JOINs in workshop list,
--      no N+1 in project_needs.
--   3. Drizzle has first-class JSONB support; admin UI work is trivial.
--   4. If we ever grow to many entities + many languages, splitting to a
--      <table>_translations side table is a mechanical refactor.
--
-- Backfill: leaving the JSONB columns NULL post-migration is fine — the
-- helper falls back to the canonical TEXT column (DE) until translations
-- arrive. Translations land via a separate seed commit per entity.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS. Safe to re-run.

-- ----------------------------------------------------------------------
-- workshops
-- ----------------------------------------------------------------------

ALTER TABLE workshops
  ADD COLUMN IF NOT EXISTS title_i18n             JSONB,
  ADD COLUMN IF NOT EXISTS description_i18n       JSONB,
  ADD COLUMN IF NOT EXISTS short_description_i18n JSONB,
  ADD COLUMN IF NOT EXISTS duration_i18n          JSONB,
  ADD COLUMN IF NOT EXISTS level_i18n             JSONB,
  ADD COLUMN IF NOT EXISTS category_i18n          JSONB;

COMMENT ON COLUMN workshops.title_i18n IS
  'Locale → translated string (e.g. {"en":"Linux Workshop","fr":"Atelier Linux"}). Falls back to title (DE) if locale absent.';
COMMENT ON COLUMN workshops.description_i18n IS
  'Locale → translated description. Falls back to description (DE) if locale absent.';
COMMENT ON COLUMN workshops.duration_i18n IS
  'Locale → translated free-form duration ("2 Tage" → "2 days"). Falls back to duration column.';

-- ----------------------------------------------------------------------
-- project_needs
-- ----------------------------------------------------------------------

ALTER TABLE project_needs
  ADD COLUMN IF NOT EXISTS title_i18n       JSONB,
  ADD COLUMN IF NOT EXISTS description_i18n JSONB,
  ADD COLUMN IF NOT EXISTS target_unit_i18n JSONB;

COMMENT ON COLUMN project_needs.title_i18n IS
  'Locale → translated title (e.g. {"en":"CE conformity engineer","fr":"Ingénieur·e conformité CE"}). Fallback to title (DE).';
COMMENT ON COLUMN project_needs.description_i18n IS
  'Locale → translated description. Fallback to description (DE).';
COMMENT ON COLUMN project_needs.target_unit_i18n IS
  'Locale → translated unit suffix ("70 Monitor" → "70 monitors"). Fallback to target_unit.';
