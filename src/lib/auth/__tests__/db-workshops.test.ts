/**
 * Tests for auth/db-workshops.ts — workshop and registration queries.
 *
 * Behaviors locked:
 *   getWorkshopBySlug
 *   - returns null when workshop not found
 *   - returns DbWorkshop when found
 *
 *   getWorkshopsForUser
 *   - returns empty array when no active workshops
 *   - returns workshops with optional registration_status
 *
 *   getUserWorkshopRegistrations
 *   - returns empty array when no registrations
 *   - returns registration rows with workshop title/slug
 *
 *   isUserRegisteredForWorkshop
 *   - returns false when not registered (or only cancelled)
 *   - returns true when an active registration exists
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
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.innerJoin = jest.fn().mockReturnValue(chain)
  chain.leftJoin = jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = jest.fn(() => makeChain([]))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  workshops: {
    id: 'w_id',
    slug: 'w_slug',
    title: 'w_title',
    description: 'w_description',
    category: 'w_category',
    duration: 'w_duration',
    level: 'w_level',
    maxParticipants: 'w_maxParticipants',
    priceCents: 'w_priceCents',
    isActive: 'w_isActive',
    createdAt: 'w_createdAt',
    updatedAt: 'w_updatedAt',
  },
  workshopInstances: {
    id: 'wi_id',
    workshopId: 'wi_workshopId',
  },
  workshopRegistrations: {
    id: 'wr_id',
    userId: 'wr_userId',
    workshopInstanceId: 'wr_workshopInstanceId',
    status: 'wr_status',
    paymentStatus: 'wr_paymentStatus',
    paymentAmountCents: 'wr_paymentAmountCents',
    paymentReference: 'wr_paymentReference',
    attended: 'wr_attended',
    rating: 'wr_rating',
    feedback: 'wr_feedback',
    notes: 'wr_notes',
    confirmedAt: 'wr_confirmedAt',
    cancelledAt: 'wr_cancelledAt',
    createdAt: 'wr_createdAt',
    updatedAt: 'wr_updatedAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  ne: jest.fn().mockReturnValue({ __ne: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
}))

jest.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: {
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    PENDING: 'pending',
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getWorkshopBySlug,
  getWorkshopsForUser,
  getUserWorkshopRegistrations,
  isUserRegisteredForWorkshop,
} from '../db-workshops'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeWorkshopRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ws-1',
    slug: 'linux-basics',
    title: 'Linux-Grundkurs',
    description: 'Einführung in Linux',
    category: 'software',
    duration: '3h',
    level: 'beginner',
    max_participants: 10,
    price_cents: 0,
    is_active: true,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  }
}

function makeRegistrationRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'reg-1',
    user_id: 'user-1',
    workshop_instance_id: 'wi-1',
    status: 'confirmed',
    payment_status: null,
    payment_amount_cents: null,
    payment_reference: null,
    attended: false,
    rating: null,
    feedback: null,
    notes: null,
    confirmed_at: null,
    cancelled_at: null,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
    workshop_title: 'Linux-Grundkurs',
    workshop_slug: 'linux-basics',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbSelect.mockImplementation(() => makeChain([]))
})

// ============================================================================
// getWorkshopBySlug
// ============================================================================

describe('getWorkshopBySlug', () => {
  it('returns null when workshop not found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await getWorkshopBySlug('missing-slug')

    expect(result).toBeNull()
  })

  it('returns DbWorkshop when found', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeWorkshopRow()]))

    const result = await getWorkshopBySlug('linux-basics')

    expect(result?.id).toBe('ws-1')
    expect(result?.title).toBe('Linux-Grundkurs')
  })
})

// ============================================================================
// getWorkshopsForUser
// ============================================================================

describe('getWorkshopsForUser', () => {
  it('returns empty array when no active workshops', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await getWorkshopsForUser('user-1')

    expect(result).toEqual([])
  })

  it('returns workshop rows with optional registration_status', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([
        makeWorkshopRow({ registration_status: 'confirmed' }),
        makeWorkshopRow({ id: 'ws-2', slug: 'repair-basics', registration_status: null }),
      ]),
    )

    const result = await getWorkshopsForUser('user-1')

    expect(result).toHaveLength(2)
    expect(result[0].registration_status).toBe('confirmed')
    expect(result[1].registration_status).toBeNull()
  })
})

// ============================================================================
// getUserWorkshopRegistrations
// ============================================================================

describe('getUserWorkshopRegistrations', () => {
  it('returns empty array when no registrations', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await getUserWorkshopRegistrations('user-1')

    expect(result).toEqual([])
  })

  it('returns registration rows with workshop title and slug', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeRegistrationRow()]))

    const result = await getUserWorkshopRegistrations('user-1')

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('reg-1')
    expect(result[0].workshop_title).toBe('Linux-Grundkurs')
    expect(result[0].workshop_slug).toBe('linux-basics')
  })
})

// ============================================================================
// isUserRegisteredForWorkshop
// ============================================================================

describe('isUserRegisteredForWorkshop', () => {
  it('returns false when user is not registered', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await isUserRegisteredForWorkshop('user-1', 'linux-basics')

    expect(result).toBe(false)
  })

  it('returns true when an active registration exists', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([{ id: 'reg-1' }]))

    const result = await isUserRegisteredForWorkshop('user-1', 'linux-basics')

    expect(result).toBe(true)
  })
})
