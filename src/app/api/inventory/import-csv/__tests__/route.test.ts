/**
 * @jest-environment node
 *
 * Tests for POST /api/inventory/import-csv (withAuth)
 *        GET  /api/inventory/import-csv (withAuth — history)
 *
 * Behaviors locked:
 *   POST - 401, 400 (validation), 400 (rate limit), 200 with import stats
 *   GET  - 401, 200 with history
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  aiExtractedProducts: {
    id: 'aep_id',
    productName: 'aep_productName',
    brand: 'aep_brand',
    category: 'aep_category',
    status: 'aep_status',
  },
  inventoryItems: {
    id: 'ii_id',
    aiProductId: 'ii_aiProductId',
    kivitendoArticleNumber: 'ii_kivitendoArticleNumber',
    legacyCsvData: 'ii_legacyCsvData',
    createdAt: 'ii_createdAt',
    assignedTo: 'ii_assignedTo',
  },
  sustainabilityScores: {
    productId: 'ss_productId',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  desc: (a: unknown) => ({ __desc: a }),
}))

// Mock csv-parse/sync with jest.fn() so we can override per-test
const mockCsvParse = jest.fn()
jest.mock('csv-parse/sync', () => ({
  parse: (...args: unknown[]) => mockCsvParse(...args),
}))

const TWO_ROWS = [
  { Artikelnummer: 'ART-001', Typ: 'Laptop', Artikelbeschreibung: 'Lenovo ThinkPad', Verkaufspreis: '299.00', Hersteller: 'Lenovo' },
  { Artikelnummer: 'ART-002', Typ: 'Desktop', Artikelbeschreibung: 'Dell OptiPlex', Verkaufspreis: '199.00', Hersteller: 'Dell' },
]

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  ImportCSVSchema: {},
}))

jest.mock('@/lib/inventory/csv-analysis', () => ({
  analyzeProductDescription: jest.fn().mockReturnValue({
    productName: 'ThinkPad X1',
    brand: 'Lenovo',
    category: 'laptops',
    condition: 'good',
    confidence: 0.8,
  }),
  calculateSustainabilityScore: jest.fn().mockReturnValue({
    overall_score: 70,
    environmental_score: 75,
    social_score: 65,
    economic_score: 70,
    factors: [],
    recommendations: [],
    improvement_suggestions: [],
  }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: { PENDING: 'pending', APPROVED: 'approved' },
}))

jest.mock('@/config/marketplace-status', () => ({
  INVENTORY_ITEM_STATUS: { AVAILABLE: 'available', RESERVED: 'reserved' },
}))

const mockCsvImportRateLimit = jest.fn()
jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: { csvImport: (...args: unknown[]) => mockCsvImportRateLimit(...args) },
}))

import { NextRequest } from 'next/server'
import { POST, GET } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

function makePostRequest(body: unknown) {
  return new NextRequest('http://localhost/api/inventory/import-csv', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeGetRequest() {
  return new NextRequest('http://localhost/api/inventory/import-csv')
}

/** Build a select chain that resolves with `rows` at the limit() step */
function selectChainReturning(rows: unknown[]) {
  return {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(rows),
      }),
    }),
  }
}

/** Build a select chain that resolves with `rows` at the where() step */
function selectChainWhere(rows: unknown[]) {
  return {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(rows),
    }),
  }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValidateBody.mockReturnValue({ success: true, data: { csvContent: 'test' } })
  mockCsvImportRateLimit.mockReturnValue(true)
  mockCsvParse.mockReturnValue(TWO_ROWS)
  // Default: no duplicates
  mockSelect.mockReturnValue(selectChainReturning([]))
  mockReturning.mockResolvedValue([{ id: 'new-id' }])
  mockValues.mockReturnValue({ returning: mockReturning })
  // Re-wire analysis mocks that lose impl after resetAllMocks
  const analysisMocks = jest.requireMock('@/lib/inventory/csv-analysis') as {
    analyzeProductDescription: jest.Mock
    calculateSustainabilityScore: jest.Mock
  }
  analysisMocks.analyzeProductDescription.mockReturnValue({
    productName: 'ThinkPad X1',
    brand: 'Lenovo',
    category: 'laptops',
    condition: 'good',
    confidence: 0.8,
  })
  analysisMocks.calculateSustainabilityScore.mockReturnValue({
    overall_score: 70,
    environmental_score: 75,
    social_score: 65,
    economic_score: 70,
    factors: [],
    recommendations: [],
    improvement_suggestions: [],
  })
})

describe('POST /api/inventory/import-csv — unauthenticated', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await POST(makePostRequest({ csvContent: 'test' }))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/inventory/import-csv — rate limiting', () => {
  it('returns 400 when rate limited', async () => {
    mockCsvImportRateLimit.mockReturnValueOnce(false)
    const res = await POST(makePostRequest({ csvContent: 'test' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/warte/i)
  })
})

describe('POST /api/inventory/import-csv — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 }),
    })
    const res = await POST(makePostRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 when CSV has too many rows (>1000)', async () => {
    const largeRows = Array.from({ length: 1001 }, (_, i) => ({
      Artikelnummer: `ART-${i}`,
      Typ: 'Laptop',
      Artikelbeschreibung: `Product ${i}`,
      Verkaufspreis: '100.00',
      Hersteller: 'Brand',
    }))
    mockCsvParse.mockReturnValueOnce(largeRows)

    const res = await POST(makePostRequest({ csvContent: 'big_csv' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/maximal 1000/i)
  })
})

describe('POST /api/inventory/import-csv — success', () => {
  it('returns 200 with import stats for valid CSV (2 rows)', async () => {
    // No duplicates for either row — default beforeEach select chain handles this
    const res = await POST(makePostRequest({ csvContent: 'valid' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.success).toBe(true)
    expect(body.data.imported).toBe(2)
    expect(body.data.skipped).toBe(0)
  })

  it('skips rows with missing required fields', async () => {
    mockCsvParse.mockReturnValueOnce([
      { Artikelnummer: '', Typ: 'X', Artikelbeschreibung: '', Verkaufspreis: '', Hersteller: '' },
    ])
    const res = await POST(makePostRequest({ csvContent: 'empty_fields' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.skipped).toBe(1)
    expect(body.data.errors).toHaveLength(1)
  })

  it('records duplicates when article number already exists', async () => {
    // First row is a duplicate, second row is new
    mockSelect
      .mockReturnValueOnce(selectChainReturning([{ id: 'existing-1' }])) // ART-001 duplicate
      .mockReturnValue(selectChainReturning([]))                           // ART-002 new

    const res = await POST(makePostRequest({ csvContent: 'valid' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.duplicates).toContain('ART-001')
    expect(body.data.imported).toBe(1)
    expect(body.data.skipped).toBe(1)
  })
})

describe('GET /api/inventory/import-csv — history', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(401)
  })

  it('returns 200 with import history', async () => {
    const historyItems = [
      { id: 'ii-1', kivitendoArticleNumber: 'ART-001', legacyCsvData: {}, createdAt: new Date(), productName: 'ThinkPad', brand: 'Lenovo', category: 'laptops', aiStatus: 'pending' },
    ]
    mockSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(historyItems),
            }),
          }),
        }),
      }),
    })

    const res = await GET(makeGetRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.imports).toHaveLength(1)
  })
})
