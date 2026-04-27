/**
 * Tests for services/index.ts — unified service layer.
 *
 * Mission-relevant: the services layer merges DB operational data with
 * static presentation config. If DB priority is wrong (presentation
 * overrides DB), staff edits to titles/descriptions are silently ignored.
 *
 * Behaviors locked:
 *   mergeServiceData (via getService)
 *   - DB hero_title overrides presentation fallback
 *   - presentation fallback used when DB hero_title is null
 *   - DB features_json used when non-empty, falls back to presentation
 *   - DB process_json used when non-empty, falls back to presentation
 *   - DB icon_name resolved via getIconByName, falls back to presentation icon
 *
 *   getService
 *   - returns merged UnifiedService when DB record found
 *   - falls back to presentation-only service when not in DB
 *   - returns null when neither DB nor presentation found
 *
 *   getAllServices / getFeaturedServices / getBookableServices
 *   - delegates to DB functions, maps each row through mergeServiceData
 *
 *   getAllServiceSlugs
 *   - merges DB slugs with presentation slugs, deduplicates
 *
 *   serviceExists / isServiceBookable
 *   - returns boolean from DB lookup
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetServiceTypeBySlug = jest.fn()
const mockGetServiceTypeById = jest.fn()
const mockGetAllServiceTypes = jest.fn()
const mockGetFeaturedServiceTypes = jest.fn()
const mockGetBookableServiceTypes = jest.fn()
const mockGetServiceTypesByCategory = jest.fn()
const mockGetAllServiceSlugsFromDb = jest.fn()
const mockGetAllServiceTypesForAdmin = jest.fn()
const mockUpdateServiceType = jest.fn()
const mockCreateServiceType = jest.fn()
const mockDeleteServiceType = jest.fn()

jest.mock('../db', () => ({
  getServiceTypeBySlug: (...args: unknown[]) => mockGetServiceTypeBySlug(...args),
  getServiceTypeById: (...args: unknown[]) => mockGetServiceTypeById(...args),
  getAllServiceTypes: (...args: unknown[]) => mockGetAllServiceTypes(...args),
  getFeaturedServiceTypes: (...args: unknown[]) => mockGetFeaturedServiceTypes(...args),
  getBookableServiceTypes: (...args: unknown[]) => mockGetBookableServiceTypes(...args),
  getServiceTypesByCategory: (...args: unknown[]) => mockGetServiceTypesByCategory(...args),
  getAllServiceSlugs: (...args: unknown[]) => mockGetAllServiceSlugsFromDb(...args),
  getAllServiceTypesForAdmin: (...args: unknown[]) => mockGetAllServiceTypesForAdmin(...args),
  updateServiceType: (...args: unknown[]) => mockUpdateServiceType(...args),
  createServiceType: (...args: unknown[]) => mockCreateServiceType(...args),
  deleteServiceType: (...args: unknown[]) => mockDeleteServiceType(...args),
}))

const mockGetServicePresentation = jest.fn()
const mockGetServicePricing = jest.fn()
const mockServicePresentation: Record<string, unknown> = {}

jest.mock('../presentation', () => ({
  getServicePresentation: (...args: unknown[]) => mockGetServicePresentation(...args),
  getServicePricing: (...args: unknown[]) => mockGetServicePricing(...args),
  // Getter defers access to mockServicePresentation until test execution
  // (direct value reference would hit TDZ during jest.mock hoisting)
  get servicePresentation() { return mockServicePresentation },
}))

const mockGetIconByName = jest.fn()

jest.mock('@/config/service-icons', () => ({
  getIconByName: (...args: unknown[]) => mockGetIconByName(...args),
}))

// The sub-modules that index.ts re-exports from
jest.mock('../inventory-service', () => ({
  getInventoryProducts: jest.fn(),
}))
jest.mock('../seller-service', () => ({
  getSellerDashboard: jest.fn(),
}))
jest.mock('../order-service', () => ({
  createOrder: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getService,
  getServiceById,
  getAllServices,
  getFeaturedServices,
  getBookableServices,
  getAllServiceSlugs,
  serviceExists,
  isServiceBookable,
} from '../index'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeDbService(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'svc-1',
    slug: 'computer-repair',
    name: 'Computer Repair',
    description: 'Wir reparieren Computer',
    category: 'repair',
    hero_title: null,
    hero_subtitle: null,
    hero_description: null,
    icon_name: null,
    features_json: null,
    process_json: null,
    pricing_base: null,
    pricing_details: null,
    pricing_media_prices: null,
    duration_minutes: 60,
    price_cents: 8900,
    requires_approval: false,
    is_active: true,
    is_bookable: true,
    is_featured: false,
    display_order: 1,
    created_at: new Date('2026-01-01'),
    updated_at: null,
    ...overrides,
  }
}

const FALLBACK_PRESENTATION = {
  icon: 'HardDriveIcon',
  hero: {
    title: 'Fallback Title',
    subtitle: 'Fallback Sub',
    description: 'Fallback Desc',
  },
  features: [{ title: 'Feature A', description: 'Desc A', icon: null }],
  process: [{ step: 1, title: 'Step 1', description: 'D1' }],
}

const FALLBACK_PRICING = {
  base: 'Ab CHF 89',
  details: ['CHF 89 für erste Stunde'],
  mediaPrices: undefined,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetServicePresentation.mockReturnValue(FALLBACK_PRESENTATION)
  mockGetServicePricing.mockReturnValue(FALLBACK_PRICING)
  mockGetIconByName.mockReturnValue('MockIcon')
})

// ============================================================================
// mergeServiceData — DB priority (tested via getService)
// ============================================================================

describe('mergeServiceData — DB priority', () => {
  it('uses DB hero_title over presentation fallback', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(
      makeDbService({ hero_title: 'Custom DB Title' }),
    )

    const result = await getService('computer-repair')

    expect(result?.name).toBe('Custom DB Title')
  })

  it('falls back to presentation hero title when DB hero_title is null', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(makeDbService({ hero_title: null }))

    const result = await getService('computer-repair')

    expect(result?.name).toBe('Fallback Title')
  })

  it('uses DB features_json when non-empty, ignoring presentation features', async () => {
    const dbFeatures = [{ title: 'DB Feature', description: 'DB Desc', icon: 'Zap' }]
    mockGetServiceTypeBySlug.mockResolvedValueOnce(
      makeDbService({ features_json: dbFeatures }),
    )

    const result = await getService('computer-repair')

    expect(result?.features).toHaveLength(1)
    expect(result?.features[0].title).toBe('DB Feature')
  })

  it('falls back to presentation features when DB features_json is null', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(makeDbService({ features_json: null }))

    const result = await getService('computer-repair')

    expect(result?.features[0].title).toBe('Feature A')
  })

  it('uses DB process_json when non-empty', async () => {
    const dbProcess = [{ step: 1, title: 'DB Step', description: 'D' }]
    mockGetServiceTypeBySlug.mockResolvedValueOnce(
      makeDbService({ process_json: dbProcess }),
    )

    const result = await getService('computer-repair')

    expect(result?.process[0].title).toBe('DB Step')
  })

  it('falls back to presentation process when DB process_json is null', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(makeDbService({ process_json: null }))

    const result = await getService('computer-repair')

    expect(result?.process[0].title).toBe('Step 1')
  })

  it('resolves icon_name via getIconByName when set', async () => {
    mockGetIconByName.mockReturnValueOnce('ResolvedIcon')
    mockGetServiceTypeBySlug.mockResolvedValueOnce(
      makeDbService({ icon_name: 'HardDrive' }),
    )

    const result = await getService('computer-repair')

    expect(result?.icon).toBe('ResolvedIcon')
    expect(mockGetIconByName).toHaveBeenCalledWith('HardDrive')
  })

  it('falls back to presentation icon when icon_name is null', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(makeDbService({ icon_name: null }))

    const result = await getService('computer-repair')

    expect(result?.icon).toBe('HardDriveIcon')
  })
})

// ============================================================================
// getService — routing
// ============================================================================

describe('getService', () => {
  it('returns merged service when DB record found', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(makeDbService())

    const result = await getService('computer-repair')

    expect(result).not.toBeNull()
    expect(result?.id).toBe('svc-1')
    expect(result?.slug).toBe('computer-repair')
  })

  it('falls back to presentation-only when not in DB', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(null)
    // Set up presentation data for the slug
    Object.assign(mockServicePresentation, {
      'presentation-only': {
        icon: 'Globe',
        hero: { title: 'Presentation Service', subtitle: 'Sub', description: 'Desc' },
        features: [],
        process: [],
      },
    })

    const result = await getService('presentation-only')

    expect(result).not.toBeNull()
    expect(result?.id).toBe('presentation-presentation-only')
  })

  it('returns null when neither DB nor presentation found', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(null)
    // mockServicePresentation has no entry for 'unknown-slug'

    const result = await getService('unknown-slug')

    expect(result).toBeNull()
  })
})

// ============================================================================
// Delegating functions
// ============================================================================

describe('getAllServices', () => {
  it('maps all DB services through mergeServiceData', async () => {
    mockGetAllServiceTypes.mockResolvedValueOnce([makeDbService(), makeDbService({ id: 'svc-2', slug: 'data-recovery' })])

    const result = await getAllServices()

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('svc-1')
  })

  it('returns empty array when no services exist', async () => {
    mockGetAllServiceTypes.mockResolvedValueOnce([])

    const result = await getAllServices()

    expect(result).toEqual([])
  })
})

describe('getFeaturedServices', () => {
  it('returns only featured services', async () => {
    mockGetFeaturedServiceTypes.mockResolvedValueOnce([makeDbService({ is_featured: true })])

    const result = await getFeaturedServices()

    expect(result).toHaveLength(1)
    expect(result[0].isFeatured).toBe(true)
  })
})

describe('getAllServiceSlugs', () => {
  it('merges DB slugs and presentation slugs with deduplication', async () => {
    mockGetAllServiceSlugsFromDb.mockResolvedValueOnce(['computer-repair', 'data-recovery'])
    Object.assign(mockServicePresentation, {
      'computer-repair': {},   // duplicate — should appear once
      'web-design': {},         // presentation-only — should appear once
    })

    const result = await getAllServiceSlugs()

    const unique = new Set(result)
    expect(unique.size).toBe(result.length) // no duplicates
    expect(result).toContain('computer-repair')
    expect(result).toContain('data-recovery')
    expect(result).toContain('web-design')
  })
})

// ============================================================================
// Utility functions
// ============================================================================

describe('serviceExists', () => {
  it('returns true when service found', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(makeDbService({ is_active: true }))

    const result = await serviceExists('computer-repair')

    expect(result).toBe(true)
  })

  it('returns false when service not found', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(null)

    const result = await serviceExists('missing')

    expect(result).toBe(false)
  })
})

describe('isServiceBookable', () => {
  it('returns true when service is bookable and active', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(makeDbService({ is_bookable: true, is_active: true }))

    const result = await isServiceBookable('computer-repair')

    expect(result).toBe(true)
  })

  it('returns false when service not found', async () => {
    mockGetServiceTypeBySlug.mockResolvedValueOnce(null)

    const result = await isServiceBookable('missing')

    expect(result).toBe(false)
  })
})
