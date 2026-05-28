-- Migration 080: Compensation, employment lifecycle, leave management
--
-- Phase 4 of the team + timecards rebuild. Adds the data model the
-- audit identified as missing for "the platform can actually run
-- payroll" — hourly_rate / salary with effective-dated history, end
-- date + exit reason, Swiss-employment fields (AHV / canton), an
-- explicit work_state machine, and a leave_periods table for vacation
-- / sick / parental tracking. Payroll_batches scaffolds Phase 5's
-- accountant-export.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS
-- / DO-block CHECK-constraint-by-name guard. Safe to re-run.

-- ----------------------------------------------------------------------
-- team_profiles: compensation + lifecycle + work-state columns
-- ----------------------------------------------------------------------

ALTER TABLE team_profiles ADD COLUMN IF NOT EXISTS hourly_rate_cents INTEGER;
ALTER TABLE team_profiles ADD COLUMN IF NOT EXISTS salary_chf NUMERIC(10, 2);
ALTER TABLE team_profiles ADD COLUMN IF NOT EXISTS salary_effective_date DATE;
ALTER TABLE team_profiles ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE team_profiles ADD COLUMN IF NOT EXISTS exit_reason TEXT;
ALTER TABLE team_profiles ADD COLUMN IF NOT EXISTS ahv_number TEXT;
ALTER TABLE team_profiles ADD COLUMN IF NOT EXISTS canton_tax_code TEXT;

-- work_state: explicit machine with CHECK constraint. Defaults to
-- 'active' so the rollout doesn't break existing rows. 'on_leave' is
-- set manually by HR; a future migration could auto-derive it from
-- an active leave_periods row, but explicit beats clever here.
ALTER TABLE team_profiles
  ADD COLUMN IF NOT EXISTS work_state TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'team_profiles_work_state_valid'
      AND conrelid = 'team_profiles'::regclass
  ) THEN
    ALTER TABLE team_profiles
      ADD CONSTRAINT team_profiles_work_state_valid
      CHECK (work_state IN ('active', 'on_leave', 'unavailable', 'inactive'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_team_profiles_work_state ON team_profiles(work_state);
CREATE INDEX IF NOT EXISTS idx_team_profiles_end_date ON team_profiles(end_date) WHERE end_date IS NOT NULL;

-- ----------------------------------------------------------------------
-- compensation_history: rate-change audit trail
--
-- Every salary or hourly_rate change appends a row here with an
-- effective_date. The current value on team_profiles is a
-- convenience denormalization; this table is the source of truth for
-- "what did Maria's rate look like in April?" — the question payroll
-- has to answer.
--
-- ON DELETE RESTRICT on team_profile_id: deleting a profile must
-- fail loudly if compensation history exists. Same audit-immutability
-- principle as payment_transactions (migration 077).
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compensation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_profile_id UUID NOT NULL REFERENCES team_profiles(id) ON DELETE RESTRICT,
  hourly_rate_cents INTEGER,
  salary_chf NUMERIC(10, 2),
  effective_date DATE NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compensation_history_profile
  ON compensation_history(team_profile_id, effective_date DESC);

-- At least one of the two pay fields must be set per row — otherwise
-- the change is unparseable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'compensation_history_at_least_one_amount'
      AND conrelid = 'compensation_history'::regclass
  ) THEN
    ALTER TABLE compensation_history
      ADD CONSTRAINT compensation_history_at_least_one_amount
      CHECK (hourly_rate_cents IS NOT NULL OR salary_chf IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'compensation_history_amounts_non_negative'
      AND conrelid = 'compensation_history'::regclass
  ) THEN
    ALTER TABLE compensation_history
      ADD CONSTRAINT compensation_history_amounts_non_negative
      CHECK (
        (hourly_rate_cents IS NULL OR hourly_rate_cents >= 0) AND
        (salary_chf IS NULL OR salary_chf >= 0)
      );
  END IF;
END
$$;

-- ----------------------------------------------------------------------
-- leave_periods: vacation / sick / parental / unpaid / other
--
-- A team member can have many leave periods over time. The data this
-- replaces is `team_profiles.availability` (free-form text like "auf
-- Urlaub bis 19. Mai"), which HR couldn't filter or sum.
--
-- ON DELETE CASCADE on team_profile_id: leave records are profile-
-- scoped, not org-scoped — if a profile is deleted (which RESTRICT
-- now blocks if compensation_history exists, but is otherwise
-- permitted), the leave records die with it.
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_profile_id UUID NOT NULL REFERENCES team_profiles(id) ON DELETE CASCADE,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  kind TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leave_periods_kind_valid'
      AND conrelid = 'leave_periods'::regclass
  ) THEN
    ALTER TABLE leave_periods
      ADD CONSTRAINT leave_periods_kind_valid
      CHECK (kind IN ('vacation', 'sick', 'parental', 'unpaid', 'military', 'other'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leave_periods_dates_ordered'
      AND conrelid = 'leave_periods'::regclass
  ) THEN
    ALTER TABLE leave_periods
      ADD CONSTRAINT leave_periods_dates_ordered
      CHECK (ends_on >= starts_on);
  END IF;
END
$$;

-- Composite index for "is X on leave today?" queries: (profile_id, ends_on, starts_on)
-- The query pattern is WHERE team_profile_id = X AND ends_on >= today AND starts_on <= today.
CREATE INDEX IF NOT EXISTS idx_leave_periods_profile_active
  ON leave_periods(team_profile_id, starts_on, ends_on);

-- ----------------------------------------------------------------------
-- payroll_batches: monthly Lohnlauf abschliessen + export tracking
--
-- Phase 5 will wire UI on top of this. The table is added now so the
-- timecard-side relationship (timecards.payroll_batch_id, also added
-- in this migration) is in place without a follow-up schema change.
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  exported_at TIMESTAMPTZ,
  exported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payroll_batches_dates_ordered'
      AND conrelid = 'payroll_batches'::regclass
  ) THEN
    ALTER TABLE payroll_batches
      ADD CONSTRAINT payroll_batches_dates_ordered
      CHECK (period_end >= period_start);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_payroll_batches_period
  ON payroll_batches(period_start DESC, period_end DESC);

-- ----------------------------------------------------------------------
-- timecards: link to payroll batch + snapshot rate at approval time
-- ----------------------------------------------------------------------

ALTER TABLE timecards ADD COLUMN IF NOT EXISTS payroll_batch_id UUID
  REFERENCES payroll_batches(id) ON DELETE SET NULL;

-- Hourly rate snapshot at approval time. Lets payroll know "what rate
-- applied to these hours" even if the team_profile's rate later changes.
ALTER TABLE timecards ADD COLUMN IF NOT EXISTS rate_applied_cents INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'timecards_rate_applied_non_negative'
      AND conrelid = 'timecards'::regclass
  ) THEN
    ALTER TABLE timecards
      ADD CONSTRAINT timecards_rate_applied_non_negative
      CHECK (rate_applied_cents IS NULL OR rate_applied_cents >= 0);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_timecards_payroll_batch
  ON timecards(payroll_batch_id) WHERE payroll_batch_id IS NOT NULL;
