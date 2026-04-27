/**
 * Tests for services/db.ts — service type CRUD + queries.
 *
 * Mission-relevant: service types (laptop repair, device setup, etc.) are the
 * bookable offerings that connect community members with volunteer technicians.
 * Mapping bugs (camelCase → snake_case) break every service page and booking
 * flow. Create/update/delete failures leave admins unable to manage offerings.
 *
 * Behaviors locked:
 *   toDbServiceType mapping (exercised through query functions)
 *   - maps camelCase Drizzle fields to snake_case DbServiceType interface
 *   - duration_minutes defaults to 60 when durationMinutes is null
 *   - is_active defaults to true when isActive is null
 *   - is_bookable defaults to true when isBookable is null
 *   - requires_approval defaults to false when requiresApproval is null
 *   - updated_at is null when updatedAt is null
 *
 *   Read functions (getAllServiceTypes, getFeaturedServiceTypes, etc.)
 *   - return [] / null on DB error (graceful degradation — don't crash pages)
 *   - return mapped rows on success
 *   - getServiceTypeBySlug / getServiceTypeById return null when not found
 *   - getAllServiceSlugs returns slug strings
 *
 *   updateServiceType
 *   - returns current record (via getServiceTypeById) when no fields provided
 *   - executes UPDATE and returns updated record on success
 *   - returns null when service not found
 *
 *   createServiceType
 *   - inserts row and returns mapped record
 *   - throws on DB error
 *
 *   deleteServiceType
 *   - returns true when service found and soft-deleted
 *   - returns false when service not found
 *   - throws on DB error
 */

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function makeSelectChain(result: unknown[] = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.then = resolved.then.bind(resolved)
  chain.catch = resolved.catch.bind(resolved)
  chain.finally = resolved.finally.bind(resolved)
  return chain
}

function makeInsertChain(result: unknown[] = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.values = jest.fn().mockReturnValue(chain)
  chain.returning = jest.fn().mockReturnValue(chain)
  chain.then = resolved.then.bind(resolved)
  chain.catch = resolved.catch.bind(resolved)
  chain.finally = resolved.finally.bind(resolved)
  return chain
}

function makeUpdateChain(result: unknown[] = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.set = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.returning = jest.fn().mockReturnValue(chain)
  chain.then = resolved.then.bind(resolved)
  chain.catch = resolved.catch.bind(resolved)
  chain.finally = resolved.finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = jest.fn(() => makeSelectChain([]))
const mockDbExecute = jest.fn()
const mockDbInsert = jest.fn(() => makeInsertChain([]))
const mockDbUpdate = jest.fn(() => makeUpdateChain([]))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
    execute: (...args: unknown[]) => mockDbExecute(...args),
    insert: (...args: unknown[]) => mockDbInsert(...args),
    update: (...args: unknown[]) => mockDbUpdate(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  serviceTypes: {
    id: 'id',
    slug: 'slug',
    name: 'name',
    isActive: 'isActive',
    isFeatured: 'isFeatured',
    isBookable: 'isBookable',
    category: 'category',
    displayOrder: 'displayOrder',
    updatedAt: 'updatedAt',
  },
}))

jest.mock('drizzle-orm', () => {
  const sqlFn = jest.fn().mockReturnValue({ __sql: 'mocked' })
  ;(sqlFn as unknown as Record<string, unknown>).raw = jest.fn().mockReturnValue({ __sql: 'raw' })
  ;(sqlFn as unknown as Record<string, unknown>).join = jest.fn().mockReturnValue({ __sql: 'joined' })
  return {
    ...jest.requireActual('drizzle-orm'),
    sql: sqlFn,
    eq: jest.fn().mockReturnValue({ __eq: true }),
    and: jest.fn().mockReturnValue({ __and: true }),
    asc: jest.fn().mockReturnValue({ __asc: true }),
    desc: jest.fn().mockReturnValue({ __desc: true }),
    getTableName: jest.fn().mockReturnValue('mock_service_types'),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getAllServiceTypes,
  getFeaturedServiceTypes,
  getBookableServiceTypes,
  getServiceTypeBySlug,
  getServiceTypeById,
  getServiceTypesByCategory,
  getAllServiceSlugs,
  getAllServiceTypesForAdmin,
  updateServiceType,
  createServiceType,
  deleteServiceType,
} from '../db'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'svc-1',
    slug: 'laptop-repair',
    name: 'Laptop Reparatur',
    description: 'Laptop reparieren',
    category: 'repair',
    durationMinutes: 60,
    priceCents: 5000,
    requiresApproval: false,
    isActive: true,
    isBookable: true,
    isFeatured: false,
    displayOrder: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: null,
    iconName: 'Wrench',
    heroTitle: null,
    heroSubtitle: null,
    heroDescription: null,
    featuresJson: [],
    processJson: [],
    pricingBase: null,
    pricingDetails: null,
    pricingMediaPrices: null,
    ...overrides,
  }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockDbSelect.mockImplementation(() => makeSelectChain([]))
  mockDbInsert.mockImplementation(() => makeInsertChain([]))
  mockDbUpdate.mockImplementation(() => makeUpdateChain([]))
})

