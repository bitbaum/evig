-- 141: users.orangecat_actor_id — "Sign in with OrangeCat" (orangecat ADR-0009, D8).
--
-- OrangeCat is the fleet's identity root. Its id_token `sub` is the person's
-- OrangeCat actor id, the ONLY key that identifies one person across products;
-- email never is (two accounts may share one, and OrangeCat's own password
-- sign-up does not verify it). An evig account becomes an OrangeCat account by
-- carrying that id: set on first OrangeCat sign-in for a new person, or by an
-- explicit "Connect OrangeCat" from a signed-in existing account. Unique, so
-- one OrangeCat identity can never open two evig accounts.
--
-- Staff is untouched: is_staff stays the sole grant, never the sign-in method.
ALTER TABLE users ADD COLUMN IF NOT EXISTS orangecat_actor_id UUID;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_orangecat_actor_id
  ON users (orangecat_actor_id) WHERE orangecat_actor_id IS NOT NULL;
