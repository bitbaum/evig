-- Migration 120: make every blog post admin-manageable
--
-- Two additions so staff can edit/delete ANY post from the admin UI (including
-- the git/file-authored ones) without touching git:
--
-- 1. blog_posts.visibility — so DB-authored posts can be public or unlisted
--    (matches the file frontmatter `visibility`). Validated at the app layer.
-- 2. blog_hidden_slugs — a suppression list. "Deleting" a git/file post can't
--    remove the markdown at runtime, so instead its slug is hidden here and the
--    public readers skip it (the file stays in the repo as a harmless fallback).
--    Editing a file post imports it into blog_posts (DB wins on slug); this table
--    is only for the delete case.

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public';

CREATE TABLE IF NOT EXISTS blog_hidden_slugs (
  slug        text        PRIMARY KEY,
  hidden_by   uuid        REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
