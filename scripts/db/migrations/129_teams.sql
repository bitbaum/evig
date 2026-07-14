-- Migration 129: First-class Teams + membership
--
-- Revamp-IT is organised into real named teams (Orga, IT-Admin, Medien/
-- Kommunikation, Laden). Each team owns a set of Nextcloud mail folders, has
-- members, and 2 leads (1 Hauptverantwortliche + 1 Vertretung). People belong
-- to MULTIPLE teams — so membership is a many-to-many join, NOT the single
-- `team_profiles.department` string it replaces (department is deprecated and
-- dropped in a later migration once every reader is off it — expand/contract,
-- precedent 121→122).
--
-- ENUM POLICY (per CLAUDE.md §DB): membership `role` is an APP-LEVEL enum whose
-- authority is src/config/teams.ts + zod at the write boundary. It is
-- DELIBERATELY plain TEXT here with NO CHECK constraint (hand-synced CHECK lists
-- drift; see migration 110). The only structural invariant enforced in SQL is
-- the partial-unique below: at most one LIVE membership per (team, person).

CREATE TABLE IF NOT EXISTS teams (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- URL-safe identifier used in /admin/teams/<slug> (ASCII only).
    slug                     TEXT NOT NULL UNIQUE,
    name                     TEXT NOT NULL,
    purpose                  TEXT,
    -- Nextcloud mail folders this team "betreut" (owns). Intentionally NOT
    -- unique across teams — several folders (intern@, spenden@, …) are shared.
    mail_folders             TEXT[] NOT NULL DEFAULT '{}',
    -- Semantic colour KEY (SectionColor: primary|info|…), resolved to classes
    -- in src/config/teams.ts — never a class string or hex.
    accent                   TEXT NOT NULL DEFAULT 'info',
    meeting_cadence          TEXT,
    -- Team-level focus headline (separate from each member's own focus). Both
    -- reuse the focus-freshness SSOT for the staleness badge.
    current_focus            TEXT,
    current_focus_updated_at TIMESTAMPTZ,
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order               INTEGER NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_memberships (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id    UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    -- Keyed to users(id), NOT team_profiles — every board/task/activity join is
    -- on user_id, and membership should exist even before an HR profile does.
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Values: lead | deputy | member (Haupt-/Stellvertretung / Mitglied).
    role       TEXT NOT NULL DEFAULT 'member',
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- NULL = live membership; set on transfer/leave to preserve history.
    left_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_active            ON teams(is_active);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team   ON team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user   ON team_memberships(user_id);
-- One LIVE membership per person per team (history rows carry left_at, so they
-- are exempt). The "≤1 lead + ≤1 deputy per team" rule is enforced in the
-- service/zod layer, not here (enum semantics stay out of SQL).
CREATE UNIQUE INDEX IF NOT EXISTS uq_team_memberships_live
    ON team_memberships(team_id, user_id) WHERE left_at IS NULL;

COMMENT ON TABLE teams IS 'First-class teams. Each owns mail_folders + has members via team_memberships. role enum lives in src/config/teams.ts + zod, not CHECK.';
COMMENT ON TABLE team_memberships IS 'Many-to-many person↔team. left_at IS NULL = live membership; a set left_at is transfer/leave history.';

-- ---------------------------------------------------------------------------
-- Seed the 4 real teams (idempotent by slug). Structure is env-independent.
-- ---------------------------------------------------------------------------
INSERT INTO teams (slug, name, purpose, mail_folders, accent, sort_order)
VALUES
  ('orga', 'Orga-Team',
   'Organisation, Finanzen, Spenden, HR, Einkauf und Empfang.',
   ARRAY['finanz@revamp-it.ch','intern@revamp-it.ch','spenden@revamp-it.ch','hr@revamp-it.ch','upcycling@revamp-it.ch','einkauf@revamp-it.ch','empfang@revamp-it.ch'],
   'primary', 10),
  ('it-admin', 'IT-Admin-Team',
   'Software, Support und interne IT-Administration.',
   ARRAY['software@revamp-it.ch','support@revamp-it.ch','intern@revamp-it.ch'],
   'info', 20),
  ('medien', 'Medien/Kommunikation/Auftritt-Team',
   'Medien, Kommunikation, Events und öffentlicher Auftritt.',
   ARRAY['events@revamp-it.ch','intern@revamp-it.ch'],
   'secondary', 30),
  ('laden', 'Laden-Team (Gestaltung/Betreuung/Pflege)',
   'Ladenlokal: Gestaltung, Betreuung, Pflege und Bestellungen.',
   ARRAY['bestellung@revamp-it.ch','einkauf@revamp-it.ch','empfang@revamp-it.ch','spenden@revamp-it.ch'],
   'warning', 40)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed memberships for the people whose accounts we can resolve by a stable
-- email natural key (the known @revamp-it.ch accounts). Guarded so a from-zero
-- CI replay (empty users) inserts nothing, and re-runs are idempotent.
--
-- Members from the Teamsliste whose email is not yet known (Cem [IT-Admin
-- lead], Sili, Robin, Simeon, Annika, Mohannad, Bruno, Reza, Carlos) are left
-- for manual assignment in /admin/teams — seeding a guessed address risks
-- attaching the wrong person, so we only seed confirmed accounts.
-- ---------------------------------------------------------------------------
INSERT INTO team_memberships (team_id, user_id, role)
SELECT t.id, u.id, 'member'
FROM (VALUES
    ('orga',     'veronica@revamp-it.ch'),
    ('orga',     'daniel@revamp-it.ch'),
    ('orga',     'andreas@revamp-it.ch'),
    ('it-admin', 'daniel@revamp-it.ch'),
    ('it-admin', 'andreas@revamp-it.ch'),
    ('medien',   'georgy@revamp-it.ch'),
    ('laden',    'veronica@revamp-it.ch')
) AS seed(slug, email)
JOIN teams t ON t.slug = seed.slug
JOIN users u ON u.email = seed.email
WHERE NOT EXISTS (
    SELECT 1 FROM team_memberships m
    WHERE m.team_id = t.id AND m.user_id = u.id AND m.left_at IS NULL
);
