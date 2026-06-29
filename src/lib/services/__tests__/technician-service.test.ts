/**
 * Tests for technician-service.ts — getTechnicianById.
 *
 * Mission-relevant: repair technicians are a core part of the RevampIT
 * cooperative — they earn meaningful work fixing donated hardware. A bug in
 * the profile fetch (wrong coercions, missing services) breaks the public
 * technician directory and prevents users from booking repairs.
 *
 * Behaviors locked:
 *   - returns null when no active profile is found
 *   - returns TechnicianDetail with all mapped fields when profile found
 *   - averageRating is parsed to float (Drizzle returns decimal as string)
 *   - averageRating is null when DB value is null
 *   - totalJobsCompleted and totalReviews default to 0 when null
 *   - acceptsGratis / acceptsKulturlegi / isVerified default to false when null
 *   - profileTier defaults to 'community' when null
 *   - skills defaults to [] when DB returns null
 *   - services array is empty for COMMUNITY tier (no second query)
 *   - services array is populated for PROFESSIONAL tier (second query fires)
 */

// ---------------------------------------------------------------------------
// Drizzle chainable mock factory
// ---------------------------------------------------------------------------

function makeSelectChain(result: unknown[] = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.innerJoin = jest.fn().mockReturnValue(chain)
  chain.leftJoin = jest.fn().mockReturnValue(chain)
  chain.groupBy = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.then = resolved.then.bind(resolved)
  chain.catch = resolved.catch.bind(resolved)
  chain.finally = resolved.finally.bind(resolved)
  return chain
}

const mockDbSelect = jest.fn(() => makeSelectChain([]))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  repairerProfiles: { id: 'repairerProfiles', userId: 'userId', isActive: 'isActive' },
  repairerServices: { id: 'repairerServices', repairerId: 'repairerId', isActive: 'isActive' },
  userSkills: { userId: 'userSkills_userId', skillId: 'skillId' },
  users: { id: 'users', name: 'users_name' },
  userProfiles: { userId: 'userProfiles_userId', avatarUrl: 'userProfiles_avatarUrl' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'mocked' }), {
    raw: jest.fn().mockReturnValue({ __sql: 'raw' }),
    join: jest.fn().mockReturnValue({ __sql: 'joined' }),
  }),
}))

jest.mock('@/config/repairer-status', () => ({
  REPAIRER_PROFILE_TIER: {
    COMMUNITY: 'community',
    PROFESSIONAL: 'professional',
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getTechnicianById } from '../technician-service'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeProfile(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'tech-1',
    userId: 'user-1',
    name: 'Hans Müller',
    bio: 'Erfahrener Laptop-Techniker',
    hourlyRateCents: 8500,
    averageRating: '4.75',
    totalJobsCompleted: 23,
    totalReviews: 18,
    profileTier: REPAIRER_PROFILE_TIER.COMMUNITY,
    city: 'Bern',
    postalCode: '3011',
    acceptsGratis: false,
    acceptsKulturlegi: true,
    isVerified: true,
    serviceDeliveryTypes: ['in_person'],
    maxTravelKm: 20,
    responseTimeHours: 48,
    createdAt: '2026-01-01T00:00:00Z',
    skills: ['laptop_repair', 'data_recovery'],
    ...overrides,
  }
}

function makeService(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'svc-1',
    serviceCategory: 'laptop',
    serviceName: 'Bildschirmaustausch',
    description: 'Defekten Bildschirm ersetzen',
    basePriceCents: 12000,
    hourlyRateCents: null,
    estimatedHours: '1-2',
    ...overrides,
  }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockDbSelect.mockImplementation(() => makeSelectChain([]))
})

// ============================================================================
// Not found
// ============================================================================

describe('getTechnicianById — not found', () => {
  it('returns null when no active profile exists', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([]))

    const result = await getTechnicianById('missing')

    expect(result).toBeNull()
  })
})

// ============================================================================
// Field mapping
// ============================================================================

