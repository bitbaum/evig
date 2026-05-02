/**
 * Tests for dashboard/techniker.ts — IT-Hilfe technician dashboard data.
 *
 * Mission-relevant: the technician dashboard is the primary workspace for
 * volunteer helpers. Wrong profile stats (rating, job count), a broken
 * offer count, or mismatched request list leaves helpers blind to
 * opportunities and undermines the cooperative repair mission.
 *
 * Behaviors locked:
 *   getTechnicianProfile
 *   - returns null when no profile exists
 *   - maps snake_case DB columns to camelCase TS interface
 *   - defaults totalJobsCompleted to 0 when null
 *   - defaults averageRating to '0.0' when null
 *   - defaults isActive to false when null
 *   - defaults city to '' when null
 *   - returns null and logs on DB error
 *
 *   getActiveOfferCount
 *   - returns parsed integer count
 *   - returns 0 when count is null/undefined
 *   - returns 0 on DB error
 *
 *   getMatchingRequests
 *   - runs fallback query (no skills filter) when user has no skills registered
 *   - runs skill-overlap query when skills are registered
 *   - maps all fields correctly (offerCount defaults to 0)
 *   - returns [] on DB error
 *
 *   getMyOffers
 *   - returns mapped offer rows
 *   - returns [] on DB error
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockQuery = jest.fn()

jest.mock('@/lib/auth/db', () => ({
  query: (...args: unknown[]) => mockQuery.apply(null, args),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    REPAIRER_PROFILES: 'repairer_profiles',
    IT_HILFE_OFFERS: 'it_hilfe_offers',
    IT_HILFE_REQUESTS: 'it_hilfe_requests',
    USER_SKILLS: 'user_skills',
  },
}))

jest.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { OPEN: 'open', COMPLETED: 'completed' },
  OFFER_STATUS: { PENDING: 'pending', ACCEPTED: 'accepted' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getTechnicianProfile,
  getActiveOfferCount,
  getMatchingRequests,
  getMyOffers,
} from '../techniker'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'user-1'

function makeProfileRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'tech-1',
    total_jobs_completed: 15,
    average_rating: '4.2',
    is_active: true,
    city: 'Bern',
    ...overrides,
  }
}

function makeRequestRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'req-1',
    title: 'Laptop startet nicht',
    category_id: 'laptop',
    urgency: 'medium',
    budget_tier: 'low',
    budget_amount_cents: null,
    city: 'Zürich',
    canton: 'ZH',
    offer_count: 2,
    created_at: '2026-04-01T10:00:00Z',
    ...overrides,
  }
}

function makeOfferRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    offer_id: 'offer-1',
    offer_status: 'pending',
    offer_created_at: '2026-04-02T09:00:00Z',
    request_id: 'req-1',
    request_title: 'Laptop startet nicht',
    category_id: 'laptop',
    urgency: 'medium',
    city: 'Zürich',
    canton: 'ZH',
    request_status: 'open',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// getTechnicianProfile
// ============================================================================

describe('getTechnicianProfile', () => {
  it('returns null when no profile exists', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const result = await getTechnicianProfile(USER_ID)

    expect(result).toBeNull()
  })

  it('maps snake_case DB columns to camelCase interface', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [makeProfileRow()] })

    const result = await getTechnicianProfile(USER_ID)

    expect(result).toMatchObject({
      id: 'tech-1',
      totalJobsCompleted: 15,
      averageRating: '4.2',
      isActive: true,
      city: 'Bern',
    })
  })

  it('defaults totalJobsCompleted to 0 when null', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [makeProfileRow({ total_jobs_completed: null })],
    })

    const result = await getTechnicianProfile(USER_ID)

    expect(result?.totalJobsCompleted).toBe(0)
  })

  it('defaults averageRating to "0.0" when null', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [makeProfileRow({ average_rating: null })],
    })

    const result = await getTechnicianProfile(USER_ID)

    expect(result?.averageRating).toBe('0.0')
  })

  it('defaults isActive to false when null', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [makeProfileRow({ is_active: null })],
    })

    const result = await getTechnicianProfile(USER_ID)

    expect(result?.isActive).toBe(false)
  })

  it('defaults city to empty string when null', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [makeProfileRow({ city: null })],
    })

    const result = await getTechnicianProfile(USER_ID)

    expect(result?.city).toBe('')
  })

  it('returns null and logs on DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('relation does not exist'))

    const result = await getTechnicianProfile(USER_ID)

    expect(result).toBeNull()
    const { logger } = jest.requireMock('@/lib/logger')
    expect(logger.error).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// getActiveOfferCount
// ============================================================================

describe('getActiveOfferCount', () => {
  it('returns parsed integer count', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: '7' }] })

    const result = await getActiveOfferCount(USER_ID)

    expect(result).toBe(7)
  })

  it('returns 0 when count is null/undefined', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ count: null }] })

    const result = await getActiveOfferCount(USER_ID)

    expect(result).toBe(0)
  })

  it('returns 0 when rows are empty', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const result = await getActiveOfferCount(USER_ID)

    expect(result).toBe(0)
  })

  it('returns 0 on DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'))

    const result = await getActiveOfferCount(USER_ID)

    expect(result).toBe(0)
  })
})

// ============================================================================
// getMatchingRequests
// ============================================================================

describe('getMatchingRequests', () => {
  it('runs a single fallback query when user has no skills', async () => {
    // 1st query: empty skills
    // 2nd query: fallback open requests
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [makeRequestRow()] })

    const result = await getMatchingRequests(USER_ID)

    expect(result).toHaveLength(1)
    expect(mockQuery).toHaveBeenCalledTimes(2)
  })

  it('runs skill-overlap query when skills are registered', async () => {
    // 1st query: returns skills
    // 2nd query: skill-overlap requests
    mockQuery
      .mockResolvedValueOnce({ rows: [{ skill_id: 'laptop' }, { skill_id: 'phone' }] })
      .mockResolvedValueOnce({ rows: [makeRequestRow()] })

    const result = await getMatchingRequests(USER_ID)

    expect(result).toHaveLength(1)
    expect(mockQuery).toHaveBeenCalledTimes(2)
  })

  it('maps all request fields correctly', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // no skills
      .mockResolvedValueOnce({ rows: [makeRequestRow()] })

    const result = await getMatchingRequests(USER_ID)

    expect(result[0]).toMatchObject({
      id: 'req-1',
      title: 'Laptop startet nicht',
      categoryId: 'laptop',
      urgency: 'medium',
      budgetTier: 'low',
      budgetAmountCents: null,
      city: 'Zürich',
      canton: 'ZH',
      offerCount: 2,
      createdAt: '2026-04-01T10:00:00Z',
    })
  })

  it('defaults offerCount to 0 when offer_count is null', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [makeRequestRow({ offer_count: null })] })

    const result = await getMatchingRequests(USER_ID)

    expect(result[0].offerCount).toBe(0)
  })

  it('returns [] on DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('timeout'))

    const result = await getMatchingRequests(USER_ID)

    expect(result).toEqual([])
  })

  it('returns empty array when no matching requests', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ skill_id: 'laptop' }] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await getMatchingRequests(USER_ID)

    expect(result).toEqual([])
  })
})

// ============================================================================
// getMyOffers
// ============================================================================

describe('getMyOffers', () => {
  it('returns mapped offer rows', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [makeOfferRow()] })

    const result = await getMyOffers(USER_ID)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      offerId: 'offer-1',
      offerStatus: 'pending',
      requestId: 'req-1',
      requestTitle: 'Laptop startet nicht',
      categoryId: 'laptop',
      urgency: 'medium',
      city: 'Zürich',
      canton: 'ZH',
      requestStatus: 'open',
    })
  })

  it('returns empty array when no offers', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const result = await getMyOffers(USER_ID)

    expect(result).toEqual([])
  })

  it('returns [] and logs on DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('connection lost'))

    const result = await getMyOffers(USER_ID)

    expect(result).toEqual([])
    const { logger } = jest.requireMock('@/lib/logger')
    expect(logger.error).toHaveBeenCalledTimes(1)
  })
})
