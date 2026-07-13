-- Site feedback / suggestions
-- The floating "Vorschlag / Feedback" widget on public pages (SuggestionButton)
-- previously POSTed to /api/suggestions which only sent a fire-and-forget email.
-- With prod email deliverability unreliable, submissions could be lost silently.
-- This table makes persistence the reliable channel; email + in-app notification
-- are best-effort on top.

CREATE TABLE IF NOT EXISTS site_suggestions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion        TEXT NOT NULL,
  contact           TEXT,
  page              TEXT,
  url               TEXT,
  page_title        TEXT,
  page_section      TEXT,
  scope             TEXT,
  selected_elements JSONB,
  author_user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_suggestions_unresolved_idx
  ON site_suggestions (resolved, created_at DESC);
