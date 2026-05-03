/**
 * @jest-environment node
 *
 * Tests for GET/PATCH /api/admin/workshops/proposals/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/workshops/proposals/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when not found
 *   - returns 200 with proposal
 *
 *   PATCH /api/admin/workshops/proposals/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when action is not 'edit'
 *   - returns 400 when no fields provided
 *   - returns 404 when proposal not found
 *   - returns 400 when proposal not pending
 *   - returns 200 on success
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
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
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockReturning = jest.fn()
const mockCreateEditSnapshot = jest.fn()
const mockAppendEditHistory = jest.fn()

// alias called at module init
jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_table: unknown, name: string) => ({ id: `${name}_id`, name: `${name}_name`, email: `${name}_email` }),
}))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  workshopProposals: { id: 'wp_id', userId: 'wp_userId', title: 'wp_title', status: 'wp_status', editHistory: 'wp_editHistory', lastEditedBy: 'wp_lastEditedBy', lastEditedAt: 'wp_lastEditedAt' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Interner Serverfehler',
    WORKSHOP_PROPOSAL_NOT_FOUND: 'Workshop-Vorschlag nicht gefunden',
  },
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: { PENDING: 'pending', APPROVED: 'approved' },
}))

jest.mock('@/lib/admin/edit-utils', () => ({
  createEditSnapshot: (...args: unknown[]) => mockCreateEditSnapshot.apply(null, args),
  appendEditHistory: (...args: unknown[]) => mockAppendEditHistory.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// WorkshopProposal type import
jest.mock('@/components/workshops/types', () => ({}))

import { NextRequest } from 'next/server'
import { GET, PATCH } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_PROPOSAL = { id: 'prop-1', title: 'Workshop', status: 'pending', editHistory: null }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/workshops/proposals/prop-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'prop-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockWhere.mockResolvedValue([MOCK_PROPOSAL])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ ...MOCK_PROPOSAL, title: 'Updated Workshop' }])

  mockCreateEditSnapshot.mockReturnValue({ fields_changed: ['title'], snapshot: {} })
  mockAppendEditHistory.mockReturnValue([{ id: 'e-1' }])
})

describe('GET /api/admin/workshops/proposals/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/workshops/proposals/[id] — authenticated', () => {
  it('returns 404 when not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with proposal', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.proposal.id).toBe('prop-1')
  })
})

describe('PATCH /api/admin/workshops/proposals/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { action: 'edit', fields: { title: 'New' } }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/workshops/proposals/[id] — validation', () => {
  it('returns 400 when action is not edit', async () => {
    const response = await PATCH(makeRequest('PATCH', { action: 'approve', fields: {} }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when no fields provided', async () => {
    const response = await PATCH(makeRequest('PATCH', { action: 'edit', fields: {} }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when proposal not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest('PATCH', { action: 'edit', fields: { title: 'New' } }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when proposal not pending', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_PROPOSAL, status: 'approved' }])
    const response = await PATCH(makeRequest('PATCH', { action: 'edit', fields: { title: 'New' } }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/workshops/proposals/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await PATCH(makeRequest('PATCH', { action: 'edit', fields: { title: 'Updated Workshop' } }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.proposal.title).toBe('Updated Workshop')
  })
})
