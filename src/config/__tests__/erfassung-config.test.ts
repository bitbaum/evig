/**
 * Tests for erfassung (product intake) config utilities.
 *
 * categories.ts: hierarchical category lookup — used in the product
 *   registration flow where technicians classify donated hardware.
 *   Correct parent/child resolution matters for accurate inventory records.
 *
 * conditions.ts: condition lookup, label resolution, alias normalisation,
 *   and voice-input parsing — all pure string/array functions.
 *   parseConditionFromText is critical for voice transcription accuracy.
 */

// ============================================================================
// categories.ts
// ============================================================================

import {
  getCategoryByValue,
  getSubcategoryByValue,
  getParentCategory,
  getSubcategories,
  getAllCategoriesFlat,
  getCategoryDetails,
} from '../erfassung/categories'

// ─── getCategoryByValue ───────────────────────────────────────────────────────

describe('getCategoryByValue', () => {
  it('returns "Laptops" for value "10"', () => {
    const cat = getCategoryByValue('10')
    expect(cat).not.toBeUndefined()
    expect(cat?.label).toBe('Laptops')
  })

  it('returns category with value, label, icon, subs', () => {
    const cat = getCategoryByValue('10')
    expect(cat).toHaveProperty('value', '10')
    expect(cat).toHaveProperty('label')
    expect(cat).toHaveProperty('icon')
    expect(cat).toHaveProperty('subs')
    expect(Array.isArray(cat?.subs)).toBe(true)
  })

  it('returns undefined for unknown value', () => {
    expect(getCategoryByValue('999')).toBeUndefined()
  })

  it('does not match subcategory values (subcategories are 3-digit)', () => {
    expect(getCategoryByValue('101')).toBeUndefined()
  })
})

// ─── getSubcategoryByValue ────────────────────────────────────────────────────

describe('getSubcategoryByValue', () => {
  it('returns "Business Laptops" for value "101"', () => {
    const sub = getSubcategoryByValue('101')
    expect(sub).not.toBeUndefined()
    expect(sub?.label).toBe('Business Laptops')
  })

  it('returned subcategory has value and label', () => {
    const sub = getSubcategoryByValue('101')
    expect(sub).toHaveProperty('value', '101')
    expect(sub).toHaveProperty('label')
  })

  it('returns undefined for unknown subcategory', () => {
    expect(getSubcategoryByValue('999')).toBeUndefined()
  })

  it('does not match main category values (main categories are 2-digit)', () => {
    // Value '10' is a main category; getSubcategoryByValue searches subs only
    expect(getSubcategoryByValue('10')).toBeUndefined()
  })
})

// ─── getParentCategory ────────────────────────────────────────────────────────

describe('getParentCategory', () => {
  it('"101" → parent is category "10" (Laptops)', () => {
    const parent = getParentCategory('101')
    expect(parent).not.toBeUndefined()
    expect(parent?.value).toBe('10')
    expect(parent?.label).toBe('Laptops')
  })

  it('"201" → parent is category "20"', () => {
    const parent = getParentCategory('201')
    expect(parent).not.toBeUndefined()
    expect(parent?.value).toBe('20')
  })

  it('unknown subcategory value → undefined', () => {
    expect(getParentCategory('999')).toBeUndefined()
  })
})

// ─── getSubcategories ─────────────────────────────────────────────────────────

describe('getSubcategories', () => {
  it('returns non-empty array for category "10"', () => {
    const subs = getSubcategories('10')
    expect(subs.length).toBeGreaterThan(0)
  })

  it('returns subcategories including "101"', () => {
    const subs = getSubcategories('10')
    expect(subs.some(s => s.value === '101')).toBe(true)
  })

  it('returns empty array for unknown category', () => {
    expect(getSubcategories('999')).toEqual([])
  })

  it('each subcategory has value and label', () => {
    for (const sub of getSubcategories('10')) {
      expect(sub).toHaveProperty('value')
      expect(sub).toHaveProperty('label')
    }
  })
})

// ─── getAllCategoriesFlat ─────────────────────────────────────────────────────

