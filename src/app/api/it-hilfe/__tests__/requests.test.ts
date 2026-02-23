/**
 * @jest-environment node
 *
 * Tests for IT-Hilfe requests API routes
 *
 * Covers: GET /api/it-hilfe/requests (browse)
 *         GET /api/it-hilfe/requests/[id] (detail)
 *         PUT /api/it-hilfe/requests/[id] (update/status change)
 */

jest.mock('@/lib/auth/db', () => ({
  query: jest.fn(),
  paginatedQuery: jest.fn(),
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
  sendCustomEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    itHilfeCreate: jest.fn().mockReturnValue(true),
  },
}))

jest.mock('@/lib/security/sanitize', () => ({
  sanitizeInput: jest.fn((input: string) => input),
}))

jest.mock('@/lib/validation/schemas', () => ({
  itHilfeRequestSchema: {},
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
}))

jest.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeRequestConfirmation: jest.fn().mockReturnValue({ subject: '', html: '' }),
  adminNewITHilfeRequest: jest.fn().mockReturnValue({ subject: '', html: '' }),
  helperNewMatchingRequest: jest.fn().mockReturnValue({ subject: '', html: '' }),
}))

import { NextRequest } from 'next/server'
import { query, paginatedQuery } from '@/lib/auth/db'
import { auth } from '@/auth'

const mockQuery = query as jest.MockedFunction<typeof query>
const mockPaginatedQuery = paginatedQuery as jest.MockedFunction<typeof paginatedQuery>
const mockAuth = auth as jest.MockedFunction<typeof auth>

// Helper to create a NextRequest with URL
function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3001'), init as never)
}

// Helper: mock DB row for a request
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
    mockQuery.mockReset()
    mockPaginatedQuery.mockReset()
  })

  it('returns requests with default filters', async () => {
    const row = mockRequestRow()
    mockPaginatedQuery.mockResolvedValueOnce({ rows: [row], total: 1 } as never)

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
    mockPaginatedQuery.mockResolvedValueOnce({ rows: [], total: 0 } as never)

    await GET(makeRequest('/api/it-hilfe/requests?category=smartphone'))

    // Verify category param was passed to query
    const queryCall = mockPaginatedQuery.mock.calls[0]
    const params = queryCall[1] as string[]
    expect(params).toContain('smartphone')
  })

  it('applies text search filter', async () => {
    mockPaginatedQuery.mockResolvedValueOnce({ rows: [], total: 0 } as never)

    await GET(makeRequest('/api/it-hilfe/requests?search=ThinkPad'))

    const queryCall = mockPaginatedQuery.mock.calls[0]
    const sql = queryCall[0] as string
    expect(sql).toContain('ILIKE')
    const params = queryCall[1] as string[]
    expect(params).toContain('%ThinkPad%')
  })

  it('handles database errors gracefully', async () => {
    mockPaginatedQuery.mockRejectedValueOnce(new Error('DB connection failed'))

    const res = await GET(makeRequest('/api/it-hilfe/requests'))
    const body = await res.json()

    expect(body.success).toBe(false)
  })

  it('returns empty result set', async () => {
    mockPaginatedQuery.mockResolvedValueOnce({ rows: [], total: 0 } as never)

    const res = await GET(makeRequest('/api/it-hilfe/requests'))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data.requests).toHaveLength(0)
    expect(body.data.total).toBe(0)
  })

  it('respects pagination params', async () => {
    mockPaginatedQuery.mockResolvedValueOnce({ rows: [], total: 100 } as never)

    const res = await GET(makeRequest('/api/it-hilfe/requests?limit=10&offset=20'))
    const body = await res.json()

    expect(body.data.pagination.limit).toBe(10)
    expect(body.data.pagination.offset).toBe(20)
    expect(body.data.pagination.hasMore).toBe(true)
  })

  it('caps limit at 50', async () => {
    mockPaginatedQuery.mockResolvedValueOnce({ rows: [], total: 0 } as never)

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
    mockQuery.mockReset()
    mockAuth.mockReset()
  })

  const validId = '11111111-1111-1111-1111-111111111111'
  const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) })

  it('returns request details for valid ID', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockQuery.mockResolvedValueOnce({
      rows: [mockRequestRow()],
      rowCount: 1,
    } as never)

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
    mockQuery.mockResolvedValueOnce({
      rows: [mockRequestRow()],
      rowCount: 1,
    } as never)

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
    mockQuery.mockResolvedValueOnce({
      rows: [mockRequestRow()],
      rowCount: 1,
    } as never)

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
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validId}`), makeCtx(validId))
    const body = await res.json()

    expect(body.success).toBe(false)
    expect(res.status).toBe(404)
  })

  it('returns null arrays as empty arrays', async () => {
    mockAuth.mockResolvedValue(null as never)
    mockQuery.mockResolvedValueOnce({
      rows: [mockRequestRow({ skills_needed: null, image_urls: null })],
      rowCount: 1,
    } as never)

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
    mockQuery.mockReset()
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
    mockQuery.mockResolvedValueOnce({
      rows: [{ requester_id: 'user-owner', status: 'open' }],
      rowCount: 1,
    } as never)

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
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ requester_id: 'user-owner', status: 'open' }],
        rowCount: 1,
      } as never)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as never) // UPDATE

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
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ requester_id: 'user-owner', status: 'matched' }],
        rowCount: 1,
      } as never)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as never) // INCREMENT helper counter
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as never) // UPDATE request

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
    mockQuery.mockResolvedValueOnce({
      rows: [{ requester_id: 'user-owner', status: 'open' }],
      rowCount: 1,
    } as never)

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
    mockQuery.mockResolvedValueOnce({
      rows: [{ requester_id: 'user-owner', status: 'completed' }],
      rowCount: 1,
    } as never)

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
