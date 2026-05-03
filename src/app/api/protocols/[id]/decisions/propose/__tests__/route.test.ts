/**
 * @jest-environment node
 *
 * Tests for POST /api/protocols/[id]/decisions/propose
 *
 * This route generates AI task proposals for an approved decision.
 * Correctness matters: wrong error mapping surfaces confusing messages to admins
 * managing non-profit governance decisions.
 *
 * Behaviors locked:
 *   POST /api/protocols/[id]/decisions/propose
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when generateTaskProposals throws DECISION_NOT_APPROVED
 *   - returns 400 when generateTaskProposals throws DECISION_NOT_FOUND
 *   - returns 200 with proposals on success
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (handler: (req: Request, session: unknown, ctx: unknown) => unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return handler(req, session, resolvedContext)
      }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// Schema mock — static, survives jest.resetAllMocks()
jest.mock('@/lib/schemas/protocols', () => ({
  closeDecisionSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body?.action_item_id) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return { success: true, data: { action_item_id: body.action_item_id } }
    },
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    DECISION_NOT_APPROVED: 'Nicht genehmigt',
    DECISION_NOT_FOUND: 'Nicht gefunden',
    AI_PROPOSAL_FAILED: 'KI-Vorschlag fehlgeschlagen',
  },
}))

const mockGenerateTaskProposals = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  generateTaskProposals: (...args: unknown[]) => mockGenerateTaskProposals.apply(null, args),
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
  user: {
    id: 'user-1',
    email: 'admin@revamp-it.ch',
    name: 'Admin',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
}

const MOCK_PROPOSALS = [
  { title: 'Aufgabe 1', description: 'Beschreibung 1' },
  { title: 'Aufgabe 2', description: 'Beschreibung 2' },
]

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/protocols/proto-1/decisions/propose', body !== undefined
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'POST' }
  )
}

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGenerateTaskProposals.mockResolvedValue(MOCK_PROPOSALS)
})

// ============================================================================
// POST — unauthenticated
// ============================================================================

describe('POST /api/protocols/[id]/decisions/propose — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST — validation
// ============================================================================

describe('POST /api/protocols/[id]/decisions/propose — validation', () => {
  it('returns 400 when body is missing action_item_id', async () => {
    const response = await POST(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })

  it('does not call generateTaskProposals when validation fails', async () => {
    await POST(makeRequest({}), makeContext())
    expect(mockGenerateTaskProposals).not.toHaveBeenCalled()
  })
})

// ============================================================================
// POST — service errors
// ============================================================================

describe('POST /api/protocols/[id]/decisions/propose — service errors', () => {
  it('returns 400 when generateTaskProposals throws DECISION_NOT_APPROVED', async () => {
    mockGenerateTaskProposals.mockRejectedValueOnce(new Error('DECISION_NOT_APPROVED'))
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Nicht genehmigt')
  })

  it('returns 400 when generateTaskProposals throws DECISION_NOT_FOUND', async () => {
    mockGenerateTaskProposals.mockRejectedValueOnce(new Error('DECISION_NOT_FOUND'))
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Nicht gefunden')
  })

  it('returns 500 when generateTaskProposals throws AI_PROPOSAL_FAILED', async () => {
    mockGenerateTaskProposals.mockRejectedValueOnce(new Error('AI_PROPOSAL_FAILED'))
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('KI-Vorschlag fehlgeschlagen')
  })

  it('returns 500 when generateTaskProposals throws an unexpected error', async () => {
    mockGenerateTaskProposals.mockRejectedValueOnce(new Error('DB connection lost'))
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// POST — success
// ============================================================================

describe('POST /api/protocols/[id]/decisions/propose — success', () => {
  it('returns 200 with proposals array', async () => {
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual(MOCK_PROPOSALS)
  })

  it('passes protocolId and action_item_id to generateTaskProposals', async () => {
    await POST(makeRequest({ action_item_id: 'item-42' }), makeContext('proto-99'))
    expect(mockGenerateTaskProposals).toHaveBeenCalledWith('proto-99', 'item-42')
  })
})
