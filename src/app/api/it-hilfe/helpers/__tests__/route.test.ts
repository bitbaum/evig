/**
 * @jest-environment node
 *
 * Tests for GET /api/it-hilfe/helpers (legacy proxy to /api/technicians)
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockTechniciansGET = jest.fn()

jest.mock('@/app/api/technicians/route', () => ({
  GET: (...args: unknown[]) => mockTechniciansGET(...args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/repairer-status', () => ({
  REPAIRER_PROFILE_TIER: { COMMUNITY: 'community' },
}))

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRequest(url = 'http://localhost/api/it-hilfe/helpers') {
  return new NextRequest(url)
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('GET /api/it-hilfe/helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('proxies to technicians and remaps response shape', async () => {
    const technicians = [{ id: 'tech-1', name: 'Alice' }, { id: 'tech-2', name: 'Bob' }]
    const pagination = { total: 2, limit: 20, offset: 0 }

    mockTechniciansGET.mockResolvedValue(
      Response.json({ technicians, pagination }, { status: 200 })
    )

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.helpers).toEqual(technicians)
    expect(body.total).toBe(2)
    expect(body.pagination).toEqual(pagination)
  })

  it('returns 500 when techniciansGET throws', async () => {
    mockTechniciansGET.mockRejectedValue(new Error('upstream failure'))

    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
  })

  it('handles missing pagination gracefully', async () => {
    const technicians = [{ id: 'tech-1' }]
    mockTechniciansGET.mockResolvedValue(
      Response.json({ technicians }, { status: 200 })
    )

    const res = await GET(makeRequest())
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.total).toBe(0)
    expect(Array.isArray(body.helpers)).toBe(true)
  })
})
