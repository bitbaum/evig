-- Presentation slide comments
-- Readers of a shared presentation deck (signed in OR anonymous) can leave
-- feedback on a specific slide. Staff collect it in /admin/presentations/feedback
-- and paste it to the AI to fix the slides. Anonymous comments are allowed
-- (author_user_id NULL, optional author_name); signed-in comments attach the
-- user server-side.

CREATE TABLE IF NOT EXISTS presentation_comments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_slug      TEXT NOT NULL,
  slide_index    INTEGER NOT NULL,
  slide_title    TEXT,
  body           TEXT NOT NULL,
  author_name    TEXT,
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_staff       BOOLEAN NOT NULL DEFAULT FALSE,
  resolved       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS presentation_comments_deck_idx
  ON presentation_comments (deck_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS presentation_comments_unresolved_idx
  ON presentation_comments (resolved, created_at DESC);
