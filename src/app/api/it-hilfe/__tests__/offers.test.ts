/**
 * @jest-environment node
 *
 * Tests for IT-Hilfe offers API routes
 *
 * Covers: GET /api/it-hilfe/requests/[id]/offers (list offers - owner only)
 *         POST /api/it-hilfe/requests/[id]/offers (submit offer)
 *         DELETE /api/it-hilfe/requests/[id]/offers/[offerId] (withdraw offer)
 */

// Mock Drizzle db for the offers route (GET + POST)
const mockSelectChain = {
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
}
const mockInsertChain = {
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([]),
}
const mockUpdateChain = {
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
}

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(() => mockSelectChain),
    insert: jest.fn(() => mockInsertChain),
    update: jest.fn(() => mockUpdateChain),
  },
}))

// Mock raw query for the delete route (still uses raw SQL)
jest.mock('@/lib/auth/db', () => ({
  query: jest.fn(),
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

jest.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeNewOfferReceived: jest.fn().mockReturnValue({ subject: '', html: '' }),
}))

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    offerCreate: jest.fn().mockReturnValue(true),
  },
}))

import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { auth } from '@/auth'

const mockQuery = query as jest.MockedFunction<typeof query>
const mockAuth = auth as jest.MockedFunction<typeof auth>

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3001'), init as never)
}

const validRequestId = '11111111-1111-1111-1111-111111111111'
const validOfferId = '22222222-2222-2222-2222-222222222222'

// --- List offers (GET /api/it-hilfe/requests/[id]/offers) ---

describe('GET /api/it-hilfe/requests/[id]/offers', () => {
  let GET: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../it-hilfe/requests/[id]/offers/route')
    GET = mod.GET
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) })

  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`), makeCtx(validRequestId))

    expect(res.status).toBe(401)
  })

  it('returns offers for request owner', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner' },
      expires: '',
    } as never)

    // First select: check request ownership
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'open' }])
    // Second select: get offers
    mockSelectChain.orderBy.mockResolvedValueOnce([{
      id: validOfferId,
      requestId: validRequestId,
      helperId: 'user-helper',
      helperName: 'Lisa Techniker',
      helperEmail: 'lisa@example.com',
      message: 'Ich kann dir mit dem Laptop helfen, habe viel Erfahrung damit.',
      estimatedTime: '1-2 Stunden',
      proposedCompensation: 'CHF 30',
      relevantSkills: ['hardware_repair'],
      status: 'pending',
      createdAt: new Date().toISOString(),
    }])

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`), makeCtx(validRequestId))
    const body = await res.json()

    expect(body.success).toBe(true)
    expect(body.data.offers).toHaveLength(1)
    expect(body.data.offers[0].helperName).toBe('Lisa Techniker')
    expect(body.data.offers[0].relevantSkills).toEqual(['hardware_repair'])
  })

  it('forbids non-owners from viewing offers', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-other' },
      expires: '',
    } as never)
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'open' }])

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`), makeCtx(validRequestId))

    expect(res.status).toBe(403)
  })

  it('returns 404 for non-existent request', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner' },
      expires: '',
    } as never)
    mockSelectChain.where.mockResolvedValueOnce([])

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`), makeCtx(validRequestId))

    expect(res.status).toBe(404)
  })

  it('normalizes null skills to empty array', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner' },
      expires: '',
    } as never)
    mockSelectChain.where.mockResolvedValueOnce([{ requesterId: 'user-owner', status: 'open' }])
    mockSelectChain.orderBy.mockResolvedValueOnce([{
      id: validOfferId,
      requestId: validRequestId,
      helperId: 'user-helper',
      helperName: 'Lisa Techniker',
      helperEmail: 'lisa@example.com',
      message: 'Hilfe anbieten',
      estimatedTime: null,
      proposedCompensation: null,
      relevantSkills: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }])

    const res = await GET(makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`), makeCtx(validRequestId))
    const body = await res.json()

    expect(body.data.offers[0].relevantSkills).toEqual([])
  })
})

// --- Submit offer (POST /api/it-hilfe/requests/[id]/offers) ---

describe('POST /api/it-hilfe/requests/[id]/offers', () => {
  let POST: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../it-hilfe/requests/[id]/offers/route')
    POST = mod.POST
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const makeCtx = (id: string) => ({ params: Promise.resolve({ id }) })

  const validOfferBody = {
    message: 'Ich kann dir helfen, habe viel Erfahrung mit Laptops.',
    estimatedTime: '1-2 Stunden',
    proposedCompensation: 'CHF 30',
    relevantSkills: [],
  }

  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    )

    expect(res.status).toBe(401)
  })

  it('creates an offer successfully', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never)

    // Request exists and is open
    mockSelectChain.where.mockResolvedValueOnce([{
      requesterId: 'user-owner', status: 'open', title: 'Laptop',
      requester_name: 'Hans', requester_email: 'hans@test.ch',
    }])
    // Not expired
    mockSelectChain.where.mockResolvedValueOnce([])
    // No existing offer
    mockSelectChain.where.mockResolvedValueOnce([])
    // INSERT offer
    mockInsertChain.returning.mockResolvedValueOnce([{ id: validOfferId }])
    // UPDATE request status (fire-and-forget)
    mockUpdateChain.where.mockResolvedValueOnce([])

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data.offerId).toBe(validOfferId)
  })

  it('prevents offering on own request', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner', name: 'Hans', email: 'hans@test.ch' },
      expires: '',
    } as never)
    mockSelectChain.where.mockResolvedValueOnce([{
      requesterId: 'user-owner', status: 'open', title: 'Laptop',
      requester_name: 'Hans', requester_email: 'hans@test.ch',
    }])

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('eigene Anfrage')
  })

  it('prevents duplicate offers', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never)
    mockSelectChain.where
      .mockResolvedValueOnce([{
        requesterId: 'user-owner', status: 'open', title: 'Laptop',
        requester_name: 'Hans', requester_email: 'hans@test.ch',
      }])
      .mockResolvedValueOnce([]) // not expired
      .mockResolvedValueOnce([{ id: 'existing-offer' }]) // existing offer

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('bereits ein Angebot')
  })

  it('rejects offers on closed requests', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never)
    mockSelectChain.where.mockResolvedValueOnce([{
      requesterId: 'user-owner', status: 'matched', title: 'Laptop',
      requester_name: 'Hans', requester_email: 'hans@test.ch',
    }])

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('keine neuen Angebote')
  })

  it('rejects offers on expired requests', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never)
    mockSelectChain.where
      .mockResolvedValueOnce([{
        requesterId: 'user-owner', status: 'open', title: 'Laptop',
        requester_name: 'Hans', requester_email: 'hans@test.ch',
      }])
      .mockResolvedValueOnce([{ id: validRequestId }]) // expired

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify(validOfferBody),
      }),
      makeCtx(validRequestId),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('abgelaufen')
  })

  it('rejects message shorter than 20 characters', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never)
    mockSelectChain.where
      .mockResolvedValueOnce([{
        requesterId: 'user-owner', status: 'open', title: 'Laptop',
        requester_name: 'Hans', requester_email: 'hans@test.ch',
      }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify({ ...validOfferBody, message: 'Too short' }),
      }),
      makeCtx(validRequestId),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(JSON.stringify(body)).toContain('20')
  })

  it('rejects empty message', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper', name: 'Lisa', email: 'lisa@test.ch' },
      expires: '',
    } as never)
    mockSelectChain.where
      .mockResolvedValueOnce([{
        requesterId: 'user-owner', status: 'open', title: 'Laptop',
        requester_name: 'Hans', requester_email: 'hans@test.ch',
      }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const res = await POST(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers`, {
        method: 'POST',
        body: JSON.stringify({ ...validOfferBody, message: '' }),
      }),
      makeCtx(validRequestId),
    )

    expect(res.status).toBe(400)
  })
})

