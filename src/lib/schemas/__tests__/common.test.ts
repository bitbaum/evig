/**
 * Tests for common reusable Zod schemas (lib/schemas/common.ts)
 *
 * These primitives are composed into every other schema in the codebase.
 * Correctness here propagates everywhere — a bug in swissPostalCodeSchema
 * breaks every form that uses it.
 *
 * Covers: uuidSchema, paginationSchema, swissPostalCodeSchema,
 *         phoneSchema, ratingSchema, optionalRatingSchema.
 */

import {
  uuidSchema,
  paginationSchema,
  swissPostalCodeSchema,
  phoneSchema,
  ratingSchema,
  optionalRatingSchema,
} from '../common'

// ============================================================================
// uuidSchema
// ============================================================================

describe('uuidSchema', () => {
  it('accepts a valid UUID v4', () => {
    const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(true)
  })

  it('rejects a plain string', () => {
    const result = uuidSchema.safeParse('not-a-uuid')
    expect(result.success).toBe(false)
  })

  it('rejects an empty string', () => {
    const result = uuidSchema.safeParse('')
    expect(result.success).toBe(false)
  })

  it('rejects a UUID missing hyphens', () => {
    const result = uuidSchema.safeParse('550e8400e29b41d4a716446655440000')
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// paginationSchema
// ============================================================================

describe('paginationSchema', () => {
  it('accepts empty input (defaults applied)', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('defaults limit to 20', () => {
    const result = paginationSchema.safeParse({})
    if (result.success) expect(result.data.limit).toBe(20)
  })

  it('defaults offset to 0', () => {
    const result = paginationSchema.safeParse({})
    if (result.success) expect(result.data.offset).toBe(0)
  })

  it('accepts limit of 1 and 100', () => {
    for (const limit of [1, 100]) {
      const result = paginationSchema.safeParse({ limit })
      expect(result.success).toBe(true)
    }
  })

  it('rejects limit below 1', () => {
    const result = paginationSchema.safeParse({ limit: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects limit above 100', () => {
    const result = paginationSchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it('coerces string limit to number', () => {
    const result = paginationSchema.safeParse({ limit: '50' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(50)
  })

  it('rejects negative offset', () => {
    const result = paginationSchema.safeParse({ offset: -1 })
    expect(result.success).toBe(false)
  })

  it('coerces string offset to number', () => {
    const result = paginationSchema.safeParse({ offset: '40' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.offset).toBe(40)
  })
})

// ============================================================================
// swissPostalCodeSchema
// ============================================================================

describe('swissPostalCodeSchema', () => {
  it('accepts valid 4-digit Swiss postal codes', () => {
    for (const code of ['8001', '3000', '4051', '1000']) {
      const result = swissPostalCodeSchema.safeParse(code)
      expect(result.success).toBe(true)
    }
  })

  it('rejects 3-digit code', () => {
    const result = swissPostalCodeSchema.safeParse('800')
    expect(result.success).toBe(false)
  })

  it('rejects 5-digit code', () => {
    const result = swissPostalCodeSchema.safeParse('80012')
    expect(result.success).toBe(false)
  })

  it('rejects letters', () => {
    const result = swissPostalCodeSchema.safeParse('ABCD')
    expect(result.success).toBe(false)
  })

  it('rejects code with spaces', () => {
    const result = swissPostalCodeSchema.safeParse('80 01')
    expect(result.success).toBe(false)
  })

  it('rejects empty string', () => {
    const result = swissPostalCodeSchema.safeParse('')
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// phoneSchema
// ============================================================================

describe('phoneSchema', () => {
  it('accepts a valid phone number (10+ chars)', () => {
    const result = phoneSchema.safeParse('+41 79 123 45 67')
    expect(result.success).toBe(true)
  })

  it('accepts exactly 10 characters', () => {
    const result = phoneSchema.safeParse('0791234567')
    expect(result.success).toBe(true)
  })

  it('rejects phone number shorter than 10 characters', () => {
    const result = phoneSchema.safeParse('079123456')
    expect(result.success).toBe(false)
  })

  it('rejects empty string', () => {
    const result = phoneSchema.safeParse('')
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// ratingSchema
// ============================================================================

describe('ratingSchema', () => {
  it('accepts ratings 1 through 5', () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      const result = ratingSchema.safeParse(rating)
      expect(result.success).toBe(true)
    }
  })

  it('rejects rating below 1', () => {
    const result = ratingSchema.safeParse(0)
    expect(result.success).toBe(false)
  })

  it('rejects rating above 5', () => {
    const result = ratingSchema.safeParse(6)
    expect(result.success).toBe(false)
  })

  it('rejects non-integer rating', () => {
    const result = ratingSchema.safeParse(3.5)
    expect(result.success).toBe(false)
  })

  it('coerces string to integer', () => {
    const result = ratingSchema.safeParse('4')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe(4)
  })
})

// ============================================================================
// optionalRatingSchema
// ============================================================================

describe('optionalRatingSchema', () => {
  it('accepts undefined', () => {
    const result = optionalRatingSchema.safeParse(undefined)
    expect(result.success).toBe(true)
  })

  it('accepts null', () => {
    const result = optionalRatingSchema.safeParse(null)
    expect(result.success).toBe(true)
  })

  it('accepts valid rating', () => {
    const result = optionalRatingSchema.safeParse(3)
    expect(result.success).toBe(true)
  })

  it('rejects out-of-range rating', () => {
    const result = optionalRatingSchema.safeParse(6)
    expect(result.success).toBe(false)
  })
})
