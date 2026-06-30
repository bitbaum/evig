/**
 * @jest-environment node
 *
 * Tests for GET /api/cron/release-escrow
 *
 * Behaviors locked:
 *   - 401 when CRON_SECRET is set and the bearer is missing/wrong
 *   - A due, active escrow is CAPTURED for its remaining amount, then marked released
 *   - A due escrow with nothing left to capture is closed WITHOUT a Payrexx call
 *   - A capture failure leaves the row active (not counted released) for the next run
 */

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockSelectWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockCapture = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...a: unknown[]) => { mockSelect(...a); return { from: mockFrom } },
    update: (...a: unknown[]) => { mockUpdate(...a); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  escrowAccounts: { id: 'ea_id', status: 'ea_status', releaseDeadline: 'ea_deadline', transactionId: 'ea_txid', totalAmountCents: 'ea_total', releasedAmountCents: 'ea_released' },
  paymentTransactions: { id: 'pt_id', providerTransactionId: 'pt_provider' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  isNotNull: (a: unknown) => ({ __isNotNull: a }),
  lt: (a: unknown, b: unknown) => ({ __lt: [a, b] }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), { raw: (s: string) => ({ __raw: s }) }),
}))

jest.mock('@/lib/payments/payrexx-client', () => ({
  captureTransaction: (...a: unknown[]) => mockCapture(...a),
}))

jest.mock('@/config/payment-status', () => ({
  ESCROW_STATUS: { ACTIVE: 'active', RELEASED: 'released' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

function setDue(rows: unknown[]) {
  // db.select(...).from(...).innerJoin(...).where(...) -> rows
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ where: mockSelectWhere })
  mockSelectWhere.mockResolvedValue(rows)
}

beforeEach(() => {
  jest.resetAllMocks()
  delete process.env.CRON_SECRET
  // db.update(...).set(...).where(...) resolves
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)
  mockCapture.mockResolvedValue({ id: 1, status: 'confirmed' })
})

const req = () => new NextRequest('http://localhost/api/cron/release-escrow')

describe('GET /api/cron/release-escrow — auth', () => {
  it('returns 401 when CRON_SECRET is set and bearer is wrong', async () => {
    process.env.CRON_SECRET = 'top-secret'
    const res = await GET(new NextRequest('http://localhost/api/cron/release-escrow', { headers: { authorization: 'Bearer nope' } }))
    expect(res.status).toBe(401)
  })
})

describe('GET /api/cron/release-escrow — release', () => {
  it('captures the remaining amount of a due escrow then marks it released', async () => {
    setDue([{ escrowId: 'e1', totalAmountCents: 5000, releasedAmountCents: 0, providerTransactionId: 'tx_1' }])
    const res = await GET(req())
    const body = await res.json()

    expect(mockCapture).toHaveBeenCalledWith('tx_1', 5000)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(body).toEqual({ success: true, found: 1, released: 1 })
  })

  it('closes a due escrow with nothing left to capture WITHOUT calling Payrexx', async () => {
    setDue([{ escrowId: 'e2', totalAmountCents: 5000, releasedAmountCents: 5000, providerTransactionId: 'tx_2' }])
    const res = await GET(req())
    const body = await res.json()

    expect(mockCapture).not.toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(body.released).toBe(1)
  })

  it('leaves the escrow active (not released) when capture fails', async () => {
    mockCapture.mockRejectedValue(new Error('Payrexx 500'))
    setDue([{ escrowId: 'e3', totalAmountCents: 5000, releasedAmountCents: 0, providerTransactionId: 'tx_3' }])
    const res = await GET(req())
    const body = await res.json()

    expect(mockCapture).toHaveBeenCalledWith('tx_3', 5000)
    expect(mockUpdate).not.toHaveBeenCalled() // not marked released
    expect(body.released).toBe(0)
    expect(body.errors).toHaveLength(1)
  })
})
