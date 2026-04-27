/**
 * Tests for config/erfassung/profiles.ts — customer profile lookup helpers.
 *
 * Mission-relevant: customer profiles guide staff when matching a used computer
 * to the right recipient. If getProfileBySlug('oma') returns undefined, the
 * erfassung form can't pre-select the senior profile and loses the guided flow.
 *
 * Behaviors locked:
 *   getProfileBySlug
 *   - returns profile for known slug
 *   - returns undefined for unknown slug
 *
 *   getProfilesBySlugs
 *   - returns matching profiles, skipping invalid slugs
 *   - returns empty array when all slugs are invalid
 *
 *   validateProfileSlugs
 *   - filters out invalid slugs
 *   - keeps valid slugs
 *
 *   getProfilesByCategory
 *   - returns an object with category keys
 *   - each category bucket is an array of profiles
 *   - known slugs appear in the correct category
 */

import {
  getProfileBySlug,
  getProfilesBySlugs,
  validateProfileSlugs,
  getProfilesByCategory,
  CUSTOMER_PROFILES,
} from '../profiles'

// ============================================================================
// getProfileBySlug
// ============================================================================

describe('getProfileBySlug', () => {
  it('returns profile for "oma"', () => {
    const profile = getProfileBySlug('oma')
    expect(profile).toBeDefined()
    expect(profile!.slug).toBe('oma')
  })

  it('returns profile for "dev"', () => {
    const profile = getProfileBySlug('dev')
    expect(profile).toBeDefined()
    expect(profile!.slug).toBe('dev')
  })

  it('returned profile has required fields', () => {
    const profile = getProfileBySlug('oma')!
    expect(profile.name_de).toBeTruthy()
    expect(Array.isArray(profile.requirements)).toBe(true)
  })

  it('returns undefined for unknown slug', () => {
    expect(getProfileBySlug('nonexistent')).toBeUndefined()
  })
})

// ============================================================================
// getProfilesBySlugs
// ============================================================================

describe('getProfilesBySlugs', () => {
  it('returns profiles for valid slugs', () => {
    const profiles = getProfilesBySlugs(['oma', 'dev'])
    expect(profiles).toHaveLength(2)
    expect(profiles.map(p => p.slug)).toContain('oma')
    expect(profiles.map(p => p.slug)).toContain('dev')
  })

  it('skips invalid slugs', () => {
    const profiles = getProfilesBySlugs(['oma', 'invalid_slug'])
    expect(profiles).toHaveLength(1)
    expect(profiles[0].slug).toBe('oma')
  })

  it('returns empty array when all slugs are invalid', () => {
    expect(getProfilesBySlugs(['x', 'y', 'z'])).toEqual([])
  })

  it('returns empty array for empty input', () => {
    expect(getProfilesBySlugs([])).toEqual([])
  })
})

// ============================================================================
// validateProfileSlugs
// ============================================================================

describe('validateProfileSlugs', () => {
  it('keeps valid slugs', () => {
    const result = validateProfileSlugs(['oma', 'dev'])
    expect(result).toContain('oma')
    expect(result).toContain('dev')
  })

  it('filters out invalid slugs', () => {
    const result = validateProfileSlugs(['oma', 'invalid_xyz'])
    expect(result).not.toContain('invalid_xyz')
  })

  it('returns empty array when none are valid', () => {
    expect(validateProfileSlugs(['invalid1', 'invalid2'])).toEqual([])
  })
})

// ============================================================================
// getProfilesByCategory
// ============================================================================

describe('getProfilesByCategory', () => {
  it('returns an object with expected category keys', () => {
    const byCategory = getProfilesByCategory()
    expect(byCategory).toHaveProperty('Basis-Nutzer')
    expect(byCategory).toHaveProperty('Power-Nutzer')
    expect(byCategory).toHaveProperty('Professionell')
  })

  it('"oma" is in Basis-Nutzer category', () => {
    const byCategory = getProfilesByCategory()
    expect(byCategory['Basis-Nutzer'].some(p => p.slug === 'oma')).toBe(true)
  })

  it('"gamer" is in Power-Nutzer category', () => {
    const byCategory = getProfilesByCategory()
    expect(byCategory['Power-Nutzer'].some(p => p.slug === 'gamer')).toBe(true)
  })

  it('all categories contain only CustomerProfile objects', () => {
    const byCategory = getProfilesByCategory()
    for (const profiles of Object.values(byCategory)) {
      for (const p of profiles) {
        expect(p.slug).toBeTruthy()
        expect(p.name_de).toBeTruthy()
      }
    }
  })
})
