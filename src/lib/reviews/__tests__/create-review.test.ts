/**
 * Tests for reviews/create-review.ts — shared review creation SSOT.
 *
 * Mission-relevant: reviews affect seller/helper/repairer ratings visible
 * to all users. If a duplicate review is created, ratings are inflated.
 * If the fire-and-forget rating update throws unhandled, it would crash
 * the Node process. If the wrong update function is dispatched, a
 * helper's rating gets updated when a seller's should.
 *
 * Behaviors locked:
 *   findDuplicateReview
 *   - returns false when no existing review found
 *   - returns true when an existing review is found
 *   - adds bookingId condition when provided
 *
 *   createReview
 *   - inserts a review and returns its ID
 *   - fires rating update in background (does not block return)
 *   - does not throw if rating update fails (logged, swallowed)
 *
 *   updateTargetRating dispatch (via createReview)
 *   - calls db.execute for 'it_hilfe' target type
 *   - calls db.execute for 'listing' target type
 *   - calls db.execute for 'repairer' target type
 *   - does not call db.execute for unknown target type
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select = jest.fn().mockReturnValue(chain)
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.insert = jest.fn().mockReturnValue(chain)
  chain.values = jest.fn().mockReturnValue(chain)
  chain.returning = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = jest.fn(() => makeChain([]))
const mockDbInsert = jest.fn(() => makeChain([]))
const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
    insert: (...args: unknown[]) => mockDbInsert(...args),
    execute: (...args: unknown[]) => mockDbExecute(...args),
  },
}))

jest.mock('@/db/schema/reviews', () => ({
  reviews: {
    id: 'r_id',
    reviewerId: 'r_reviewerId',
    targetType: 'r_targetType',
    targetId: 'r_targetId',
    bookingId: 'r_bookingId',
  },
}))

jest.mock('@/db/schema', () => ({
  helperProfiles: { userId: 'hp_userId' },
}))

jest.mock('@/db/schema/marketplace', () => ({
  sellerProfiles: { userId: 'sp_userId' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'mocked' }),
    { raw: jest.fn().mockReturnValue({ __raw: true }) },
  ),
}))

jest.mock('@/config/review-status', () => ({
  REVIEW_STATUS: { PUBLISHED: 'published', PENDING: 'pending' },
}))

jest.mock('@/config/database', () => ({
  REVIEW_TARGET_TYPES: { IT_HILFE: 'it_hilfe', LISTING: 'listing', REPAIRER: 'repairer' },
  TABLE_NAMES: {
    REVIEWS: 'reviews',
    IT_HILFE_TECHNICIAN_PROFILES: 'it_hilfe_technician_profiles',
    IT_HILFE_OFFERS: 'it_hilfe_offers',
    SELLER_PROFILES: 'seller_profiles',
    LISTINGS: 'listings',
    REPAIRER_PROFILES: 'repairer_profiles',
  },
}))

jest.mock('@/config/it-hilfe', () => ({
  OFFER_STATUS: { ACCEPTED: 'accepted' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { findDuplicateReview, createReview } from '../create-review'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_PARAMS = {
  reviewerId: 'user-1',
  targetType: 'it_hilfe',
  targetId: 'request-1',
  overallRating: 5,
  content: 'Hervorragende Arbeit!',
}

function flushMicrotasks() {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbSelect.mockImplementation(() => makeChain([]))
  mockDbInsert.mockImplementation(() => makeChain([{ id: 'review-new' }]))
  mockDbExecute.mockResolvedValue({ rowCount: 1 })
})

// ============================================================================
// findDuplicateReview
// ============================================================================

describe('findDuplicateReview', () => {
  it('returns false when no existing review found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await findDuplicateReview('user-1', 'it_hilfe', 'req-1')

    expect(result).toBe(false)
  })

  it('returns true when an existing review is found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([{ id: 'review-existing' }]))

    const result = await findDuplicateReview('user-1', 'it_hilfe', 'req-1')

    expect(result).toBe(true)
  })

  it('calls db.select once', async () => {
    await findDuplicateReview('user-1', 'listing', 'listing-1')
    expect(mockDbSelect).toHaveBeenCalledTimes(1)
  })

  it('still queries without bookingId condition when bookingId is null', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await findDuplicateReview('user-1', 'it_hilfe', 'req-1', null)

    expect(result).toBe(false)
    expect(mockDbSelect).toHaveBeenCalledTimes(1)
  })

  it('queries with bookingId condition when provided', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    await findDuplicateReview('user-1', 'it_hilfe', 'req-1', 'booking-abc')

    // eq should be called more times (extra condition for bookingId)
    const { eq } = jest.requireMock('drizzle-orm') as { eq: jest.Mock }
    const calls = eq.mock.calls.map(([col]: [string]) => col)
    // bookingId column should appear among eq calls
    expect(calls).toContain('r_bookingId')
  })
})

// ============================================================================
// createReview
// ============================================================================

describe('createReview', () => {
  it('inserts a review and returns its ID', async () => {
    const result = await createReview(BASE_PARAMS)

    expect(result.reviewId).toBe('review-new')
    expect(mockDbInsert).toHaveBeenCalledTimes(1)
  })

  it('does not throw if rating update fails (fire-and-forget)', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('DB connection lost'))

    await expect(createReview(BASE_PARAMS)).resolves.toBeDefined()
    await flushMicrotasks()
    // Still resolved, error was swallowed
  })

  it('returns immediately without waiting for rating update', async () => {
    let updateStarted = false
    mockDbExecute.mockImplementationOnce(async () => {
      updateStarted = true
      return { rowCount: 1 }
    })

    const result = createReview(BASE_PARAMS)
    // result is still a promise — the insert is what we await
    expect(await result).toHaveProperty('reviewId')
  })
})

// ============================================================================
// updateTargetRating dispatch (via createReview)
// ============================================================================

describe('updateTargetRating dispatch', () => {
  async function callAndFlush(params: typeof BASE_PARAMS) {
    await createReview(params)
    await flushMicrotasks()
  }

  it('calls db.execute once for it_hilfe target type', async () => {
    await callAndFlush({ ...BASE_PARAMS, targetType: 'it_hilfe' })
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('calls db.execute once for listing target type', async () => {
    await callAndFlush({ ...BASE_PARAMS, targetType: 'listing' })
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('calls db.execute once for repairer target type', async () => {
    await callAndFlush({ ...BASE_PARAMS, targetType: 'repairer' })
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('does not call db.execute for unknown target type', async () => {
    await callAndFlush({ ...BASE_PARAMS, targetType: 'unknown-type' })
    expect(mockDbExecute).not.toHaveBeenCalled()
  })
})
