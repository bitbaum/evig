/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/tax-reports
 *
 * Behaviors locked:
 *   GET - 401, 200 (vat), 200 (transactions), 200 (compliance with 3 parallel db.execute)
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
const mockGenerateTaxReport = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('@/db/schema/payments', () => ({
  paymentTransactions: {},
  refunds: {},
  escrowAccounts: {},
  paymentDisputes: {},
}))

jest.mock('@/db/schema/auth', () => ({
  users: {},
  userProfiles: {},
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  getTableName: () => 'mock_table',
}))

jest.mock('@/config/payment-status', () => ({
  PAYMENT_STATUS: { SUCCEEDED: 'succeeded' },
  PAYMENT_TRANSACTION_TYPE: { PAYMENT: 'payment' },
}))

jest.mock('@/lib/payments/tax-compliance', () => ({
  generateTaxReport: (...args: unknown[]) => mockGenerateTaxReport.apply(null, args),
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

const MOCK_VAT_REPORT = {
  period: { start: '2026-01-01', end: '2026-01-31' },
  country: 'CH',
  summary: { totalRevenue: 1000, vatCollected: 77 },
  compliance: { vatRequired: true },
  transactions: [],
}

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/tax-reports')
  Object.entries({ type: 'vat', ...params }).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString(), { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Main transactions query
  mockDbExecute.mockResolvedValue({ rows: [] })

  mockGenerateTaxReport.mockReturnValue(MOCK_VAT_REPORT)
})

describe('GET /api/admin/tax-reports — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/tax-reports — authenticated', () => {
  it('returns 200 for vat report type', async () => {
    const response = await GET(makeRequest({ type: 'vat' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.report.type).toBe('vat')
    expect(mockGenerateTaxReport).toHaveBeenCalledTimes(1)
  })

  it('returns 200 for transactions report type', async () => {
    const response = await GET(makeRequest({ type: 'transactions' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.report.totalTransactions).toBe(0)
  })

  it('returns 200 for compliance report type with parallel db queries', async () => {
    // compliance runs 3 more db.execute via Promise.all after the main query
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })                          // main transactions
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })           // refunds
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })           // escrows
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })           // disputes
    const response = await GET(makeRequest({ type: 'compliance' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.report.compliance.totalRefunds).toBe(2)
  })
})
