# Feature Spec: Abo-Tauschbörse (Subscription Exchange)

**Status**: Design / Draft
**Priority**: Medium (Mission-aligned feature)
**Estimated effort**: 4–6 weeks (full implementation)

## Problem Statement

Many people pay for digital subscriptions they don't fully use (streaming, software, cloud storage). Others can't afford these services. RevampIT's mission of making technology accessible extends beyond hardware to digital services.

## Concept

A community-driven subscription pool where:
1. Members contribute unused subscription slots or share costs
2. Others gain access to services they couldn't afford individually
3. Democratic governance decides which subscriptions to maintain

## User Stories

- As a user, I want to offer my unused Netflix/Spotify/Office 365 seat to the community
- As a user, I want to join a pool to get access to services at reduced cost
- As an admin, I want to see pool utilization and manage memberships

## Data Model (Draft)

```sql
-- Subscription pools (one per service)
CREATE TABLE subscription_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,           -- e.g., 'Netflix', 'Office 365'
  service_category TEXT NOT NULL,       -- 'streaming', 'productivity', 'cloud'
  max_members INT NOT NULL,
  monthly_cost_chf DECIMAL(10,2) NOT NULL,
  cost_per_member_chf DECIMAL(10,2) GENERATED ALWAYS AS (monthly_cost_chf / max_members) STORED,
  owner_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, closed
  description TEXT,
  rules TEXT,                           -- pool-specific rules (markdown)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool memberships
CREATE TABLE pool_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES subscription_pools(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',  -- owner, admin, member
  status TEXT NOT NULL DEFAULT 'active', -- active, pending, suspended
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(pool_id, user_id)
);

-- Payment contributions
CREATE TABLE pool_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES subscription_pools(id),
  user_id UUID NOT NULL REFERENCES users(id),
  amount_chf DECIMAL(10,2) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, overdue
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Governance: renewal votes
CREATE TABLE pool_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES subscription_pools(id),
  voter_id UUID NOT NULL REFERENCES users(id),
  vote_type TEXT NOT NULL,              -- 'renew', 'cancel', 'change_plan'
  vote TEXT NOT NULL,                   -- 'yes', 'no', 'abstain'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pool_id, voter_id, vote_type)
);
```

## UI Pages (Planned)

| Page | Path | Description |
|------|------|-------------|
| Browse pools | /subscriptions | List available pools |
| Pool detail | /subscriptions/[id] | Members, cost, join |
| Create pool | /subscriptions/new | Owner creates pool |
| My pools | /dashboard/subscriptions | Manage memberships |
| Admin overview | /admin/subscriptions | Moderation |

## Implementation Phases

### Phase 1: MVP (2 weeks)
- Pool CRUD (create, view, join, leave)
- Simple cost splitting (equal shares)
- No payment integration (manual tracking)

### Phase 2: Payments (1–2 weeks)
- Payrexx integration for monthly contributions
- Automated reminders for overdue payments
- Payment history

### Phase 3: Governance (1 week)
- Renewal voting before subscription period ends
- Majority rules (configurable per pool)
- Auto-pause pools with insufficient votes

### Phase 4: Polish (1 week)
- Email notifications (new members, payment reminders, votes)
- Pool recommendations based on user interests
- Usage analytics for admins

## Open Questions

1. **Legal**: Is sharing subscription accounts allowed under Swiss law? Need to research per-service ToS.
2. **Payment**: Should we hold funds in escrow or do direct splits?
3. **Trust**: How to handle members who stop paying? Grace period? Auto-removal?
4. **Privacy**: How much member info is visible to pool owners?

## Dependencies

- Payrexx payment integration (already exists for marketplace)
- Email notification system (already exists)
- User profiles (already exist)
