-- Migration 082: Public projects, needs, contributions
--
-- Bridges the public /projects pages (i18n-driven content) and the
-- internal task_projects work-management tables. The goal: convert
-- visitor interest into matched resources (expertise, hardware, partner
-- intros, funding, volunteer time).
--
-- Three tables:
--   projects                 — registry of public projects (slug = i18n key)
--   project_needs            — typed asks per project (open/matched/fulfilled)
--   project_contributions    — inbound offers from visitors, triaged by staff
--
-- Idempotent: CREATE TABLE IF NOT EXISTS + DO-block guards for CHECK
-- constraints. Safe to re-run.

-- ----------------------------------------------------------------------
-- projects
-- ----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  task_project_id UUID REFERENCES task_projects(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_slug   ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(is_active) WHERE is_active = TRUE;

-- ----------------------------------------------------------------------
-- project_needs
-- ----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS project_needs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  target_quantity INTEGER,
  target_unit     TEXT,
  status          TEXT NOT NULL DEFAULT 'open',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_needs_type_valid'
      AND conrelid = 'project_needs'::regclass
  ) THEN
    ALTER TABLE project_needs
      ADD CONSTRAINT project_needs_type_valid
      CHECK (type IN ('expertise','hardware','partner_intro','funding','volunteer_time'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_needs_status_valid'
      AND conrelid = 'project_needs'::regclass
  ) THEN
    ALTER TABLE project_needs
      ADD CONSTRAINT project_needs_status_valid
      CHECK (status IN ('open','matched','fulfilled','archived'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_project_needs_project ON project_needs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_needs_status  ON project_needs(status) WHERE status = 'open';

-- ----------------------------------------------------------------------
-- project_contributions
-- ----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS project_contributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  need_id         UUID REFERENCES project_needs(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  organization    TEXT,
  message         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'new',
  internal_notes  TEXT,
  responded_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  responded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_contributions_status_valid'
      AND conrelid = 'project_contributions'::regclass
  ) THEN
    ALTER TABLE project_contributions
      ADD CONSTRAINT project_contributions_status_valid
      CHECK (status IN ('new','contacted','accepted','declined'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_project_contributions_project ON project_contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contributions_need    ON project_contributions(need_id);
CREATE INDEX IF NOT EXISTS idx_project_contributions_status  ON project_contributions(status) WHERE status = 'new';

-- ----------------------------------------------------------------------
-- Seed: upcycling project + starter needs
-- ----------------------------------------------------------------------

INSERT INTO projects (slug)
VALUES ('upcycling')
ON CONFLICT (slug) DO NOTHING;

-- Needs seeded only if the project has none yet, so re-runs don't
-- duplicate. Uses a CTE to grab the project id once.
WITH p AS (
  SELECT id FROM projects WHERE slug = 'upcycling'
),
existing AS (
  SELECT COUNT(*) AS n FROM project_needs WHERE project_id = (SELECT id FROM p)
)
INSERT INTO project_needs (project_id, type, title, description, target_quantity, target_unit, sort_order)
SELECT (SELECT id FROM p), v.type, v.title, v.description, v.target_quantity, v.target_unit, v.sort_order
FROM (VALUES
  ('expertise',      'CE-Konformität Fachingenieur:in',
                     'Fachperson für Produkthaftung und CE-Kennzeichnung bei Kleinserienproduktion in geschützten Werkstätten.',
                     NULL::INTEGER, NULL::TEXT, 10),
  ('expertise',      'Elektronik: Flimmern & Helligkeitsregelung',
                     'Modellübergreifende Lösung für Flimmern und Dimmen von LED-Backlights aus alten Monitoren.',
                     NULL, NULL, 20),
  ('partner_intro',  'Geschützte Werkstatt mit Elektronik-Know-how',
                     'Produktionspartner für die Kleinserie. Fokus auf Drahtzug, FARO, St. Jakob, Palme oder vergleichbar.',
                     NULL, NULL, 30),
  ('partner_intro',  'Liegenschaftsverwaltung / Facility Management',
                     'Pilotinstallationen in Nebenräumen, Parkhäusern, Technikräumen. Livit, Wincasa, Allreal, ISS oder ähnlich.',
                     NULL, NULL, 40),
  ('hardware',       'Ausrangierte Monitore (24″+)',
                     'Funktionsfähige oder reparierbare Monitore aus Sammelstellen und Firmen-Ausmusterung. Kooperation mit ERZ ist gestartet, zusätzliche Quellen erwünscht.',
                     70, 'Monitor', 50),
  ('funding',        'Förderung für LCA & Kleinserie',
                     'Mitfinanzierung der ZHAW-Ökobilanz und der Produktion der Kleinserie. Stiftungen: Klimastiftung Schweiz, KliK, Gebert Rüf, Migros Pionierfonds.',
                     NULL, 'CHF', 60),
  ('volunteer_time', 'Dokumentation pro Monitor-Modell',
                     'Fotos, Boards, Pin-Belegungen, Sicherheitshinweise für die offene Anleitung. Ideal für Techniker:innen oder Studierende.',
                     NULL, 'Stunden', 70)
) AS v(type, title, description, target_quantity, target_unit, sort_order)
WHERE (SELECT n FROM existing) = 0;
