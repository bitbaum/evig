-- Migration 134: connect tasks + protocols to teams (team space)
--
-- The team page (/admin/teams/[slug]) becomes a working space: a team's open
-- tasks and its meeting protocols show up there. Both links are OPTIONAL —
-- org-wide tasks/protocols keep team_id NULL, nothing existing changes.
-- ON DELETE SET NULL: deleting a team never deletes its work records.

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team_id);

ALTER TABLE meeting_protocols
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_protocols_team ON meeting_protocols(team_id);
