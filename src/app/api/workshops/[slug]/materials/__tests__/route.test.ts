/**
 * @jest-environment node
 *
 * Tests for GET /api/workshops/[slug]/materials (public with optional auth)
 *
 * Behaviors locked:
 *   GET - 404 (workshop not found), 200 with public materials (unauthenticated),
 *         200 with registered materials (authenticated + registered),
 *         200 with attended materials (authenticated + attended)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockSelect = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  workshops: {
    id: 'ws_id', title: 'ws_title', slug: 'ws_slug', isActive: 'ws_isActive',
  },
  workshopMaterials: {
    id: 'wm_id', workshopId: 'wm_workshopId', title: 'wm_title',
    description: 'wm_description', materialType: 'wm_materialType',
    url: 'wm_url', fileSizeBytes: 'wm_fileSizeBytes',
    accessType: 'wm_accessType', displayOrder: 'wm_displayOrder',
    createdAt: 'wm_createdAt', isActive: 'wm_isActive',
  },
  workshopRegistrations: {
    id: 'wr_id', userId: 'wr_userId',
    workshopInstanceId: 'wr_workshopInstanceId',
    status: 'wr_status', attended: 'wr_attended',
    createdAt: 'wr_createdAt',
  },
  workshopInstances: {
    id: 'wi_id', workshopId: 'wi_workshopId',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  asc: (a: unknown) => ({ __asc: a }),
  desc: (a: unknown) => ({ __desc: a }),
  inArray: (col: unknown, vals: unknown) => ({ __inArray: [col, vals] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: {
    PENDING: 'pending', CONFIRMED: 'confirmed',
    ATTENDED: 'attended', CANCELLED: 'cancelled',
  },
  WORKSHOP_MATERIAL_ACCESS_TYPE: {
    PUBLIC: 'public', REGISTERED: 'registered', ATTENDED: 'attended',
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
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
  }
})

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_PUBLIC_MATERIAL = {
  id: 'mat-1',
  title: 'Einführungsfolien',
  description: null,
  material_type: 'slides',
  url: 'https://example.com/slides.pdf',
  file_size_bytes: null,
  access_type: 'public',
  display_order: 1,
  created_at: new Date(),
}

// Build parallel query chain with .then() for workshop lookup and registration check
function makeWorkshopLookupChain(workshop: unknown) {
  const thenFn = jest.fn().mockImplementation((cb: (rows: unknown[]) => unknown) =>
    Promise.resolve(cb(workshop ? [workshop] : []))
  )
  const where = jest.fn().mockReturnValue({ then: thenFn })
  const from = jest.fn().mockReturnValue({ where })
  return { from }
}

function makeRegistrationLookupChain(reg: unknown) {
  const thenFn = jest.fn().mockImplementation((cb: (rows: unknown[]) => unknown) =>
    Promise.resolve(cb(reg ? [reg] : []))
  )
  const limit = jest.fn().mockReturnValue({ then: thenFn })
  const orderBy = jest.fn().mockReturnValue({ limit })
  const where = jest.fn().mockReturnValue({ orderBy })
  const innerJoin2 = jest.fn().mockReturnValue({ where })
  const innerJoin1 = jest.fn().mockReturnValue({ innerJoin: innerJoin2 })
  const from = jest.fn().mockReturnValue({ innerJoin: innerJoin1 })
  return { from }
}

// Build materials fetch chain: where → orderBy (resolves to array)
function makeMaterialsChain(materials: unknown[]) {
  const orderBy = jest.fn().mockResolvedValue(materials)
  const where = jest.fn().mockReturnValue({ orderBy })
  const from = jest.fn().mockReturnValue({ where })
  return { from }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(null) // unauthenticated by default
})

// ============================================================================
// 404 — workshop not found
// ============================================================================

describe('GET /api/workshops/[slug]/materials — workshop not found', () => {
  it('returns 404 when workshop does not exist', async () => {
    mockSelect
      .mockReturnValueOnce(makeWorkshopLookupChain(null))
      .mockReturnValue(makeRegistrationLookupChain(null))

    const req = new NextRequest('http://localhost/api/workshops/nonexistent/materials')
    const response = await GET(req, { params: Promise.resolve({ slug: 'nonexistent' }) })

    expect(response.status).toBe(404)
  })
})

// ============================================================================
// 200 — public materials (unauthenticated)
// ============================================================================

describe('GET /api/workshops/[slug]/materials — public access', () => {
  it('returns 200 with only public materials when unauthenticated', async () => {
    mockSelect
      .mockReturnValueOnce(makeWorkshopLookupChain({ id: 'workshop-1', title: 'Linux Kurs' }))
      // No registration call since session is null
      .mockReturnValue(makeMaterialsChain([MOCK_PUBLIC_MATERIAL]))

    const req = new NextRequest('http://localhost/api/workshops/linux-kurs/materials')
    const response = await GET(req, { params: Promise.resolve({ slug: 'linux-kurs' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.accessLevel).toBe('public')
    expect(body.data.materials).toHaveLength(1)
    expect(body.data.workshopTitle).toBe('Linux Kurs')
  })
})

// ============================================================================
// 200 — registered materials
// ============================================================================

describe('GET /api/workshops/[slug]/materials — registered access', () => {
  it('returns 200 with registered-level materials when user is registered', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    })

    const registeredMaterial = { ...MOCK_PUBLIC_MATERIAL, id: 'mat-2', access_type: 'registered' }

    mockSelect
      .mockReturnValueOnce(makeWorkshopLookupChain({ id: 'workshop-1', title: 'Linux Kurs' }))
      .mockReturnValueOnce(makeRegistrationLookupChain({ status: 'confirmed', attended: false }))
      .mockReturnValue(makeMaterialsChain([MOCK_PUBLIC_MATERIAL, registeredMaterial]))

    const req = new NextRequest('http://localhost/api/workshops/linux-kurs/materials')
    const response = await GET(req, { params: Promise.resolve({ slug: 'linux-kurs' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.accessLevel).toBe('registered')
    expect(body.data.materials).toHaveLength(2)
  })
})

// ============================================================================
// 200 — attended materials
// ============================================================================

describe('GET /api/workshops/[slug]/materials — attended access', () => {
  it('returns 200 with all materials when user has attended', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    })

    const attendedMaterial = { ...MOCK_PUBLIC_MATERIAL, id: 'mat-3', access_type: 'attended' }

    mockSelect
      .mockReturnValueOnce(makeWorkshopLookupChain({ id: 'workshop-1', title: 'Linux Kurs' }))
      .mockReturnValueOnce(makeRegistrationLookupChain({ status: 'attended', attended: true }))
      .mockReturnValue(makeMaterialsChain([MOCK_PUBLIC_MATERIAL, attendedMaterial]))

    const req = new NextRequest('http://localhost/api/workshops/linux-kurs/materials')
    const response = await GET(req, { params: Promise.resolve({ slug: 'linux-kurs' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.accessLevel).toBe('attended')
    expect(body.data.materials).toHaveLength(2)
  })
})
