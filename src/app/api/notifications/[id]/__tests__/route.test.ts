/**
 * PATCH /api/notifications/[id] — mark a single notification as read
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { PATCH } from '../route'

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

function routeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.clearAllMocks()
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
    mockQuery.mockResolvedValueOnce({ rows: [] }) // user lookup returns nothing

    const res = await PATCH(mockRequest, routeParams('notif-1'))
    const body = await json(res)

    expect(res.status).toBe(404)
    expect(body.success).toBe(false)
  })

  it('returns 200 with success when notification is marked as read', async () => {
    mockSession()
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] })        // user lookup
      .mockResolvedValueOnce({ rows: [{ id: 'notif-1' }] })        // UPDATE returns the row

    const res = await PATCH(mockRequest, routeParams('notif-1'))
    const body = await json(res)

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('passes notification id and user id to UPDATE with ownership guard', async () => {
    mockSession()
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'user-42' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'notif-99' }] })

    await PATCH(mockRequest, routeParams('notif-99'))

    const [updateSql, updateParams] = mockQuery.mock.calls[1] as [string, unknown[]]
    expect(updateSql).toContain('SET is_read = true')
    expect(updateSql).toContain('AND user_id = $2')
    expect(updateSql).toContain('AND is_read = false')
    expect(updateParams).toEqual(['notif-99', 'user-42'])
  })

  it('returns 200 when notification is not found or already read (acceptable state)', async () => {
    mockSession()
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'user-1' }] })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE matched nothing

    const res = await PATCH(mockRequest, routeParams('notif-missing'))
    const body = await json(res)

    // Not an error — already read or belongs to another user are both fine
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 500 when a database error occurs', async () => {
    mockSession()
    mockQuery.mockRejectedValueOnce(new Error('DB error'))

    const res = await PATCH(mockRequest, routeParams('notif-1'))
    const body = await json(res)

    expect(res.status).toBe(500)
    expect(body.success).toBe(false)
  })
})
