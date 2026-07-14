-- Seed: placeholder team members (pseudonymised) + memberships for all 8 teams
-- ============================================================================
-- NOT a migration — it lives outside scripts/db/migrations/ on purpose so a
-- from-zero CI replay and fresh dev DBs do NOT get 15 fake users. Run it
-- deliberately against a target DB:
--   psql "$DATABASE_URL" -f scripts/db/seeds/team-placeholders.sql
--
-- WHY placeholders: the real people are not registered yet. Each is a LOCKED
-- stand-in — password_hash NULL (cannot log in by any means) — so the org
-- structure is visible in /admin now. The SINGLE marker that makes them findable
-- + claimable is the email domain @placeholder.revamp-it.ch (queryable, and the
-- address a claim replaces). Names are recognizable pseudonyms (real teammate's
-- first-letter kept, gender kept, real rock-legend surname), NOT a marker.
-- To onboard a real person later: send them a registration link that claims the
-- row (sets their real name + email + password_hash) — memberships survive
-- because they key on user_id, which never changes.
--
-- Georgy is the ONLY real account here (georgy.butaev@revamp-it.ch, resolved by
-- its real email below) — never pseudonymised.
--
-- Idempotent: users upsert on unique email (DO NOTHING); memberships insert only
-- when no live membership already exists for (team, person).
-- ============================================================================

BEGIN;

-- 1) Placeholder users. is_staff = TRUE (they are internal team members and must
--    appear in staff/team views) is safe: with password_hash NULL and no OAuth
--    account row, login is impossible until the row is claimed.
-- Names: recognizable first name (maps to the real teammate) + a rock-legend
-- surname so they read as real people. The @placeholder.revamp-it.ch email is
-- the systematic "not-yet-claimed" marker (surname is no longer the marker).
INSERT INTO users (name, email, is_staff, is_super_admin, password_hash, role)
VALUES
  ('Vera Hendrix',      'vera@placeholder.revamp-it.ch',   TRUE, FALSE, NULL, 'user'),
  ('David Jagger',       'david@placeholder.revamp-it.ch',   TRUE, FALSE, NULL, 'user'),
  ('Andres Bowie',      'andres@placeholder.revamp-it.ch', TRUE, FALSE, NULL, 'user'),
  ('Cemo Mercury',      'cemo@placeholder.revamp-it.ch',   TRUE, FALSE, NULL, 'user'),
  ('Sila Lennon',       'sila@placeholder.revamp-it.ch',   TRUE, FALSE, NULL, 'user'),
  ('Robyn Cobain',      'robyn@placeholder.revamp-it.ch',  TRUE, FALSE, NULL, 'user'),
  ('Simeo Springsteen', 'simeo@placeholder.revamp-it.ch',  TRUE, FALSE, NULL, 'user'),
  ('Anneke Joplin',     'anneke@placeholder.revamp-it.ch', TRUE, FALSE, NULL, 'user'),
  ('Mohan Dylan',       'mohan@placeholder.revamp-it.ch',  TRUE, FALSE, NULL, 'user'),
  ('Bruns Marley',      'bruns@placeholder.revamp-it.ch',  TRUE, FALSE, NULL, 'user'),
  ('Rezo Hetfield',     'rezo@placeholder.revamp-it.ch',   TRUE, FALSE, NULL, 'user'),
  ('Romeu Page',        'romeu@placeholder.revamp-it.ch',  TRUE, FALSE, NULL, 'user'),
  ('Carlo Santana',     'carlo@placeholder.revamp-it.ch',  TRUE, FALSE, NULL, 'user'),
  ('Tobin Morrison',    'tobin@placeholder.revamp-it.ch',  TRUE, FALSE, NULL, 'user'),
  ('Heino Clapton',     'heino@placeholder.revamp-it.ch',  TRUE, FALSE, NULL, 'user')
ON CONFLICT (email) DO NOTHING;

-- 2) Memberships (team slug, member email, role). Roles map the Teamsliste's
--    "Teamverantwortliche (1 Haupt, 1 Vertretung)" onto lead/deputy; everyone
--    else is member. Verkauf listed two leads (Reza+Andreas) → Haupt=lead,
--    Vertretung=deputy, honouring the model's ≤1-lead invariant.
--    UNCERTAIN on source (had a "?"): Anneke + Georgy under medien.
INSERT INTO team_memberships (team_id, user_id, role)
SELECT t.id, u.id, seed.role
FROM (VALUES
  -- orga (no lead marked on source)
  ('orga',        'vera@placeholder.revamp-it.ch',    'member'),
  ('orga',        'david@placeholder.revamp-it.ch',    'member'),
  ('orga',        'andres@placeholder.revamp-it.ch',  'member'),
  -- it-admin
  ('it-admin',    'david@placeholder.revamp-it.ch',    'lead'),
  ('it-admin',    'cemo@placeholder.revamp-it.ch',    'member'),
  ('it-admin',    'sila@placeholder.revamp-it.ch',    'member'),
  ('it-admin',    'robyn@placeholder.revamp-it.ch',   'member'),
  ('it-admin',    'simeo@placeholder.revamp-it.ch',   'member'),
  ('it-admin',    'anneke@placeholder.revamp-it.ch',  'member'),
  -- medien (no lead marked; anneke + georgy were "?" on source)
  ('medien',      'mohan@placeholder.revamp-it.ch',   'member'),
  ('medien',      'anneke@placeholder.revamp-it.ch',  'member'),
  ('medien',      'georgy.butaev@revamp-it.ch',       'member'),  -- REAL account
  -- laden
  ('laden',       'vera@placeholder.revamp-it.ch',    'lead'),
  ('laden',       'bruns@placeholder.revamp-it.ch',   'member'),
  ('laden',       'rezo@placeholder.revamp-it.ch',    'member'),
  ('laden',       'romeu@placeholder.revamp-it.ch',   'member'),
  -- verkauf (Reza=Haupt→lead, Andreas=Vertretung→deputy)
  ('verkauf',     'rezo@placeholder.revamp-it.ch',    'lead'),
  ('verkauf',     'andres@placeholder.revamp-it.ch',  'deputy'),
  ('verkauf',     'carlo@placeholder.revamp-it.ch',   'member'),
  -- lager (no lead marked)
  ('lager',       'rezo@placeholder.revamp-it.ch',    'member'),
  ('lager',       'anneke@placeholder.revamp-it.ch',  'member'),
  ('lager',       'romeu@placeholder.revamp-it.ch',   'member'),
  -- reparatur (no lead marked)
  ('reparatur',   'tobin@placeholder.revamp-it.ch',   'member'),
  ('reparatur',   'rezo@placeholder.revamp-it.ch',    'member'),
  ('reparatur',   'romeu@placeholder.revamp-it.ch',   'member'),
  ('reparatur',   'heino@placeholder.revamp-it.ch',   'member'),
  ('reparatur',   'anneke@placeholder.revamp-it.ch',  'member'),
  -- fundraising (inactive team; kept for history)
  ('fundraising', 'vera@placeholder.revamp-it.ch',    'lead'),
  ('fundraising', 'bruns@placeholder.revamp-it.ch',   'member'),
  ('fundraising', 'mohan@placeholder.revamp-it.ch',   'member')
) AS seed(slug, email, role)
JOIN teams t ON t.slug = seed.slug
JOIN users u ON u.email = seed.email
WHERE NOT EXISTS (
  SELECT 1 FROM team_memberships m
  WHERE m.team_id = t.id AND m.user_id = u.id AND m.left_at IS NULL
);

COMMIT;
