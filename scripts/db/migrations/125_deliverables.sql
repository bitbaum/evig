-- Migration 125: Deliverables + review/feedback loop
--
-- The home for delivered artifacts (reports, presentations, mockups, docs,
-- links). Each is OWNED by a person, optionally linked to a task, and can be
-- shared two ways: internally (admin detail page) or externally via an
-- unguessable share_token (read + comment, no login) — feedback lands back in
-- the structured store and notifies the owner.
--
-- ENUM POLICY (per CLAUDE.md §DB): type / status / visibility / feedback kind /
-- feedback status are APP-LEVEL enums — their authority is src/config/deliverables.ts
-- + zod at the write boundary. They are DELIBERATELY plain TEXT here with NO
-- CHECK constraint (hand-synced CHECK lists drift; see migration 110). The only
-- CHECK is a true invariant: current_version >= 1.

CREATE TABLE IF NOT EXISTS deliverables (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    type            TEXT NOT NULL DEFAULT 'other',
    -- The rendering the recipient opens: a public path (/presentations/x),
    -- an R2 file URL, an external link, or the git source path.
    url             TEXT,
    -- The editable, versioned source: its deliverables/<slug>/ git folder.
    -- Powers the agent brief (§4.8 "Where").
    source_path     TEXT,
    task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
    status          TEXT NOT NULL DEFAULT 'draft',
    visibility      TEXT NOT NULL DEFAULT 'team',
    -- Unguessable external share link (nullable = not shared externally yet).
    share_token     TEXT UNIQUE,
    current_version INTEGER NOT NULL DEFAULT 1 CHECK (current_version >= 1),
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deliverable_feedback (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
    -- NULL when the comment came from an external reviewer via the share link.
    author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    -- Display name for external (no-login) reviewers.
    author_name    TEXT,
    kind           TEXT NOT NULL DEFAULT 'comment',
    -- Which part of the deliverable a change_request targets (free text).
    target         TEXT,
    body           TEXT NOT NULL,
    -- Lifecycle for change_request items: open / addressed / wontfix / approved.
    status         TEXT NOT NULL DEFAULT 'open',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_owner       ON deliverables(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status      ON deliverables(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_type        ON deliverables(type);
CREATE INDEX IF NOT EXISTS idx_deliverables_task        ON deliverables(task_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_feedback_del ON deliverable_feedback(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_feedback_st  ON deliverable_feedback(status);

COMMENT ON TABLE deliverables IS 'Delivered artifacts (report/presentation/mockup/document/link). Enums live in src/config/deliverables.ts + zod, not CHECK.';
COMMENT ON TABLE deliverable_feedback IS 'Feedback thread on a deliverable: comment / change_request / approval. External (share-link) authors have NULL author_user_id + a author_name.';

-- ---------------------------------------------------------------------------
-- Backfill: the Kivitendo intake restyle as the first deliverable.
-- Guarded so a from-zero CI replay (empty DB, no users) inserts nothing, and a
-- re-run is idempotent (NOT EXISTS by url). Owner = George (the author).
-- ---------------------------------------------------------------------------
INSERT INTO deliverables (owner_user_id, title, description, type, url, source_path, status, visibility, share_token)
SELECT
    u.id,
    'Kivitendo Auftragserfassung — schöneres UI',
    'Tablet-taugliches, gut leserliches Mockup für die Kivitendo-Auftragsmaske (Positions-Tabelle #row_table_id) plus die produktive CSS-Datei zum Herunterladen. Nur Aussehen, keine Struktur-Änderung.',
    'mockup',
    '/presentations/kivitendo-intake',
    'deliverables/2026-07-13-kivitendo-intake-ui/',
    'in_review',
    'team',
    replace(gen_random_uuid()::text, '-', '')
FROM users u
WHERE u.email = 'georgy.butaev@revamp-it.ch'
  AND NOT EXISTS (
    SELECT 1 FROM deliverables d WHERE d.url = '/presentations/kivitendo-intake'
  );
