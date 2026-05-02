/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/payments/dashboard
 *
 * Behaviors locked:
 *   GET - 401, 200 (8 parallel db.execute calls)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session)
      })
  },
}))

const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('@/db/schema/payments', () => ({
  paymentTransactions: {},
  paymentProviders: {},
  escrowAccounts: {},
  refunds: {},
  paymentDisputes: {},
}))

jest.mock('@/db/schema/auth', () => ({
  users: {},
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  getTableName: () => 'mock_table',
}))

jest.mock('@/config/payment-status', () => ({
  PAYMENT_STATUS: { SUCCEEDED: 'succeeded', FAILED: 'failed' },
  ESCROW_STATUS: { ACTIVE: 'active', RELEASED: 'released' },
  PAYMENT_DISPUTE_STATUS: { OPENED: 'opened', LOST: 'lost' },
}))

jest.mock('@/config/refund', () => ({
  REFUND_STATUS: { COMPLETED: 'completed', REQUESTED: 'requested', PROCESSING: 'processing' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_OVERVIEW = { total_transactions: 10, successful_transactions: 9, failed_transactions: 1, total_volume_cents: 50000, total_fees_cents: 500, total_refunds_cents: 0, avg_processing_time_minutes: 1.5 }
const MOCK_ESCROW = { total_escrows: '5', active_escrows: '3', released_escrows: '2', total_escrow_amount_cents: 10000, total_released_amount_cents: 5000 }
const MOCK_REFUND = { total_refunds: '2', completed_refunds: '1', pending_refunds: '1', total_refund_amount_cents: 3000 }
const MOCK_DISPUTE = { total_disputes: '1', open_disputes: '1', lost_disputes: '0', total_dispute_amount_cents: 2000 }

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/payments/dashboard')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString(), { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // 8 parallel db.execute calls
  mockDbExecute
    .mockResolvedValueOnce({ rows: [MOCK_OVERVIEW] })     // overview
    .mockResolvedValueOnce({ rows: [] })                   // currency
    .mockResolvedValueOnce({ rows: [] })                   // provider
    .mockResolvedValueOnce({ rows: [] })                   // daily volume
    .mockResolvedValueOnce({ rows: [] })                   // recent transactions
    .mockResolvedValueOnce({ rows: [MOCK_ESCROW] })        // escrow
    .mockResolvedValueOnce({ rows: [MOCK_REFUND] })        // refunds
    .mockResolvedValueOnce({ rows: [MOCK_DISPUTE] })       // disputes
})

describe('GET /api/admin/payments/dashboard — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/payments/dashboard — authenticated', () => {
  it('returns 200 with dashboard data', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.overview.totalTransactions).toBe(10)
    expect(body.data.overview.successRate).toBe('90.00%')
    expect(body.data.escrow.totalEscrows).toBe(5)
    expect(body.data.refunds.totalRefunds).toBe(2)
    expect(body.data.disputes.totalDisputes).toBe(1)
    expect(mockDbExecute).toHaveBeenCalledTimes(8)
  })
})
