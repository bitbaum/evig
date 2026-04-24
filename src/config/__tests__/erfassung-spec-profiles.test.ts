/**
 * Tests for erfassung spec-templates and profiles config.
 *
 * spec-templates.ts: field template lookups used in the product registration
 *   form. getSpecTemplate, getSpecTemplateForSubcategory, templateToSpecFields,
 *   and mergeWithTemplate all need to return correct shapes for the form to
 *   initialize correctly. Wrong templates → missing spec fields → incomplete
 *   inventory records.
 *
 * profiles.ts: customer profile lookups used in product recommendations.
 *   getProfileBySlug, getProfilesBySlugs, validateProfileSlugs, getProfilesByCategory.
 */

// ============================================================================
// spec-templates.ts
// ============================================================================

import {
  getSpecTemplate,
  getSpecTemplateForSubcategory,
  templateToSpecFields,
  mergeWithTemplate,
} from '../erfassung/spec-templates'

// ─── getSpecTemplate ──────────────────────────────────────────────────────────

describe('getSpecTemplate', () => {
  it('category "10" (Laptops) → returns template array', () => {
    const template = getSpecTemplate('10')
    expect(Array.isArray(template)).toBe(true)
    expect(template.length).toBeGreaterThan(0)
  })

  it('Laptop template contains "CPU" field', () => {
    const template = getSpecTemplate('10')
    expect(template.some(f => f.key === 'CPU')).toBe(true)
  })

  it('Laptop template contains "RAM" field', () => {
    const template = getSpecTemplate('10')
    expect(template.some(f => f.key === 'RAM')).toBe(true)
  })

  it('unknown category → returns default template (not empty)', () => {
    const template = getSpecTemplate('999')
    expect(Array.isArray(template)).toBe(true)
    expect(template.length).toBeGreaterThan(0)
  })

  it('returns a deep copy — mutating result does not affect future calls', () => {
    const first = getSpecTemplate('10')
    first[0].key = 'MUTATED'
    const second = getSpecTemplate('10')
    expect(second[0].key).not.toBe('MUTATED')
  })

  it('each field has at least a key', () => {
    for (const field of getSpecTemplate('10')) {
      expect(typeof field.key).toBe('string')
      expect(field.key.length).toBeGreaterThan(0)
    }
  })

  it('category "20" (Desktop) has template', () => {
    const template = getSpecTemplate('20')
    expect(template.length).toBeGreaterThan(0)
    expect(template.some(f => f.key === 'CPU')).toBe(true)
  })
})

// ─── getSpecTemplateForSubcategory ────────────────────────────────────────────

describe('getSpecTemplateForSubcategory', () => {
  it('"101" (Business Laptop, sub of "10") → inherits Laptop template', () => {
    const template = getSpecTemplateForSubcategory('101')
    expect(template.length).toBeGreaterThan(0)
    expect(template.some(f => f.key === 'CPU')).toBe(true)
  })

  it('"201" (sub of "20" Desktop) → inherits Desktop template', () => {
    const template = getSpecTemplateForSubcategory('201')
    expect(template.length).toBeGreaterThan(0)
  })

  it('unknown subcategory → falls back to default template', () => {
    const template = getSpecTemplateForSubcategory('999')
    expect(Array.isArray(template)).toBe(true)
    expect(template.length).toBeGreaterThan(0)
  })

  it('returns an array', () => {
    expect(Array.isArray(getSpecTemplateForSubcategory('101'))).toBe(true)
  })
})

// ─── templateToSpecFields ─────────────────────────────────────────────────────

describe('templateToSpecFields', () => {
  it('converts template to SpecFields with empty values', () => {
    const template = getSpecTemplate('10')
    const fields = templateToSpecFields(template)
    for (const field of fields) {
      expect(field.value).toBe('')
    }
  })

  it('result has same length as template', () => {
    const template = getSpecTemplate('10')
    expect(templateToSpecFields(template).length).toBe(template.length)
  })

  it('each SpecField has key and value', () => {
    const fields = templateToSpecFields(getSpecTemplate('10'))
    for (const field of fields) {
      expect(field).toHaveProperty('key')
      expect(field).toHaveProperty('value')
    }
  })

  it('keys match template keys', () => {
    const template = getSpecTemplate('10')
    const fields = templateToSpecFields(template)
    template.forEach((t, i) => {
      expect(fields[i].key).toBe(t.key)
    })
  })

  it('empty template → empty fields array', () => {
    expect(templateToSpecFields([])).toEqual([])
  })
})

// ─── mergeWithTemplate ────────────────────────────────────────────────────────