describe('getTechnicianById — field mapping', () => {
  it('returns core identity fields correctly', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile()]))

    const result = await getTechnicianById('tech-1')

    expect(result?.id).toBe('tech-1')
    expect(result?.userId).toBe('user-1')
    expect(result?.name).toBe('Hans Müller')
    expect(result?.bio).toBe('Erfahrener Laptop-Techniker')
  })

  it('parses averageRating from Drizzle decimal string to float', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile({ averageRating: '4.75' })]))

    const result = await getTechnicianById('tech-1')

    expect(result?.averageRating).toBeCloseTo(4.75)
    expect(typeof result?.averageRating).toBe('number')
  })

  it('returns null averageRating when DB value is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile({ averageRating: null })]))

    const result = await getTechnicianById('tech-1')

    expect(result?.averageRating).toBeNull()
  })

  it('coerces null totalJobsCompleted to 0', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile({ totalJobsCompleted: null })]))

    const result = await getTechnicianById('tech-1')

    expect(result?.totalJobsCompleted).toBe(0)
  })

  it('coerces null totalReviews to 0', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile({ totalReviews: null })]))

    const result = await getTechnicianById('tech-1')

    expect(result?.totalReviews).toBe(0)
  })

  it('coerces null acceptsGratis to false', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile({ acceptsGratis: null })]))

    const result = await getTechnicianById('tech-1')

    expect(result?.acceptsGratis).toBe(false)
  })

  it('coerces null acceptsKulturlegi to false', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile({ acceptsKulturlegi: null })]))

    const result = await getTechnicianById('tech-1')

    expect(result?.acceptsKulturlegi).toBe(false)
  })

  it('coerces null isVerified to false', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile({ isVerified: null })]))

    const result = await getTechnicianById('tech-1')

    expect(result?.isVerified).toBe(false)
  })

  it('coerces null profileTier to "community"', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile({ profileTier: null })]))

    const result = await getTechnicianById('tech-1')

    expect(result?.profileTier).toBe('community')
  })

  it('returns empty skills array when DB skills is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile({ skills: null })]))

    const result = await getTechnicianById('tech-1')

    expect(result?.skills).toEqual([])
  })

  it('preserves truthy boolean values and populated skills', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeProfile()]))

    const result = await getTechnicianById('tech-1')

    expect(result?.acceptsKulturlegi).toBe(true)
    expect(result?.isVerified).toBe(true)
    expect(result?.skills).toEqual(['laptop_repair', 'data_recovery'])
  })
})

// ============================================================================
// Services — tier-conditional second query
// ============================================================================

describe('getTechnicianById — services', () => {
  it('returns empty services for COMMUNITY tier (no second DB query)', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeSelectChain([makeProfile({ profileTier: REPAIRER_PROFILE_TIER.COMMUNITY })]),
    )

    const result = await getTechnicianById('tech-1')

    expect(result?.services).toEqual([])
    // Only one db.select call for community tier
    expect(mockDbSelect).toHaveBeenCalledTimes(1)
  })

  it('fires a second query and returns services for PROFESSIONAL tier', async () => {
    mockDbSelect
      .mockReturnValueOnce(
        makeSelectChain([makeProfile({ profileTier: REPAIRER_PROFILE_TIER.PROFESSIONAL })]),
      )
      .mockReturnValueOnce(makeSelectChain([makeService()]))

    const result = await getTechnicianById('tech-1')

    expect(result?.services).toHaveLength(1)
    expect(mockDbSelect).toHaveBeenCalledTimes(2)
  })

  it('returns correct service fields for PROFESSIONAL tier', async () => {
    mockDbSelect
      .mockReturnValueOnce(
        makeSelectChain([makeProfile({ profileTier: REPAIRER_PROFILE_TIER.PROFESSIONAL })]),
      )
      .mockReturnValueOnce(
        makeSelectChain([makeService({ serviceName: 'Bildschirmaustausch', basePriceCents: 12000 })]),
      )

    const result = await getTechnicianById('tech-1')

    expect(result?.services[0].serviceName).toBe('Bildschirmaustausch')
    expect(result?.services[0].basePriceCents).toBe(12000)
  })

  it('returns empty services for PROFESSIONAL tier when no services exist', async () => {
    mockDbSelect
      .mockReturnValueOnce(
        makeSelectChain([makeProfile({ profileTier: REPAIRER_PROFILE_TIER.PROFESSIONAL })]),
      )
      .mockReturnValueOnce(makeSelectChain([]))

    const result = await getTechnicianById('tech-1')

    expect(result?.services).toEqual([])
  })
})
