-- Seed: EXAMPLE goals + KPIs on the Reparatur/Support team
-- ============================================================================
-- Demonstration data so the coordination hub isn't empty — plain editable rows
-- staff can change or delete in /admin/teams/reparatur. NOT a migration (lives
-- in seeds/); run deliberately:  psql "$DATABASE_URL" -f this-file.sql
-- Idempotent: each row inserts only if its title/label doesn't already exist on
-- the team, so re-runs are safe.
-- ============================================================================

BEGIN;

INSERT INTO team_goals (team_id, title, detail, status, target_label, sort_order)
SELECT t.id, g.title, g.detail, g.status, g.target_label, g.sort_order
FROM teams t
CROSS JOIN (VALUES
  ('Durchlaufzeit pro Reparatur unter 4 Tage bringen',
   'Von Annahme bis abholbereit — schnellere Rückgabe an die Empfänger.', 'in_progress', 'Q3', 0),
  ('Reparatur-Doku für die häufigsten 10 Modelle',
   'Kurzanleitungen, damit auch neue Freiwillige die Standardgeräte selbständig instand setzen.', 'open', '2026', 1),
  ('Ersatzteile aus Spendengeräten wiederverwenden',
   'Defekte Geräte als Teilespender erfassen statt neue Teile zu kaufen.', 'open', 'laufend', 2)
) AS g(title, detail, status, target_label, sort_order)
WHERE t.slug = 'reparatur'
  AND NOT EXISTS (SELECT 1 FROM team_goals x WHERE x.team_id = t.id AND x.title = g.title);

INSERT INTO team_metrics (team_id, label, current_value, target_value, unit, higher_is_better, sort_order)
SELECT t.id, m.label, m.current_value, m.target_value, m.unit, m.higher_is_better, m.sort_order
FROM teams t
CROSS JOIN (VALUES
  ('Reparaturen pro Monat',    42, 60, '',     TRUE,  0),
  ('Durchlaufzeit',             6,  4, 'Tage', FALSE, 1),
  ('Wiederverwendungsquote',   82, 90, '%',    TRUE,  2)
) AS m(label, current_value, target_value, unit, higher_is_better, sort_order)
WHERE t.slug = 'reparatur'
  AND NOT EXISTS (SELECT 1 FROM team_metrics x WHERE x.team_id = t.id AND x.label = m.label);

COMMIT;