// --- Withdraw offer (DELETE /api/it-hilfe/requests/[id]/offers/[offerId]) ---
// This route still uses raw SQL, so we test with mockQuery

describe('DELETE /api/it-hilfe/requests/[id]/offers/[offerId]', () => {
  let DELETE: (req: NextRequest, ctx: { params: Promise<{ id: string; offerId: string }> }) => Promise<Response>

  beforeAll(async () => {
    const mod = await import('../../it-hilfe/requests/[id]/offers/[offerId]/route')
    DELETE = mod.DELETE
  })

  beforeEach(() => {
    mockQuery.mockReset()
    mockAuth.mockReset()
  })

  const makeCtx = (id: string, offerId: string) => ({ params: Promise.resolve({ id, offerId }) })

  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null as never)

    const res = await DELETE(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers/${validOfferId}`, { method: 'DELETE' }),
      makeCtx(validRequestId, validOfferId),
    )

    expect(res.status).toBe(401)
  })

  it('withdraws a pending offer', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper' },
      expires: '',
    } as never)
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ helper_id: 'user-helper', status: 'pending', request_id: validRequestId }],
        rowCount: 1,
      } as never)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as never) // UPDATE offer
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as never) // UPDATE request offer_count

    const res = await DELETE(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers/${validOfferId}`, { method: 'DELETE' }),
      makeCtx(validRequestId, validOfferId),
    )
    const body = await res.json()

    expect(body.success).toBe(true)
  })

  it('forbids withdrawing another users offer', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-other' },
      expires: '',
    } as never)
    mockQuery.mockResolvedValueOnce({
      rows: [{ helper_id: 'user-helper', status: 'pending', request_id: validRequestId }],
      rowCount: 1,
    } as never)

    const res = await DELETE(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers/${validOfferId}`, { method: 'DELETE' }),
      makeCtx(validRequestId, validOfferId),
    )

    expect(res.status).toBe(403)
  })

  it('prevents withdrawing non-pending offers', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper' },
      expires: '',
    } as never)
    mockQuery.mockResolvedValueOnce({
      rows: [{ helper_id: 'user-helper', status: 'accepted', request_id: validRequestId }],
      rowCount: 1,
    } as never)

    const res = await DELETE(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers/${validOfferId}`, { method: 'DELETE' }),
      makeCtx(validRequestId, validOfferId),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('ausstehende')
  })

  it('returns 404 for non-existent offer', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper' },
      expires: '',
    } as never)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)

    const res = await DELETE(
      makeRequest(`/api/it-hilfe/requests/${validRequestId}/offers/${validOfferId}`, { method: 'DELETE' }),
      makeCtx(validRequestId, validOfferId),
    )

    expect(res.status).toBe(404)
  })

  it('rejects invalid UUID format', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-helper' },
      expires: '',
    } as never)

    const res = await DELETE(
      makeRequest('/api/it-hilfe/requests/bad-id/offers/bad-offer', { method: 'DELETE' }),
      makeCtx('bad-id', 'bad-offer'),
    )

    expect(res.status).toBe(400)
  })
})
