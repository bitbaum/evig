/**
 * GET /api/notifications  — list current user's notifications
 * PATCH /api/notifications — mark all as read
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { GET, PATCH } from '../route'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/auth/db', () => ({ query: jest.fn() }))
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

const mockAuth = auth as jest.Mock
const mockQuery = query as jest.Mock
const mockRequest = {} as NextRequest

beforeEach(() => {
  jest.clearAllMocks()
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
    mockQuery.mockResolvedValueOnce({ rows: [] }) // user lookup returns nothing

    const res = await GET(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns notifications with correct unreadCount', async () => {
    mockSession()
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] }) // user lookup
      .mockResolvedValueOnce({
        rows: [
          { id: 'n1', type: 'decision_voting', title: 'Abstimmung', content: '...', related_type: 'decision', related_id: 'dec-1', is_read: false, read_at: null, created_at: '2026-01-01T00:00:00Z' },
          { id: 'n2', type: 'protocol_finalized', title: 'Protokoll', content: '...', related_type: 'protocol', related_id: 'proto-1', is_read: true, read_at: '2026-01-02T00:00:00Z', created_at: '2025-12-01T00:00:00Z' },
        ],
      }) // notifications query

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
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] })
      .mockResolvedValueOnce({ rows: [] })

    const res = await GET(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(200)
    const data = body.data as { notifications: unknown[]; unreadCount: number }
    expect(data.notifications).toHaveLength(0)
    expect(data.unreadCount).toBe(0)
  })

  it('queries notifications ordered by unread first', async () => {
    mockSession()
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] })
      .mockResolvedValueOnce({ rows: [] })

    await GET(mockRequest)

    const [notifSql] = mockQuery.mock.calls[1] as [string]
    expect(notifSql).toContain('ORDER BY is_read ASC')
    expect(notifSql).toContain('LIMIT 30')
  })

  it('returns 500 when a database error occurs', async () => {
    mockSession()
    mockQuery.mockRejectedValueOnce(new Error('DB connection lost'))

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
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const res = await PATCH(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('marks all unread notifications as read and returns success', async () => {
    mockSession()
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] }) // user lookup
      .mockResolvedValueOnce({ rows: [], rowCount: 3 })      // UPDATE

    const res = await PATCH(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)

    const [updateSql, updateParams] = mockQuery.mock.calls[1] as [string, unknown[]]
    expect(updateSql).toContain('SET is_read = true')
    expect(updateSql).toContain('is_read = false')
    expect(updateParams).toContain('user-1')
  })

  it('returns 500 when a database error occurs', async () => {
    mockSession()
    mockQuery.mockRejectedValueOnce(new Error('DB error'))

    const res = await PATCH(mockRequest)
    const body = await json(res)

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
