-- Migration 110: drop the notifications.type CHECK constraint — end the hand-sync
--
-- The constraint's value list had to be manually kept in sync with
-- NOTIFICATION_TYPES in src/config/notifications.ts (recreated in migrations
-- 039, 040, 069, 093, 108 — five times). It caused two production incidents:
-- new notification types silently failed to insert (downgraded to logger.warn
-- by callers) until someone noticed and wrote the next sync migration.
--
-- `notifications.type` is written EXCLUSIVELY by internal services
-- (src/lib/services/notifications.ts and friends) using NOTIFICATION_TYPES
-- constants — never from user input. The TS config + compiler are the real
-- validator; the CHECK's only effect was punishing config additions.
--
-- Policy (CLAUDE.md): app-level enums = config constant + zod at the write
-- boundary. DB CHECKs are reserved for true invariants (ranges, money,
-- date ordering).

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
