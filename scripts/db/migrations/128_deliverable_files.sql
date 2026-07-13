-- Migration 126: Deliverable files (downloadable / viewable code)
--
-- A deliverable can list files the recipient may download or view as code.
-- Files are web-served from public/ (always deployed with the standalone build) —
-- each entry is { "name": <display>, "url": <public path> }. This is the SSOT
-- for "download the files / see the code" on the detail + share pages.

ALTER TABLE deliverables
  ADD COLUMN IF NOT EXISTS files JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN deliverables.files IS 'Array of { name, url } — downloadable/viewable files served from public/.';

-- Backfill the Kivitendo deliverable with its served files (guarded/idempotent).
UPDATE deliverables
SET files = '[
  { "name": "mockup.html", "url": "/presentations/kivitendo-intake/index.html" },
  { "name": "kivitendo-intake.css", "url": "/presentations/kivitendo-intake/kivitendo-intake.css" }
]'::jsonb
WHERE url = '/presentations/kivitendo-intake'
  AND files = '[]'::jsonb;
