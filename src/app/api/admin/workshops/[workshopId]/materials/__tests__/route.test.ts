/**
 * @jest-environment node
 *
 * Tests for GET/POST /api/admin/workshops/[workshopId]/materials
 *
 * Behaviors locked:
 *   GET - 401, 200
 *   POST - 401, 400 (missing title), 400 (missing url), 400 (invalid type), 200
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request, context?: { params?: Promise<{ workshopId: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  workshopMaterials: {
    id: 'wm_id', workshopId: 'wm_workshopId', instanceId: 'wm_instanceId',
    title: 'wm_title', description: 'wm_desc', materialType: 'wm_type',
    url: 'wm_url', fileSizeBytes: 'wm_fileSize', accessType: 'wm_accessType',
    displayOrder: 'wm_displayOrder', isActive: 'wm_isActive', createdAt: 'wm_createdAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  asc: (col: unknown) => ({ __asc: col }),
  desc: (col: unknown) => ({ __desc: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_MATERIAL_ACCESS_TYPE: { PUBLIC: 'public', REGISTERED: 'registered', ATTENDED: 'attended' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_MATERIAL = { id: 'mat-1', workshop_id: 'wks-1', title: 'Slides', material_type: 'pdf', url: 'https://example.com/slides.pdf', access_type: 'registered' }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/workshops/wks-1/materials', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(workshopId = 'wks-1') {
  return { params: Promise.resolve({ workshopId }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockResolvedValue([MOCK_MATERIAL])

  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([MOCK_MATERIAL])
})

describe('GET /api/admin/workshops/[workshopId]/materials — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/workshops/[workshopId]/materials — authenticated', () => {
  it('returns 200 with materials list', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.materials).toHaveLength(1)
    expect(body.data.materials[0].id).toBe('mat-1')
  })
})

describe('POST /api/admin/workshops/[workshopId]/materials — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest('POST', { title: 'Slides', url: 'https://example.com', materialType: 'pdf' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/workshops/[workshopId]/materials — validation', () => {
  it('returns 400 when title is missing', async () => {
    const response = await POST(makeRequest('POST', { url: 'https://example.com', materialType: 'pdf' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when url is missing', async () => {
    const response = await POST(makeRequest('POST', { title: 'Slides', materialType: 'pdf' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when materialType is invalid', async () => {
    const response = await POST(makeRequest('POST', { title: 'Slides', url: 'https://example.com', materialType: 'invalid' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/workshops/[workshopId]/materials — success', () => {
  it('returns 200 on success', async () => {
    const response = await POST(makeRequest('POST', { title: 'Slides', url: 'https://example.com', materialType: 'pdf' }), makeContext())
    expect(response.status).toBe(200)
    expect(mockReturning).toHaveBeenCalledTimes(1)
  })
})
