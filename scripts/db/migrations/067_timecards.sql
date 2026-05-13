-- Migration 067: Timecards
-- Adds staff timecard periods plus entries with optional links to tasks/protocols.

CREATE TABLE IF NOT EXISTS timecards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL DEFAULT 'week',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT timecards_period_type_check CHECK (period_type IN ('week', 'month')),
  CONSTRAINT timecards_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  CONSTRAINT timecards_period_order_check CHECK (period_end >= period_start),
  CONSTRAINT timecards_user_period_key UNIQUE (user_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_timecards_user ON timecards(user_id);
CREATE INDEX IF NOT EXISTS idx_timecards_status ON timecards(status);
CREATE INDEX IF NOT EXISTS idx_timecards_period ON timecards(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_timecards_reviewed_by ON timecards(reviewed_by);

CREATE TABLE IF NOT EXISTS timecard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timecard_id UUID NOT NULL REFERENCES timecards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  protocol_id UUID REFERENCES meeting_protocols(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT timecard_entries_break_minutes_check CHECK (break_minutes >= 0 AND break_minutes <= 1440),
  CONSTRAINT timecard_entries_duration_minutes_check CHECK (duration_minutes > 0 AND duration_minutes <= 960),
  CONSTRAINT timecard_entries_category_check CHECK (
    category IN ('workshop', 'repair', 'intake', 'sales', 'admin', 'education', 'logistics', 'meeting', 'volunteering', 'other')
  ),
  CONSTRAINT timecard_entries_source_check CHECK (
    source IN ('manual', 'ai_assisted', 'template', 'task_completion')
  )
);

CREATE INDEX IF NOT EXISTS idx_timecard_entries_timecard ON timecard_entries(timecard_id);
CREATE INDEX IF NOT EXISTS idx_timecard_entries_user_date ON timecard_entries(user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_timecard_entries_category ON timecard_entries(category);
CREATE INDEX IF NOT EXISTS idx_timecard_entries_task ON timecard_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_timecard_entries_protocol ON timecard_entries(protocol_id);
