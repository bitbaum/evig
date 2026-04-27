/**
 * Tests for config/shop.ts — shop URL helpers and category lookup.
 *
 * Mission-relevant: shop category URLs drive the navigation sidebar and
 * mega menu links. If getCategoryUrl produces the wrong path (e.g. missing
 * leading slash), shop links 404. If getSearchUrl doesn't encode the query,
 * searches with special characters break the URL.
 *
 * Behaviors locked:
 *   getCategoryUrl
 *   - returns /shop/category/<slug>
 *
 *   getSearchUrl
 *   - returns /shop/search?q=<encoded-query>
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
  it('returns the correct shop category path', () => {
    expect(getCategoryUrl('laptop-zubehoer')).toBe('/shop/category/laptop-zubehoer')
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
  it('returns /shop/search?q=<query> for a simple term', () => {
    expect(getSearchUrl('laptop')).toBe('/shop/search?q=laptop')
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

  it('starts with /shop/search?q=', () => {
    expect(getSearchUrl('monitor').startsWith('/shop/search?q=')).toBe(true)
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
