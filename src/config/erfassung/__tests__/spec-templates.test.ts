/**
 * Tests for config/erfassung/spec-templates.ts — product spec template helpers.
 *
 * Mission-relevant: spec templates pre-fill spec fields on the erfassung form.
 * If getSpecTemplate('10') returns the default template instead of the laptop
 * template, staff enter specs without guided field names.
 *
 * Behaviors locked:
 *   getSpecTemplate
 *   - returns template for known category '10' (laptops)
 *   - falls back to default template for unknown category
 *   - returned templates are independent copies (not shared references)
 *
 *   getSpecTemplateForSubcategory
 *   - returns parent template for subcategory '101' (prefix match → '10')
 *   - returns default for completely unknown subcategory
 *
 *   templateToSpecFields
 *   - converts template to spec fields with empty string values
 *   - preserves all keys
 *
 *   mergeWithTemplate
 *   - adds missing template fields to existing specs
 *   - keeps existing values intact
 *   - does not duplicate already-present keys
 */

import {
  getSpecTemplate,
  getSpecTemplateForSubcategory,
  templateToSpecFields,
  mergeWithTemplate,
  SPEC_TEMPLATES,
} from '../spec-templates'

// ============================================================================
// getSpecTemplate
// ============================================================================

describe('getSpecTemplate', () => {
  it('returns non-empty template for laptops category "10"', () => {
    const template = getSpecTemplate('10')
    expect(Array.isArray(template)).toBe(true)
    expect(template.length).toBeGreaterThan(0)
  })

  it('each template field has a key', () => {
    for (const field of getSpecTemplate('10')) {
      expect(field.key).toBeTruthy()
    }
  })

  it('falls back to default template for unknown category', () => {
    const unknown = getSpecTemplate('unknown_cat')
    const def = getSpecTemplate('default')
    expect(unknown).toEqual(def)
  })

  it('returned array is a copy (mutation does not affect original)', () => {
    const template1 = getSpecTemplate('10')
    const template2 = getSpecTemplate('10')
    template1[0].key = 'mutated'
    expect(template2[0].key).not.toBe('mutated')
  })
})

// ============================================================================
// getSpecTemplateForSubcategory
// ============================================================================

describe('getSpecTemplateForSubcategory', () => {
  it('returns parent template for subcategory "101" (prefix → "10")', () => {
    const sub = getSpecTemplateForSubcategory('101')
    const parent = getSpecTemplate('10')
    expect(sub).toEqual(parent)
  })

  it('returns direct match for known category key', () => {
    const direct = getSpecTemplateForSubcategory('10')
    const expected = getSpecTemplate('10')
    expect(direct).toEqual(expected)
  })

  it('falls back to default for completely unknown subcategory', () => {
    const result = getSpecTemplateForSubcategory('999')
    const def = getSpecTemplate('default')
    expect(result).toEqual(def)
  })
})

// ============================================================================
// templateToSpecFields
// ============================================================================

describe('templateToSpecFields', () => {
  it('returns spec fields with empty string values', () => {
    const template = getSpecTemplate('10')
    const fields = templateToSpecFields(template)
    for (const f of fields) {
      expect(f.value).toBe('')
    }
  })

  it('preserves all keys from template', () => {
    const template = getSpecTemplate('10')
    const fields = templateToSpecFields(template)
    const templateKeys = template.map(t => t.key)
    const fieldKeys = fields.map(f => f.key)
    expect(fieldKeys).toEqual(templateKeys)
  })
})

// ============================================================================
// mergeWithTemplate
// ============================================================================

describe('mergeWithTemplate', () => {
  it('returns at least as many fields as the template', () => {
    const templateLength = getSpecTemplate('10').length
    const merged = mergeWithTemplate([], '10')
    expect(merged.length).toBeGreaterThanOrEqual(templateLength)
  })

  it('keeps existing spec values intact', () => {
    const existing = [{ key: 'ram', value: '8GB' }]
    const merged = mergeWithTemplate(existing, '10')
    const ram = merged.find(f => f.key === 'ram')
    expect(ram!.value).toBe('8GB')
  })

  it('does not duplicate existing keys', () => {
    const template = getSpecTemplate('10')
    const existing = template.slice(0, 1).map(f => ({ key: f.key, value: 'existing' }))
    const merged = mergeWithTemplate(existing, '10')
    const occurrences = merged.filter(f => f.key === existing[0].key)
    expect(occurrences).toHaveLength(1)
  })
})
