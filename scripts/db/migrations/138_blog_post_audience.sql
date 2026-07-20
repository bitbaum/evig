-- Migration 138: audience access-control axis for blog posts.
-- ORTHOGONAL to blog_posts.visibility (public|unlisted|link = discoverability).
-- audience controls WHO may load the post at all:
--   public — anyone (default; every existing post)
--   team   — logged-in staff only (session.user.isStaff)
--   author — the author (created_by) + super admins only
-- App-validated (zod + src/config/blog.ts BLOG_AUDIENCE), no SQL CHECK
-- (migration-110 policy — hand-synced CHECK lists drift).
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'public';
