-- Migration 130: complete the real team set (7 active + 1 inactive)
--
-- Migration 129 seeded the first 4 teams (orga, it-admin, medien, laden). The
-- real Teamsliste has 8 teams total; this adds the remaining 4. Fundraising was
-- crossed out on the source → seeded is_active = FALSE (the disbanding is
-- information worth keeping, not deleting; filter it out in queries instead).
--
-- Same enum/accent policy as 129: `accent` is a SectionColor KEY (src/config/
-- teams.ts), never a class/hex. mail_folders left empty for the new teams — the
-- source did not list folders for them; fill in via /admin/teams rather than
-- guessing an address onto the wrong team.

INSERT INTO teams (slug, name, purpose, mail_folders, accent, sort_order, is_active)
VALUES
  ('verkauf', 'Verkauf/Bestellung/Versand-Team',
   'Verkauf, Bestellungen und Versand.',
   '{}', 'success', 50, TRUE),
  ('lager', 'Lager-Team (Logistik)',
   'Lager und Logistik.',
   '{}', 'neutral', 60, TRUE),
  ('reparatur', 'Reparatur/Support-Team',
   'Reparatur und technischer Support.',
   '{}', 'error', 70, TRUE),
  ('fundraising', 'Fundraising-Team',
   'Mittelbeschaffung und Spendenkampagnen.',
   '{}', 'secondary', 80, FALSE)
ON CONFLICT (slug) DO NOTHING;
