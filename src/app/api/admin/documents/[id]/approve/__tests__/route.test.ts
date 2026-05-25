/**
 * @jest-environment node
 *
 * Tests for PUT /api/admin/documents/[id]/approve
 *
 * Mission-relevant: guards against double-approval. Uses a DB transaction for
 * the update + required-docs check + application status update.
 *
 * Behaviors locked:
 *   PUT /api/admin/documents/[id]/approve
 *   - returns 401 when not authenticated
 *   - returns 400 when adminNotes is not a string
 *   - returns 400 when expiresAt is invalid date
 *   - returns 404 when document not found
 *   - returns 400 when document already approved
 *   - returns 200 on success
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
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockDbExecute = jest.fn()
const mockTxExecute = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
    transaction: (...args: unknown[]) => mockTransaction.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  repairerApplications: { id: 'ra_id' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'sql' }), { raw: jest.fn(), join: jest.fn() }),
  getTableName: jest.fn().mockReturnValue('mock_table'),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: {
    VERIFICATION_DOCUMENTS: 'verification_documents',
    DOCUMENT_TYPES: 'document_types',
    USERS: 'users',
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}))

jest.mock('@/config/document-status', () => ({
  DOCUMENT_STATUS: {
    PENDING: 'pending',
    IN_REVIEW: 'in_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    INCOMPLETE: 'incomplete',
  },
}))

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'test-msg' }),
}))

jest.mock('@/lib/email/templates/notification', () => ({
  notificationEmail: jest.fn().mockReturnValue({ subject: 'Test', html: '<p>Test</p>' }),
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

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { PUT } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_DOC_PENDING = {
  id: 'doc-1',
  application_id: 'app-1',
  user_id: 'user-1',
  status: 'pending',
  document_verification_status: 'pending',
  user_email: 'user@example.com',
  user_name: 'User',
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/documents/doc-1/approve', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'doc-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockDbExecute.mockResolvedValueOnce({ rows: [MOCK_DOC_PENDING] })
  // sendCustomEmail is fire-and-forget — returns SendEmailResult
  const { sendCustomEmail } = require('@/lib/email')
  sendCustomEmail.mockResolvedValue({ success: true, messageId: 'test-msg' })
  // Transaction: callback is called with tx, which returns newStatus
  mockTransaction.mockImplementation(async (cb: (tx: { execute: typeof mockTxExecute }) => unknown) => {
    mockTxExecute
      .mockResolvedValueOnce({ rows: [] })  // UPDATE document
      .mockResolvedValueOnce({ rows: [{ total_required: '2', approved_required: '2' }] })  // COUNT check
      .mockResolvedValueOnce({ rows: [] })  // UPDATE application
    return cb({ execute: mockTxExecute })
  })
})

// ============================================================================
// PUT /api/admin/documents/[id]/approve
// ============================================================================

describe('PUT /api/admin/documents/[id]/approve — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/admin/documents/[id]/approve — validation', () => {
  it('returns 400 when adminNotes is not a string', async () => {
    const response = await PUT(makeRequest({ adminNotes: 123 }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when expiresAt is not a valid date', async () => {
    const response = await PUT(makeRequest({ expiresAt: 'not-a-date' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/admin/documents/[id]/approve — service errors', () => {
  it('returns 404 when document not found', async () => {
    mockDbExecute.mockReset()
    mockDbExecute.mockResolvedValueOnce({ rows: [] })
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when document already approved', async () => {
    mockDbExecute.mockReset()
    mockDbExecute.mockResolvedValueOnce({ rows: [{ ...MOCK_DOC_PENDING, status: 'approved' }] })
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/admin/documents/[id]/approve — success', () => {
  it('returns 200 on success', async () => {
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.documentId).toBe('doc-1')
  })

  it('returns 500 when DB throws', async () => {
    mockDbExecute.mockReset()
    mockDbExecute.mockRejectedValueOnce(new Error('DB error'))
    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(500)
  })

  it('logs (resolved) warn when sendCustomEmail returns {success:false} — admin-detectable, not silently swallowed', async () => {
    // sendCustomEmail RESOLVES with {success:false,error} on SMTP/
    // Listmonk failure rather than throwing. The bare .catch() only
    // catches the rare exception path; without checking .success the
    // resolved-failure case left no log. The applicant has no in-app
    // fallback for document decisions, so the email is their only
    // signal that their submitted ID/cert was reviewed.
    const { sendCustomEmail } = require('@/lib/email')
    sendCustomEmail.mockResolvedValueOnce({ success: false, error: 'SMTP rejected' })

    const response = await PUT(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    // Flush the fire-and-forget chain
    await new Promise(resolve => setImmediate(resolve))

    const { logger } = require('@/lib/logger')
    expect(logger.warn).toHaveBeenCalledWith(
      'Document approval email failed (resolved)',
      expect.objectContaining({ error: 'SMTP rejected', documentId: 'doc-1' }),
    )
  })
})
