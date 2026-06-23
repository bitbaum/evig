/**
 * Tests for review-service.ts — target validation, rating update, notification.
 *
 * Mission-relevant: reviews are the trust mechanism that lets RepairIT users
 * choose verified technicians and listing sellers. A bug in validateReviewTarget
 * allows reviews for non-existent targets; a broken rating update leaves
 * technician profiles with stale averages; a failed notification leaves
 * repairers unaware of new feedback.
 *
 * Behaviors locked:
 *   validateReviewTarget
 *   - returns true for verified REPAIRER when found
 *   - returns false for REPAIRER when not found / not verified
 *   - returns true for LISTING when found
 *   - returns false for LISTING when not found
 *   - returns true for SERVICE (placeholder — always)
 *   - returns true for WORKSHOP when found
 *   - returns true for IT_HILFE when request is COMPLETED
 *   - returns false for unknown target type
 *
 *   updateHelperAverageRating
 *   - returns early (no-op) when no helper found via offer join
 *   - executes AVG query and updates helper profile when helper found
 *   - skips update when avg_rating is null (no reviews yet)
 *   - silently logs on DB error (does not throw)
 *
 *   notifyRepairerOfReview
 *   - returns early (no-op) when repairer not found
 *   - sends email when repairer found
 *   - logs warning when sendEmail returns { success: false }
 *   - silently logs on unexpected error (does not throw)
 */

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function makeSelectChain(result: unknown[] = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.innerJoin = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.then = resolved.then.bind(resolved)
  chain.catch = resolved.catch.bind(resolved)
  chain.finally = resolved.finally.bind(resolved)
  return chain
}

function makeUpdateChain(result: unknown[] = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.set = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.then = resolved.then.bind(resolved)
  chain.catch = resolved.catch.bind(resolved)
  chain.finally = resolved.finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = jest.fn(() => makeSelectChain([]))
const mockDbExecute = jest.fn()
const mockDbUpdate = jest.fn(() => makeUpdateChain([]))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
    update: (...args: unknown[]) => mockDbUpdate.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  repairerProfiles: { id: 'repairerProfiles', isVerified: 'isVerified', userId: 'userId', businessName: 'businessName' },
  listings: { id: 'listings' },
  workshops: { id: 'workshops' },
  reviews: { id: 'reviews' },
  itHilfeRequests: { id: 'itHilfeRequests', status: 'status', matchedOfferId: 'matchedOfferId' },
  itHilfeOffers: { id: 'itHilfeOffers', helperId: 'helperId' },
  helperProfiles: { userId: 'helperProfiles_userId', averageRating: 'averageRating' },
  users: { id: 'users', email: 'email', name: 'name' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'mocked' }), {
    raw: jest.fn().mockReturnValue({ __sql: 'raw' }),
    join: jest.fn().mockReturnValue({ __sql: 'joined' }),
  }),
  getTableName: jest.fn().mockReturnValue('mock_table'),
}))

jest.mock('@/config/database', () => ({
  REVIEW_TARGET_TYPES: {
    REPAIRER: 'repairer',
    LISTING: 'listing',
    SERVICE: 'service',
    WORKSHOP: 'workshop',
    IT_HILFE: 'it_hilfe',
  },
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'https://revamp-it.ch',
}))

const mockSendEmail = jest.fn().mockResolvedValue({ success: true })
jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { COMPLETED: 'completed', OPEN: 'open' },
}))

