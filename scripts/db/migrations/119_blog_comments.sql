-- Migration 119: blog comments
--
-- Any logged-in user can comment on a blog post. Comments are keyed by the post
-- SLUG (not a blog_posts.id) so they work for both DB-authored and git/file
-- posts, and survive a post moving between the two stores. Visible immediately;
-- admins (or the author) can delete. `status` is validated at the app layer
-- (config + zod), not a SQL CHECK, per the migration-110 policy.

CREATE TABLE IF NOT EXISTS blog_comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug   text        NOT NULL,
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        text        NOT NULL,
  status      text        NOT NULL DEFAULT 'visible',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_comments_post_slug_idx ON blog_comments (post_slug, created_at);
CREATE INDEX IF NOT EXISTS blog_comments_user_id_idx  ON blog_comments (user_id);
