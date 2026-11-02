-- AccountKit's screens are the only writer of credentials since this release
-- (docs/ACCOUNTKIT-MIGRATION.md). Its account panel renames a person and
-- deletes an account in `auth_users`; both now reach evig's `users`:
--   - a rename sets users.name (an empty name clears it);
--   - a deletion deletes the users row, and evig's foreign keys cascade from
--     there. Rows that must be kept reference users without a cascade, so such
--     a person (and a super admin) is refused before anything is deleted
--     (src/lib/auth/shared/evig-plugin.ts).
-- The functions are replaced in place, so a box whose mirror is attached picks
-- them up at once. The deletion trigger is attached here only where the mirror
-- already is (production since the 2026-11-01 import); elsewhere the import
-- attaches it with the others. Additive and idempotent.
CREATE OR REPLACE FUNCTION evig_accountkit_to_users() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.email_verified AND NOT OLD.email_verified THEN
    UPDATE users SET "emailVerified" = now()
    WHERE id::text = NEW.id AND "emailVerified" IS NULL;
  END IF;
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE users SET email = NEW.email
    WHERE id::text = NEW.id AND lower(email::text) IS DISTINCT FROM NEW.email;
  END IF;
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE users SET name = nullif(NEW.name, '')
    WHERE id::text = NEW.id AND coalesce(name, '') IS DISTINCT FROM NEW.name;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION evig_accountkit_delete_users() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM users WHERE id::text = OLD.id;
  RETURN OLD;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'evig_accountkit_to_users' AND NOT tgisinternal) THEN
    DROP TRIGGER IF EXISTS evig_accountkit_delete_users ON auth_users;
    CREATE TRIGGER evig_accountkit_delete_users AFTER DELETE ON auth_users
      FOR EACH ROW EXECUTE FUNCTION evig_accountkit_delete_users();
  END IF;
END $$;