// ============================================================================
// toDbServiceType field mapping
// ============================================================================

describe('field mapping — toDbServiceType', () => {
  it('maps camelCase fields to snake_case output', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow()]))

    const results = await getAllServiceTypes()

    expect(results[0]).toMatchObject({
      id: 'svc-1',
      slug: 'laptop-repair',
      name: 'Laptop Reparatur',
      duration_minutes: 60,
      price_cents: 5000,
      requires_approval: false,
      is_active: true,
      is_bookable: true,
      is_featured: false,
      display_order: 10,
    })
  })

  it('defaults duration_minutes to 60 when durationMinutes is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow({ durationMinutes: null })]))

    const results = await getAllServiceTypes()

    expect(results[0].duration_minutes).toBe(60)
  })

  it('defaults is_active to true when isActive is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow({ isActive: null })]))

    const results = await getAllServiceTypes()

    expect(results[0].is_active).toBe(true)
  })

  it('defaults is_bookable to true when isBookable is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow({ isBookable: null })]))

    const results = await getAllServiceTypes()

    expect(results[0].is_bookable).toBe(true)
  })

  it('defaults requires_approval to false when requiresApproval is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow({ requiresApproval: null })]))

    const results = await getAllServiceTypes()

    expect(results[0].requires_approval).toBe(false)
  })

  it('returns null for updated_at when updatedAt is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow({ updatedAt: null })]))

    const results = await getAllServiceTypes()

    expect(results[0].updated_at).toBeNull()
  })

  it('maps icon_name from iconName', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow({ iconName: 'Monitor' })]))

    const results = await getAllServiceTypes()

    expect(results[0].icon_name).toBe('Monitor')
  })
})

// ============================================================================
// Read functions — happy paths
// ============================================================================

describe('getAllServiceTypes', () => {
  it('returns mapped service types', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow(), makeRow({ id: 'svc-2', slug: 'phone-repair' })]))

    const results = await getAllServiceTypes()

    expect(results).toHaveLength(2)
    expect(results[0].slug).toBe('laptop-repair')
  })

  it('returns empty array when no services exist', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([]))

    const results = await getAllServiceTypes()

    expect(results).toEqual([])
  })

  it('returns empty array on DB error (graceful degradation)', async () => {
    mockDbSelect.mockReturnValueOnce({
      ...makeSelectChain([]),
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue(Promise.reject(new Error('DB down'))),
        }),
      }),
    })

    const results = await getAllServiceTypes()

    expect(results).toEqual([])
  })
})

describe('getFeaturedServiceTypes', () => {
  it('returns featured service types', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow({ isFeatured: true })]))

    const results = await getFeaturedServiceTypes()

    expect(results).toHaveLength(1)
    expect(results[0].is_featured).toBe(true)
  })

  it('returns empty array on DB error', async () => {
    mockDbSelect.mockReturnValueOnce({
      ...makeSelectChain([]),
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue(Promise.reject(new Error('DB error'))),
        }),
      }),
    })

    const results = await getFeaturedServiceTypes()

    expect(results).toEqual([])
  })
})

describe('getBookableServiceTypes', () => {
  it('returns bookable service types', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow()]))

    const results = await getBookableServiceTypes()

    expect(results).toHaveLength(1)
  })
})

describe('getServiceTypeBySlug', () => {
  it('returns null when no service found', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([]))

    const result = await getServiceTypeBySlug('missing')

    expect(result).toBeNull()
  })

  it('returns mapped service when found', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow()]))

    const result = await getServiceTypeBySlug('laptop-repair')

    expect(result?.slug).toBe('laptop-repair')
    expect(result?.id).toBe('svc-1')
  })

  it('returns null on DB error', async () => {
    mockDbSelect.mockReturnValueOnce({
      ...makeSelectChain([]),
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue(Promise.reject(new Error('DB error'))),
      }),
    })

    const result = await getServiceTypeBySlug('any')

    expect(result).toBeNull()
  })
})

describe('getServiceTypeById', () => {
  it('returns null when not found', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([]))

    const result = await getServiceTypeById('missing-id')

    expect(result).toBeNull()
  })

  it('returns mapped service when found', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow()]))

    const result = await getServiceTypeById('svc-1')

    expect(result?.id).toBe('svc-1')
  })
})

