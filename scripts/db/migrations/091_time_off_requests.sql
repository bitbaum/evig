-- ============================================================================
-- 091_time_off_requests.sql
--
-- Self-service time-off requests with an approval cycle. A staff member
-- requests future leave (vacation, unpaid, military, …); an approver
-- (super admin or staff with the `timecards` permission) approves or
-- rejects it. Distinct from `timecard_entries` (which log actual worked /
-- absent days) and from `leave_periods` (HR's authoritative leave record) —
-- an approved request can be materialised into a leave_period.
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_off_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('ferien', 'unbezahlt', 'militaer', 'unfall', 'other')),
  starts_on     DATE NOT NULL,
  ends_on       DATE NOT NULL,
  half_day      BOOLEAN NOT NULL DEFAULT false,
  note          TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at   TIMESTAMPTZ,
  review_notes  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT time_off_requests_range_ck CHECK (ends_on >= starts_on)
);

CREATE INDEX IF NOT EXISTS idx_time_off_requests_user   ON time_off_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_period ON time_off_requests(starts_on, ends_on);
