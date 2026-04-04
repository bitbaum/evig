-- Migration 056: Add assigned_to column to tasks
-- Allows assigning tasks to specific team members

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks (assigned_to) WHERE assigned_to IS NOT NULL;
