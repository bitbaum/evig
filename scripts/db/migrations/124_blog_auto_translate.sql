-- Migration 124: auto-translate-on-publish for DB blog posts
--
-- Builds on 123 (blog_post_translations). Two additions:
--
-- 1. blog_posts.auto_translate — per-post opt-in (default TRUE). When a post is
--    published with this on, the missing locales are filled in the background
--    from the German base (fire-and-forget, like syncToKivvi). Missing-only, so
--    a hand-written/edited translation is never overwritten.
-- 2. blog_post_translations.is_machine — marks a row as machine-generated, so
--    the editor can badge it and the public page can show an "automatisch
--    übersetzt" note. Cleared when a human edits that locale in the editor.

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS auto_translate boolean NOT NULL DEFAULT true;

ALTER TABLE blog_post_translations
  ADD COLUMN IF NOT EXISTS is_machine boolean NOT NULL DEFAULT false;
