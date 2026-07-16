-- Migration 132: seed the Forschung & Entwicklung (R&D) team
--
-- New structural team for research and development work. Same enum/accent
-- policy as 129/130: `accent` is a SectionColor KEY (src/config/teams.ts),
-- never a class/hex. mail_folders left empty — fill in via /admin/teams.
--
-- Georgy is seeded as lead. The seed joins on users by email so it is a no-op
-- for addresses that don't exist; LIMIT 1 prevents double-seeding when both
-- address variants exist (app invariant: at most one live lead per team).

INSERT INTO teams (slug, name, purpose, mail_folders, accent, sort_order, is_active)
VALUES
  ('forschung-entwicklung', 'Forschung & Entwicklung',
   'Forschung und Entwicklung: neue Werkzeuge, Plattform-Verbesserungen und Experimente.',
   '{}', 'info', 90, TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO team_memberships (team_id, user_id, role)
SELECT t.id, u.id, 'lead'
FROM teams t
JOIN users u ON u.email IN ('georgy.butaev@revamp-it.ch', 'georgy@revamp-it.ch')
WHERE t.slug = 'forschung-entwicklung'
  AND NOT EXISTS (
    SELECT 1 FROM team_memberships m
    WHERE m.team_id = t.id AND m.user_id = u.id AND m.left_at IS NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM team_memberships l
    WHERE l.team_id = t.id AND l.role = 'lead' AND l.left_at IS NULL
  )
ORDER BY u.email
LIMIT 1;
