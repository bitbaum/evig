-- Migration: 048_subscription_pools
-- Status: DRAFT — Do not run until feature implementation begins
-- Feature: Subscription Exchange (Abo-Tauschbörse)
-- See: docs/features/SUBSCRIPTION_EXCHANGE.md

-- Subscription pools (one per shared service)
CREATE TABLE IF NOT EXISTS subscription_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  service_category TEXT NOT NULL DEFAULT 'other',
  max_members INT NOT NULL CHECK (max_members > 0),
  monthly_cost_chf DECIMAL(10,2) NOT NULL CHECK (monthly_cost_chf >= 0),
  cost_per_member_chf DECIMAL(10,2) GENERATED ALWAYS AS (monthly_cost_chf / max_members) STORED,
  owner_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  rules TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool memberships
CREATE TABLE IF NOT EXISTS pool_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES subscription_pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(pool_id, user_id)
);

-- Payment contributions
CREATE TABLE IF NOT EXISTS pool_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES subscription_pools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  amount_chf DECIMAL(10,2) NOT NULL CHECK (amount_chf >= 0),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Governance votes
CREATE TABLE IF NOT EXISTS pool_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES subscription_pools(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES users(id),
  vote_type TEXT NOT NULL,
  vote TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pool_id, voter_id, vote_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pool_memberships_user ON pool_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_pool_memberships_pool ON pool_memberships(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_contributions_pool ON pool_contributions(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_contributions_status ON pool_contributions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_pools_status ON subscription_pools(status);
