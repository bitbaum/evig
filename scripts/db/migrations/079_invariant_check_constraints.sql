-- Migration 079: Invariant CHECK constraints for production-safety guarantees
--
-- Data integrity audit (2026-05-28) flagged four constraints that
-- can't be enforced at the application layer alone — any raw SQL
-- migration, CSV import path, or future ad-hoc fix can bypass TS.
-- These are DB-layer guards that make the kind of bug they prevent
-- physically impossible.
--
-- Each guard is added in its own DO block so a re-run is a no-op if
-- the constraint already exists.

-- ----------------------------------------------------------------------
-- 1. users.token_version >= 0
--
-- token_version is bumped on every staff-permission change to force a
-- JWT refresh (migration 072). A bug that decremented it past 0 would
-- silently lock all users with that token version into a permanent
-- "stale token" state. Belt-and-suspenders next to the .notNull()
-- .default(0) the column already has.
-- ----------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_token_version_non_negative'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_token_version_non_negative
      CHECK (token_version >= 0);
  END IF;
END
$$;

-- ----------------------------------------------------------------------
-- 2. listings: verified_at + verified_by both-or-neither
--
-- "Who verified this?" and "when was it verified?" must agree. A
-- listing that has verified_at set but verified_by NULL (or vice
-- versa) is a half-completed verification that the admin UI can't
-- properly display and the reviewers can't audit.
-- ----------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listings_verified_both_or_neither'
      AND conrelid = 'listings'::regclass
  ) THEN
    ALTER TABLE listings
      ADD CONSTRAINT listings_verified_both_or_neither
      CHECK (
        (verified_at IS NULL AND verified_by IS NULL) OR
        (verified_at IS NOT NULL AND verified_by IS NOT NULL)
      );
  END IF;
END
$$;

-- ----------------------------------------------------------------------
-- 3. marketplace_orders: one pending_payment per (buyer, listing)
--
-- Without this, a buyer can race-click "buy now" and create multiple
-- pending_payment orders for the same listing — each holding a
-- Payrexx gateway, each holding a RESERVED status on the listing in
-- a race that the listing-row FOR UPDATE lock (the marketplace orders
-- POST handler does take one) protects against in the synchronous
-- path, but doesn't help if the second order is created across a
-- separate handler invocation that already saw the listing as still
-- ACTIVE because the first transaction hadn't committed yet.
-- ----------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_orders_one_pending_per_buyer_listing
  ON marketplace_orders (buyer_id, listing_id)
  WHERE status = 'pending_payment';

-- ----------------------------------------------------------------------
-- 4. newsletter_subscriptions.email stays lowercase
--
-- The column is plain TEXT with a UNIQUE constraint — without a
-- lowercase invariant, `Test@x.ch` and `test@x.ch` can both subscribe
-- (different bytes → both pass UNIQUE), then the user gets duplicate
-- newsletters and unsubscribing one leaves the other live. Cheaper
-- than migrating to CITEXT.
-- ----------------------------------------------------------------------
DO $$
BEGIN
  -- Backfill any existing rows to lowercase BEFORE adding the
  -- constraint, otherwise the ALTER fails on pre-constraint dirty data.
  UPDATE newsletter_subscriptions SET email = lower(email) WHERE email <> lower(email);

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'newsletter_subscriptions_email_lowercase'
      AND conrelid = 'newsletter_subscriptions'::regclass
  ) THEN
    ALTER TABLE newsletter_subscriptions
      ADD CONSTRAINT newsletter_subscriptions_email_lowercase
      CHECK (email = lower(email));
  END IF;
END
$$;
