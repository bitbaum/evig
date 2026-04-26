/**
 * Tests for the marketplace listing helpers (lib/marketplace/listing-helpers.ts).
 *
 * Two exports:
 *
 *   buildMeiliSpecs — pure spec → Meilisearch denormalized fields
 *     transform. Drives marketplace search filterability ("show me all
 *     laptops with ≥16 GB RAM"). The SPEC_MEILI_FIELD_MAP is the
 *     allow-list — anything not in it is dropped, anything in it is
 *     normalized via normalizeSpecValue.
 *
 *   indexListingInSearch — fire-and-forget Meilisearch indexer that
 *     merges denormalized specs into the document. Errors are logged
 *     but never thrown (callers don't await it). Mission-relevant:
 *     a regression here breaks marketplace search/filter.
 */

const mockIndexListing = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('@/lib/search/meilisearch', () => ({
  indexListing: (...args: unknown[]) => mockIndexListing(...args),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: (...args: unknown[]) => mockLoggerError(...args),
    debug: jest.fn(),
  },
}))

import { buildMeiliSpecs, indexListingInSearch } from '../listing-helpers'
import type { ListingSpecInput } from '@/lib/schemas/marketplace'
import type { MeilisearchDocument } from '@/lib/search/meilisearch'

beforeEach(() => {
  mockIndexListing.mockReset()
  mockLoggerError.mockReset()
})

// ============================================================================
// buildMeiliSpecs
// ============================================================================

describe('buildMeiliSpecs', () => {
  it('returns empty object when specs is undefined', () => {
    expect(buildMeiliSpecs(undefined)).toEqual({})
  })

  it('returns empty object for empty specs array', () => {
    expect(buildMeiliSpecs([])).toEqual({})
  })

  it('maps RAM spec to spec_ram_gb with parsed numeric value', () => {
    const specs: ListingSpecInput[] = [{ key: 'RAM', value: '16 GB' }]
    expect(buildMeiliSpecs(specs)).toEqual({ spec_ram_gb: 16 })
  })

  it('maps Speicher spec to spec_storage_gb with TB→GB conversion', () => {
    const specs: ListingSpecInput[] = [{ key: 'Speicher', value: '1 TB' }]
    // 1 TB → 1000 GB
    expect(buildMeiliSpecs(specs)).toEqual({ spec_storage_gb: 1000 })
  })

  it('maps Display spec to spec_display_inches', () => {
    const specs: ListingSpecInput[] = [{ key: 'Display', value: '14 Zoll' }]
    expect(buildMeiliSpecs(specs)).toEqual({ spec_display_inches: 14 })
  })

  it('maps Grösse spec to spec_display_inches (Swiss German alias for Display)', () => {
    // CLAUDE.md rule #4 — Grösse uses ö, not Groesse
    const specs: ListingSpecInput[] = [{ key: 'Grösse', value: '15.6 Zoll' }]
    expect(buildMeiliSpecs(specs)).toEqual({ spec_display_inches: 15.6 })
  })

  it('handles multiple mapped specs in one call', () => {
    const specs: ListingSpecInput[] = [
      { key: 'RAM', value: '32 GB' },
      { key: 'Speicher', value: '512 GB' },
      { key: 'Display', value: '16 Zoll' },
    ]
    expect(buildMeiliSpecs(specs)).toEqual({
      spec_ram_gb: 32,
      spec_storage_gb: 512,
      spec_display_inches: 16,
    })
  })

  it('drops unmapped spec keys (allow-list behavior)', () => {
    // "Farbe" / "CPU" are not in SPEC_MEILI_FIELD_MAP — dropped silently
    const specs: ListingSpecInput[] = [
      { key: 'RAM', value: '16 GB' },
      { key: 'Farbe', value: 'Schwarz' },
      { key: 'CPU', value: 'i7-12700H' },
    ]
    const result = buildMeiliSpecs(specs)
    expect(result).toEqual({ spec_ram_gb: 16 })
    expect(result).not.toHaveProperty('Farbe')
    expect(result).not.toHaveProperty('CPU')
  })

  it('skips specs with falsy values (empty string, null-equivalent)', () => {
    const specs: ListingSpecInput[] = [
      { key: 'RAM', value: '' },
      { key: 'Speicher', value: '256 GB' },
    ]
    const result = buildMeiliSpecs(specs)
    expect(result).not.toHaveProperty('spec_ram_gb')
    expect(result.spec_storage_gb).toBe(256)
  })

  it('overlapping spec keys later overwrites earlier (Display + Grösse → same field)', () => {
    // Both Display and Grösse map to spec_display_inches — last wins
    const specs: ListingSpecInput[] = [
      { key: 'Display', value: '13 Zoll' },
      { key: 'Grösse', value: '14 Zoll' },
    ]
    expect(buildMeiliSpecs(specs)).toEqual({ spec_display_inches: 14 })
  })
})

