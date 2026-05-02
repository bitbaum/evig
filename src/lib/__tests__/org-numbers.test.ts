/**
 * Tests for lib/org-numbers.ts — server-side DB layer for organizational numbers.
 *
 * Mission-relevant: org numbers (CO₂ savings, devices sold, team size) appear
 * on the public website and in HIRN's system prompt. If getNumericValue throws
 * instead of falling back to defaults on DB failure, the homepage crashes.
 * If mapRow drops numericValue (numeric DB type coercion), HIRN quotes "null"
 * instead of the actual CO₂ figure.
 *
 * Behaviors locked:
 *   getOrgNumber
 *   - returns null when row not found
 *   - returns mapped OrgNumber with correct field types when found
 *   - coerces numericValue to Number (DB may return string)
 *   - returns null on DB error (never throws)
 *
 *   getOrgNumbers
 *   - returns empty array on DB error (never throws)
 *   - returns all rows when no category filter
 *   - returns filtered rows when category provided
 *
 *   getNumericValue
 *   - returns DB numericValue when found
 *   - falls back to ORG_NUMBERS_DEFAULTS when DB returns null
 *   - throws when key not found in DB or defaults
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select = jest.fn().mockReturnValue(chain)
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('server-only', () => ({}))

const mockDbSelect = jest.fn(() => makeChain([]))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  orgNumbers: {
    key: 'on_key', value: 'on_value', numericValue: 'on_numericValue',
    label: 'on_label', category: 'on_category', confidence: 'on_confidence',
    methodology: 'on_methodology', calculation: 'on_calculation',
    sourceDocument: 'on_sourceDocument', externalLink: 'on_externalLink',
    lastVerified: 'on_lastVerified', updatedAt: 'on_updatedAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  asc: jest.fn().mockReturnValue({ __asc: true }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// Provide a minimal defaults map so fallback tests don't need to load the full file
jest.mock('@/lib/org-numbers.defaults', () => ({
  ORG_NUMBERS_DEFAULTS: {
    'founding_year': { key: 'founding_year', numericValue: 2003, value: '2003', label: 'Gründungsjahr', category: 'impact', confidence: 'exact' },
    'team_fte': { key: 'team_fte', numericValue: 5, value: '5', label: 'Team FTE', category: 'team', confidence: 'estimate' },
  },
  getDefaultNumeric: jest.fn((key: string) => {
    const map: Record<string, number> = { founding_year: 2003, team_fte: 5 }
    const v = map[key]
    if (v == null) throw new Error(`Unknown key: ${key}`)
    return v
  }),
  getDefaultValue: jest.fn((key: string) => String(key)),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getOrgNumber, getOrgNumbers, getNumericValue } from '../org-numbers'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    key: 'founding_year',
    value: '2003',
    numericValue: '2003',      // DB may return decimal as string
    label: 'Gründungsjahr',
    category: 'impact',
    confidence: 'exact',
    methodology: null,
    calculation: null,
    sourceDocument: null,
    externalLink: null,
    lastVerified: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbSelect.mockImplementation(() => makeChain([]))
})

// ============================================================================
// getOrgNumber
// ============================================================================

describe('getOrgNumber', () => {
  it('returns null when no row found', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([]))

    const result = await getOrgNumber('unknown_key')

    expect(result).toBeNull()
  })

  it('returns mapped OrgNumber when row found', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makeRow()]))

    const result = await getOrgNumber('founding_year')

    expect(result).not.toBeNull()
    expect(result!.key).toBe('founding_year')
    expect(result!.value).toBe('2003')
    expect(result!.label).toBe('Gründungsjahr')
    expect(result!.category).toBe('impact')
    expect(result!.confidence).toBe('exact')
  })

  it('coerces numericValue to Number', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makeRow({ numericValue: '2003.0' })]))

    const result = await getOrgNumber('founding_year')

    expect(result!.numericValue).toBe(2003)
    expect(typeof result!.numericValue).toBe('number')
  })

  it('sets numericValue to null when DB column is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makeRow({ numericValue: null })]))

    const result = await getOrgNumber('founding_year')

    expect(result!.numericValue).toBeNull()
  })

  it('returns null on DB error (never throws)', async () => {
    mockDbSelect.mockImplementationOnce(() => {
      throw new Error('DB connection refused')
    })

    const result = await getOrgNumber('founding_year')

    expect(result).toBeNull()
  })

  it('converts lastVerified and updatedAt to strings', async () => {
    const date = new Date('2026-04-01')
    mockDbSelect.mockReturnValueOnce(makeChain([makeRow({ lastVerified: date, updatedAt: date })]))

    const result = await getOrgNumber('founding_year')

    expect(typeof result!.lastVerified).toBe('string')
    expect(typeof result!.updatedAt).toBe('string')
  })
})

// ============================================================================
// getOrgNumbers
// ============================================================================

describe('getOrgNumbers', () => {
  it('returns empty array when no rows', async () => {
    const result = await getOrgNumbers()

    expect(result).toEqual([])
  })

  it('returns all mapped rows when no category filter', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeChain([makeRow({ key: 'founding_year' }), makeRow({ key: 'team_fte', value: '5', numericValue: 5 })])
    )

    const result = await getOrgNumbers()

    expect(result).toHaveLength(2)
    expect(result[0].key).toBe('founding_year')
    expect(result[1].key).toBe('team_fte')
  })

  it('passes category filter to query when provided', async () => {
    const { eq } = jest.requireMock('drizzle-orm') as { eq: jest.Mock }
    mockDbSelect.mockReturnValueOnce(makeChain([makeRow()]))

    await getOrgNumbers('impact')

    // eq should be called with the category column and 'impact'
    const categoryCall = eq.mock.calls.find(([, v]: [unknown, string]) => v === 'impact')
    expect(categoryCall).toBeDefined()
  })

  it('returns empty array on DB error (never throws)', async () => {
    mockDbSelect.mockImplementationOnce(() => {
      throw new Error('timeout')
    })

    const result = await getOrgNumbers()

    expect(result).toEqual([])
  })
})

// ============================================================================
// getNumericValue
// ============================================================================

describe('getNumericValue', () => {
  it('returns DB numericValue when key exists in DB', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makeRow({ numericValue: 2003 })]))

    const result = await getNumericValue('founding_year')

    expect(result).toBe(2003)
  })

  it('falls back to ORG_NUMBERS_DEFAULTS when DB row not found', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([]))  // not in DB

    const result = await getNumericValue('team_fte')

    expect(result).toBe(5)  // from mock defaults
  })

  it('falls back to ORG_NUMBERS_DEFAULTS when DB numericValue is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makeRow({ numericValue: null })]))

    const result = await getNumericValue('team_fte')

    expect(result).toBe(5)  // from mock defaults
  })

  it('throws when key not found in DB or defaults', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([]))

    await expect(getNumericValue('nonexistent_key')).rejects.toThrow('"nonexistent_key" not found')
  })
})
