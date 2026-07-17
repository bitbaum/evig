-- 136: Zeiterfassung ledger foundation — retire SMALL-Time, step 1
--
-- Adds the accounting dimension the timecard tool lacks vs. the legacy
-- SMALL-Time punch clock (arbeitszeit.revamp-it.ch):
--
--   * employment_periods    — effective-dated Pensum (weekly minutes). Soll is
--                             computable for ANY past month even after a 60%→80%
--                             change. Seeded from team_profiles.contract_hours.
--   * vacation_entitlements — Ferienanspruch per person-year (+ carryover, the
--                             legacy tool's "Übertrag F").
--   * team_profiles.time_opening_minutes / time_opening_date
--                           — Zeitsaldo carried over at cutover ("Übertrag T").
--                             We do NOT migrate punch-level history; SMALL-Time
--                             stays read-only as the pre-cutover archive.
--   * team_profiles.zeiterfassung_reminder_day
--                           — day-of-month for the personal "fill out your
--                             Zeiterfassung" reminder (NULL = off).
--
-- No CHECK constraints on app-level enums (per repo rule); ranges/date order
-- ARE true invariants and get checks.

BEGIN;

CREATE TABLE IF NOT EXISTS employment_periods (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_profile_id uuid NOT NULL REFERENCES team_profiles(id) ON DELETE CASCADE,
  valid_from      date NOT NULL,
  -- Weekly contracted working time in minutes (60% of a 40h week = 1440).
  weekly_minutes  integer NOT NULL,
  notes           text,
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employment_periods_weekly_minutes_range
    CHECK (weekly_minutes >= 0 AND weekly_minutes <= 6000),
  CONSTRAINT employment_periods_unique_start UNIQUE (team_profile_id, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_employment_periods_profile
  ON employment_periods(team_profile_id, valid_from DESC);

CREATE TABLE IF NOT EXISTS vacation_entitlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_profile_id uuid NOT NULL REFERENCES team_profiles(id) ON DELETE CASCADE,
  year            integer NOT NULL,
  -- Days, half-day precision (e.g. 12.5). Base entitlement for the year.
  days            numeric(4,1) NOT NULL,
  -- Carryover from the previous year (legacy "Übertrag F").
  carryover_days  numeric(4,1) NOT NULL DEFAULT 0,
  notes           text,
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vacation_entitlements_year_range CHECK (year >= 2000 AND year <= 2100),
  CONSTRAINT vacation_entitlements_days_range CHECK (days >= 0 AND days <= 60),
  CONSTRAINT vacation_entitlements_unique_year UNIQUE (team_profile_id, year)
);

CREATE INDEX IF NOT EXISTS idx_vacation_entitlements_profile
  ON vacation_entitlements(team_profile_id, year DESC);

ALTER TABLE team_profiles
  ADD COLUMN IF NOT EXISTS time_opening_minutes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_opening_date date,
  ADD COLUMN IF NOT EXISTS zeiterfassung_reminder_day integer;

ALTER TABLE team_profiles
  DROP CONSTRAINT IF EXISTS team_profiles_reminder_day_range;
ALTER TABLE team_profiles
  ADD CONSTRAINT team_profiles_reminder_day_range
  CHECK (zeiterfassung_reminder_day IS NULL
         OR (zeiterfassung_reminder_day >= 1 AND zeiterfassung_reminder_day <= 28));

-- Seed one employment period per profile that has contracted hours today.
-- valid_from = the profile's start date (fallback: a date safely before any
-- timecard data) so historical Soll uses the same Pensum until HR adds real
-- period boundaries.
INSERT INTO employment_periods (team_profile_id, valid_from, weekly_minutes, notes)
SELECT
  tp.id,
  COALESCE(tp.start_date, DATE '2020-01-01'),
  tp.contract_hours * 60,
  'Automatisch übernommen aus Profil (Migration 136)'
FROM team_profiles tp
WHERE tp.contract_hours IS NOT NULL AND tp.contract_hours > 0
ON CONFLICT (team_profile_id, valid_from) DO NOTHING;

COMMIT;
