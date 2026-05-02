/**
 * @jest-environment node
 *
 * Tests for GET /api/health
 *
 * Mission-relevant: monitoring uses this to determine service availability.
 * When the database is down the response should be 503, not 200, so alerts
 * fire. When only Meilisearch is down the system is degraded, not unhealthy.
 *
 * Behaviors locked:
 *   GET /api/health
 *   - returns 200 when all services healthy
 *   - returns 503 when database is unhealthy
 *   - returns 200 with degraded status when only Meilisearch is down
 *   - includes database and meilisearch in services
 *   - includes latency in healthy service responses
 *   - includes timestamp in response
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'sql' }), { raw: jest.fn() }),
}))

jest.mock('@/config/urls', () => ({
  MEILISEARCH_URL: 'http://localhost:7700',
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MEILISEARCH_OK = new Response(JSON.stringify({ status: 'available' }), { status: 200 })
const MEILISEARCH_DOWN = new Response(null, { status: 503 })

beforeEach(() => {
  jest.resetAllMocks()
  mockDbExecute.mockResolvedValue({ rows: [{ now: new Date().toISOString() }] })

  // Static mock for global fetch — survives resetAllMocks
  global.fetch = jest.fn().mockResolvedValue(MEILISEARCH_OK)
})

// ============================================================================
// GET /api/health
// ============================================================================

describe('GET /api/health — all healthy', () => {
  it('returns 200', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })

  it('returns status: healthy', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.status).toBe('healthy')
  })

  it('includes both services', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.services.database).toBeDefined()
    expect(body.data.services.meilisearch).toBeDefined()
  })

  it('includes timestamp', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.timestamp).toBeTruthy()
  })

  it('reports database as healthy', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.data.services.database.status).toBe('healthy')
  })

  it('includes database latency', async () => {
    const response = await GET()
    const body = await response.json()
    expect(typeof body.data.services.database.latency).toBe('number')
  })
})

describe('GET /api/health — database unhealthy', () => {
  it('returns 503 when DB throws', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const response = await GET()
    expect(response.status).toBe(503)
  })

  it('returns status: unhealthy', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const response = await GET()
    const body = await response.json()
    expect(body.data.status).toBe('unhealthy')
  })

  it('reports database as unhealthy', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const response = await GET()
    const body = await response.json()
    expect(body.data.services.database.status).toBe('unhealthy')
  })
})

describe('GET /api/health — meilisearch unhealthy', () => {
  it('returns 200 with degraded status when Meilisearch is down', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(MEILISEARCH_DOWN)
    const response = await GET()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.status).toBe('degraded')
  })

  it('reports meilisearch as unhealthy', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(MEILISEARCH_DOWN)
    const response = await GET()
    const body = await response.json()
    expect(body.data.services.meilisearch.status).toBe('unhealthy')
  })
})
