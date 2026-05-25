/**
 * @jest-environment node
 *
 * Tests for POST /api/workshops/propose (authenticated)
 *
 * Behaviors locked:
 *   POST - 401, 400 (invalid body), 400 (spam check), 400 (location not found),
 *          400 (unapproved location), 200 (success)
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
  workshopProposals: {
    id: 'wp_id',
    userId: 'wp_userId',
    status: 'wp_status',
    createdAt: 'wp_createdAt',
    $inferInsert: {},
  },
  locations: { id: 'loc_id', isApproved: 'loc_isApproved' },
  users: { id: 'u_id', email: 'u_email', isStaff: 'u_isStaff' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  gte: (a: unknown, b: unknown) => ({ __gte: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: { PENDING: 'pending', APPROVED: 'approved' },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
  SUCCESS_MESSAGES: {},
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'https://revamp-it.ch',
}))

jest.mock('@/lib/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
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

const VALID_PROPOSAL_BODY = {
  title: 'Linux Einführung',
  description: 'Eine umfassende Einführung in Linux',
  shortDescription: 'Linux Basics',
  category: 'linux',
  durationHours: 2,
  level: 'beginner',
  maxParticipants: 15,
  minParticipants: 3,
  pricePerPerson: 0,
  learningObjectives: ['Terminal bedienen', 'Dateisystem verstehen'],
  termsAccepted: true as true,
}

// Build a standard db.select chain for spam check (0 proposals) + no location lookup
function makeSpamCheckChain(count: number) {
  const thenFn = jest.fn().mockImplementation((cb: (rows: unknown[]) => unknown) =>
    Promise.resolve(cb([{ count }]))
  )
  const where = jest.fn().mockReturnValue({ then: thenFn })
  const from = jest.fn().mockReturnValue({ where })
  return { from }
}

function makeLocationChain(locationRow: unknown) {
  const thenFn = jest.fn().mockImplementation((cb: (rows: unknown[]) => unknown) =>
    Promise.resolve(cb(locationRow ? [locationRow] : []))
  )
  const where = jest.fn().mockReturnValue({ then: thenFn })
  const from = jest.fn().mockReturnValue({ where })
  return { from }
}

// Admin emails lookup chain (flat promise)
function makeAdminEmailsChain(emails: { email: string }[]) {
  const where = jest.fn().mockResolvedValue(emails)
  const from = jest.fn().mockReturnValue({ where })
  return { from }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ id: 'proposal-1' }])
})

// ============================================================================
// 401 — unauthenticated
// ============================================================================

describe('POST /api/workshops/propose — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/workshops/propose', {
      method: 'POST',
      body: JSON.stringify(VALID_PROPOSAL_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// 400 — validation
// ============================================================================

describe('POST /api/workshops/propose — validation', () => {
  it('returns 400 when body is missing required fields', async () => {
    const req = new NextRequest('http://localhost/api/workshops/propose', {
      method: 'POST',
      body: JSON.stringify({ title: 'x' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when termsAccepted is false', async () => {
    const req = new NextRequest('http://localhost/api/workshops/propose', {
      method: 'POST',
      body: JSON.stringify({ ...VALID_PROPOSAL_BODY, termsAccepted: false }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// 400 — spam check
// ============================================================================

describe('POST /api/workshops/propose — spam check', () => {
  it('returns 400 when user already has 3+ pending/approved proposals', async () => {
    // spam check returns count=3, no location needed
    mockSelect
      .mockReturnValueOnce(makeSpamCheckChain(3))
      .mockReturnValue(makeLocationChain(null))

    const req = new NextRequest('http://localhost/api/workshops/propose', {
      method: 'POST',
      body: JSON.stringify(VALID_PROPOSAL_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/3/)
  })
})

// ============================================================================
// 400 — location checks
// ============================================================================

describe('POST /api/workshops/propose — location checks', () => {
  it('returns 400 when selected location does not exist', async () => {
    mockSelect
      .mockReturnValueOnce(makeSpamCheckChain(0))
      .mockReturnValue(makeLocationChain(null))

    const req = new NextRequest('http://localhost/api/workshops/propose', {
      method: 'POST',
      body: JSON.stringify({
        ...VALID_PROPOSAL_BODY,
        selectedLocationId: '123e4567-e89b-12d3-a456-426614174000',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/existiert nicht/i)
  })

  it('returns 400 when selected location is not approved', async () => {
    mockSelect
      .mockReturnValueOnce(makeSpamCheckChain(0))
      .mockReturnValue(makeLocationChain({ id: 'loc-1', isApproved: false }))

    const req = new NextRequest('http://localhost/api/workshops/propose', {
      method: 'POST',
      body: JSON.stringify({
        ...VALID_PROPOSAL_BODY,
        selectedLocationId: '123e4567-e89b-12d3-a456-426614174000',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/nicht zur Buchung/i)
  })
})

// ============================================================================
// 200 — success
// ============================================================================

describe('POST /api/workshops/propose — success', () => {
  it('returns 200 with proposalId on valid submission', async () => {
    // spam check (0 proposals), no location needed
    mockSelect
      .mockReturnValueOnce(makeSpamCheckChain(0))
      .mockReturnValue(makeAdminEmailsChain([{ email: 'admin@revamp-it.ch' }]))

    const req = new NextRequest('http://localhost/api/workshops/propose', {
      method: 'POST',
      body: JSON.stringify(VALID_PROPOSAL_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.proposalId).toBe('proposal-1')
  })

  it('admin notification email URL points to /admin/workshops/proposals (not the previous /admin/workshop-proposals which 404s)', async () => {
    mockSelect
      .mockReturnValueOnce(makeSpamCheckChain(0))
      .mockReturnValue(makeAdminEmailsChain([{ email: 'admin@revamp-it.ch' }]))

    const emailMod = require('@/lib/email')
    emailMod.sendEmail.mockResolvedValue({ success: true })

    const req = new NextRequest('http://localhost/api/workshops/propose', {
      method: 'POST',
      body: JSON.stringify(VALID_PROPOSAL_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)

    // sendEmail is called twice: applicant confirmation + admin notification.
    // The admin call uses template 'adminNewWorkshopProposal' and passes the
    // dashboard URL as its 5th template argument (last positional arg).
    expect(emailMod.sendEmail).toHaveBeenCalledWith(
      'admin@revamp-it.ch',
      'adminNewWorkshopProposal',
      expect.any(String),       // proposer name
      expect.any(String),       // proposer email
      VALID_PROPOSAL_BODY.title,
      'https://revamp-it.ch/admin/workshops/proposals',
    )
  })
})
