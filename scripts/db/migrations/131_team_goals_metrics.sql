-- Migration 131: team goals + success metrics (coordination hub)
--
-- Makes each team page a coordination surface: a structured goal list (with a
-- status) and manual KPI metrics (label + current/target + unit). Both are
-- team-scoped sub-resources, cascade-deleted with the team.
--
-- ENUM POLICY (per CLAUDE.md §DB): goal `status` is an APP-LEVEL enum whose
-- authority is src/config/teams.ts + zod at the write boundary — plain TEXT
-- here, NO CHECK constraint (hand-synced CHECK lists drift; see migration 110).

CREATE TABLE IF NOT EXISTS team_goals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id      UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    detail       TEXT,
    -- open | in_progress | done — authority in src/config/teams.ts + zod.
    status       TEXT NOT NULL DEFAULT 'open',
    -- Free-form target label ("Q3", "2026", "laufend") — deliberately not a DATE:
    -- teams think in quarters/loose horizons, not calendar dates.
    target_label TEXT,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_goals_team ON team_goals(team_id, sort_order);

CREATE TABLE IF NOT EXISTS team_metrics (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    label           TEXT NOT NULL,
    -- Manual KPI values (nullable — a metric may have only a target, or only a
    -- current reading). NUMERIC so progress can be computed; parsed as string in JS.
    current_value   NUMERIC,
    target_value    NUMERIC,
    unit            TEXT,
    -- Direction of "good": TRUE = higher is better (repairs), FALSE = lower is
    -- better (turnaround days). Drives the progress/over-target colouring.
    higher_is_better BOOLEAN NOT NULL DEFAULT TRUE,
    -- Reserved for a future auto-compute path: NULL = manual value. When set, a
    -- later change can pull the current value live from a named platform query.
    source_key      TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_metrics_team ON team_metrics(team_id, sort_order);
