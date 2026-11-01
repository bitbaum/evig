-- Admin access is no longer "you have a Revamp address".
-- A signed-in person asks from Einstellungen; an existing admin confirms.
-- One open request per user. grant_level is filled when someone confirms.

CREATE TABLE IF NOT EXISTS admin_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  grant_level TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admin_access_requests_status_valid CHECK (status IN ('pending', 'approved', 'rejected')),
  CONSTRAINT admin_access_requests_level_valid CHECK (grant_level IS NULL OR grant_level IN ('staff', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_admin_access_requests_user ON admin_access_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_requests_status ON admin_access_requests (status);

CREATE UNIQUE INDEX IF NOT EXISTS admin_access_requests_one_pending
  ON admin_access_requests (user_id)
  WHERE status = 'pending';
