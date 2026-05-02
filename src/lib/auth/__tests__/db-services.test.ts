/**
 * Tests for auth/db-services.ts — service appointment queries.
 *
 * Behaviors locked:
 *   getUserServiceAppointments
 *   - returns empty array when no appointments
 *   - returns mapped appointment rows with service name/slug
 *
 *   hasPendingAppointmentForService
 *   - returns false when no pending appointment
 *   - returns true when pending appointment exists
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
  serviceAppointments: {
    id: 'sa_id',
    userId: 'sa_userId',
    serviceTypeId: 'sa_serviceTypeId',
    preferredDate: 'sa_preferredDate',
    confirmedDate: 'sa_confirmedDate',
    description: 'sa_description',
    deviceInfo: 'sa_deviceInfo',
    urgency: 'sa_urgency',
    status: 'sa_status',
    outcomeNotes: 'sa_outcomeNotes',
    priceChargedCents: 'sa_priceChargedCents',
    createdAt: 'sa_createdAt',
    updatedAt: 'sa_updatedAt',
  },
  serviceTypes: {
    id: 'st_id',
    name: 'st_name',
    slug: 'st_slug',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  inArray: jest.fn().mockReturnValue({ __inArray: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
}))

jest.mock('@/config/appointment-status', () => ({
  APPOINTMENT_STATUS: {
    REQUESTED: 'requested',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getUserServiceAppointments,
  hasPendingAppointmentForService,
} from '../db-services'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeAppointmentRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'appt-1',
    user_id: 'user-1',
    service_type_id: 'svc-1',
    preferred_date: '2026-05-01',
    confirmed_date: null,
    description: 'Laptop läuft langsam',
    device_info: 'ThinkPad T480',
    urgency: 'medium',
    status: 'requested',
    outcome_notes: null,
    price_charged_cents: null,
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-01T10:00:00Z',
    service_name: 'Laptop-Reparatur',
    service_slug: 'laptop-repair',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbSelect.mockImplementation(() => makeChain([]))
})

// ============================================================================
// getUserServiceAppointments
// ============================================================================

describe('getUserServiceAppointments', () => {
  it('returns empty array when no appointments', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await getUserServiceAppointments('user-1')

    expect(result).toEqual([])
  })

  it('returns appointment rows with service name and slug', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([makeAppointmentRow()]))

    const result = await getUserServiceAppointments('user-1')

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('appt-1')
    expect(result[0].service_name).toBe('Laptop-Reparatur')
    expect(result[0].service_slug).toBe('laptop-repair')
  })
})

// ============================================================================
// hasPendingAppointmentForService
// ============================================================================

describe('hasPendingAppointmentForService', () => {
  it('returns false when no pending appointment exists', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await hasPendingAppointmentForService('user-1', 'laptop-repair')

    expect(result).toBe(false)
  })

  it('returns true when a pending appointment exists', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([{ id: 'appt-1' }]))

    const result = await hasPendingAppointmentForService('user-1', 'laptop-repair')

    expect(result).toBe(true)
  })
})
