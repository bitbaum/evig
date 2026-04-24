/**
 * Tests for src/lib/api/helpers.ts — parsePagination
 *
 * parsePagination is the SSOT for all list-endpoint pagination handling.
 * Accepts either a NextRequest or a URLSearchParams.
 * All URL-parsing and clamping logic is pure — tested with URLSearchParams.
 *
 * Other helpers (apiSuccess, apiError, etc.) wrap NextResponse and are
 * integration-level; parsePagination is the only pure function here.
 *
 * next/server is mocked because NextRequest requires a global Request object
 * that is not available in the Jest environment — parsePagination only uses
 * URLSearchParams from it, so the mock is sufficient.
 */

jest.mock('next/server', () => ({
  NextRequest: class NextRequest {},
  NextResponse: { json: jest.fn() },
}))

import { parsePagination } from '../api/helpers'
import { API_DEFAULTS } from '@/config/api-defaults'

function params(query: string): URLSearchParams {
  return new URLSearchParams(query)
}

// ─── Default behaviour ────────────────────────────────────────────────────────

describe('parsePagination — defaults', () => {
  it('no params → global PAGINATION_LIMIT default', () => {
    const { limit } = parsePagination(params(''))
    expect(limit).toBe(API_DEFAULTS.PAGINATION_LIMIT)
  })

  it('no params → offset=0', () => {
    const { offset } = parsePagination(params(''))
    expect(offset).toBe(0)
  })

  it('no params → page=1 (1-indexed)', () => {
    const { page } = parsePagination(params(''))
    expect(page).toBe(1)
  })
})

// ─── Custom defaults ──────────────────────────────────────────────────────────

describe('parsePagination — custom defaultLimit / maxLimit', () => {
  it('custom defaultLimit is used when no limit param', () => {
    const { limit } = parsePagination(params(''), { defaultLimit: 20 })
    expect(limit).toBe(20)
  })

  it('custom maxLimit caps the limit', () => {
    const { limit } = parsePagination(params('limit=9999'), { defaultLimit: 20, maxLimit: 50 })
    expect(limit).toBe(50)
  })

  it('limit below maxLimit is passed through', () => {
    const { limit } = parsePagination(params('limit=10'), { defaultLimit: 20, maxLimit: 50 })
    expect(limit).toBe(10)
  })
})

// ─── limit clamping ───────────────────────────────────────────────────────────

describe('parsePagination — limit clamping', () => {
  it('limit=0 → clamped to 1 (minimum)', () => {
    const { limit } = parsePagination(params('limit=0'))
    expect(limit).toBe(1)
  })

  it('limit=-5 → clamped to 1', () => {
    const { limit } = parsePagination(params('limit=-5'))
    expect(limit).toBe(1)
  })

  it('limit=NaN → falls back to defaultLimit', () => {
    const { limit } = parsePagination(params('limit=abc'), { defaultLimit: 25 })
    expect(limit).toBe(25)
  })

  it('limit exceeding PAGINATION_MAX_LIMIT → capped', () => {
    const { limit } = parsePagination(params(`limit=${API_DEFAULTS.PAGINATION_MAX_LIMIT + 100}`))
    expect(limit).toBe(API_DEFAULTS.PAGINATION_MAX_LIMIT)
  })

  it('limit=1 is valid', () => {
    const { limit } = parsePagination(params('limit=1'))
    expect(limit).toBe(1)
  })
})

// ─── offset ───────────────────────────────────────────────────────────────────

describe('parsePagination — offset', () => {
  it('offset=20 → 20', () => {
    const { offset } = parsePagination(params('offset=20'))
    expect(offset).toBe(20)
  })

  it('offset=-10 → clamped to 0', () => {
    const { offset } = parsePagination(params('offset=-10'))
    expect(offset).toBe(0)
  })

  it('offset=NaN → 0', () => {
    const { offset } = parsePagination(params('offset=bad'))
    expect(offset).toBe(0)
  })
})

// ─── page-based pagination ────────────────────────────────────────────────────

describe('parsePagination — page param', () => {
  it('page=2 with limit=20 → offset=20 (page-based derivation)', () => {
    const { offset } = parsePagination(params('page=2&limit=20'))
    expect(offset).toBe(20)
  })

  it('page=3 with limit=10 → offset=20', () => {
    const { offset } = parsePagination(params('page=3&limit=10'))
    expect(offset).toBe(20)
  })

  it('page=1 → offset=0', () => {
    const { offset } = parsePagination(params('page=1&limit=10'))
    expect(offset).toBe(0)
  })

  it('page=0 → page clamped to 1 (minimum)', () => {
    const { page } = parsePagination(params('page=0'))
    expect(page).toBeGreaterThanOrEqual(1)
  })

  it('explicit offset takes precedence over page-derived offset', () => {
    // offset is explicitly set → page derivation skipped
    const { offset } = parsePagination(params('page=3&offset=5&limit=10'))
    expect(offset).toBe(5)
  })
})

// ─── return shape ─────────────────────────────────────────────────────────────

describe('parsePagination — return shape', () => {
  it('returns { limit, offset, page }', () => {
    const result = parsePagination(params(''))
    expect(result).toHaveProperty('limit')
    expect(result).toHaveProperty('offset')
    expect(result).toHaveProperty('page')
  })

  it('all returned values are integers', () => {
    const { limit, offset, page } = parsePagination(params('limit=15&offset=30&page=3'))
    expect(Number.isInteger(limit)).toBe(true)
    expect(Number.isInteger(offset)).toBe(true)
    expect(Number.isInteger(page)).toBe(true)
  })
})