describe('getServiceTypesByCategory', () => {
  it('returns services in category', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow(), makeRow({ id: 'svc-2' })]))

    const results = await getServiceTypesByCategory('repair')

    expect(results).toHaveLength(2)
  })

  it('returns empty array on DB error', async () => {
    mockDbSelect.mockReturnValueOnce({
      ...makeSelectChain([]),
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue(Promise.reject(new Error('error'))),
        }),
      }),
    })

    const results = await getServiceTypesByCategory('repair')

    expect(results).toEqual([])
  })
})

describe('getAllServiceSlugs', () => {
  it('returns slug strings from rows', async () => {
    const chain = makeSelectChain([{ slug: 'laptop-repair' }, { slug: 'phone-repair' }])
    mockDbSelect.mockReturnValueOnce(chain)

    const slugs = await getAllServiceSlugs()

    expect(slugs).toEqual(['laptop-repair', 'phone-repair'])
  })

  it('returns empty array on error', async () => {
    mockDbSelect.mockReturnValueOnce({
      ...makeSelectChain([]),
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue(Promise.reject(new Error('error'))),
        }),
      }),
    })

    const slugs = await getAllServiceSlugs()

    expect(slugs).toEqual([])
  })
})

describe('getAllServiceTypesForAdmin', () => {
  it('returns all service types including inactive', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeSelectChain([makeRow(), makeRow({ id: 'svc-2', isActive: false })]),
    )

    const results = await getAllServiceTypesForAdmin()

    expect(results).toHaveLength(2)
  })
})

// ============================================================================
// updateServiceType
// ============================================================================

describe('updateServiceType', () => {
  it('returns current record via getServiceTypeById when no fields provided', async () => {
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow()]))

    const result = await updateServiceType('svc-1', {})

    expect(result?.id).toBe('svc-1')
    expect(mockDbExecute).not.toHaveBeenCalled()
  })

  it('executes UPDATE and then fetches updated record', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{ id: 'svc-1' }] }) // UPDATE RETURNING
    mockDbSelect.mockReturnValueOnce(makeSelectChain([makeRow({ name: 'Neuer Name' })]))

    const result = await updateServiceType('svc-1', { name: 'Neuer Name' })

    expect(result?.name).toBe('Neuer Name')
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('returns null when service not found (UPDATE returns 0 rows)', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await updateServiceType('missing', { name: 'X' })

    expect(result).toBeNull()
  })

  it('throws on DB error', async () => {
    mockDbExecute.mockRejectedValueOnce(new Error('constraint violation'))

    await expect(updateServiceType('svc-1', { name: 'X' })).rejects.toThrow('constraint violation')
  })
})

// ============================================================================
// createServiceType
// ============================================================================

describe('createServiceType', () => {
  it('inserts and returns the mapped record', async () => {
    mockDbInsert.mockReturnValueOnce(makeInsertChain([makeRow()]))

    const result = await createServiceType({ name: 'Laptop Reparatur', slug: 'laptop-repair' })

    expect(result?.id).toBe('svc-1')
    expect(result?.name).toBe('Laptop Reparatur')
  })

  it('returns null when insert returns no rows', async () => {
    mockDbInsert.mockReturnValueOnce(makeInsertChain([]))

    const result = await createServiceType({ name: 'Test', slug: 'test' })

    expect(result).toBeNull()
  })

  it('throws on DB error', async () => {
    mockDbInsert.mockReturnValueOnce({
      ...makeInsertChain([]),
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockReturnValue(Promise.reject(new Error('duplicate slug'))),
      }),
    })

    await expect(createServiceType({ name: 'Test', slug: 'test' })).rejects.toThrow('duplicate slug')
  })
})

// ============================================================================
// deleteServiceType
// ============================================================================

describe('deleteServiceType', () => {
  it('returns true when service found and soft-deleted', async () => {
    mockDbUpdate.mockReturnValueOnce(makeUpdateChain([{ id: 'svc-1' }]))

    const result = await deleteServiceType('svc-1')

    expect(result).toBe(true)
  })

  it('returns false when service not found', async () => {
    mockDbUpdate.mockReturnValueOnce(makeUpdateChain([]))

    const result = await deleteServiceType('missing')

    expect(result).toBe(false)
  })

  it('throws on DB error', async () => {
    mockDbUpdate.mockReturnValueOnce({
      ...makeUpdateChain([]),
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockReturnValue(Promise.reject(new Error('DB error'))),
        }),
      }),
    })

    await expect(deleteServiceType('svc-1')).rejects.toThrow('DB error')
  })
})
