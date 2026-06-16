/**
 * Tests for config/shop.ts — legacy shop URL helpers and category lookup.
 *
 * Mission-relevant: the public shop is the marketplace. These legacy helpers
 * must keep generating marketplace URLs so old imports do not recreate a
 * parallel /shop surface.
 *
 * Behaviors locked:
 *   getCategoryUrl
 *   - returns /marketplace?category=<slug>
 *
 *   getSearchUrl
 *   - returns /marketplace?search=<encoded-query>
 *   - encodes spaces and special chars
 *
 *   getCategoryBySlug
 *   - returns category for known slug
 *   - returns undefined for unknown slug
 */

import { getCategoryUrl, getSearchUrl, getCategoryBySlug } from '../shop'

// ============================================================================
// getCategoryUrl
// ============================================================================

describe('getCategoryUrl', () => {
  it('returns the canonical marketplace category path', () => {
    expect(getCategoryUrl('laptop-zubehoer')).toBe('/marketplace?category=laptop-zubehoer')
  })

  it('starts with a leading slash', () => {
    const url = getCategoryUrl('computer-komplettsysteme')
    expect(url.startsWith('/')).toBe(true)
  })

  it('includes the slug verbatim', () => {
    const slug = 'festplatten-ssds-sticks'
    expect(getCategoryUrl(slug)).toContain(slug)
  })
})

// ============================================================================
// getSearchUrl
// ============================================================================

describe('getSearchUrl', () => {
  it('returns /marketplace?search=<query> for a simple term', () => {
    expect(getSearchUrl('laptop')).toBe('/marketplace?search=laptop')
  })

  it('encodes spaces as %20', () => {
    const url = getSearchUrl('USB Kabel')
    expect(url).toContain('%20')
    expect(url).not.toContain(' ')
  })

  it('encodes special characters', () => {
    const url = getSearchUrl('a&b=c')
    // encodeURIComponent encodes & and =
    expect(url).not.toContain('&')
    expect(url).toContain('%26')
  })

  it('starts with /marketplace?search=', () => {
    expect(getSearchUrl('monitor').startsWith('/marketplace?search=')).toBe(true)
  })
})

// ============================================================================
// getCategoryBySlug
// ============================================================================

describe('getCategoryBySlug', () => {
  it('returns the category for a known slug', () => {
    const cat = getCategoryBySlug('laptop-zubehoer')
    expect(cat).toBeDefined()
    expect(cat!.slug).toBe('laptop-zubehoer')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getCategoryBySlug('does-not-exist')).toBeUndefined()
  })

  it('returns the category with the expected name', () => {
    const cat = getCategoryBySlug('festplatten-ssds-sticks')
    expect(cat).toBeDefined()
    expect(cat!.name).toBeTruthy()
  })
})
