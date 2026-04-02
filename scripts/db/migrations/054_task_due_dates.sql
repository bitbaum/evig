-- Add due_date column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
