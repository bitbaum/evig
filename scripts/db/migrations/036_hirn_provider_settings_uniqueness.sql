-- 036_hirn_provider_settings_uniqueness.sql
-- Ziel: Doppelte System-Provider beheben und echte Eindeutigkeit für system/user erzwingen.

BEGIN;

-- 1) Duplikate bei System-Scope bereinigen (neueste Zeile behalten)
WITH ranked AS (
  SELECT
    id,
    provider,
    ROW_NUMBER() OVER (
      PARTITION BY provider
      ORDER BY is_default DESC, updated_at DESC, created_at DESC, id DESC
    ) AS rn
  FROM hirn_provider_settings
  WHERE scope = 'system' AND user_id IS NULL
)
DELETE FROM hirn_provider_settings h
USING ranked r
WHERE h.id = r.id
  AND r.rn > 1;

-- 2) Zusätzliche Eindeutigkeit mit partiellen Unique Indexes erzwingen
CREATE UNIQUE INDEX IF NOT EXISTS ux_hirn_provider_settings_system_provider
  ON hirn_provider_settings(provider)
  WHERE scope = 'system' AND user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_hirn_provider_settings_user_provider
  ON hirn_provider_settings(user_id, provider)
  WHERE scope = 'user' AND user_id IS NOT NULL;

COMMIT;
