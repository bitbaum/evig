/**
 * GET /api/notifications  — list current user's notifications
 * PATCH /api/notifications — mark all as read
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'

// Mock Drizzle db with chainable API
const mockDbResult: unknown[] = []
const mockChain = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockImplementation(() => Promise.resolve(mockDbResult)),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
}
// db.update() returns a different chain than db.select()
const mockUpdateChain = {
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue(undefined),
}

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(() => mockChain),
    update: jest.fn(() => mockUpdateChain),
  },
}))
jest.mock('@/db/schema', () => ({
  users: { id: 'users.id', email: 'users.email' },
  notifications: {
    id: 'n.id', type: 'n.type', title: 'n.title', content: 'n.content',
    relatedType: 'n.related_type', relatedId: 'n.related_id',
    isRead: 'n.is_read', readAt: 'n.read_at', createdAt: 'n.created_at',
    userId: 'n.user_id',
  },
}))
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  asc: jest.fn(),
  desc: jest.fn(),
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

// Must import AFTER mocks are set up
import { GET, PATCH } from '../route'
import { db } from '@/db'

const mockAuth = auth as jest.Mock
const mockRequest = {} as NextRequest

beforeEach(() => {
  jest.clearAllMocks()
  mockDbResult.length = 0
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockSession(email = 'user@revamp-it.ch') {
  mockAuth.mockResolvedValue({ user: { email } })
}

function mockNoSession() {
  mockAuth.mockResolvedValue(null)
}

async function json(response: Response) {
  return response.json() as Promise<Record<string, unknown>>
}

// ---------------------------------------------------------------------------
// GET /api/notifications
// ---------------------------------------------------------------------------

describe('GET /api/notifications', () => {
  it('returns 401 when not authenticated', async () => {
    mockNoSession()

    const res = await GET(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 404 when user is not found in the database', async () => {
    mockSession()
    // User lookup returns empty array
    const emptyChain = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
    };
    (db.select as jest.Mock).mockReturnValue(emptyChain)

    const res = await GET(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns notifications with correct unreadCount', async () => {
    mockSession()

    // First call: user lookup
    const userLookupResult = [{ id: 'user-1' }]
    // Second call: notifications
    const notificationsResult = [
      { id: 'n1', type: 'decision_voting', title: 'Abstimmung', content: '...', related_type: 'decision', related_id: 'dec-1', is_read: false, read_at: null, created_at: '2026-01-01T00:00:00Z' },
      { id: 'n2', type: 'protocol_finalized', title: 'Protokoll', content: '...', related_type: 'protocol', related_id: 'proto-1', is_read: true, read_at: '2026-01-02T00:00:00Z', created_at: '2025-12-01T00:00:00Z' },
    ]

    // Mock the user select chain (returns from .where())
    const userChain = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(userLookupResult),
    }

    // Mock the notifications select chain (returns from .limit())
    const notifChain = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(notificationsResult),
    }

    let callCount = 0;
    (db.select as jest.Mock).mockImplementation(() => {
      callCount++
      return callCount === 1 ? userChain : notifChain
    })

    const res = await GET(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    const data = body.data as { notifications: unknown[]; unreadCount: number }
    expect(data.notifications).toHaveLength(2)
    expect(data.unreadCount).toBe(1)
  })

  it('returns empty notifications with unreadCount 0 when table is empty', async () => {
    mockSession()

    const userChain = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([{ id: 'user-1' }]),
    }

    const notifChain = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    }

    let callCount = 0;
    (db.select as jest.Mock).mockImplementation(() => {
      callCount++
      return callCount === 1 ? userChain : notifChain
    })

    const res = await GET(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(200)
    const data = body.data as { notifications: unknown[]; unreadCount: number }
    expect(data.notifications).toHaveLength(0)
    expect(data.unreadCount).toBe(0)
  })

  it('returns 500 when a database error occurs', async () => {
    mockSession()
    // User lookup throws
    const errorChain = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockRejectedValue(new Error('DB connection lost')),
    };
    (db.select as jest.Mock).mockReturnValue(errorChain)

    const res = await GET(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PATCH /api/notifications — mark all as read
// ---------------------------------------------------------------------------

describe('PATCH /api/notifications', () => {
  it('returns 401 when not authenticated', async () => {
    mockNoSession()

    const res = await PATCH(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(401)
    expect(body.success).toBe(false)
  })

  it('returns 404 when user is not found in the database', async () => {
    mockSession()
    const emptyChain = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
    };
    (db.select as jest.Mock).mockReturnValue(emptyChain)

    const res = await PATCH(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('marks all unread notifications as read and returns success', async () => {
    mockSession()
    const userChain = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([{ id: 'user-1' }]),
    };
    (db.select as jest.Mock).mockReturnValue(userChain)
    mockUpdateChain.where.mockResolvedValue(undefined)

    const res = await PATCH(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(db.update).toHaveBeenCalled()
    expect(mockUpdateChain.set).toHaveBeenCalled()
    expect(mockUpdateChain.where).toHaveBeenCalled()
  })

  it('returns 500 when a database error occurs', async () => {
    mockSession()
    const errorChain = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockRejectedValue(new Error('DB error')),
    };
    (db.select as jest.Mock).mockReturnValue(errorChain)

    const res = await PATCH(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
