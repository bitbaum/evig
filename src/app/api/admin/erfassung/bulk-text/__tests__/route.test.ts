/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/erfassung/bulk-text
 *
 * Behaviors locked:
 *   POST /api/admin/erfassung/bulk-text
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 200 with products array
 *   - returns 500 when extraction throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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

const mockExtractMultipleProducts = jest.fn()

jest.mock('@/lib/erfassung/bulk-extraction', () => ({
  extractMultipleProducts: (...args: unknown[]) => mockExtractMultipleProducts.apply(null, args),
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: jest.fn().mockReturnValue({ success: true, data: { text: 'Product A\nProduct B' } }),
  BulkTextSchema: {},
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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

function makeRequest(body: Record<string, unknown> = { text: 'Product A\nProduct B' }) {
  return new NextRequest('http://localhost/api/admin/erfassung/bulk-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockExtractMultipleProducts.mockResolvedValue([
    { produktname: 'Product A', hersteller: 'Brand A' },
    { produktname: 'Product B', hersteller: 'Brand B' },
  ])

  const schemas = require('@/lib/schemas')
  schemas.validateBody.mockReturnValue({ success: true, data: { text: 'Product A\nProduct B' } })
})

// ============================================================================
// POST /api/admin/erfassung/bulk-text
// ============================================================================

describe('POST /api/admin/erfassung/bulk-text — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/erfassung/bulk-text — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const schemas = require('@/lib/schemas')
    const { NextResponse } = jest.requireActual('next/server')
    schemas.validateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/erfassung/bulk-text — success', () => {
  it('returns 200 with products array', async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.productCount).toBe(2)
    expect(body.data.products).toHaveLength(2)
  })

  it('returns 500 when extraction throws', async () => {
    mockExtractMultipleProducts.mockRejectedValueOnce(new Error('AI error'))
    const response = await POST(makeRequest())
    expect(response.status).toBe(500)
  })
})
