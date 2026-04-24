/**
 * Tests for parsePagination in lib/api/helpers.ts
 *
 * parsePagination is called by every paginated list endpoint — wrong
 * clamping or page derivation silently returns wrong data to clients.
 * Tests cover: defaults, limit clamping, offset clamping, page derivation,
 * custom overrides, and invalid input handling.
 */

// helpers.ts imports NextRequest/NextResponse from next/server.
// Mock the module so Jest doesn't need the browser/edge Request global.
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: jest.fn(),
  },
}))

// Also mock logger so apiError tests don't require the full logger setup.
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}))

import { parsePagination } from '../helpers'
import { API_DEFAULTS } from '@/config/api-defaults'

// Convenience: build URLSearchParams from a plain object
function params(obj: Record<string, string>): URLSearchParams {
  return new URLSearchParams(obj)
}

// ============================================================================
// Default values
// ============================================================================

describe('parsePagination — defaults', () => {
  it('returns PAGINATION_LIMIT when no limit param', () => {
    const { limit } = parsePagination(params({}))
    expect(limit).toBe(API_DEFAULTS.PAGINATION_LIMIT) // 50
  })

  it('returns offset 0 when no offset param', () => {
    const { offset } = parsePagination(params({}))
    expect(offset).toBe(0)
  })

  it('returns page 1 when no page param', () => {
    const { page } = parsePagination(params({}))
    expect(page).toBe(1)
  })
})

// ============================================================================
// limit clamping
// ============================================================================

describe('parsePagination — limit clamping', () => {
  it('accepts a valid limit within bounds', () => {
    const { limit } = parsePagination(params({ limit: '20' }))
    expect(limit).toBe(20)
  })

  it('clamps limit below 1 to 1', () => {
    const { limit } = parsePagination(params({ limit: '0' }))
    expect(limit).toBe(1)
  })

  it('clamps negative limit to 1', () => {
    const { limit } = parsePagination(params({ limit: '-10' }))
    expect(limit).toBe(1)
  })

  it('clamps limit above maxLimit to maxLimit', () => {
    const { limit } = parsePagination(params({ limit: '999' }))
    expect(limit).toBe(API_DEFAULTS.PAGINATION_MAX_LIMIT) // 200
  })

  it('uses defaultLimit for NaN limit', () => {
    const { limit } = parsePagination(params({ limit: 'abc' }))
    expect(limit).toBe(API_DEFAULTS.PAGINATION_LIMIT)
  })

  it('uses defaultLimit for empty-string limit', () => {
    const { limit } = parsePagination(params({ limit: '' }))
    expect(limit).toBe(API_DEFAULTS.PAGINATION_LIMIT)
  })

  it('respects custom defaultLimit override', () => {
    const { limit } = parsePagination(params({}), { defaultLimit: 10 })
    expect(limit).toBe(10)
  })

  it('respects custom maxLimit override', () => {
    const { limit } = parsePagination(params({ limit: '999' }), { maxLimit: 50 })
    expect(limit).toBe(50)
  })

  it('clamps custom defaultLimit to custom maxLimit when over', () => {
    const { limit } = parsePagination(params({ limit: '60' }), { maxLimit: 50 })
    expect(limit).toBe(50)
  })
})

// ============================================================================
// offset clamping
// ============================================================================

describe('parsePagination — offset clamping', () => {
  it('accepts a valid offset', () => {
    const { offset } = parsePagination(params({ offset: '100' }))
    expect(offset).toBe(100)
  })

  it('clamps negative offset to 0', () => {
    const { offset } = parsePagination(params({ offset: '-5' }))
    expect(offset).toBe(0)
  })

  it('uses 0 for NaN offset', () => {
    const { offset } = parsePagination(params({ offset: 'bad' }))
    expect(offset).toBe(0)
  })

  it('uses 0 for empty-string offset', () => {
    const { offset } = parsePagination(params({ offset: '' }))
    expect(offset).toBe(0)
  })

  it('accepts offset of 0 explicitly', () => {
    const { offset } = parsePagination(params({ offset: '0' }))
    expect(offset).toBe(0)
  })
})

// ============================================================================
// page-based derivation
// ============================================================================

describe('parsePagination — page derivation', () => {
  it('derives offset from page when only page is provided', () => {
    // page=2, limit=50 → offset = (2-1)*50 = 50
    const { offset, page } = parsePagination(params({ page: '2' }))
    expect(page).toBe(2)
    expect(offset).toBe(50)
  })

  it('derives offset correctly for page=1 (should be 0)', () => {
    const { offset } = parsePagination(params({ page: '1' }))
    expect(offset).toBe(0)
  })

  it('page derivation respects custom limit', () => {
    // page=3, limit=10 → offset = (3-1)*10 = 20
    const { offset } = parsePagination(params({ page: '3', limit: '10' }))
    expect(offset).toBe(20)
  })

  it('offset takes precedence when both page and offset are provided', () => {
    // Explicit offset wins over page derivation
    const { offset } = parsePagination(params({ page: '3', offset: '5' }))
    expect(offset).toBe(5)
  })

  it('clamps page below 1 to 1 (page=0 → page=1, offset=0)', () => {
    const { page, offset } = parsePagination(params({ page: '0' }))
    expect(page).toBe(1)
    expect(offset).toBe(0)
  })

  it('clamps NaN page to 1', () => {
    const { page } = parsePagination(params({ page: 'notanumber' }))
    expect(page).toBe(1)
  })

  it('does NOT derive offset from page when page is absent', () => {
    // Only offset param — should use it directly
    const { offset } = parsePagination(params({ offset: '75' }))
    expect(offset).toBe(75)
  })
})

// ============================================================================
// URLSearchParams input (primary use case in tests)
// ============================================================================

describe('parsePagination — URLSearchParams input', () => {
  it('accepts URLSearchParams directly', () => {
    const sp = new URLSearchParams({ limit: '25', offset: '50' })
    const { limit, offset } = parsePagination(sp)
    expect(limit).toBe(25)
    expect(offset).toBe(50)
  })

  it('handles empty URLSearchParams', () => {
    const { limit, offset, page } = parsePagination(new URLSearchParams())
    expect(limit).toBe(API_DEFAULTS.PAGINATION_LIMIT)
    expect(offset).toBe(0)
    expect(page).toBe(1)
  })
})

// ============================================================================
// Combined
// ============================================================================

describe('parsePagination — combined params', () => {
  it('returns all three fields together', () => {
    const result = parsePagination(params({ limit: '10', offset: '30' }))
    expect(result).toMatchObject({ limit: 10, offset: 30, page: 1 })
  })

  it('page field reflects parsed page value even when offset is also provided', () => {
    const result = parsePagination(params({ page: '4', offset: '0' }))
    expect(result.page).toBe(4)
    expect(result.offset).toBe(0) // offset param wins
  })
})
