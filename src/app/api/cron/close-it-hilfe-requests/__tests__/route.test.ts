/**
 * @jest-environment node
 *
 * Tests for GET /api/cron/close-it-hilfe-requests
 *
 * Behaviors locked:
 *   - 401 when CRON_SECRET is set and the bearer is missing or wrong
 *   - 200 + { success, expired: N } when the bulk update succeeds
 *   - 500 when the DB throws
 *   - The where-clause locks the three predicates (status=open, expires_at IS NOT NULL,
 *     expires_at < NOW()) so a refactor can't quietly drop one and silently
 *     start expiring MATCHED/COMPLETED rows.
 */

const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockWhere = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeRequests: {
    id: 'ihr_id',
    status: 'ihr_status',
    expiresAt: 'ihr_expiresAt',
    updatedAt: 'ihr_updatedAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  isNotNull: (a: unknown) => ({ __isNotNull: a }),
  lt: (a: unknown, b: unknown) => ({ __lt: [a, b] }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) },
  ),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { OPEN: 'open', EXPIRED: 'expired' },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

beforeEach(() => {
  jest.resetAllMocks()
  delete process.env.CRON_SECRET

  // Chain: db.update(...).set(...).where(...).returning() -> [rows]
  mockReturning.mockResolvedValue([])
  mockWhere.mockReturnValue({ returning: mockReturning })
  mockSet.mockReturnValue({ where: mockWhere })
})

describe('GET /api/cron/close-it-hilfe-requests — auth', () => {
  it('returns 401 when CRON_SECRET is set and bearer is wrong', async () => {
    process.env.CRON_SECRET = 'top-secret'
    const req = new NextRequest('http://localhost/api/cron/close-it-hilfe-requests', {
      headers: { authorization: 'Bearer nope' },
    })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 401 when CRON_SECRET is set and bearer is missing', async () => {
    process.env.CRON_SECRET = 'top-secret'
    const req = new NextRequest('http://localhost/api/cron/close-it-hilfe-requests')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('skips auth check when CRON_SECRET is unset (dev mode)', async () => {
    const req = new NextRequest('http://localhost/api/cron/close-it-hilfe-requests')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it('accepts the correct bearer token', async () => {
    process.env.CRON_SECRET = 'top-secret'
    const req = new NextRequest('http://localhost/api/cron/close-it-hilfe-requests', {
      headers: { authorization: 'Bearer top-secret' },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
  })
})

describe('GET /api/cron/close-it-hilfe-requests — bulk expire', () => {
  it('returns expired=0 when nothing is past its deadline', async () => {
    mockReturning.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost/api/cron/close-it-hilfe-requests')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, expired: 0 })
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it('returns expired=N for each row transitioned', async () => {
    mockReturning.mockResolvedValueOnce([
      { id: 'req-1' },
      { id: 'req-2' },
      { id: 'req-3' },
    ])

    const req = new NextRequest('http://localhost/api/cron/close-it-hilfe-requests')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true, expired: 3 })
  })

  it('sets status=expired in the update payload', async () => {
    const req = new NextRequest('http://localhost/api/cron/close-it-hilfe-requests')
    await GET(req)

    const setPayload = mockSet.mock.calls[0]?.[0]
    expect(setPayload).toMatchObject({ status: 'expired' })
  })

  it('locks the three where-predicates so MATCHED/COMPLETED rows can never be touched', async () => {
    const req = new NextRequest('http://localhost/api/cron/close-it-hilfe-requests')
    await GET(req)

    // The where clause is and(eq(status, 'open'), isNotNull(expiresAt), lt(expiresAt, NOW()))
    const whereArg = mockWhere.mock.calls[0]?.[0] as { __and: unknown[] }
    expect(whereArg.__and).toHaveLength(3)

    const [statusFilter, notNullFilter, ltFilter] = whereArg.__and as Array<{
      __eq?: [unknown, unknown]
      __isNotNull?: unknown
      __lt?: [unknown, unknown]
    }>
    expect(statusFilter.__eq).toEqual(['ihr_status', 'open'])
    expect(notNullFilter.__isNotNull).toBe('ihr_expiresAt')
    expect(ltFilter.__lt?.[0]).toBe('ihr_expiresAt')
  })
})

describe('GET /api/cron/close-it-hilfe-requests — DB error', () => {
  it('returns 500 when the update throws', async () => {
    mockReturning.mockRejectedValueOnce(new Error('connection refused'))

    const req = new NextRequest('http://localhost/api/cron/close-it-hilfe-requests')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toEqual({ error: 'Internal error' })
  })
})
