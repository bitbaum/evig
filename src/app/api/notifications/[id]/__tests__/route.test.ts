/**
 * PATCH /api/notifications/[id] — mark a single notification as read
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'

const mockUpdateResult: unknown[] = []

const mockUpdateChain = {
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  returning: jest.fn().mockImplementation(() => Promise.resolve(mockUpdateResult)),
}

jest.mock('@/db', () => ({
  db: {
    update: jest.fn(() => mockUpdateChain),
  },
}))
jest.mock('@/db/schema', () => ({
  notifications: {
    id: 'n.id', userId: 'n.user_id', isRead: 'n.is_read', readAt: 'n.read_at',
  },
}))
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  sql: jest.fn(),
}))
jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/permissions', () => ({
  canAccessSection: jest.fn(() => true),
  toStaffUser: jest.fn(),
  ADMIN_SECTIONS: {},
}))
jest.mock('@/lib/api/helpers', () => ({
  apiSuccess: jest.fn((data) => ({
    status: 200,
    json: () => Promise.resolve({ success: true, data }),
  })),
  apiError: jest.fn((_err: unknown, _msg: unknown, status = 500) => ({
    status,
    json: () => Promise.resolve({ success: false }),
  })),
  apiUnauthorized: jest.fn((msg?: string) => ({
    status: 401,
    json: () => Promise.resolve({ success: false, error: msg || 'Unauthorized' }),
  })),
  apiForbidden: jest.fn((msg?: string) => ({
    status: 403,
    json: () => Promise.resolve({ success: false, error: msg || 'Forbidden' }),
  })),
}))
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))

import { PATCH } from '../route'

const mockAuth = auth as jest.Mock
const mockRequest = {} as NextRequest

function routeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdateResult.length = 0
  mockUpdateChain.returning.mockImplementation(() => Promise.resolve(mockUpdateResult))
})

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

function mockSession(id = 'user-123', email = 'user@revamp-it.ch') {
  mockAuth.mockResolvedValue({ user: { id, email, isStaff: false, staffPermissions: [] }, expires: '2099-01-01' })
}

function mockNoSession() {
  mockAuth.mockResolvedValue(null)
}

// ---------------------------------------------------------------------------
// PATCH /api/notifications/[id]
// ---------------------------------------------------------------------------

describe('PATCH /api/notifications/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockNoSession()

    const res = await PATCH(mockRequest, routeParams('notif-1'))
    const body = await json(res)

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 200 with success when notification is marked as read', async () => {
    mockSession()
    mockUpdateResult.push({ id: 'notif-1' })

    const res = await PATCH(mockRequest, routeParams('notif-1'))
    const body = await json(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 200 when notification is not found or already read', async () => {
    mockSession()
    // UPDATE matched nothing — empty array (no result pushed)

    const res = await PATCH(mockRequest, routeParams('notif-missing'))
    const body = await json(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 500 when a database error occurs', async () => {
    mockSession()
    mockUpdateChain.returning.mockRejectedValue(new Error('DB error'))

    const res = await PATCH(mockRequest, routeParams('notif-1'))
    const body = await json(res)

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
