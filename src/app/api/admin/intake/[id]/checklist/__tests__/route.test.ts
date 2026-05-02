/**
 * @jest-environment node
 *
 * Tests for PATCH /api/admin/intake/[id]/checklist
 *
 * Behaviors locked:
 *   PATCH /api/admin/intake/[id]/checklist
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when item not found
 *   - returns 400 when checklist item_id is not valid for this device
 *   - returns 200 with updated checklist state
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

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  inventoryItems: { id: 'ii_id', aiProductId: 'ii_aiProductId', intakeTier: 'ii_intakeTier', intakeChecklist: 'ii_intakeChecklist', checklistComplete: 'ii_checklistComplete', updatedAt: 'ii_updatedAt' },
  aiExtractedProducts: { id: 'aep_id', category: 'aep_category', aiProductId: 'aep_aiProductId' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  isNotNull: (col: unknown) => ({ __isNotNull: col }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
}))

jest.mock('@/lib/schemas/intake', () => ({
  ChecklistUpdateSchema: {},
}))

jest.mock('@/config/intake-checklist', () => ({
  getChecklistForDevice: jest.fn().mockReturnValue([{ id: 'photos', label: 'Fotos', category: 'Aufnahme' }]),
  isChecklistComplete: jest.fn().mockReturnValue(false),
  getChecklistProgress: jest.fn().mockReturnValue({ completed: 1, total: 1 }),
}))

const mockAppendIntakeEvent = jest.fn()

jest.mock('@/lib/intake/timeline', () => ({
  appendIntakeEvent: (...args: unknown[]) => mockAppendIntakeEvent.apply(null, args),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler', INTAKE_ITEM_NOT_FOUND: 'Nicht gefunden', INTAKE_INVALID_CHECKLIST_ITEM: 'Ungültiges Checklistenelement' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
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

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { PATCH } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_ROW = { id: 'inv-1', intakeTier: 'refurbish', intakeChecklist: {}, category: 'Laptop' }

function makeRequest(body: Record<string, unknown> = { item_id: 'photos', completed: true }) {
  return new NextRequest('http://localhost/api/admin/intake/inv-1/checklist', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'inv-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([MOCK_ROW])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  mockAppendIntakeEvent.mockResolvedValue(undefined)

  mockValidateBody.mockReturnValue({
    success: true,
    data: { item_id: 'photos', completed: true },
  })

  const checklist = require('@/config/intake-checklist')
  checklist.getChecklistForDevice.mockReturnValue([{ id: 'photos', label: 'Fotos', category: 'Aufnahme' }])
  checklist.isChecklistComplete.mockReturnValue(false)
  checklist.getChecklistProgress.mockReturnValue({ completed: 1, total: 1 })
})

// ============================================================================
// PATCH /api/admin/intake/[id]/checklist
// ============================================================================

describe('PATCH /api/admin/intake/[id]/checklist — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/intake/[id]/checklist — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PATCH(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when item not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when checklist item_id is not valid for this device', async () => {
    const checklist = require('@/config/intake-checklist')
    checklist.getChecklistForDevice.mockReturnValueOnce([]) // no applicable items
    const response = await PATCH(makeRequest({ item_id: 'nonexistent', completed: true }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/intake/[id]/checklist — success', () => {
  it('returns 200 with updated checklist state', async () => {
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.checklist_complete).toBe(false)
    expect(body.data.checklist_progress).toEqual({ completed: 1, total: 1 })
  })
})