describe('getAllCategoriesFlat', () => {
  it('returns a non-empty array', () => {
    expect(getAllCategoriesFlat().length).toBeGreaterThan(0)
  })

  it('includes both main and subcategories', () => {
    const flat = getAllCategoriesFlat()
    expect(flat.some(c => c.isMain)).toBe(true)
    expect(flat.some(c => !c.isMain)).toBe(true)
  })

  it('main categories have isMain=true', () => {
    const flat = getAllCategoriesFlat()
    const laptops = flat.find(c => c.value === '10')
    expect(laptops?.isMain).toBe(true)
  })

  it('subcategories have isMain=false', () => {
    const flat = getAllCategoriesFlat()
    const sub = flat.find(c => c.value === '101')
    expect(sub?.isMain).toBe(false)
  })

  it('subcategory label includes parent category name (breadcrumb)', () => {
    const flat = getAllCategoriesFlat()
    const sub = flat.find(c => c.value === '101')
    // Should be "Laptops > Business Laptops"
    expect(sub?.label).toContain('>')
    expect(sub?.label).toContain('Laptops')
    expect(sub?.label).toContain('Business Laptops')
  })

  it('each entry has value, label, isMain', () => {
    for (const cat of getAllCategoriesFlat().slice(0, 10)) {
      expect(cat).toHaveProperty('value')
      expect(cat).toHaveProperty('label')
      expect(cat).toHaveProperty('isMain')
    }
  })
})

// ─── getCategoryDetails ───────────────────────────────────────────────────────

describe('getCategoryDetails', () => {
  it('main category "10" → isMain=true, no parent', () => {
    const details = getCategoryDetails('10')
    expect(details).not.toBeUndefined()
    expect(details?.isMain).toBe(true)
    expect(details?.parent).toBeUndefined()
  })

  it('subcategory "101" → isMain=false, has parent', () => {
    const details = getCategoryDetails('101')
    expect(details).not.toBeUndefined()
    expect(details?.isMain).toBe(false)
    expect(details?.parent).not.toBeUndefined()
    expect(details?.parent?.value).toBe('10')
  })

  it('subcategory fullLabel includes parent > child', () => {
    const details = getCategoryDetails('101')
    expect(details?.fullLabel).toContain('>')
    expect(details?.fullLabel).toContain('Laptops')
    expect(details?.fullLabel).toContain('Business Laptops')
  })

  it('main category fullLabel is just the category label', () => {
    const details = getCategoryDetails('10')
    expect(details?.fullLabel).toBe('Laptops')
  })

  it('unknown value → undefined', () => {
    expect(getCategoryDetails('999')).toBeUndefined()
  })
})

// ============================================================================
// conditions.ts
// ============================================================================

import {
  getConditionByValue,
  getConditionLabel,
  normalizeConditionValue,
  getConditionBadge,
  parseConditionFromText,
  ZUSTAND_OPTIONS,
} from '../erfassung/conditions'

// ─── getConditionByValue ──────────────────────────────────────────────────────

describe('getConditionByValue', () => {
  it('returns condition for "new"', () => {
    const c = getConditionByValue('new')
    expect(c).not.toBeUndefined()
    expect(c?.label).toBe('Neu')
  })

  it('returns condition for "good"', () => {
    const c = getConditionByValue('good')
    expect(c?.label).toBe('Gut')
  })

  it('returns undefined for unknown condition', () => {
    expect(getConditionByValue('ancient')).toBeUndefined()
  })

  it('all ZUSTAND_OPTIONS values are findable', () => {
    for (const opt of ZUSTAND_OPTIONS) {
      expect(getConditionByValue(opt.value)?.value).toBe(opt.value)
    }
  })
})

// ─── getConditionLabel ────────────────────────────────────────────────────────

describe('getConditionLabel', () => {
  it('"new" → "Neu"', () => {
    expect(getConditionLabel('new')).toBe('Neu')
  })

  it('"like_new" → "Wie neu"', () => {
    expect(getConditionLabel('like_new')).toBe('Wie neu')
  })

  it('"good" → "Gut"', () => {
    expect(getConditionLabel('good')).toBe('Gut')
  })

  it('"fair" → "Akzeptabel"', () => {
    expect(getConditionLabel('fair')).toBe('Akzeptabel')
  })

  it('"poor" → "Schlecht"', () => {
    expect(getConditionLabel('poor')).toBe('Schlecht')
  })

  it('"defect" → "Defekt"', () => {
    expect(getConditionLabel('defect')).toBe('Defekt')
  })

  it('unknown value → raw string fallback', () => {
    expect(getConditionLabel('mystery_condition')).toBe('mystery_condition')
  })

  it('returns non-empty string for all canonical conditions', () => {
    for (const opt of ZUSTAND_OPTIONS) {
      expect(getConditionLabel(opt.value).length).toBeGreaterThan(0)
    }
  })
})

// ─── normalizeConditionValue ──────────────────────────────────────────────────

