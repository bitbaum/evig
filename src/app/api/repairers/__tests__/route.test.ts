/**
 * @jest-environment node
 *
 * Tests for GET /api/repairers (legacy proxy → /api/technicians?tier=professional)
 *
 * Behaviors locked:
 *   GET - forwards to techniciansGET and remaps { technicians } → { repairers }
 *   GET - 200 with repairers list, 200 with empty list, 500 on upstream error
 */

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

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_TECHNICIAN = {
  id: 'rep-1',
  userId: 'user-1',
  name: 'Max Muster',
  profileTier: 'professional',
}

beforeEach(() => {
  jest.resetAllMocks()
})

// ============================================================================
// GET — legacy proxy
// ============================================================================

describe('GET /api/repairers — legacy proxy', () => {
  it('returns 200 and remaps technicians → repairers', async () => {
    mockTechniciansGET.mockResolvedValue(
      Response.json({ success: true, technicians: [MOCK_TECHNICIAN], pagination: { total: 1 } })
    )
    const req = new NextRequest('http://localhost/api/repairers')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.repairers).toHaveLength(1)
    expect(body.repairers[0].id).toBe('rep-1')
    expect(body.technicians).toBeUndefined()
  })

  it('returns 200 with empty repairers when upstream returns no technicians', async () => {
    mockTechniciansGET.mockResolvedValue(
      Response.json({ success: true, technicians: [], pagination: { total: 0 } })
    )
    const req = new NextRequest('http://localhost/api/repairers')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.repairers).toEqual([])
  })

  it('forces tier=professional regardless of query params', async () => {
    mockTechniciansGET.mockResolvedValue(
      Response.json({ success: true, technicians: [] })
    )
    const req = new NextRequest('http://localhost/api/repairers?canton=BE')
    await GET(req)
    // The proxied URL passed to techniciansGET must have tier=professional
    const proxiedReq = mockTechniciansGET.mock.calls[0][0] as Request
    const url = new URL(proxiedReq.url)
    expect(url.searchParams.get('tier')).toBe('professional')
    // Original param forwarded
    expect(url.searchParams.get('canton')).toBe('BE')
  })

  it('preserves upstream status code', async () => {
    mockTechniciansGET.mockResolvedValue(
      Response.json({ success: false, error: 'error' }, { status: 500 })
    )
    const req = new NextRequest('http://localhost/api/repairers')
    const response = await GET(req)
    expect(response.status).toBe(500)
  })

  it('returns repairers=[] when upstream body lacks technicians key', async () => {
    mockTechniciansGET.mockResolvedValue(
      Response.json({ success: true })
    )
    const req = new NextRequest('http://localhost/api/repairers')
    const response = await GET(req)
    const body = await response.json()
    expect(body.repairers).toEqual([])
  })

  it('returns 500 when upstream throws', async () => {
    mockTechniciansGET.mockRejectedValue(new Error('upstream failure'))
    const req = new NextRequest('http://localhost/api/repairers')
    const response = await GET(req)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
