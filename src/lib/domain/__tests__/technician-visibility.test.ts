/**
 * Tests for lib/domain/technician-visibility.ts
 */

import { technicianListConditionsForTier } from '@/lib/domain/technician-visibility'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
}))

jest.mock('@/db/schema', () => ({
  repairerProfiles: {
    isActive: 'isActive',
    isVerified: 'isVerified',
    profileTier: 'profileTier',
    status: 'status',
  },
}))

describe('technicianListConditionsForTier', () => {
  it('returns OR condition when tier is empty (all public tiers)', () => {
    const conditions = technicianListConditionsForTier('')
    expect(conditions).toHaveLength(1)
    expect(conditions[0]).toHaveProperty('__or')
  })

  it('returns community active-only conditions', () => {
    const conditions = technicianListConditionsForTier(REPAIRER_PROFILE_TIER.COMMUNITY)
    expect(conditions).toHaveLength(2)
    expect(conditions.every(c => '__eq' in (c as object))).toBe(true)
  })

  it('returns professional verified+active conditions', () => {
    const conditions = technicianListConditionsForTier(REPAIRER_PROFILE_TIER.PROFESSIONAL)
    expect(conditions).toHaveLength(4)
  })
})
