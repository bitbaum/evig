-- Migration 123: per-locale translations for DB-authored blog posts
--
-- File posts (content/posts/*.md) already carry translations via sibling files
-- (`<slug>.en.md`, `<slug>.fr.md`, …), but DB posts created in the admin UI were
-- single-locale. This closes the last gap in "admins manage posts without git":
-- a translation of a DB post can now be written entirely in the editor.
--
-- Model: blog_posts holds the CANONICAL German content (title/excerpt/content/
-- seo) plus every locale-INDEPENDENT field (slug, featured_image, category,
-- tags, visibility, publish state, dates). This table overlays the per-locale
-- text for non-German locales. A reader for locale X overlays the matching row;
-- with none, it falls back to the German base — mirroring the site-wide DE
-- fallback used for file posts.
--
-- `locale` is validated at the app layer against src/i18n/routing `locales`
-- (zod at the write boundary) — no SQL CHECK, per the migration-110 policy of
-- keeping app-level enums out of hand-synced DB constraints.

CREATE TABLE IF NOT EXISTS blog_post_translations (
  post_id          uuid        NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  locale           text        NOT NULL,
  title            text        NOT NULL,
  excerpt          text,
  content          text        NOT NULL,
  seo_title        text,
  seo_description  text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_blog_post_translations_post ON blog_post_translations(post_id);
