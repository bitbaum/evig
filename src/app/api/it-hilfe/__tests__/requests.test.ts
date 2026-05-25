/**
 * @jest-environment node
 *
 * Tests for IT-Hilfe requests API routes
 *
 * Covers: GET /api/it-hilfe/requests (browse)
 *         GET /api/it-hilfe/requests/[id] (detail)
 *         PUT /api/it-hilfe/requests/[id] (update/status change)
 */

// Detail/update route uses Drizzle select/update chains
const mockSelectChain = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
}
const mockUpdateChain = {
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
}

// Browse route uses db.execute(sql`...`) for raw Drizzle SQL
const mockExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(() => mockSelectChain),
    update: jest.fn(() => mockUpdateChain),
    execute: mockExecute,
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    itHilfeCreate: jest.fn().mockReturnValue(true),
  },
}))

jest.mock('@/lib/security/sanitize', () => ({
  sanitizeInput: jest.fn((input: string) => input),
}))

jest.mock('@/lib/schemas/it-hilfe', () => {
  const actual = jest.requireActual('@/lib/schemas/it-hilfe')
  return {
    ...actual,
    validateAndRespond: jest.fn().mockReturnValue({
      success: true,
      data: {
        categoryId: 'laptop',
        title: 'Test Anfrage',
        description: 'Mein Laptop startet nicht mehr',
        urgency: 'medium',
        maxBudgetCents: null,
        postalCode: '8001',
        city: 'Zürich',
        canton: 'ZH',
        serviceType: 'flexible',
        skillsNeeded: [],
      },
    }),
  }
})

jest.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeRequestConfirmation: jest.fn().mockReturnValue({ subject: '', html: '' }),
  adminNewITHilfeRequest: jest.fn().mockReturnValue({ subject: '', html: '' }),
  helperNewMatchingRequest: jest.fn().mockReturnValue({ subject: '', html: '' }),
}))

import { NextRequest } from 'next/server'
import { auth } from '@/auth'

const mockAuth = auth as jest.MockedFunction<typeof auth>

// Helper to create a NextRequest with URL
function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3001'), init as never)
}

// Helper: mock DB row for a request (snake_case — matches Drizzle select aliases in GET)
function mockRequestRow(overrides = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    requester_id: 'user-owner',
    requester_name: 'Hans Müller',
    requester_email: 'hans@example.com',
    category_id: 'laptop',
    device_brand: 'Lenovo',
    device_model: 'ThinkPad',
    title: 'Laptop reparieren',
    description: 'Display flackert',
    urgency: 'medium',
    budget_type: 'free',
    budget_amount_cents: null,
    postal_code: '8001',
    city: 'Zürich',
    canton: 'ZH',
    service_type: 'flexible',
    skills_needed: ['hardware_repair'],
    image_urls: null,
    status: 'open',
    matched_offer_id: null,
    offer_count: 0,
    ai_diagnosis: null,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// --- Browse requests (GET /api/it-hilfe/requests) ---

describe('GET /api/it-hilfe/requests', () => {
  let GET: (req: NextRequest) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../it-hilfe/requests/route')
    GET = mod.GET
  })

  beforeEach(() => {
    mockExecute.mockReset()
  })

  // Helper: wrap row with _total_count (mimics COUNT(*) OVER())
  function withCount(rows: Record<string, unknown>[], total?: number) {
    const count = total ?? rows.length
    return { rows: rows.map(r => ({ ...r, _total_count: String(count) })) }
  }

  it('returns requests with default filters', async () => {
    const row = mockRequestRow()
    mockExecute.mockResolvedValueOnce(withCount([row], 1))

    const res = await GET(makeRequest('/api/it-hilfe/requests'))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data.requests).toHaveLength(1)
    expect(body.data.requests[0].title).toBe('Laptop reparieren')
    expect(body.data.requests[0].requesterName).toBe('Hans Müller')
    expect(body.data.total).toBe(1)
    expect(body.data.pagination.hasMore).toBe(false)
  })

  it('applies category filter', async () => {
    mockExecute.mockResolvedValueOnce(withCount([]))

    const res = await GET(makeRequest('/api/it-hilfe/requests?category=smartphone'))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(mockExecute).toHaveBeenCalledTimes(1)
  })

  it('applies text search filter', async () => {
    mockExecute.mockResolvedValueOnce(withCount([]))

    const res = await GET(makeRequest('/api/it-hilfe/requests?search=ThinkPad'))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(mockExecute).toHaveBeenCalledTimes(1)
  })

  it('handles database errors gracefully', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB connection failed'))

    const res = await GET(makeRequest('/api/it-hilfe/requests'))
    const body = await res.json()

    expect(body.success).toBe(false)
  })

  it('returns empty result set', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })

    const res = await GET(makeRequest('/api/it-hilfe/requests'))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data.requests).toHaveLength(0)
    expect(body.data.total).toBe(0)
  })

  it('respects pagination params', async () => {
    // Must include at least one row so _total_count is readable
    mockExecute.mockResolvedValueOnce(withCount([mockRequestRow()], 100))

    const res = await GET(makeRequest('/api/it-hilfe/requests?limit=10&offset=20'))
    const body = await res.json()

    expect(body.data.pagination.limit).toBe(10)
    expect(body.data.pagination.offset).toBe(20)
    expect(body.data.pagination.hasMore).toBe(true)
  })

  it('caps limit at 50', async () => {
    mockExecute.mockResolvedValueOnce(withCount([]))

    const res = await GET(makeRequest('/api/it-hilfe/requests?limit=999'))
    const body = await res.json()

    expect(body.data.pagination.limit).toBe(50)
  })
})

