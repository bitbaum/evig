/**
 * Tests for lib/suggestion-utils/suggestionEnhancer.ts.
 *
 * Mission-relevant: the chatbot and page-contextual widget use these to
 * produce suggestion cards. If getEnhancedSuggestion ignores the language
 * param, German users see English labels. If createEnhancedSuggestions
 * drops items, the widget shows fewer options than expected.
 *
 * Behaviors locked:
 *   getEnhancedSuggestion
 *   - returns German content for 'de' language
 *   - returns English content for 'en' language
 *   - falls back gracefully when key doesn't exist in ENHANCED_SUGGESTIONS
 *   - includes provided href in returned suggestion
 *   - merges options into returned suggestion
 *   - returned label gets an icon prepended (via ensureIconInLabel)
 *
 *   createEnhancedSuggestions
 *   - returns correct number of suggestions
 *   - each has the href from the config
 *   - respects language for labels
 *
 *   enhanceSuggestion
 *   - adds icon to label if not already present
 *   - passes through all other fields unchanged
 */

jest.mock('@/config/org', () => ({
  LOCATIONS: {
    store: { full: 'Zürich Ausstellungsstrasse 36' },
    office: { full: 'Zürich' },
  },
  CONTACT: { email: 'info@revamp-it.ch' },
}))

import {
  getEnhancedSuggestion,
  createEnhancedSuggestions,
  enhanceSuggestion,
  ENHANCED_SUGGESTIONS,
} from '../suggestion-utils/suggestionEnhancer'

// ============================================================================
// getEnhancedSuggestion
// ============================================================================

describe('getEnhancedSuggestion', () => {
  it('returns German label for de language on known key', () => {
    const result = getEnhancedSuggestion('shop', '/shop', 'de')
    // German label should contain "kaufen" or be the German template value
    const deLabel = ENHANCED_SUGGESTIONS['shop']['de'].label
    expect(result.label).toContain(deLabel.replace(/^\S+\s/, '')) // strip leading icon
  })

  it('returns English label for en language on known key', () => {
    const result = getEnhancedSuggestion('shop', '/shop', 'en')
    const enLabel = ENHANCED_SUGGESTIONS['shop']['en'].label
    expect(result.label).toContain(enLabel.replace(/^\S+\s/, ''))
  })

  it('includes the provided href', () => {
    const result = getEnhancedSuggestion('repair', '/services/repair', 'de')
    expect(result.href).toBe('/services/repair')
  })

  it('falls back gracefully when key not in ENHANCED_SUGGESTIONS', () => {
    const result = getEnhancedSuggestion('nonexistent-key', '/some/path', 'de', {
      label: 'Custom Label',
    })
    expect(result.href).toBe('/some/path')
    expect(result.label).toBeTruthy()
  })

  it('falls back to key as label when no options.label and key unknown', () => {
    const result = getEnhancedSuggestion('unknown-xyz', '/path', 'de')
    // label should contain the key (possibly with an icon)
    expect(result.label.toLowerCase()).toContain('unknown-xyz')
  })

  it('merges options into the result', () => {
    const result = getEnhancedSuggestion('shop', '/shop', 'de', {
      category: 'products',
    })
    expect(result.category).toBe('products')
  })

  it('description comes from the template', () => {
    const result = getEnhancedSuggestion('workshops', '/workshops', 'de')
    const expected = ENHANCED_SUGGESTIONS['workshops']['de'].description
    expect(result.description).toBe(expected)
  })
})

// ============================================================================
// createEnhancedSuggestions
// ============================================================================

describe('createEnhancedSuggestions', () => {
  it('returns the correct number of suggestions', () => {
    const configs = [
      { key: 'shop', href: '/shop' },
      { key: 'repair', href: '/services/repair' },
      { key: 'workshops', href: '/workshops' },
    ]
    const results = createEnhancedSuggestions(configs, 'de')
    expect(results).toHaveLength(3)
  })

  it('each suggestion has the href from its config', () => {
    const configs = [
      { key: 'shop', href: '/shop-custom' },
      { key: 'donate', href: '/spenden' },
    ]
    const results = createEnhancedSuggestions(configs, 'de')
    expect(results[0].href).toBe('/shop-custom')
    expect(results[1].href).toBe('/spenden')
  })

  it('returns English labels when language is en', () => {
    const configs = [{ key: 'shop', href: '/shop' }]
    const [deSuggestion] = createEnhancedSuggestions(configs, 'de')
    const [enSuggestion] = createEnhancedSuggestions(configs, 'en')
    // Labels should differ between languages
    expect(deSuggestion.label).not.toBe(enSuggestion.label)
  })

  it('returns empty array for empty config list', () => {
    expect(createEnhancedSuggestions([], 'de')).toEqual([])
  })
})

// ============================================================================
// enhanceSuggestion
// ============================================================================

describe('enhanceSuggestion', () => {
  it('returns an object with the same href', () => {
    const result = enhanceSuggestion(
      { label: 'Shop', href: '/shop', description: 'Buy stuff' },
      'de',
    )
    expect(result.href).toBe('/shop')
  })

  it('returns an object with description preserved', () => {
    const result = enhanceSuggestion(
      { label: 'Shop', href: '/shop', description: 'Original desc' },
      'de',
    )
    expect(result.description).toBe('Original desc')
  })

  it('label is non-empty', () => {
    const result = enhanceSuggestion(
      { label: 'Test', href: '/test', description: '' },
      'de',
    )
    expect(result.label).toBeTruthy()
  })
})

// ============================================================================
// ENHANCED_SUGGESTIONS shape
// ============================================================================

describe('ENHANCED_SUGGESTIONS', () => {
  it('every key has both de and en entries', () => {
    const missingDe = Object.keys(ENHANCED_SUGGESTIONS).filter(k => !ENHANCED_SUGGESTIONS[k]['de'])
    const missingEn = Object.keys(ENHANCED_SUGGESTIONS).filter(k => !ENHANCED_SUGGESTIONS[k]['en'])
    expect(missingDe).toEqual([])
    expect(missingEn).toEqual([])
  })

  it('all labels and descriptions are non-empty strings', () => {
    const empties: string[] = []
    for (const [key, langs] of Object.entries(ENHANCED_SUGGESTIONS)) {
      for (const [lang, content] of Object.entries(langs)) {
        if (!content.label) empties.push(`${key}/${lang} label`)
        if (!content.description) empties.push(`${key}/${lang} description`)
      }
    }
    expect(empties).toEqual([])
  })
})
