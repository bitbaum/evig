-- Migration 107: align timecard_entries CHECK constraints with the config SSOT
--
-- Migration 067 constrained timecard_entries.category to worked-time categories only
-- and duration_minutes > 0. Since then src/config/timecards.ts grew six Swiss absence
-- categories (ferien/krank/unfall/feiertag/militaer/unbezahlt) and set
-- MIN_ENTRY_MINUTES = 0 (an unpaid-leave day is a 0-minute labelled marker). The DB
-- constraints were never updated, so ANY timecard containing a leave entry failed to
-- INSERT → submitTimecard's transaction rolled back → the card never reached
-- status='submitted' → the approvals queue ("Zeitkarten-Freigaben") was always empty,
-- even for a superadmin. (Found during the timecard audit.)
--
-- This realigns both constraints with the config. Idempotent (DROP IF EXISTS + re-add).
-- Keep the category list in sync with TIMECARD_ENTRY_CATEGORIES.

ALTER TABLE timecard_entries DROP CONSTRAINT IF EXISTS timecard_entries_category_check;
ALTER TABLE timecard_entries ADD CONSTRAINT timecard_entries_category_check CHECK (
  category IN (
    -- worked-time
    'workshop','repair','intake','sales','admin','education','logistics','meeting','volunteering','other',
    -- absence (Swiss timecard)
    'ferien','krank','unfall','feiertag','militaer','unbezahlt'
  )
);

ALTER TABLE timecard_entries DROP CONSTRAINT IF EXISTS timecard_entries_duration_minutes_check;
ALTER TABLE timecard_entries ADD CONSTRAINT timecard_entries_duration_minutes_check CHECK (
  duration_minutes >= 0 AND duration_minutes <= 960
);
