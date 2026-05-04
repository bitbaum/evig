-- Migration 066: Anonymous public voting for decisions
--
-- Allows decisions to be shared publicly so anyone can vote via a link
-- without needing a registered account. Identity is established by email only.
--
-- Changes:
--   decisions.allow_public_voting  — when true, anyone with the link can vote
--   decision_votes.user_id         — nullable (NULL for anonymous voters)
--   decision_votes.voter_email     — email of anonymous voter (NULL for registered)
--
-- Dedup: registered voters stay unique by (decision_id, user_id);
--        anonymous voters unique by (decision_id, voter_email).

-- 1. Add public voting flag to decisions
ALTER TABLE decisions
  ADD COLUMN IF NOT EXISTS allow_public_voting BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Make user_id nullable (for anonymous votes)
ALTER TABLE decision_votes
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Add voter_email for anonymous identity
ALTER TABLE decision_votes
  ADD COLUMN IF NOT EXISTS voter_email TEXT;

-- 4. Constraint: every vote must have either user_id or voter_email
ALTER TABLE decision_votes
  ADD CONSTRAINT decision_votes_voter_identity_check
  CHECK (user_id IS NOT NULL OR voter_email IS NOT NULL);

-- 5. Replace the old unique index with two partial indexes
--    (partial indexes can't be expressed as a single unique constraint)
DROP INDEX IF EXISTS decision_votes_decision_id_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS decision_votes_decision_id_user_unique
  ON decision_votes (decision_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS decision_votes_decision_id_email_unique
  ON decision_votes (decision_id, voter_email)
  WHERE voter_email IS NOT NULL;
