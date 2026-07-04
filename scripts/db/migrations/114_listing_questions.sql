-- Migration: 114_listing_questions
-- Description: Public Q&A on marketplace listings (Ricardo-style)

CREATE TABLE IF NOT EXISTS listing_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  asker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL CHECK (char_length(question) >= 5 AND char_length(question) <= 500),
  answer TEXT CHECK (answer IS NULL OR char_length(answer) <= 2000),
  answered_at TIMESTAMPTZ,
  answered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_questions_listing
  ON listing_questions (listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_questions_asker
  ON listing_questions (asker_id);

CREATE INDEX IF NOT EXISTS idx_listing_questions_status
  ON listing_questions (listing_id, status);
