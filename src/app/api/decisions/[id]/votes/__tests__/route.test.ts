/**
 * @jest-environment node
 *
 * Tests for GET/POST /api/decisions/[id]/votes
 *
 * Mission-relevant: members submit votes through POST. Errors in the not_found /
 * not_voting_phase / not_participant branching directly cause wrong HTTP codes
 * that confuse the frontend vote UI.
 *
 * Behaviors locked:
 *   GET /api/decisions/[id]/votes
 *   - returns 401 when not authenticated
 *   - returns 200 with votes data
 *   - returns 404 when decision not found
 *   - returns 500 when service throws
 *
 *   POST /api/decisions/[id]/votes
 *   - returns 401 when not authenticated
 *   - returns 404 when decision not found
 *   - returns 400 when not in voting phase
 *   - returns 400 when user is not a participant
 *   - returns 200 with submitted vote
 *   - returns 500 when service throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: (req: Request, session: unknown, context: unknown) => unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: unknown }).user) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return handler(req, session, resolvedContext)
      }),
}))

const mockGetDbUserId = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

const mockGetVotes = jest.fn()
const mockSubmitVote = jest.fn()

jest.mock('@/lib/services/decisions', () => ({
  getVotes: (...args: unknown[]) => mockGetVotes.apply(null, args),
  submitVote: (...args: unknown[]) => mockSubmitVote.apply(null, args),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    VOTE_NOT_IN_VOTING_PHASE: 'Abstimmungsphase ist nicht aktiv',
    VOTE_NOT_PARTICIPANT: 'Du bist kein Teilnehmer dieser Abstimmung',
    VOTE_INVALID_DATA: 'Ungültige Abstimmungsdaten',
    VOTE_SUBMIT_FAILED: 'Abstimmung fehlgeschlagen',
  },
  SUCCESS_MESSAGES: { VOTE_SUBMITTED: 'Stimme abgegeben' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'member@revamp-it.ch', name: 'Member', isStaff: false, staffPermissions: [] as string[], isSuperAdmin: false },
  expires: '2027-01-01',
}

const MOCK_VOTES = { votes: [{ userId: 'user-1', vote: 'yes', comment: null }], summary: { yes: 1, no: 0, abstain: 0 } }
const MOCK_VOTE = { id: 'vote-1', userId: 'user-1', decisionId: 'dec-1', vote: 'yes' }

function makeGetRequest() {
  return new NextRequest('http://localhost/api/decisions/dec-1/votes')
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/decisions/dec-1/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'dec-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockGetVotes.mockResolvedValue(MOCK_VOTES)
  mockSubmitVote.mockResolvedValue({ vote: MOCK_VOTE })
})

// ============================================================================
// GET /api/decisions/[id]/votes
// ============================================================================

describe('GET /api/decisions/[id]/votes — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/decisions/[id]/votes — authenticated', () => {
  it('returns 200 with votes', async () => {
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns votes data from service', async () => {
    const response = await GET(makeGetRequest(), makeContext())
    const body = await response.json()
    expect(body.data.votes).toHaveLength(1)
  })

  it('returns 404 when decision not found', async () => {
    mockGetVotes.mockResolvedValueOnce({ error: 'not_found' })
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('passes decision id and db user id to service', async () => {
    await GET(makeGetRequest(), makeContext('dec-99'))
    expect(mockGetVotes).toHaveBeenCalledWith('dec-99', 'db-user-1')
  })

  it('returns 500 when service throws', async () => {
    mockGetVotes.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// POST /api/decisions/[id]/votes
// ============================================================================

describe('POST /api/decisions/[id]/votes — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest({ vote: 'yes' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/decisions/[id]/votes — service errors', () => {
  it('returns 404 when decision not found', async () => {
    mockSubmitVote.mockResolvedValueOnce({ error: 'not_found' })
    const response = await POST(makePostRequest({ vote: 'yes' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when not in voting phase', async () => {
    mockSubmitVote.mockResolvedValueOnce({ error: 'not_voting_phase' })
    const response = await POST(makePostRequest({ vote: 'yes' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when user is not a participant', async () => {
    mockSubmitVote.mockResolvedValueOnce({ error: 'not_participant' })
    const response = await POST(makePostRequest({ vote: 'yes' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 on invalid vote data', async () => {
    mockSubmitVote.mockResolvedValueOnce({ error: 'invalid_data', message: 'Ungültige Stimme' })
    const response = await POST(makePostRequest({ vote: 'invalid' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/decisions/[id]/votes — success', () => {
  it('returns 200 with submitted vote', async () => {
    const response = await POST(makePostRequest({ vote: 'yes' }), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns vote data from service', async () => {
    const response = await POST(makePostRequest({ vote: 'yes' }), makeContext())
    const body = await response.json()
    expect(body.data.id).toBe('vote-1')
  })

  it('returns 500 when service throws', async () => {
    mockSubmitVote.mockRejectedValueOnce(new Error('DB error'))
    const response = await POST(makePostRequest({ vote: 'yes' }), makeContext())
    expect(response.status).toBe(500)
  })
})
