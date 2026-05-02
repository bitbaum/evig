/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/erfassung/bulk-save
 *
 * Behaviors locked:
 *   POST /api/admin/erfassung/bulk-save
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when product count exceeds limit
 *   - returns 200 with succeeded/failed counts when all succeed
 *   - returns 200 with partial results when a product is missing required fields
 *   - returns 200 with failed result when db.transaction throws for a product
 *   - returns 500 when outer try/catch triggers (validateBody throws)
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

const mockCreateErfassungProduct = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/db', () => ({
  db: {
    transaction: (...args: unknown[]) => mockTransaction.apply(null, args),
  },
}))

jest.mock('@/lib/erfassung/create-product', () => ({
  createErfassungProduct: (...args: unknown[]) => mockCreateErfassungProduct.apply(null, args),
}))

jest.mock('@/config/erfassung', () => ({
  BULK_LIMITS: { maxProducts: 3, saveChunkSize: 10 },
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  BulkSaveSchema: {},
}))

jest.mock('@/lib/activity', () => ({
  logActivity: jest.fn(),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
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

const VALID_PRODUCTS = [
  { hersteller: 'Dell', produktname: 'Latitude', verkaufspreis: 299, zustand: 'good' },
  { hersteller: 'Lenovo', produktname: 'ThinkPad', verkaufspreis: 350, zustand: 'good' },
]

function makeRequest(body: Record<string, unknown> = { products: VALID_PRODUCTS, action: 'draft' }) {
  return new NextRequest('http://localhost/api/admin/erfassung/bulk-save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb({}))
  mockCreateErfassungProduct.mockResolvedValue({ productId: 'prod-1', itemUUID: 'uuid-1', inventoryId: 'inv-1', imageUrl: null })
  mockValidateBody.mockReturnValue({
    success: true,
    data: { products: VALID_PRODUCTS, action: 'draft' },
  })
})

// ============================================================================
// POST /api/admin/erfassung/bulk-save
// ============================================================================

describe('POST /api/admin/erfassung/bulk-save — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/erfassung/bulk-save — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns 400 when product count exceeds limit', async () => {
    const tooMany = [
      { hersteller: 'A', produktname: 'P1', verkaufspreis: 100, zustand: 'good' },
      { hersteller: 'B', produktname: 'P2', verkaufspreis: 100, zustand: 'good' },
      { hersteller: 'C', produktname: 'P3', verkaufspreis: 100, zustand: 'good' },
      { hersteller: 'D', produktname: 'P4', verkaufspreis: 100, zustand: 'good' }, // exceeds 3
    ]
    mockValidateBody.mockReturnValueOnce({ success: true, data: { products: tooMany, action: 'draft' } })
    const response = await POST(makeRequest())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/erfassung/bulk-save — success', () => {
  it('returns 200 with succeeded/failed counts when all succeed', async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.total).toBe(2)
    expect(body.data.succeeded).toBe(2)
    expect(body.data.failed).toBe(0)
  })

  it('returns 200 with failed result when product is missing required fields', async () => {
    const withMissing = [
      { hersteller: '', produktname: '', verkaufspreis: 100, zustand: 'good' },
    ]
    mockValidateBody.mockReturnValueOnce({ success: true, data: { products: withMissing, action: 'draft' } })
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.failed).toBe(1)
    expect(body.data.succeeded).toBe(0)
  })

  it('returns 200 with failed result when db.transaction throws for a product', async () => {
    mockTransaction.mockRejectedValueOnce(new Error('DB error'))
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.failed).toBe(1)
    expect(body.data.succeeded).toBe(1)
  })
})
