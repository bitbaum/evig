/**
 * @jest-environment node
 *
 * Tests for POST/GET /api/admin/intake
 *
 * Behaviors locked:
 *   POST /api/admin/intake
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 200 with item_uuid, product_id, inventory_id
 *   - returns 500 when db.transaction throws
 *
 *   GET /api/admin/intake
 *   - returns 401 when not authenticated
 *   - returns 400 when query is invalid
 *   - returns 200 with items, pagination, statusCounts
 *   - returns 500 when DB throws
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

const mockDbExecute = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
    transaction: (...args: unknown[]) => mockTransaction.apply(null, args),
  },
}))

jest.mock('@/db/schema/inventory', () => ({
  aiExtractedProducts: {},
  inventoryItems: {},
  productImages: {},
}))

jest.mock('@/db/schema/misc', () => ({
  donations: {},
}))

jest.mock('@/db/schema/auth', () => ({
  users: {},
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    {
      raw: (s: string) => ({ __raw: s }),
      join: (arr: unknown[], _sep: unknown) => ({ __join: arr }),
    }
  ),
  getTableName: (_table: unknown) => 'mock_table',
  SQL: class {},
}))

const mockCreateErfassungProduct = jest.fn()

jest.mock('@/lib/erfassung/create-product', () => ({
  createErfassungProduct: (...args: unknown[]) => mockCreateErfassungProduct.apply(null, args),
}))

const mockAppendIntakeEvent = jest.fn()

jest.mock('@/lib/intake/timeline', () => ({
  appendIntakeEvent: (...args: unknown[]) => mockAppendIntakeEvent.apply(null, args),
}))

const mockValidateBody = jest.fn()
const mockValidateQuery = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  validateQuery: (...args: unknown[]) => mockValidateQuery.apply(null, args),
}))

jest.mock('@/lib/schemas/intake', () => ({
  IntakeCreateSchema: {},
  IntakeQuerySchema: {},
}))

jest.mock('@/config/intake-status', () => ({
  INTAKE_STATUS: { IN_PROGRESS: 'in_progress', READY: 'ready', PUBLISHED: 'published' },
}))

jest.mock('@/config/marketplace-status', () => ({
  MARKETPLACE_STATUS: { DRAFT: 'draft', PUBLISHED: 'published' },
  PRODUCT_STATUS: { APPROVED: 'approved' },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler' },
}))

jest.mock('@/config/intake-checklist', () => ({
  isChecklistComplete: jest.fn().mockReturnValue(false),
  getChecklistProgress: jest.fn().mockReturnValue({ completed: 0, total: 5 }),
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
import { POST, GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_PRODUCT_RESULT = {
  itemUUID: 'uuid-123',
  productId: 'prod-456',
  inventoryId: 'inv-789',
  donationId: null,
  imageUrl: null,
}

const MOCK_ITEMS_RESULT = {
  rows: [
    { intake_tier: 'refurbish', intake_checklist: null, category: 'Laptop', brand: 'Dell', product_name: 'Latitude' },
  ],
}

function makePostRequest(body: Record<string, unknown> = { produktname: 'ThinkPad', hersteller: 'Lenovo', zustand: 'good', intake_tier: 'refurbish' }) {
  return new NextRequest('http://localhost/api/admin/intake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/admin/intake')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString(), { method: 'GET' })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // POST mocks
  mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb({}))
  mockCreateErfassungProduct.mockResolvedValue(MOCK_PRODUCT_RESULT)
  mockAppendIntakeEvent.mockResolvedValue(undefined)
  mockValidateBody.mockReturnValue({
    success: true,
    data: { produktname: 'ThinkPad', hersteller: 'Lenovo', zustand: 'good', intake_tier: 'refurbish' },
  })

  // GET mocks
  mockValidateQuery.mockReturnValue({
    success: true,
    data: { limit: 20, offset: 0 },
  })
  mockDbExecute
    .mockResolvedValueOnce(MOCK_ITEMS_RESULT)                  // items query
    .mockResolvedValueOnce({ rows: [{ total: '1' }] })          // count query
    .mockResolvedValueOnce({ rows: [{ in_progress: '1', ready: '0', published: '0', total_unfiltered: '1' }] }) // statusCounts

  const checklist = require('@/config/intake-checklist')
  checklist.isChecklistComplete.mockReturnValue(false)
  checklist.getChecklistProgress.mockReturnValue({ completed: 0, total: 5 })
})

// ============================================================================
// POST /api/admin/intake
// ============================================================================

describe('POST /api/admin/intake — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/intake — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await POST(makePostRequest({}))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/intake — success', () => {
  it('returns 200 with item_uuid and product_id', async () => {
    const response = await POST(makePostRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.item_uuid).toBe('uuid-123')
    expect(body.data.product_id).toBe('prod-456')
    expect(body.data.inventory_id).toBe('inv-789')
  })

  it('returns 500 when db.transaction throws', async () => {
    mockTransaction.mockRejectedValueOnce(new Error('DB error'))
    const response = await POST(makePostRequest())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// GET /api/admin/intake
// ============================================================================

describe('GET /api/admin/intake — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/intake — validation', () => {
  it('returns 400 when query is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateQuery.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Query-Parameter' }, { status: 400 }),
    })
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(400)
  })
})

describe('GET /api/admin/intake — success', () => {
  it('returns 200 with items, pagination, statusCounts', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.items).toHaveLength(1)
    expect(body.data.pagination.total).toBe(1)
    expect(body.data.statusCounts.inProgress).toBe(1)
  })

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockReset()
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
  })
})