describe('normalizeConditionValue', () => {
  // normalizeConditionValue handles CONDITION_VALUE_ALIASES (legacy DB aliases),
  // NOT the CONDITION_ALIASES used by voice input/parseConditionFromText.

  it('canonical values are returned unchanged', () => {
    expect(normalizeConditionValue('new')).toBe('new')
    expect(normalizeConditionValue('good')).toBe('good')
    expect(normalizeConditionValue('defect')).toBe('defect')
  })

  it('legacy alias "excellent" → canonical "like_new"', () => {
    expect(normalizeConditionValue('excellent')).toBe('like_new')
  })

  it('legacy alias "very_good" → canonical "like_new"', () => {
    expect(normalizeConditionValue('very_good')).toBe('like_new')
  })

  it('legacy alias "acceptable" → canonical "fair"', () => {
    expect(normalizeConditionValue('acceptable')).toBe('fair')
  })

  it('legacy alias "for_parts" → canonical "defect"', () => {
    expect(normalizeConditionValue('for_parts')).toBe('defect')
  })

  it('voice alias "gut" is NOT normalized (use parseConditionFromText for that)', () => {
    // normalizeConditionValue only handles CONDITION_VALUE_ALIASES, not CONDITION_ALIASES
    expect(normalizeConditionValue('gut')).toBe('gut')
  })

  it('unknown value returned unchanged', () => {
    expect(normalizeConditionValue('xyz_unknown')).toBe('xyz_unknown')
  })
})

// ─── getConditionBadge ────────────────────────────────────────────────────────

describe('getConditionBadge', () => {
  it('returns badge with label and color', () => {
    const badge = getConditionBadge('new')
    expect(badge).toHaveProperty('label')
    expect(badge).toHaveProperty('color')
    expect(badge.label.length).toBeGreaterThan(0)
    expect(badge.color.length).toBeGreaterThan(0)
  })

  it('"new" badge has "Neu" label', () => {
    expect(getConditionBadge('new').label).toBe('Neu')
  })

  it('"good" badge has "Gut" label', () => {
    expect(getConditionBadge('good').label).toBe('Gut')
  })

  it('unknown condition → gray fallback badge', () => {
    const badge = getConditionBadge('mystery')
    expect(badge.color).toContain('neutral')
  })

  it('returns badge for all canonical conditions', () => {
    for (const opt of ZUSTAND_OPTIONS) {
      const badge = getConditionBadge(opt.value)
      expect(badge.label.length).toBeGreaterThan(0)
      expect(badge.color.length).toBeGreaterThan(0)
    }
  })
})

// ─── parseConditionFromText ───────────────────────────────────────────────────

describe('parseConditionFromText', () => {
  it('"neu" → "new"', () => {
    expect(parseConditionFromText('neu')).toBe('new')
  })

  it('"gut" → "good"', () => {
    expect(parseConditionFromText('gut')).toBe('good')
  })

  it('"defekt" → "defect"', () => {
    expect(parseConditionFromText('defekt')).toBe('defect')
  })

  it('"kaputt" → "defect"', () => {
    expect(parseConditionFromText('kaputt')).toBe('defect')
  })

  it('"sehr gut" → "like_new"', () => {
    expect(parseConditionFromText('sehr gut')).toBe('like_new')
  })

  it('"wie neu" → "like_new"', () => {
    expect(parseConditionFromText('wie neu')).toBe('like_new')
  })

  it('"akzeptabel" → "fair"', () => {
    expect(parseConditionFromText('akzeptabel')).toBe('fair')
  })

  it('case-insensitive: "NEU" → "new"', () => {
    expect(parseConditionFromText('NEU')).toBe('new')
  })

  it('trims whitespace: "  gut  " → "good"', () => {
    expect(parseConditionFromText('  gut  ')).toBe('good')
  })

  it('partial match in sentence: "das gerät ist gut erhalten" → "good"', () => {
    // "gut" is in "gut erhalten"
    expect(parseConditionFromText('das gerät ist gut erhalten')).toBe('good')
  })

  it('completely unknown text → undefined', () => {
    expect(parseConditionFromText('xyz completely unknown condition')).toBeUndefined()
  })

  it('returns a ZustandValue (canonical) not an alias', () => {
    const result = parseConditionFromText('kaputt')
    // 'kaputt' maps to 'defect', not 'kaputt' itself
    const canonicalValues = ZUSTAND_OPTIONS.map(o => o.value)
    expect(result).not.toBeUndefined()
    expect(canonicalValues).toContain(result)
  })
})
