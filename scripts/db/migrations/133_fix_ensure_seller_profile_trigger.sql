-- Migration 133: fix ensure_seller_profile() after the 122 column drops
--
-- Migration 122 dropped seller_profiles.display_name (identity hoisted to
-- user_profiles in 121), but the ensure_seller_profile() trigger function
-- from 031 still inserted that column. Result: the FIRST listing insert of
-- any user without an existing seller_profiles row errored at the trigger
-- (caught by the E2E seed; would equally hit a new P2P seller in prod).
--
-- Recreate the function without the dropped column. seller_profiles has no
-- other NOT-NULL-without-default columns post-122, so (user_id) suffices;
-- display identity comes from user_profiles (the SSOT).

CREATE OR REPLACE FUNCTION ensure_seller_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO seller_profiles (user_id)
  VALUES (NEW.seller_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
