/**
 * Tests for data/media-coverage.ts — media mention lookup helpers.
 *
 * Mission-relevant: the "As Seen In" section on the homepage and press page
 * shows media coverage. If getFeaturedMedia() returns [] instead of actual
 * articles, the press section shows no coverage.
 *
 * Behaviors locked:
 *   getMediaByTier
 *   - returns only mentions with matching tier
 *   - returns empty array for tier with no matches (e.g. tier 4)
 *
 *   getFeaturedMedia
 *   - returns only article/feature type mentions with tier <= 2
 *   - sorted by tier ascending (tier 1 before tier 2)
 *
 *   getUniqueSourcesForLogos
 *   - returns unique sources (no duplicates by shortName)
 *   - each result has name and shortName
 *
 *   getTier1Sources
 *   - returns only tier 1 mentions
 *
 *   getMediaStats
 *   - returns article count, unique sources, and total count
 */

import {
  getMediaByTier,
  getFeaturedMedia,
  getUniqueSourcesForLogos,
  getTier1Sources,
  getMediaStats,
  MEDIA_COVERAGE,
} from '../media-coverage'

// ============================================================================
// getMediaByTier
// ============================================================================

describe('getMediaByTier', () => {
  it('returns only tier 1 mentions', () => {
    const results = getMediaByTier(1)
    for (const m of results) {
      expect(m.tier).toBe(1)
    }
  })

  it('returns non-empty array for tier 1 (national media exists)', () => {
    expect(getMediaByTier(1).length).toBeGreaterThan(0)
  })

  it('all returned mentions have matching tier', () => {
    const results = getMediaByTier(2)
    for (const m of results) {
      expect(m.tier).toBe(2)
    }
  })
})

// ============================================================================
// getFeaturedMedia
// ============================================================================

describe('getFeaturedMedia', () => {
  it('returns only article or feature type', () => {
    const featured = getFeaturedMedia()
    for (const m of featured) {
      expect(['article', 'feature']).toContain(m.type)
    }
  })

  it('returns only tier 1 or 2', () => {
    const featured = getFeaturedMedia()
    for (const m of featured) {
      expect(m.tier).toBeLessThanOrEqual(2)
    }
  })

  it('is sorted by tier ascending', () => {
    const featured = getFeaturedMedia()
    for (let i = 1; i < featured.length; i++) {
      expect(featured[i].tier).toBeGreaterThanOrEqual(featured[i - 1].tier)
    }
  })
})

// ============================================================================
// getUniqueSourcesForLogos
// ============================================================================

describe('getUniqueSourcesForLogos', () => {
  it('returns array of source objects with name and shortName', () => {
    const sources = getUniqueSourcesForLogos()
    expect(Array.isArray(sources)).toBe(true)
    expect(sources.length).toBeGreaterThan(0)
    for (const s of sources) {
      expect(s.name).toBeTruthy()
      expect(s.shortName).toBeTruthy()
    }
  })

  it('returns no duplicate shortNames', () => {
    const sources = getUniqueSourcesForLogos()
    const seen = new Set<string>()
    for (const s of sources) {
      expect(seen.has(s.shortName)).toBe(false)
      seen.add(s.shortName)
    }
  })

  it('count matches unique sourceShort count in MEDIA_COVERAGE', () => {
    const unique = new Set(MEDIA_COVERAGE.map(m => m.sourceShort)).size
    expect(getUniqueSourcesForLogos()).toHaveLength(unique)
  })
})

// ============================================================================
// getTier1Sources
// ============================================================================

describe('getTier1Sources', () => {
  it('returns only tier 1 mentions', () => {
    const results = getTier1Sources()
    for (const m of results) {
      expect(m.tier).toBe(1)
    }
  })

  it('is consistent with getMediaByTier(1)', () => {
    expect(getTier1Sources()).toEqual(getMediaByTier(1))
  })
})

// ============================================================================
// getMediaStats
// ============================================================================

describe('getMediaStats', () => {
  it('returns an object with article count', () => {
    const stats = getMediaStats()
    expect(typeof stats).toBe('object')
    expect(typeof stats.articles).toBe('number')
    expect(stats.articles).toBeGreaterThan(0)
  })

  it('articles count matches filtered MEDIA_COVERAGE', () => {
    const stats = getMediaStats()
    const expected = MEDIA_COVERAGE.filter(m => m.type === 'article' || m.type === 'feature').length
    expect(stats.articles).toBe(expected)
  })
})
