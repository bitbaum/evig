/**
 * Tests for config/erfassung/categories.ts — product category hierarchy helpers.
 *
 * Mission-relevant: the category hierarchy is the SSOT for erfassung intake.
 * If getParentCategory('101') returns undefined instead of the Laptops
 * category, the admin form loses the breadcrumb and the product gets
 * saved without a parent. If getAllCategoriesFlat omits subcategories,
 * the category search picker can't find '101'.
 *
 * Behaviors locked:
 *   getCategoryByValue
 *   - returns Kategorie for known main category value
 *   - returns undefined for subcategory value
 *   - returns undefined for unknown value
 *
 *   getSubcategoryByValue
 *   - returns SubKategorie for known subcategory value
 *   - returns undefined for main category value
 *   - returns undefined for unknown value
 *
 *   getParentCategory
 *   - returns parent Kategorie for a subcategory value
 *   - returns undefined for a 2-digit main category value
 *
 *   getSubcategories
 *   - returns subcategories array for known main category
 *   - returns empty array for unknown category
 *
 *   getAllCategoriesFlat
 *   - includes main categories with isMain=true
 *   - includes subcategories with isMain=false
 *   - subcategory label uses "Parent > Sub" format
 *   - total count = main categories + all their subs
 *
 *   getCategoryDetails
 *   - returns isMain=true with fullLabel for main category
 *   - returns isMain=false with parent and fullLabel for subcategory
 *   - returns undefined for unknown value
 */

import {
  getCategoryByValue,
  getSubcategoryByValue,
  getParentCategory,
  getSubcategories,
  getAllCategoriesFlat,
  getCategoryDetails,
  KATEGORIEN,
} from '../categories'

// ============================================================================
// getCategoryByValue
// ============================================================================

describe('getCategoryByValue', () => {
  it('returns Kategorie for "10" (Laptops)', () => {
    const cat = getCategoryByValue('10')
    expect(cat).toBeDefined()
    expect(cat!.label).toBe('Laptops')
  })

  it('returns Kategorie for "20" (Desktop PCs)', () => {
    const cat = getCategoryByValue('20')
    expect(cat).toBeDefined()
    expect(cat!.value).toBe('20')
  })

  it('returns undefined for subcategory value "101"', () => {
    expect(getCategoryByValue('101')).toBeUndefined()
  })

  it('returns undefined for unknown value', () => {
    expect(getCategoryByValue('999')).toBeUndefined()
  })
})

// ============================================================================
// getSubcategoryByValue
// ============================================================================

describe('getSubcategoryByValue', () => {
  it('returns SubKategorie for "101" (Business Laptops)', () => {
    const sub = getSubcategoryByValue('101')
    expect(sub).toBeDefined()
    expect(sub!.label).toBe('Business Laptops')
  })

  it('returns SubKategorie for "701" (Grafikkarten)', () => {
    const sub = getSubcategoryByValue('701')
    expect(sub).toBeDefined()
    expect(sub!.value).toBe('701')
  })

  it('returns undefined for main category value "10"', () => {
    expect(getSubcategoryByValue('10')).toBeUndefined()
  })

  it('returns undefined for unknown subcategory value', () => {
    expect(getSubcategoryByValue('999')).toBeUndefined()
  })
})

// ============================================================================
// getParentCategory
// ============================================================================

describe('getParentCategory', () => {
  it('returns parent "10" (Laptops) for subcategory "101"', () => {
    const parent = getParentCategory('101')
    expect(parent).toBeDefined()
    expect(parent!.value).toBe('10')
    expect(parent!.label).toBe('Laptops')
  })

  it('returns parent "70" (Komponenten) for subcategory "701"', () => {
    const parent = getParentCategory('701')
    expect(parent).toBeDefined()
    expect(parent!.value).toBe('70')
  })

  it('returns undefined when passed a 2-digit main category value', () => {
    // '10'.slice(0, -1) = '1' — no category with value '1'
    expect(getParentCategory('10')).toBeUndefined()
  })
})

// ============================================================================
// getSubcategories
// ============================================================================

describe('getSubcategories', () => {
  it('returns subcategories for "10" (Laptops)', () => {
    const subs = getSubcategories('10')
    expect(subs.length).toBeGreaterThan(0)
    expect(subs.every(s => s.value.startsWith('10'))).toBe(true)
  })

  it('returns empty array for unknown category', () => {
    expect(getSubcategories('999')).toEqual([])
  })

  it('subcategory objects have value and label', () => {
    const subs = getSubcategories('10')
    for (const sub of subs) {
      expect(sub.value).toBeTruthy()
      expect(sub.label).toBeTruthy()
    }
  })
})

// ============================================================================
// getAllCategoriesFlat
// ============================================================================

describe('getAllCategoriesFlat', () => {
  it('main categories have isMain=true', () => {
    const flat = getAllCategoriesFlat()
    const mains = flat.filter(e => e.isMain)
    expect(mains.length).toBe(KATEGORIEN.length)
  })

  it('subcategories have isMain=false', () => {
    const flat = getAllCategoriesFlat()
    const subs = flat.filter(e => !e.isMain)
    const totalSubs = KATEGORIEN.reduce((acc, k) => acc + k.subs.length, 0)
    expect(subs.length).toBe(totalSubs)
  })

  it('subcategory label uses "Parent > Sub" format', () => {
    const flat = getAllCategoriesFlat()
    const sub101 = flat.find(e => e.value === '101')
    expect(sub101).toBeDefined()
    expect(sub101!.label).toMatch(/^Laptops > /)
  })

  it('total count = main + all subs', () => {
    const flat = getAllCategoriesFlat()
    const expected = KATEGORIEN.reduce((acc, k) => acc + 1 + k.subs.length, 0)
    expect(flat.length).toBe(expected)
  })

  it('includes main category "10" with value and label', () => {
    const flat = getAllCategoriesFlat()
    const laptops = flat.find(e => e.value === '10')
    expect(laptops).toBeDefined()
    expect(laptops!.isMain).toBe(true)
  })
})

// ============================================================================
// getCategoryDetails
// ============================================================================

describe('getCategoryDetails', () => {
  it('returns isMain=true for main category "10"', () => {
    const details = getCategoryDetails('10')
    expect(details).toBeDefined()
    expect(details!.isMain).toBe(true)
    expect(details!.fullLabel).toBe('Laptops')
  })

  it('returns isMain=false with parent for subcategory "101"', () => {
    const details = getCategoryDetails('101')
    expect(details).toBeDefined()
    expect(details!.isMain).toBe(false)
    expect(details!.parent).toBeDefined()
    expect(details!.parent!.value).toBe('10')
  })

  it('fullLabel for subcategory is "Parent > Sub"', () => {
    const details = getCategoryDetails('101')
    expect(details!.fullLabel).toBe('Laptops > Business Laptops')
  })

  it('returns undefined for unknown value', () => {
    expect(getCategoryDetails('999')).toBeUndefined()
  })

  it('includes description for main category', () => {
    const details = getCategoryDetails('10')
    expect(details!.description).toBeTruthy()
  })
})
