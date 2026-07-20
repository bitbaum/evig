-- Public share tokens for the Monatsrapport.
--
-- A report is addressed by (user_id, month) — a running month may have no
-- timecard row yet, so the token cannot live on `timecards`; it gets its own
-- table. The token is an unguessable bearer capability (like deliverables'
-- share_token); revoked_at lets an approver kill a link that was shared too
-- widely. No enums, no CHECK constraints (per CLAUDE.md §DB).

CREATE TABLE IF NOT EXISTS report_shares (
  token       text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month       text NOT NULL,                       -- YYYY-MM
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- One (active or revoked) row per report — ensureReportShareToken revives it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_report_shares_user_month
  ON report_shares (user_id, month);
