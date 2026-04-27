/**
 * Tests for config/open-source-registry.ts — OSS alternatives lookup helpers.
 *
 * Mission-relevant: Revamp-IT promotes open-source software as part of its
 * mission. If getAlternativesByCategory('office') returns [] instead of
 * real alternatives, the OSS page shows empty sections. If searchAlternatives
 * returns nothing for 'libre', users can't find LibreOffice.
 *
 * Behaviors locked:
 *   getCategoryById
 *   - returns category for known id
 *   - returns undefined for unknown id
 *
 *   getAlternativeById
 *   - returns alternative for known id
 *   - returns undefined for unknown id
 *
 *   getAlternativesByCategory
 *   - returns non-empty array for known category
 *   - returns empty array for unknown category
 *
 *   getProprietaryAppById
 *   - returns app for known id
 *   - returns undefined for unknown id
 *
 *   getAlternativesForApp
 *   - returns alternatives replacing known app
 *   - returns empty array for unknown app
 *
 *   getAllAlternatives / getAllCategories / getAllProprietaryApps
 *   - each returns non-empty array
 *   - getAllCategories returns items sorted by order
 *
 *   searchAlternatives
 *   - returns all alternatives for empty query
 *   - returns matching alternatives for known name fragment
 *   - returns empty array for nonsense query
 */

import {
  getCategoryById,
  getAlternativeById,
  getAlternativesByCategory,
  getProprietaryAppById,
  getAlternativesForApp,
  getAllAlternatives,
  getAllCategories,
  getAllProprietaryApps,
  searchAlternatives,
} from '../open-source-registry'

// ============================================================================
// getCategoryById
// ============================================================================

describe('getCategoryById', () => {
  it('returns "office" category', () => {
    const cat = getCategoryById('office')
    expect(cat).toBeDefined()
    expect(cat!.id).toBe('office')
  })

  it('returned category has label, icon, order', () => {
    const cat = getCategoryById('office')!
    expect(cat.label).toBeTruthy()
    expect(cat.icon).toBeTruthy()
    expect(typeof cat.order).toBe('number')
  })

  it('returns undefined for unknown id', () => {
    expect(getCategoryById('unknown_cat')).toBeUndefined()
  })
})

// ============================================================================
// getAlternativeById
// ============================================================================

describe('getAlternativeById', () => {
  it('returns LibreOffice for "libreoffice"', () => {
    const alt = getAlternativeById('libreoffice')
    expect(alt).toBeDefined()
    expect(alt!.name).toBe('LibreOffice')
  })

  it('returned alternative has required fields', () => {
    const alt = getAlternativeById('libreoffice')!
    expect(alt.categoryId).toBeTruthy()
    expect(Array.isArray(alt.replaces)).toBe(true)
    expect(Array.isArray(alt.platforms)).toBe(true)
  })

  it('returns undefined for unknown id', () => {
    expect(getAlternativeById('nonexistent_app')).toBeUndefined()
  })
})

// ============================================================================
// getAlternativesByCategory
// ============================================================================

describe('getAlternativesByCategory', () => {
  it('returns non-empty array for "office" category', () => {
    const alts = getAlternativesByCategory('office')
    expect(alts.length).toBeGreaterThan(0)
  })

  it('all returned alternatives belong to the requested category', () => {
    const alts = getAlternativesByCategory('office')
    for (const alt of alts) {
      expect(alt.categoryId).toBe('office')
    }
  })

  it('returns empty array for unknown category', () => {
    expect(getAlternativesByCategory('unknown_cat')).toEqual([])
  })
})

// ============================================================================
// getProprietaryAppById
// ============================================================================

describe('getProprietaryAppById', () => {
  it('returns Microsoft Office for "ms-office"', () => {
    const app = getProprietaryAppById('ms-office')
    expect(app).toBeDefined()
    expect(app!.name).toBe('Microsoft Office')
  })

  it('returns undefined for unknown id', () => {
    expect(getProprietaryAppById('unknown_app')).toBeUndefined()
  })
})

// ============================================================================
// getAlternativesForApp
// ============================================================================

describe('getAlternativesForApp', () => {
  it('returns alternatives replacing "ms-office"', () => {
    const alts = getAlternativesForApp('ms-office')
    expect(alts.length).toBeGreaterThan(0)
  })

  it('each returned alternative lists ms-office in replaces', () => {
    const alts = getAlternativesForApp('ms-office')
    for (const alt of alts) {
      const replacesIds = alt.replaces.map(r => r.appId)
      expect(replacesIds).toContain('ms-office')
    }
  })

  it('returns empty array for unknown app', () => {
    expect(getAlternativesForApp('unknown_proprietary_app')).toEqual([])
  })
})

// ============================================================================
// getAllAlternatives
// ============================================================================

describe('getAllAlternatives', () => {
  it('returns a non-empty array', () => {
    const alts = getAllAlternatives()
    expect(alts.length).toBeGreaterThan(0)
  })

  it('all alternatives have id, name, categoryId', () => {
    for (const alt of getAllAlternatives()) {
      expect(alt.id).toBeTruthy()
      expect(alt.name).toBeTruthy()
      expect(alt.categoryId).toBeTruthy()
    }
  })
})

// ============================================================================
// getAllCategories
// ============================================================================

describe('getAllCategories', () => {
  it('returns a non-empty array', () => {
    expect(getAllCategories().length).toBeGreaterThan(0)
  })

  it('returns categories sorted by order ascending', () => {
    const cats = getAllCategories()
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i].order).toBeGreaterThanOrEqual(cats[i - 1].order)
    }
  })
})

// ============================================================================
// getAllProprietaryApps
// ============================================================================

describe('getAllProprietaryApps', () => {
  it('returns a non-empty array', () => {
    expect(getAllProprietaryApps().length).toBeGreaterThan(0)
  })
})

// ============================================================================
// searchAlternatives
// ============================================================================

describe('searchAlternatives', () => {
  it('returns all alternatives for empty query', () => {
    const all = getAllAlternatives()
    expect(searchAlternatives('').length).toBe(all.length)
  })

  it('returns LibreOffice when searching for "libre"', () => {
    const results = searchAlternatives('libre')
    expect(results.some(a => a.id === 'libreoffice')).toBe(true)
  })

  it('search is case-insensitive', () => {
    const lower = searchAlternatives('libre')
    const upper = searchAlternatives('LIBRE')
    expect(lower.length).toBe(upper.length)
  })

  it('returns empty array for nonsense query', () => {
    expect(searchAlternatives('xyznonexistentapp123')).toEqual([])
  })
})
