/**
 * @jest-environment node
 *
 * Tests for POST /api/ai/analyze-product
 *
 * Behaviors locked:
 *   POST - 401 (unauthenticated), 400 (missing image/imageUrl), 200 with analysis result,
 *          200 with saveToDatabase=true inserts records, analysis errors return 500
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockInsert = jest.fn()
const mockValues = jest.fn()

jest.mock('@/db', () => ({
  db: {
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  aiExtractedProducts: { id: 'aep_id' },
  sustainabilityScores: { id: 'ss_id' },
  aiProcessingLogs: { id: 'apl_id' },
}))

const mockExtractProductFromImage = jest.fn()
jest.mock('@/lib/erfassung/ai-extraction', () => ({
  extractProductFromImage: (...args: unknown[]) => mockExtractProductFromImage(...args),
}))

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    aiAnalyze: jest.fn().mockReturnValue(true),
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: { PENDING: 'pending', APPROVED: 'approved' },
}))

jest.mock('@/lib/schemas', () => {
  const actual = jest.requireActual('@/lib/schemas')
  return actual
})

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_EXTRACTION_RESULT = {
  success: true,
  data: {
    produktname: 'ThinkPad X1 Carbon',
    hersteller: 'Lenovo',
    hauptkategorie: '10',
    unterkategorie: '101',
    verkaufspreis: '800',
    zustand: 'good',
    kurzbeschreibung: 'Business laptop in good condition',
    specs: [
      { key: 'RAM', value: '16GB' },
      { key: 'Storage', value: '512GB SSD' },
    ],
  },
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/ai/analyze-product', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockExtractProductFromImage.mockResolvedValue(MOCK_EXTRACTION_RESULT)
  mockValues.mockReturnValue({
    returning: jest.fn().mockResolvedValue([{ id: 'product-1' }]),
  })
  // Rate limiter returns true by default (not limited)
  const { rateLimiters } = require('@/lib/security/rate-limit')
  rateLimiters.aiAnalyze.mockReturnValue(true)
})

// ============================================================================
// Unauthenticated
// ============================================================================

describe('POST /api/ai/analyze-product — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest({ image: 'base64data' })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValueOnce({ user: {}, expires: '2027-01-01' })
    const req = makeRequest({ image: 'base64data' })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// Validation
// ============================================================================

describe('POST /api/ai/analyze-product — validation', () => {
  it('returns 400 when neither image nor imageUrl is provided', async () => {
    const req = makeRequest({ saveToDatabase: false })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when body is empty object (no image/imageUrl)', async () => {
    const req = makeRequest({})
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// Success — analysis with base64 image
// ============================================================================

describe('POST /api/ai/analyze-product — success', () => {
  it('returns 200 with analysis result when image is provided', async () => {
    const req = makeRequest({ image: 'base64imagedata', saveToDatabase: false })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.analysis).toBeDefined()
    expect(body.data.analysis.brand).toBe('Lenovo')
    expect(body.data.sustainability_score).toBeDefined()
    expect(mockExtractProductFromImage).toHaveBeenCalledWith('base64imagedata')
  })

  it('returns 200 with analysis result when imageUrl is provided', async () => {
    const req = makeRequest({ imageUrl: 'https://example.com/image.jpg', saveToDatabase: false })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(mockExtractProductFromImage).toHaveBeenCalledWith('https://example.com/image.jpg')
  })

  it('includes metadata in the response', async () => {
    const req = makeRequest({ image: 'base64data', saveToDatabase: false })
    const response = await POST(req)
    const body = await response.json()
    expect(body.data.metadata).toBeDefined()
    expect(body.data.metadata.ai_model).toBeDefined()
  })
})

// ============================================================================
// Save to database
// ============================================================================

describe('POST /api/ai/analyze-product — saveToDatabase', () => {
  it('inserts into aiExtractedProducts and sustainabilityScores when saveToDatabase=true', async () => {
    const req = makeRequest({ image: 'base64data', saveToDatabase: true })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.saved_product_id).toBe('product-1')
    // At minimum: aiExtractedProducts + sustainabilityScores + aiProcessingLogs = 3 inserts
    expect(mockInsert).toHaveBeenCalledTimes(3)
  })

  it('does not insert product records when saveToDatabase=false', async () => {
    const req = makeRequest({ image: 'base64data', saveToDatabase: false })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.saved_product_id).toBeNull()
    // Only aiProcessingLogs is inserted
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// Extraction failure
// ============================================================================

describe('POST /api/ai/analyze-product — extraction failure', () => {
  it('returns 500 when AI extraction fails', async () => {
    mockExtractProductFromImage.mockResolvedValueOnce({ success: false, error: 'Model unavailable' })
    const req = makeRequest({ image: 'base64data' })
    const response = await POST(req)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

// ============================================================================
// Rate limiting
// ============================================================================

describe('POST /api/ai/analyze-product — rate limiting', () => {
  it('returns 429 when rate limit is exceeded', async () => {
    const { rateLimiters } = require('@/lib/security/rate-limit')
    rateLimiters.aiAnalyze.mockReturnValueOnce(false)
    const req = makeRequest({ image: 'base64data' })
    const response = await POST(req)
    expect(response.status).toBe(429)
  })
})