// ============================================================================
// indexListingInSearch
// ============================================================================

describe('indexListingInSearch', () => {
  const sampleDoc: MeilisearchDocument = {
    id: 'lst-1',
    title: 'MacBook Pro 14" M2',
    brand: 'Apple',
    priceCents: 150000,
    category: 'laptop',
    condition: 'good',
    location: 'Zürich',
    description: 'A laptop',
    sellerId: 's1',
    isRevampit: false,
  } as unknown as MeilisearchDocument

  it('calls indexListing with the document plus denormalized spec fields merged in', () => {
    mockIndexListing.mockResolvedValueOnce(undefined)
    indexListingInSearch(sampleDoc, [
      { key: 'RAM', value: '16 GB' },
      { key: 'Speicher', value: '512 GB' },
    ])

    expect(mockIndexListing).toHaveBeenCalledTimes(1)
    expect(mockIndexListing).toHaveBeenCalledWith(expect.objectContaining({
      id: 'lst-1',
      title: 'MacBook Pro 14" M2',
      spec_ram_gb: 16,
      spec_storage_gb: 512,
    }))
  })

  it('passes through the document unchanged when no specs provided', () => {
    mockIndexListing.mockResolvedValueOnce(undefined)
    indexListingInSearch(sampleDoc)

    expect(mockIndexListing).toHaveBeenCalledTimes(1)
    expect(mockIndexListing).toHaveBeenCalledWith(expect.objectContaining({
      id: 'lst-1',
      title: 'MacBook Pro 14" M2',
    }))
    // No spec_* fields added when no specs
    const arg = mockIndexListing.mock.calls[0][0] as Record<string, unknown>
    expect(Object.keys(arg).filter(k => k.startsWith('spec_'))).toEqual([])
  })

  it('is fire-and-forget: returns void synchronously even though indexListing is async', () => {
    let resolveIndex!: () => void
    mockIndexListing.mockReturnValueOnce(new Promise(r => { resolveIndex = r }))

    const result = indexListingInSearch(sampleDoc)
    expect(result).toBeUndefined()

    // Pending promise — caller did not await it
    resolveIndex()
  })

  it('logs but does NOT throw when indexListing rejects', async () => {
    mockIndexListing.mockReturnValueOnce(Promise.reject(new Error('Meilisearch down')))

    expect(() => indexListingInSearch(sampleDoc)).not.toThrow()

    // Wait for the rejected promise to flush through .catch
    await Promise.resolve()
    await Promise.resolve()

    expect(mockLoggerError).toHaveBeenCalledWith(
      'Failed to index listing in Meilisearch',
      expect.objectContaining({
        error: expect.any(Error),
        listingId: 'lst-1',
      }),
    )
  })

  it('drops unmapped spec keys before sending to Meilisearch (allow-list)', () => {
    mockIndexListing.mockResolvedValueOnce(undefined)
    indexListingInSearch(sampleDoc, [
      { key: 'RAM', value: '16 GB' },
      { key: 'Farbe', value: 'Schwarz' },
    ])

    const arg = mockIndexListing.mock.calls[0][0] as Record<string, unknown>
    expect(arg.spec_ram_gb).toBe(16)
    expect(arg).not.toHaveProperty('Farbe')
    expect(arg).not.toHaveProperty('spec_farbe')
  })
})
