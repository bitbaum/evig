/**
 * @jest-environment node
 *
 * Tests for GET /api/health/auth-db
 *
 * Mission-relevant: this diagnostic endpoint verifies that the Drizzle ORM
 * connection is live and core tables exist. If it always returns 200 when the
 * DB is down, deployment pipelines and on-call alerting are blind to outages.
 *
 * Behaviors locked:
 *   GET /api/health/auth-db
 *   - returns 200 when connect check passes and tables exist (count >= 2)
 *   - diagnostics.ok is true when all checks pass
 *   - diagnostics.checks includes 'connect' and 'schema_core_tables' entries
 *   - returns 500 (early exit) when the connect execute throws
 *   - returns 500 when schema table count < 2
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  users: {},
  userProfiles: {},
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'SELECT 1' }),
    { raw: jest.fn() },
  ),
  getTableName: jest.fn().mockReturnValue('users'),
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccess: (data: unknown, status = 200) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data }, { status })
  },
  apiError: (err: unknown, msg: string, status = 500) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status })
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET } from '../route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// First call: connect check (returns rows), second: schema check (returns count row)
function setupHealthyMocks() {
  mockExecute
    .mockResolvedValueOnce({ rows: [{ now: '2026-01-01', db: 'revampit' }] }) // connect
    .mockResolvedValueOnce({ rows: [{ count: 2 }] })                         // schema tables
}

beforeEach(() => {
  jest.clearAllMocks()
  setupHealthyMocks()
})

// ============================================================================
// GET /api/health/auth-db
// ============================================================================

describe('GET /api/health/auth-db — all healthy', () => {
  it('returns 200 when both checks pass', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })

  it('diagnostics.ok is true', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.ok).toBe(true)
  })

  it('includes a connect check entry', async () => {
    const response = await GET()
    const body = await response.json()
    const connectCheck = body.data.checks.find((c: { name: string }) => c.name === 'connect')
    expect(connectCheck).toBeDefined()
    expect(connectCheck.ok).toBe(true)
  })

  it('includes a schema_core_tables check entry', async () => {
    const response = await GET()
    const body = await response.json()
    const schemaCheck = body.data.checks.find((c: { name: string }) => c.name === 'schema_core_tables')
    expect(schemaCheck).toBeDefined()
    expect(schemaCheck.ok).toBe(true)
  })
})

describe('GET /api/health/auth-db — connect failure', () => {
  it('returns 500 when db.execute throws on connect check', async () => {
    mockExecute.mockReset()
    mockExecute.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const response = await GET()
    expect(response.status).toBe(500)
  })

  it('returns success: false on connect failure', async () => {
    mockExecute.mockReset()
    mockExecute.mockRejectedValueOnce(new Error('timeout'))
    const response = await GET()
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('GET /api/health/auth-db — schema check failure', () => {
  it('returns 500 when table count is less than 2', async () => {
    mockExecute.mockReset()
    mockExecute
      .mockResolvedValueOnce({ rows: [{ now: '2026-01-01', db: 'revampit' }] })
      .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // only 1 table found
    const response = await GET()
    expect(response.status).toBe(500)
  })

  it('diagnostics.ok is false when schema check fails', async () => {
    mockExecute.mockReset()
    mockExecute
      .mockResolvedValueOnce({ rows: [{ now: '2026-01-01', db: 'revampit' }] })
      .mockResolvedValueOnce({ rows: [{ count: 0 }] })
    const response = await GET()
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