// --- Get request detail (GET /api/it-hilfe/requests/[id]) ---

describe('GET /api/it-hilfe/requests/[id]', () => {
  let GET: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../it-hilfe/requests/[id]/route')
    GET = mod.GET
  })

  beforeEach(() => {
    mockSelectChain.from.mockReturnThis()
    mockSelectChain.where.mockReset().mockReturnThis()
    mockSelectChain.innerJoin.mockReturnThis()
    mockSelectChain.leftJoin.mockReturnThis()
    mockAuth.mockReset()
  })

  const validId = '11111111-1111-1111-1111-111111111111'
  const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) })

  it('returns request details for valid ID', async () => {
    mockAuth.mockResolvedValue(null as never)
    // Drizzle chain: select().from().innerJoin().where() → returns array
    mockSelectChain.where.mockResolvedValueOnce([mockRequestRow()])

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validId}`), makeCtx(validId))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data.request.id).toBe(validId)
    expect(body.data.request.title).toBe('Laptop reparieren')
    expect(body.data.request.isOwner).toBe(false)
  })

  it('shows email only to owner', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner', email: 'owner@test.ch', name: 'Owner' },
      expires: '',
    } as never)
    mockSelectChain.where.mockResolvedValueOnce([mockRequestRow()])

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validId}`), makeCtx(validId))
    const body = await res.json()

    expect(body.data.request.isOwner).toBe(true)
    expect(body.data.request.requesterEmail).toBe('hans@example.com')
  })

  it('hides email from non-owners', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-other', email: 'other@test.ch', name: 'Other' },
      expires: '',
    } as never)
    mockSelectChain.where.mockResolvedValueOnce([mockRequestRow()])

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validId}`), makeCtx(validId))
    const body = await res.json()

    expect(body.data.request.isOwner).toBe(false)
    expect(body.data.request.requesterEmail).toBeUndefined()
  })

  it('rejects invalid UUID format', async () => {
    const res = await GET(makeRequest('/api/it-hilfe/requests/not-a-uuid'), makeCtx('not-a-uuid'))
    const body = await res.json()

    expect(body.success).toBe(false)
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent request', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockSelectChain.where.mockResolvedValueOnce([])

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validId}`), makeCtx(validId))
    const body = await res.json()

    expect(body.success).toBe(false)
    expect(res.status).toBe(404)
  })

  it('returns null arrays as empty arrays', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockSelectChain.where.mockResolvedValueOnce([mockRequestRow({ skills_needed: null, image_urls: null })])

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validId}`), makeCtx(validId))
    const body = await res.json()

    expect(body.data.request.skillsNeeded).toEqual([])
    expect(body.data.request.imageUrls).toEqual([])
  })
})

// --- Update request (PUT /api/it-hilfe/requests/[id]) ---

describe('PUT /api/it-hilfe/requests/[id]', () => {
  let PUT: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../it-hilfe/requests/[id]/route')
    PUT = mod.PUT
  })

  beforeEach(() => {
    mockSelectChain.from.mockReturnThis()
    mockSelectChain.where.mockReset().mockReturnThis()
    mockSelectChain.innerJoin.mockReturnThis()
    mockSelectChain.leftJoin.mockReturnThis()
    mockUpdateChain.set.mockReturnThis()
    mockUpdateChain.where.mockReset().mockResolvedValue([])
    mockAuth.mockReset()
  })

  const validId = '11111111-1111-1111-1111-111111111111'
  const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) })

  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await PUT(
      makeRequest(`/api/it-hilfe/requests/${validId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated' }),
      }),
      makeCtx(validId),
    )

    expect(res.status).toBe(401)
  })

  it('forbids non-owners from updating', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-other' },
      expires: '',
    } as never)
    // PUT uses camelCase keys from Drizzle select
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'open' }])

    const res = await PUT(
      makeRequest(`/api/it-hilfe/requests/${validId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'Hacked' }),
      }),
      makeCtx(validId),
    )

    expect(res.status).toBe(403)
  })

  it('allows owner to cancel open request', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner' },
      expires: '',
    } as never)
    // Ownership check
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'open' }])
    // Update resolves
    mockUpdateChain.where.mockResolvedValueOnce([])

    const res = await PUT(
      makeRequest(`/api/it-hilfe/requests/${validId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' }),
      }),
      makeCtx(validId),
    )
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('allows owner to complete matched request', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner' },
      expires: '',
    } as never)
    // Ownership check
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'matched' }])
    // Drizzle update for helper counter increment
    mockUpdateChain.where.mockResolvedValueOnce([])
    // Drizzle update for request status
    mockUpdateChain.where.mockResolvedValueOnce([])

    const res = await PUT(
      makeRequest(`/api/it-hilfe/requests/${validId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' }),
      }),
      makeCtx(validId),
    )
    const body = await res.json()

    expect(body.success).toBe(true)
  })

  it('rejects invalid status transitions', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner' },
      expires: '',
    } as never)
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'open' }])

    const res = await PUT(
      makeRequest(`/api/it-hilfe/requests/${validId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'completed' }),
      }),
      makeCtx(validId),
    )
    const body = await res.json()

    expect(body.success).toBe(false)
    expect(res.status).toBe(400)
  })

  it('rejects edits to non-editable requests', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner' },
      expires: '',
    } as never)
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'completed' }])

    const res = await PUT(
      makeRequest(`/api/it-hilfe/requests/${validId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: 'New title' }),
      }),
      makeCtx(validId),
    )

    expect(res.status).toBe(400)
  })
})