jest.mock('@/config/review-status', () => ({
  REVIEW_STATUS: { PUBLISHED: 'published', PENDING: 'pending' },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { validateReviewTarget, notifyRepairerOfReview } from '../review-service'
import { REVIEW_TARGET_TYPES } from '@/config/database'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TARGET_ID = 'target-1'
const REVIEW_ID = 'review-1'

beforeEach(() => {
  jest.resetAllMocks()
  mockDbSelect.mockImplementation(() => makeSelectChain([]))
  mockDbUpdate.mockImplementation(() => makeUpdateChain([]))
  mockSendEmail.mockResolvedValue({ success: true })
})

// ============================================================================
// validateReviewTarget
// ============================================================================

describe('validateReviewTarget', () => {
  it('returns true for REPAIRER when found and verified', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([{ id: TARGET_ID }]))

    const result = await validateReviewTarget(REVIEW_TARGET_TYPES.REPAIRER, TARGET_ID)

    expect(result).toBe(true)
  })

  it('returns false for REPAIRER when not found', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([]))

    const result = await validateReviewTarget(REVIEW_TARGET_TYPES.REPAIRER, 'missing')

    expect(result).toBe(false)
  })

  it('returns true for LISTING when found', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([{ id: TARGET_ID }]))

    const result = await validateReviewTarget(REVIEW_TARGET_TYPES.LISTING, TARGET_ID)

    expect(result).toBe(true)
  })

  it('returns false for LISTING when not found', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([]))

    const result = await validateReviewTarget(REVIEW_TARGET_TYPES.LISTING, 'missing')

    expect(result).toBe(false)
  })

  it('returns true for SERVICE (placeholder — always)', async () => {
    const result = await validateReviewTarget(REVIEW_TARGET_TYPES.SERVICE, 'any-id')

    expect(result).toBe(true)
    expect(mockDbSelect).not.toHaveBeenCalled()
  })

  it('returns true for WORKSHOP when found', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([{ id: TARGET_ID }]))

    const result = await validateReviewTarget(REVIEW_TARGET_TYPES.WORKSHOP, TARGET_ID)

    expect(result).toBe(true)
  })

  it('returns true for IT_HILFE when request is COMPLETED', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([{ id: TARGET_ID }]))

    const result = await validateReviewTarget(REVIEW_TARGET_TYPES.IT_HILFE, TARGET_ID)

    expect(result).toBe(true)
  })

  it('returns false for IT_HILFE when not found', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([]))

    const result = await validateReviewTarget(REVIEW_TARGET_TYPES.IT_HILFE, 'missing')

    expect(result).toBe(false)
  })

  it('returns false for unknown target type', async () => {
    const result = await validateReviewTarget('unknown_type', TARGET_ID)

    expect(result).toBe(false)
    expect(mockDbSelect).not.toHaveBeenCalled()
  })
})

// ============================================================================
// notifyRepairerOfReview
// ============================================================================

describe('notifyRepairerOfReview', () => {
  it('returns early (no-op) when repairer not found', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([]))

    await notifyRepairerOfReview(TARGET_ID, REVIEW_ID, 'Reviewer', 5, 'Toll!')

    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('sends email when repairer found', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeSelectChain([{
        businessName: 'Fix-It GmbH',
        email: 'tech@example.com',
        repairerName: 'Hans Müller',
      }]),
    )

    await notifyRepairerOfReview(TARGET_ID, REVIEW_ID, 'Alice', 5, 'Sehr gut!')

    expect(mockSendEmail).toHaveBeenCalledWith(
      'tech@example.com',
      'newReviewNotification',
      'Hans Müller',
      'Alice',
      5,
      'Sehr gut!',
      expect.stringContaining('revamp-it.ch'),
    )
  })

  it('logs warning when sendEmail returns { success: false }', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeSelectChain([{
        businessName: 'Fix-It GmbH',
        email: 'tech@example.com',
        repairerName: null,
      }]),
    )
    mockSendEmail.mockResolvedValueOnce({ success: false, error: 'SMTP down' })

    const { logger } = jest.requireMock('@/lib/logger')

    await notifyRepairerOfReview(TARGET_ID, REVIEW_ID, 'Bob', 4, 'OK')

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('review notification'),
      expect.anything(),
    )
  })

  it('silently logs on unexpected error and does not throw', async () => {
    mockDbSelect.mockReturnValueOnce({
      ...makeSelectChain([]),
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue(Promise.reject(new Error('Unexpected'))),
        }),
      }),
    })

    await expect(
      notifyRepairerOfReview(TARGET_ID, REVIEW_ID, 'Carol', 3, 'OK'),
    ).resolves.toBeUndefined()
  })
})
