/**
 * @jest-environment node
 *
 * Tests for GET/PATCH /api/admin/intake/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/intake/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when item not found
 *   - returns 200 with device detail and checklist
 *
 *   PATCH /api/admin/intake/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when item not found
 *   - returns 200 on success
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

// Drizzle select chain
const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockLimit = jest.fn()

// Drizzle update chain
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
  inventoryItems: { id: 'ii_id', aiProductId: 'ii_aiProductId', intakeTier: 'ii_intakeTier', intakeChecklist: 'ii_intakeChecklist', checklistComplete: 'ii_checklistComplete', marketplaceStatus: 'ii_mktStatus', sellingPriceChf: 'ii_price', sourceDonationId: 'ii_donationId', location: 'ii_location', status: 'ii_status', createdAt: 'ii_createdAt', intakeEvents: 'ii_intakeEvents', updatedAt: 'ii_updatedAt' },
  aiExtractedProducts: { id: 'aep_id', itemUuid: 'aep_itemUuid', productName: 'aep_name', brand: 'aep_brand', shortDescription: 'aep_shortDesc', condition: 'aep_condition', category: 'aep_category', subcategory: 'aep_subcategory', estimatedPriceChf: 'aep_price', createdBy: 'aep_createdBy', updatedAt: 'aep_updatedAt' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
  donations: { id: 'd_id', donorName: 'd_donorName', donorEmail: 'd_donorEmail', notes: 'd_notes', status: 'd_status' },
  productImages: { productId: 'pi_productId', isPrimary: 'pi_isPrimary', filePath: 'pi_filePath' },
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

jest.mock('@/config/intake-checklist', () => ({
  getChecklistForDevice: jest.fn().mockReturnValue([]),
  getChecklistProgress: jest.fn().mockReturnValue({ completed: 0, total: 0 }),
  isChecklistComplete: jest.fn().mockReturnValue(false),
  CHECKLIST_CATEGORY_LABELS: {},
}))

const mockAppendIntakeEvent = jest.fn()

jest.mock('@/lib/intake/timeline', () => ({
  appendIntakeEvent: (...args: unknown[]) => mockAppendIntakeEvent.apply(null, args),
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
}))

jest.mock('@/lib/schemas/intake', () => ({
  IntakeUpdateSchema: {},
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Interner Serverfehler', INTAKE_ITEM_NOT_FOUND: 'Nicht gefunden' },
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
import { GET, PATCH } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_ROW = {
  id: 'inv-1',
  ai_product_id: 'prod-1',
  intake_tier: 'refurbish',
  intake_checklist: null,
  checklist_complete: false,
  marketplace_status: 'draft',
  selling_price_chf: '299',
  source_donation_id: null,
  location: null,
  status: 'active',
  created_at: '2026-01-01',
  intake_events: [],
  item_uuid: 'uuid-1',
  product_name: 'ThinkPad',
  brand: 'Lenovo',
  short_description: null,
  condition: 'good',
  category: 'Laptop',
  subcategory: null,
  estimated_price_chf: '299',
  created_by_name: 'Admin',
  created_by_email: 'admin@revamp-it.ch',
  donor_name: null,
  donor_email: null,
  donor_notes: null,
  donation_status: null,
}

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/intake/inv-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'inv-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // GET: select().from().innerJoin().leftJoin().leftJoin().where()
  //      + image lookup: select().from(productImages).where().limit(1)
  // PATCH existence check: select().from(inventoryItems).where() (no joins)
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
  mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin })
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  // The where() result is awaited directly (detail row) OR chained with
  // .limit(1) (image lookup) — return a promise that also carries .limit.
  mockWhere.mockImplementation(() =>
    Object.assign(Promise.resolve([MOCK_ROW]), { limit: mockLimit })
  )
  mockLimit.mockResolvedValue([])

  // PATCH: select().from().where() for existence check
  // (uses same mockFrom chain, but different terminal)

  // UPDATE: update().set().where()
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  mockAppendIntakeEvent.mockResolvedValue(undefined)
  mockValidateBody.mockReturnValue({
    success: true,
    data: { hersteller: 'Lenovo' },
  })

  const checklist = require('@/config/intake-checklist')
  checklist.getChecklistForDevice.mockReturnValue([])
  checklist.getChecklistProgress.mockReturnValue({ completed: 0, total: 0 })
  checklist.isChecklistComplete.mockReturnValue(false)
})

// ============================================================================
// GET /api/admin/intake/[id]
// ============================================================================

describe('GET /api/admin/intake/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/intake/[id] — authenticated', () => {
  it('returns 404 when item not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with device detail and checklist', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.id).toBe('inv-1')
    expect(body.data.brand).toBe('Lenovo')
    expect(body.data.checklist_items).toEqual([])
  })
})

// ============================================================================
// PATCH /api/admin/intake/[id]
// ============================================================================

describe('PATCH /api/admin/intake/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { hersteller: 'Dell' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/intake/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when item not found', async () => {
    // PATCH uses select().from().where() for existence check
    // mockWhere is the terminal for both GET and PATCH select queries
    mockWhere.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest('PATCH', { hersteller: 'Dell' }), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('PATCH /api/admin/intake/[id] — success', () => {
  it('returns 200 on success', async () => {
    // PATCH: existence check resolves to [{ id, aiProductId }]
    mockWhere.mockResolvedValueOnce([{ id: 'inv-1', aiProductId: 'prod-1' }])
    const response = await PATCH(makeRequest('PATCH', { hersteller: 'Dell' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.updated).toBe(true)
  })
})