describe('mergeWithTemplate', () => {
  it('keeps existing specs unchanged', () => {
    const existing = [{ key: 'CPU', value: 'Intel i7' }]
    const merged = mergeWithTemplate(existing, '10')
    const cpu = merged.find(f => f.key === 'CPU')
    expect(cpu?.value).toBe('Intel i7')
  })

  it('adds missing template fields with empty values', () => {
    const existing = [{ key: 'CPU', value: 'Intel i7' }]
    const merged = mergeWithTemplate(existing, '10')
    // Template has RAM, Storage, etc — these should be added
    const ram = merged.find(f => f.key === 'RAM')
    expect(ram).not.toBeUndefined()
    expect(ram?.value).toBe('')
  })

  it('does not duplicate existing keys', () => {
    const existing = [{ key: 'CPU', value: 'Intel i7' }]
    const merged = mergeWithTemplate(existing, '10')
    const cpuFields = merged.filter(f => f.key === 'CPU')
    expect(cpuFields.length).toBe(1)
  })

  it('result has at least as many fields as the template', () => {
    const template = getSpecTemplate('10')
    const merged = mergeWithTemplate([], '10')
    expect(merged.length).toBeGreaterThanOrEqual(template.length)
  })

  it('merge is key case-insensitive (no duplicate "cpu" vs "CPU")', () => {
    // Existing has lowercase "cpu" but template uses "CPU"
    const existing = [{ key: 'cpu', value: 'Intel i7' }]
    const merged = mergeWithTemplate(existing, '10')
    const cpuFields = merged.filter(f => f.key.toLowerCase() === 'cpu')
    expect(cpuFields.length).toBe(1)
  })
})

// ============================================================================
// profiles.ts
// ============================================================================

import {
  getProfileBySlug,
  getProfilesBySlugs,
  validateProfileSlugs,
  getProfilesByCategory,
  CUSTOMER_PROFILES,
} from '../erfassung/profiles'

// ─── getProfileBySlug ─────────────────────────────────────────────────────────

describe('getProfileBySlug', () => {
  it('returns profile for "oma"', () => {
    const p = getProfileBySlug('oma')
    expect(p).not.toBeUndefined()
    expect(p?.slug).toBe('oma')
  })

  it('returns profile for "gamer"', () => {
    const p = getProfileBySlug('gamer')
    expect(p?.slug).toBe('gamer')
  })

  it('returned profile has required fields', () => {
    const p = getProfileBySlug('student')
    expect(p).toHaveProperty('slug')
    expect(p).toHaveProperty('name_de')
    expect(p).toHaveProperty('description')
  })

  it('returns undefined for unknown slug', () => {
    expect(getProfileBySlug('ghost_profile')).toBeUndefined()
  })
})

// ─── getProfilesBySlugs ───────────────────────────────────────────────────────

describe('getProfilesBySlugs', () => {
  it('returns array of profiles for valid slugs', () => {
    const profiles = getProfilesBySlugs(['oma', 'student'])
    expect(profiles.length).toBe(2)
    expect(profiles[0].slug).toBe('oma')
    expect(profiles[1].slug).toBe('student')
  })

  it('skips unknown slugs silently', () => {
    const profiles = getProfilesBySlugs(['oma', 'ghost_profile'])
    expect(profiles.length).toBe(1)
    expect(profiles[0].slug).toBe('oma')
  })

  it('empty array → empty result', () => {
    expect(getProfilesBySlugs([])).toEqual([])
  })

  it('all unknown slugs → empty result', () => {
    expect(getProfilesBySlugs(['ghost', 'phantom'])).toEqual([])
  })
})

// ─── validateProfileSlugs ─────────────────────────────────────────────────────

describe('validateProfileSlugs', () => {
  it('returns only valid slugs', () => {
    const valid = validateProfileSlugs(['oma', 'ghost', 'student'])
    expect(valid).toContain('oma')
    expect(valid).toContain('student')
    expect(valid).not.toContain('ghost')
  })

  it('all valid → all returned', () => {
    const valid = validateProfileSlugs(['oma', 'student', 'gamer'])
    expect(valid.length).toBe(3)
  })

  it('all invalid → empty array', () => {
    expect(validateProfileSlugs(['ghost', 'phantom'])).toEqual([])
  })

  it('empty input → empty array', () => {
    expect(validateProfileSlugs([])).toEqual([])
  })
})

// ─── getProfilesByCategory ────────────────────────────────────────────────────

describe('getProfilesByCategory', () => {
  it('returns an object with category keys', () => {
    const grouped = getProfilesByCategory()
    expect(typeof grouped).toBe('object')
    expect(Object.keys(grouped).length).toBeGreaterThan(0)
  })

  it('"Basis-Nutzer" group contains "oma"', () => {
    const grouped = getProfilesByCategory()
    const basic = grouped['Basis-Nutzer']
    expect(Array.isArray(basic)).toBe(true)
    expect(basic.some(p => p.slug === 'oma')).toBe(true)
  })

  it('each group is a non-empty array', () => {
    const grouped = getProfilesByCategory()
    for (const group of Object.values(grouped)) {
      expect(Array.isArray(group)).toBe(true)
      expect(group.length).toBeGreaterThan(0)
    }
  })

  it('total profiles across groups ≤ CUSTOMER_PROFILES length', () => {
    const grouped = getProfilesByCategory()
    const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)
    expect(total).toBeLessThanOrEqual(CUSTOMER_PROFILES.length)
  })
})
