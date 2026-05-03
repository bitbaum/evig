/**
 * @jest-environment node
 *
 * Tests for POST /api/workshops/register (authenticated)
 *
 * Behaviors locked:
 *   POST - 401, 400 (invalid body), 404 (workshop not found),
 *          409 (already registered), 400 (no available instance), 200 (success)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  workshops: {
    id: 'ws_id', title: 'ws_title', slug: 'ws_slug',
    priceCents: 'ws_priceCents', isActive: 'ws_isActive',
  },
  workshopInstances: {
    id: 'wi_id', workshopId: 'wi_workshopId',
    startDate: 'wi_startDate', location: 'wi_location',
    status: 'wi_status',
  },
  workshopRegistrations: {
    id: 'wr_id', userId: 'wr_userId',
    workshopInstanceId: 'wr_workshopInstanceId',
    status: 'wr_status', createdAt: 'wr_createdAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: { PENDING: 'pending', CONFIRMED: 'confirmed', CANCELLED: 'cancelled', WAITLIST: 'waitlist', ATTENDED: 'attended', NO_SHOW: 'no_show' },
  WORKSHOP_REGISTRATION_STATUS_VALUES: ['pending', 'confirmed', 'waitlist', 'attended', 'cancelled', 'no_show'] as [string, ...string[]],
}))

jest.mock('@/config/workshops', () => ({
  WORKSHOP_INSTANCE_STATUS: { SCHEDULED: 'scheduled', CANCELLED: 'cancelled', COMPLETED: 'completed' },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    ALREADY_REGISTERED_WORKSHOP: 'Bereits für diesen Workshop angemeldet',
    NO_WORKSHOP_INSTANCES: 'Aktuell sind keine Termine für diesen Workshop verfügbar',
  },
  SUCCESS_MESSAGES: {
    WORKSHOP_REGISTERED: 'Erfolgreich für Workshop angemeldet',
  },
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'https://revamp-it.ch',
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/date-formats', () => ({
  formatDateTimeWithWeekday: jest.fn().mockReturnValue('Montag, 1. Juni 2026, 10:00'),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
}

const MOCK_WORKSHOP = {
  id: 'workshop-1',
  title: 'Linux Einführung',
  slug: 'linux-einfuehrung',
  priceCents: 0,
}

const MOCK_INSTANCE = {
  id: 'instance-1',
  startDate: new Date('2026-06-01T10:00:00Z'),
  location: 'Bern',
}

// Build a chain for workshop lookup (single row via destructuring in route)
function makeWorkshopChain(workshop: unknown) {
  const where = jest.fn().mockResolvedValue(workshop ? [workshop] : [])
  const from = jest.fn().mockReturnValue({ where })
  return { from }
}

// Build a chain for the parallel duplicate check + instance lookup (uses .then())
function makeParallelChain(row: unknown) {
  const thenFn = jest.fn().mockImplementation((cb: (rows: unknown[]) => unknown) =>
    Promise.resolve(cb(row ? [row] : []))
  )
  const limit = jest.fn().mockReturnValue({ then: thenFn })
  const orderBy = jest.fn().mockReturnValue({ limit })
  const where = jest.fn().mockReturnValue({ then: thenFn, orderBy })
  const innerJoin = jest.fn().mockReturnValue({ where })
  const from = jest.fn().mockReturnValue({ where, innerJoin })
  return { from }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ id: 'registration-1', createdAt: new Date() }])
})

// ============================================================================
// 401 — unauthenticated
// ============================================================================

describe('POST /api/workshops/register — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/workshops/register', {
      method: 'POST',
      body: JSON.stringify({ workshopSlug: 'linux-einfuehrung' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// 400 — validation
// ============================================================================

describe('POST /api/workshops/register — validation', () => {
  it('returns 400 when workshopSlug is missing', async () => {
    const req = new NextRequest('http://localhost/api/workshops/register', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when workshopSlug is empty string', async () => {
    const req = new NextRequest('http://localhost/api/workshops/register', {
      method: 'POST',
      body: JSON.stringify({ workshopSlug: '' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// 404 — workshop not found
// ============================================================================

describe('POST /api/workshops/register — workshop not found', () => {
  it('returns 404 when workshop does not exist or is inactive', async () => {
    mockSelect.mockReturnValue(makeWorkshopChain(null))

    const req = new NextRequest('http://localhost/api/workshops/register', {
      method: 'POST',
      body: JSON.stringify({ workshopSlug: 'nonexistent-workshop' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// 409 — already registered
// ============================================================================

describe('POST /api/workshops/register — already registered', () => {
  it('returns 409 when user is already registered for this workshop', async () => {
    // First select: workshop found
    mockSelect
      .mockReturnValueOnce(makeWorkshopChain(MOCK_WORKSHOP))
      // Second select: existing registration found (duplicate check)
      .mockReturnValueOnce(makeParallelChain({ id: 'existing-reg-1' }))
      // Third select: instance lookup (not reached but set up anyway)
      .mockReturnValue(makeParallelChain(null))

    const req = new NextRequest('http://localhost/api/workshops/register', {
      method: 'POST',
      body: JSON.stringify({ workshopSlug: 'linux-einfuehrung' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toMatch(/bereits/i)
  })
})

// ============================================================================
// 400 — no available instance
// ============================================================================

describe('POST /api/workshops/register — no available instance', () => {
  it('returns 400 when no scheduled instances are available', async () => {
    mockSelect
      .mockReturnValueOnce(makeWorkshopChain(MOCK_WORKSHOP))
      .mockReturnValueOnce(makeParallelChain(null))  // no duplicate
      .mockReturnValue(makeParallelChain(null))       // no instance

    const req = new NextRequest('http://localhost/api/workshops/register', {
      method: 'POST',
      body: JSON.stringify({ workshopSlug: 'linux-einfuehrung' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/keine Termine/i)
  })
})

// ============================================================================
// 200 — success
// ============================================================================

describe('POST /api/workshops/register — success', () => {
  it('returns 200 with registrationId on successful registration', async () => {
    mockSelect
      .mockReturnValueOnce(makeWorkshopChain(MOCK_WORKSHOP))
      .mockReturnValueOnce(makeParallelChain(null))         // no duplicate
      .mockReturnValue(makeParallelChain(MOCK_INSTANCE))    // instance found

    const req = new NextRequest('http://localhost/api/workshops/register', {
      method: 'POST',
      body: JSON.stringify({ workshopSlug: 'linux-einfuehrung' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.registrationId).toBe('registration-1')
    expect(body.data.workshopTitle).toBe('Linux Einführung')
  })
})
