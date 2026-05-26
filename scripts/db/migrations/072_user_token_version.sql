-- Migration 072: Add token_version to users for JWT-stale-permissions enforcement
--
-- Auth.js v5 with JWT session strategy holds is_staff / staff_permissions /
-- is_super_admin in the signed token. The token is populated on initial sign-in
-- and refreshed every 24h (updateAge); the 30-day maxAge defines when it
-- finally expires. Until then, the jwt callback never re-fetches the user from
-- the DB, so an admin who demotes a colleague's staff permissions keeps seeing
-- a valid token for the demoted user with the OLD permissions.
--
-- token_version is bumped by the admin permission-change routes; the jwt
-- callback compares token.tokenVersion against users.token_version on each
-- refresh and re-fetches permissions when they diverge. Default 0 so existing
-- rows match a freshly-issued token's "no tokenVersion seen yet → treat as 0"
-- baseline; the first demotion bumps to 1 and the next token refresh picks it up.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

-- No index needed: lookups happen by user id (already indexed via PK) and
-- token_version is read as a single column, not filtered on.
