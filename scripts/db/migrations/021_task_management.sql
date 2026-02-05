-- =============================================
-- TASK MANAGEMENT SYSTEM
--
-- Self-reporting task system with:
-- - Task types: one-time, recurring scheduled, recurring as-needed
-- - Self-reporting model (anyone can complete, track WHO/WHAT/WHEN)
-- - Attention & request system (including broadcast to ALL teammates)
-- - Projects for grouping related tasks
--
-- Created: 2026-02-05
-- =============================================

-- Projects table (for grouping related tasks)
CREATE TABLE IF NOT EXISTS task_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    target_date DATE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    task_type TEXT NOT NULL CHECK (task_type IN ('one_time', 'recurring_scheduled', 'recurring_as_needed')),
    schedule_cron TEXT,
    schedule_human TEXT,
    category TEXT NOT NULL CHECK (category IN ('cleaning', 'maintenance', 'admin', 'inventory', 'it', 'kitchen', 'workshop', 'logistics', 'other')),
    tags TEXT[] DEFAULT '{}',
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    estimated_minutes INTEGER,
    current_status TEXT NOT NULL DEFAULT 'idle' CHECK (current_status IN ('idle', 'needs_attention', 'requested', 'in_progress')),
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id),
    project_id UUID REFERENCES task_projects(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task completions (history of who completed what and when)
CREATE TABLE IF NOT EXISTS task_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    completed_by UUID NOT NULL REFERENCES users(id),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attention flags (when a task needs urgent attention)
CREATE TABLE IF NOT EXISTS task_attention_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    flagged_by UUID NOT NULL REFERENCES users(id),
    message TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by_completion_id UUID REFERENCES task_completions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task requests (request specific user OR broadcast when requested_user_id IS NULL)
CREATE TABLE IF NOT EXISTS task_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    requested_user_id UUID REFERENCES users(id),  -- NULL = broadcast to all
    is_broadcast BOOLEAN GENERATED ALWAYS AS (requested_user_id IS NULL) STORED,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
    response_message TEXT,
    completion_id UUID REFERENCES task_completions(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger function to reset task on completion
CREATE OR REPLACE FUNCTION reset_task_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Reset recurring tasks to idle
    UPDATE tasks
    SET current_status = 'idle',
        updated_at = NOW()
    WHERE id = NEW.task_id
    AND task_type != 'one_time';

    -- Mark one-time tasks as completed
    UPDATE tasks
    SET is_completed = true,
        completed_at = NEW.completed_at,
        completed_by = NEW.completed_by,
        current_status = 'idle',
        updated_at = NOW()
    WHERE id = NEW.task_id
    AND task_type = 'one_time';

    -- Resolve attention flags
    UPDATE task_attention_flags
    SET is_resolved = true,
        resolved_by = NEW.completed_by,
        resolved_at = NEW.completed_at,
        resolved_by_completion_id = NEW.id
    WHERE task_id = NEW.task_id
    AND is_resolved = false;

    -- Complete pending requests
    UPDATE task_requests
    SET status = 'completed',
        completion_id = NEW.id,
        updated_at = NOW()
    WHERE task_id = NEW.task_id
    AND status IN ('pending', 'accepted');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS task_completion_trigger ON task_completions;
CREATE TRIGGER task_completion_trigger
AFTER INSERT ON task_completions
FOR EACH ROW
EXECUTE FUNCTION reset_task_on_completion();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(current_status) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type) WHERE NOT is_archived;
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(completed_by);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_requests_user ON task_requests(requested_user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_task_requests_broadcast ON task_requests(is_broadcast) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_task_attention_flags_task ON task_attention_flags(task_id) WHERE NOT is_resolved;

-- Add notification types for tasks (extend existing CHECK constraint)
DO $$
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

    -- Add new constraint with task notification types
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type IN (
        -- Original types (adjust based on existing values)
        'message',
        'appointment',
        'workshop',
        'review',
        'system',
        'marketing',
        -- Task management types
        'task_attention',
        'task_request',
        'task_completed',
        'task_broadcast'
      ));
EXCEPTION
    WHEN undefined_table THEN
        -- notifications table doesn't exist yet, skip
        NULL;
    WHEN undefined_column THEN
        -- type column doesn't exist, skip
        NULL;
END $$;

-- Comments for documentation
COMMENT ON TABLE tasks IS 'Self-reporting task management system';
COMMENT ON TABLE task_completions IS 'History of task completions (who/what/when)';
COMMENT ON TABLE task_attention_flags IS 'Flags for tasks needing urgent attention';
COMMENT ON TABLE task_requests IS 'Requests to specific users or broadcasts to all team';
COMMENT ON TABLE task_projects IS 'Projects for grouping related tasks';
COMMENT ON COLUMN task_requests.requested_user_id IS 'NULL means broadcast to all staff';
COMMENT ON COLUMN task_requests.is_broadcast IS 'Auto-computed: true when requested_user_id is NULL';
