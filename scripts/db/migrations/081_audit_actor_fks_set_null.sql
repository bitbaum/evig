-- Migration 081: convert "audit actor / reviewer" user_id FKs to ON DELETE SET NULL
--
-- Item #4 of the post-team-rebuild backlog: review the ~47 user_id FKs
-- that landed across history without an explicit ON DELETE policy.
-- Without a policy the default is NO ACTION, which silently blocks
-- user deletion any time the user is referenced anywhere. Combined
-- with migration 077 (payment_transactions ON DELETE RESTRICT) the
-- result is "you can almost never delete a user" — fine for
-- compliance, painful for actual user-management workflow.
--
-- This migration handles the "audit / reviewer attribution" subset:
-- columns recording who took an action on a row, where the action
-- itself must remain auditable but the actor reference can become
-- NULL on user delete (UI shows "Deleted user"). Financial /
-- payment-trail FKs stay RESTRICT (migrations 077, 078); user-owned
-- content cascades remain unchanged (they were either explicit or
-- already SET NULL).
--
-- Scope: 7 columns across 5 tables. Each one is wrapped in a DO
-- block that looks up the FK constraint by (table, column, ref table)
-- — Postgres auto-named the constraints when the original migrations
-- defined them inline, so the names are conventional but the lookup
-- is defensive. Re-running the migration after it lands is a no-op
-- (the new constraint name is checked first).
--
-- Not in scope here:
--   - payment-trail FKs (already RESTRICT via 077/078)
--   - tasks.created_by / tasks.completed_by — these gate Aufgaben-Workflow
--     analytics; HR shouldn't be able to delete a creator that still
--     has tasks attributed to them. Leave them blocking by default
--     until the GDPR-anonymize-then-soft-delete flow exists.
--   - subscription_pools.owner_id, pool_memberships.user_id, pool_votes.voter_id
--     — pools have membership semantics; cascade on delete is the
--     right policy, not SET NULL. Separate decision.

DO $$
DECLARE
  fk_name TEXT;
BEGIN
  -- Generic helper inline: for each (table, column) pair, find the
  -- existing FK to users(id) and replace it with ON DELETE SET NULL.
  -- The new constraint name has a stable suffix so a re-run sees it
  -- already exists.

  -- 1. decisions.closed_by
  SELECT conname INTO fk_name FROM pg_constraint
   WHERE conrelid = 'decisions'::regclass AND contype = 'f' AND confrelid = 'users'::regclass
     AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'decisions'::regclass AND attname = 'closed_by')];
  IF fk_name IS NOT NULL AND fk_name <> 'decisions_closed_by_fkey_setnull' THEN
    EXECUTE format('ALTER TABLE decisions DROP CONSTRAINT %I', fk_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'decisions_closed_by_fkey_setnull') THEN
    ALTER TABLE decisions
      ADD CONSTRAINT decisions_closed_by_fkey_setnull
      FOREIGN KEY (closed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- 2. listing_reports.reviewed_by
  SELECT conname INTO fk_name FROM pg_constraint
   WHERE conrelid = 'listing_reports'::regclass AND contype = 'f' AND confrelid = 'users'::regclass
     AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'listing_reports'::regclass AND attname = 'reviewed_by')];
  IF fk_name IS NOT NULL AND fk_name <> 'listing_reports_reviewed_by_fkey_setnull' THEN
    EXECUTE format('ALTER TABLE listing_reports DROP CONSTRAINT %I', fk_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'listing_reports_reviewed_by_fkey_setnull') THEN
    ALTER TABLE listing_reports
      ADD CONSTRAINT listing_reports_reviewed_by_fkey_setnull
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- 3. staff_permission_requests.reviewed_by
  SELECT conname INTO fk_name FROM pg_constraint
   WHERE conrelid = 'staff_permission_requests'::regclass AND contype = 'f' AND confrelid = 'users'::regclass
     AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'staff_permission_requests'::regclass AND attname = 'reviewed_by')];
  IF fk_name IS NOT NULL AND fk_name <> 'staff_permission_requests_reviewed_by_fkey_setnull' THEN
    EXECUTE format('ALTER TABLE staff_permission_requests DROP CONSTRAINT %I', fk_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_permission_requests_reviewed_by_fkey_setnull') THEN
    ALTER TABLE staff_permission_requests
      ADD CONSTRAINT staff_permission_requests_reviewed_by_fkey_setnull
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- 4. user_content_submissions.reviewed_by
  SELECT conname INTO fk_name FROM pg_constraint
   WHERE conrelid = 'user_content_submissions'::regclass AND contype = 'f' AND confrelid = 'users'::regclass
     AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'user_content_submissions'::regclass AND attname = 'reviewed_by')];
  IF fk_name IS NOT NULL AND fk_name <> 'user_content_submissions_reviewed_by_fkey_setnull' THEN
    EXECUTE format('ALTER TABLE user_content_submissions DROP CONSTRAINT %I', fk_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_content_submissions_reviewed_by_fkey_setnull') THEN
    ALTER TABLE user_content_submissions
      ADD CONSTRAINT user_content_submissions_reviewed_by_fkey_setnull
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- 5. ai_extracted_products.created_by
  SELECT conname INTO fk_name FROM pg_constraint
   WHERE conrelid = 'ai_extracted_products'::regclass AND contype = 'f' AND confrelid = 'users'::regclass
     AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'ai_extracted_products'::regclass AND attname = 'created_by')];
  IF fk_name IS NOT NULL AND fk_name <> 'ai_extracted_products_created_by_fkey_setnull' THEN
    EXECUTE format('ALTER TABLE ai_extracted_products DROP CONSTRAINT %I', fk_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_extracted_products_created_by_fkey_setnull') THEN
    ALTER TABLE ai_extracted_products
      ADD CONSTRAINT ai_extracted_products_created_by_fkey_setnull
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- 6. ai_extracted_products.reviewed_by
  SELECT conname INTO fk_name FROM pg_constraint
   WHERE conrelid = 'ai_extracted_products'::regclass AND contype = 'f' AND confrelid = 'users'::regclass
     AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'ai_extracted_products'::regclass AND attname = 'reviewed_by')];
  IF fk_name IS NOT NULL AND fk_name <> 'ai_extracted_products_reviewed_by_fkey_setnull' THEN
    EXECUTE format('ALTER TABLE ai_extracted_products DROP CONSTRAINT %I', fk_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_extracted_products_reviewed_by_fkey_setnull') THEN
    ALTER TABLE ai_extracted_products
      ADD CONSTRAINT ai_extracted_products_reviewed_by_fkey_setnull
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- 7. workshop_materials.uploaded_by
  SELECT conname INTO fk_name FROM pg_constraint
   WHERE conrelid = 'workshop_materials'::regclass AND contype = 'f' AND confrelid = 'users'::regclass
     AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'workshop_materials'::regclass AND attname = 'uploaded_by')];
  IF fk_name IS NOT NULL AND fk_name <> 'workshop_materials_uploaded_by_fkey_setnull' THEN
    EXECUTE format('ALTER TABLE workshop_materials DROP CONSTRAINT %I', fk_name);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workshop_materials_uploaded_by_fkey_setnull') THEN
    ALTER TABLE workshop_materials
      ADD CONSTRAINT workshop_materials_uploaded_by_fkey_setnull
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END
$$;
