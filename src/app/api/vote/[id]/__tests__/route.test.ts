/**
 * @jest-environment node
 *
 * Tests for GET /api/vote/[id] (public) and POST /api/vote/[id] (public)
 *
 * Behaviors locked:
 *   GET  - 404 (decision not found), 200 (with decision data)
 *   POST - 400 (no email), 400 (no voteData), 404 (user not found),
 *          400 (submitVote returns error), 200 (success)
 */

const mockGetPublicDecision = jest.fn()
const mockSubmitVote = jest.fn()

jest.mock('@/lib/services/decisions', () => ({
  getPublicDecision: (...args: unknown[]) => mockGetPublicDecision(...args),
  submitVote: (...args: unknown[]) => mockSubmitVote(...args),
}))

const mockQuery = jest.fn()

jest.mock('@/lib/auth/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: { USERS: 'users' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

const MOCK_DECISION = {
  id: 'decision-1',
  title: 'Test Decision',
  description: 'Should we do X?',
  background: 'Context here',
  status: 'voting',
  votingMethod: 'single_choice',
  options: [{ id: 'opt-1', label: 'Yes' }, { id: 'opt-2', label: 'No' }],
  dotCount: 3,
  votingDeadline: new Date().toISOString(),
}

beforeEach(() => {
  jest.resetAllMocks()

  mockGetPublicDecision.mockResolvedValue(MOCK_DECISION)
  mockQuery.mockResolvedValue({ rows: [{ id: 'user-1' }] })
  mockSubmitVote.mockResolvedValue({ vote: { id: 'vote-1', optionId: 'opt-1' } })
})

// ============================================================================
// GET — decision not found
// ============================================================================

describe('GET /api/vote/[id] — decision not found', () => {
  it('returns 404 when decision is null', async () => {
    mockGetPublicDecision.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/vote/nonexistent')
    const response = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/nicht gefunden/i)
  })
})

// ============================================================================
// GET — success
// ============================================================================

describe('GET /api/vote/[id] — success', () => {
  it('returns 200 with decision data', async () => {
    const req = new NextRequest('http://localhost/api/vote/decision-1')
    const response = await GET(req, { params: Promise.resolve({ id: 'decision-1' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('decision-1')
    expect(body.data.title).toBe('Test Decision')
    expect(body.data.options).toHaveLength(2)
    expect(mockGetPublicDecision).toHaveBeenCalledWith('decision-1')
  })
})

// ============================================================================
// POST — validation
// ============================================================================

describe('POST /api/vote/[id] — missing email', () => {
  it('returns 400 when email is missing', async () => {
    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/E-Mail/i)
  })
})

describe('POST /api/vote/[id] — missing voteData', () => {
  it('returns 400 when voteData is missing', async () => {
    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'voter@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/Stimmdaten/i)
  })
})

// ============================================================================
// POST — user not found
// ============================================================================

describe('POST /api/vote/[id] — anonymous voter', () => {
  it('submits anonymously when email is not registered', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'unknown@example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) })
    expect(response.status).toBe(200)
    expect(mockSubmitVote).toHaveBeenCalledWith(
      'decision-1',
      { voterEmail: 'unknown@example.com' },
      { optionId: 'opt-1' }
    )
  })
})

// ============================================================================
// POST — submitVote returns error
// ============================================================================

describe('POST /api/vote/[id] — submitVote error', () => {
  it('returns 400 when submitVote returns an error', async () => {
    mockSubmitVote.mockResolvedValueOnce({ error: 'not_voting_phase' })

    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'voter@example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/läuft/i)
  })

  it('returns 400 with generic message for unknown error code', async () => {
    mockSubmitVote.mockResolvedValueOnce({ error: 'unknown_error_code' })

    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'voter@example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/Fehler beim Abgeben/i)
  })
})

// ============================================================================
// POST — success
// ============================================================================

describe('POST /api/vote/[id] — success', () => {
  it('returns 200 with vote data on successful submission', async () => {
    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'voter@example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('vote-1')
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id FROM'),
      ['voter@example.com']
    )
    expect(mockSubmitVote).toHaveBeenCalledWith('decision-1', { userId: 'user-1' }, { optionId: 'opt-1' })
  })
})
