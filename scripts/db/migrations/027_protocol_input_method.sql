-- Migration 027: Add input_method column to meeting_protocols
-- Pipeline entry point: audio, transcript, notes, tasks

ALTER TABLE meeting_protocols
  ADD COLUMN IF NOT EXISTS input_method TEXT DEFAULT 'transcript'
  CHECK (input_method IN ('audio', 'transcript', 'notes', 'tasks'));

COMMENT ON COLUMN meeting_protocols.input_method
  IS 'Pipeline entry point: audio, transcript, notes, tasks';
