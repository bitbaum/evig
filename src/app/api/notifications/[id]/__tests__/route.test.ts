/**
 * PATCH /api/notifications/[id] — mark a single notification as read
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'

// Mock Drizzle db with chainable API
const mockSelectResult: unknown[] = []
const mockUpdateResult: unknown[] = []

const mockSelectChain = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockImplementation(() => Promise.resolve(mockSelectResult)),
}

const mockUpdateChain = {
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  returning: jest.fn().mockImplementation(() => Promise.resolve(mockUpdateResult)),
}

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(() => mockSelectChain),
    update: jest.fn(() => mockUpdateChain),
  },
}))
jest.mock('@/db/schema', () => ({
  users: { id: 'users.id', email: 'users.email' },
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
jest.mock('@/lib/api/helpers', () => ({
  apiSuccess: jest.fn((data) => ({
    status: 200,
    json: () => Promise.resolve({ success: true, data }),
  })),
  apiError: jest.fn((_err: unknown, _msg: unknown, status = 500) => ({
    status,
    json: () => Promise.resolve({ success: false }),
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
  mockSelectResult.length = 0
  mockUpdateResult.length = 0
  // Reset chain mocks
  mockSelectChain.where.mockImplementation(() => Promise.resolve(mockSelectResult))
  mockUpdateChain.returning.mockImplementation(() => Promise.resolve(mockUpdateResult))
})

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

function mockSession(email = 'user@revamp-it.ch') {
  mockAuth.mockResolvedValue({ user: { email } })
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

  it('returns 404 when user is not found in the database', async () => {
    mockSession()
    // user lookup returns nothing
    mockSelectChain.where.mockResolvedValueOnce([])

    const res = await PATCH(mockRequest, routeParams('notif-1'))
    const body = await json(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns 200 with success when notification is marked as read', async () => {
    mockSession()
    // user lookup
    mockSelectChain.where.mockResolvedValueOnce([{ id: 'user-1' }])
    // UPDATE returns the row
    mockUpdateResult.push({ id: 'notif-1' })

    const res = await PATCH(mockRequest, routeParams('notif-1'))
    const body = await json(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 200 when notification is not found or already read (acceptable state)', async () => {
    mockSession()
    // user lookup
    mockSelectChain.where.mockResolvedValueOnce([{ id: 'user-1' }])
    // UPDATE matched nothing — empty array

    const res = await PATCH(mockRequest, routeParams('notif-missing'))
    const body = await json(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 500 when a database error occurs', async () => {
    mockSession()
    // user lookup throws
    mockSelectChain.where.mockRejectedValueOnce(new Error('DB error'))

    const res = await PATCH(mockRequest, routeParams('notif-1'))
    const body = await json(res)

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
