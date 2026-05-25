/**
 * @jest-environment node
 *
 * Tests for POST /api/repairer/apply (authenticated)
 *
 * Behaviors locked:
 *   POST - 401 (no session), 400 (validation failure), 400 (already applied), 200 (success)
 */

const mockAuth = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockUpdateReturning = jest.fn()

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

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  repairerApplications: {
    id: 'ra_id',
    userId: 'ra_userId',
    status: 'ra_status',
    businessName: 'ra_businessName',
    businessType: 'ra_businessType',
    description: 'ra_description',
    yearsExperience: 'ra_yearsExperience',
    phone: 'ra_phone',
    website: 'ra_website',
    address: 'ra_address',
    city: 'ra_city',
    postalCode: 'ra_postalCode',
    serviceRadiusKm: 'ra_serviceRadiusKm',
    remoteServices: 'ra_remoteServices',
    hourlyRateCents: 'ra_hourlyRateCents',
    emergencyFeeCents: 'ra_emergencyFeeCents',
    homeVisitFeeCents: 'ra_homeVisitFeeCents',
    servicesOffered: 'ra_servicesOffered',
    specializations: 'ra_specializations',
    certifications: 'ra_certifications',
    insuranceInfo: 'ra_insuranceInfo',
    portfolioImages: 'ra_portfolioImages',
    verificationDocuments: 'ra_verificationDocuments',
    termsAccepted: 'ra_termsAccepted',
  },
  users: {
    id: 'u_id',
    email: 'u_email',
    isStaff: 'u_isStaff',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  or: (...args: unknown[]) => ({ __or: args }),
  desc: (a: unknown) => ({ __desc: a }),
  asc: (a: unknown) => ({ __asc: a }),
  isNull: (a: unknown) => ({ __isNull: a }),
  isNotNull: (a: unknown) => ({ __isNotNull: a }),
  count: () => ({ __count: true }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
    PENDING_APPLICATION: 'Du hast bereits eine ausstehende Bewerbung',
  },
  SUCCESS_MESSAGES: {
    REPAIRER_APPLICATION_SUBMITTED: 'Bewerbung eingereicht',
  },
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: { PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' },
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'http://localhost:3000',
}))

const mockSendEmail = jest.fn()

jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// Mock validateBody to return success/failure based on test setup
const mockValidateBody = jest.fn()
jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  RepairerApplicationSchema: {},
}))

jest.mock('@/config/it-hilfe', () => ({
  getSkillIds: () => ['hardware', 'software'],
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const VALID_FORM_DATA = {
  businessType: 'individual',
  description: 'Ich repariere Laptops',
  yearsExperience: '3',
  phone: '+41791234567',
  address: 'Hauptstrasse 1',
  city: 'Bern',
  postalCode: '3000',
  serviceRadius: '20',
  remoteServices: 'true',
  servicesOffered: JSON.stringify(['laptop']),
  specializations: JSON.stringify([]),
  certifications: JSON.stringify([]),
  termsAccepted: 'true',
}

function makeValidFormDataBody() {
  const fd = new FormData()
  for (const [k, v] of Object.entries(VALID_FORM_DATA)) {
    fd.append(k, v)
  }
  return fd
}

function makeRequest(formData: FormData) {
  return new NextRequest('http://localhost/api/repairer/apply', {
    method: 'POST',
    body: formData,
  })
}

const VALID_PARSED = {
  businessType: 'individual',
  businessName: null,
  description: 'Ich repariere Laptops',
  yearsExperience: 3,
  phone: '+41791234567',
  website: null,
  address: 'Hauptstrasse 1',
  city: 'Bern',
  postalCode: '3000',
  serviceRadius: 20,
  remoteServices: true,
  hourlyRate: null,
  emergencyFee: null,
  homeVisitFee: null,
  servicesOffered: ['laptop'],
  specializations: [],
  certifications: [],
  insuranceInfo: null,
  termsAccepted: true as const,
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValidateBody.mockReturnValue({ success: true, data: VALID_PARSED })
  mockSendEmail.mockResolvedValue({ success: true })

  // Default: no existing application
  const mockWhere = jest.fn().mockResolvedValue([])
  const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })

  // Default: successful insert
  mockReturning.mockResolvedValue([{ id: 'app-1' }])
  mockValues.mockReturnValue({ returning: mockReturning })

  // Default: successful update (for re-applications)
  mockUpdateReturning.mockResolvedValue([{ id: 'app-existing' }])
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning })
  mockSet.mockReturnValue({ where: mockUpdateWhere })
})

// ============================================================================
// POST — auth checks
// ============================================================================

describe('POST /api/repairer/apply — authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest(makeValidFormDataBody())
    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValueOnce({ user: {}, expires: '2027-01-01' })
    const req = makeRequest(makeValidFormDataBody())
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST — validation
// ============================================================================

describe('POST /api/repairer/apply — validation', () => {
  it('returns 400 when validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server') as typeof import('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const req = makeRequest(new FormData())
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// POST — duplicate application checks
// ============================================================================

describe('POST /api/repairer/apply — duplicate checks', () => {
  it('returns 400 when application is already approved', async () => {
    const mockWhere = jest.fn().mockResolvedValue([{ id: 'app-existing', status: 'approved' }])
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = makeRequest(makeValidFormDataBody())
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
  })

  it('returns 400 when application is pending', async () => {
    const mockWhere = jest.fn().mockResolvedValue([{ id: 'app-existing', status: 'pending' }])
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = makeRequest(makeValidFormDataBody())
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('re-submits (200, UPDATE) when prior application was REJECTED', async () => {
    // The user was rejected; they're re-applying. The route should reuse
    // the existing row (UPDATE) — UNIQUE(userId) prevents inserting a new
    // one — and reset its status to PENDING. Prior to this fix the route
    // returned 400 "Du hast bereits ein Reparateur-Profil" and locked the
    // user out forever.
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        const mockWhere = jest.fn().mockResolvedValue([{ id: 'app-existing', status: 'rejected' }])
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      const mockWhere = jest.fn().mockResolvedValue([{ email: 'admin@revamp-it.ch' }])
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      return { from: mockFrom }
    })

    const req = makeRequest(makeValidFormDataBody())
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.applicationId).toBe('app-existing')
    // UPDATE was called, INSERT was NOT.
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('re-submits (200, UPDATE) when prior application was REQUIRES_CHANGES', async () => {
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        const mockWhere = jest.fn().mockResolvedValue([{ id: 'app-existing', status: 'requires_changes' }])
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      const mockWhere = jest.fn().mockResolvedValue([{ email: 'admin@revamp-it.ch' }])
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      return { from: mockFrom }
    })

    const req = makeRequest(makeValidFormDataBody())
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

// ============================================================================
// POST — success
// ============================================================================

describe('POST /api/repairer/apply — success', () => {
  it('returns 200 with applicationId on successful submission', async () => {
    // mockSelect default: no existing application
    // mockInsert chain: insert + returning → [{ id: 'app-1' }]
    // Then second select for admin emails
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        // Check existing application
        const mockWhere = jest.fn().mockResolvedValue([])
        const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
        return { from: mockFrom }
      }
      // Admin emails query
      const mockWhere = jest.fn().mockResolvedValue([{ email: 'admin@revamp-it.ch' }])
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      return { from: mockFrom }
    })

    const req = makeRequest(makeValidFormDataBody())
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.applicationId).toBe('app-1')
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })
})
