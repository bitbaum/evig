/**
 * Tests for the suggestion enhancement helpers
 * (lib/suggestion-utils/suggestionEnhancer.ts).
 *
 * These power the chatbot suggestion panel and the page-contextual
 * navigation suggestions. Pure transformation functions that:
 *   - Inject the right emoji icon into a suggestion label
 *   - Pick the localized template (de/en) for a known key
 *   - Fall back to caller-supplied label/description when the key is unknown
 */

import {
  ENHANCED_SUGGESTIONS,
  enhanceSuggestion,
  getEnhancedSuggestion,
  createEnhancedSuggestions,
} from '../suggestionEnhancer'

// ============================================================================
// enhanceSuggestion
// ============================================================================

describe('enhanceSuggestion', () => {
  it('returns a suggestion with all input fields preserved', () => {
    const result = enhanceSuggestion(
      { label: 'Plain', href: '/x', description: 'desc' },
      'de',
    )
    expect(result.href).toBe('/x')
    expect(result.description).toBe('desc')
  })

  it('prefixes an icon to a label that lacks one', () => {
    const result = enhanceSuggestion(
      { label: 'Repair', href: '/services/repair', description: '' },
      'en',
    )
    // ensureIconInLabel adds an emoji prefix. Length must grow.
    expect(result.label.length).toBeGreaterThan('Repair'.length)
  })

  it('does not double-prefix when the label already has an emoji', () => {
    const labelWithIcon = '🛠️ Repair'
    const result = enhanceSuggestion(
      { label: labelWithIcon, href: '/services/repair', description: '' },
      'en',
    )
    // Should not turn into "🛠️ 🛠️ Repair"
    expect(result.label).toBe(labelWithIcon)
  })
})

// ============================================================================
// getEnhancedSuggestion
// ============================================================================

describe('getEnhancedSuggestion', () => {
  it('uses the German template when language=de for a known key', () => {
    const result = getEnhancedSuggestion('shop', '/shop', 'de')
    const expected = ENHANCED_SUGGESTIONS['shop']!.de
    expect(result.label).toContain(expected.label)
    expect(result.description).toBe(expected.description)
    expect(result.href).toBe('/shop')
  })

  it('uses the English template when language=en for a known key', () => {
    const result = getEnhancedSuggestion('shop', '/shop', 'en')
    const expected = ENHANCED_SUGGESTIONS['shop']!.en
    expect(result.label).toContain(expected.label)
    expect(result.description).toBe(expected.description)
  })

  it('falls back to the key as label when key is unknown and no options', () => {
    const result = getEnhancedSuggestion('does-not-exist', '/somewhere', 'de')
    expect(result.label).toContain('does-not-exist')
    expect(result.href).toBe('/somewhere')
    expect(result.description).toBe('')
  })

  it('falls back to options.label / options.description when key is unknown', () => {
    const result = getEnhancedSuggestion('unknown-key', '/x', 'de', {
      label: 'My Custom Label',
      description: 'My Custom Description',
    })
    expect(result.label).toContain('My Custom Label')
    expect(result.description).toBe('My Custom Description')
  })

  it('honours options spread (e.g. category override) on known keys too', () => {
    const result = getEnhancedSuggestion('shop', '/shop', 'de', {
      category: 'product',
      priority: 10,
    })
    expect(result.category).toBe('product')
    expect(result.priority).toBe(10)
  })

  it('still applies icon enhancement to fallback path', () => {
    const result = getEnhancedSuggestion('unknown', '/x', 'de', { label: 'Foo' })
    // ensureIconInLabel always adds an emoji, so length must grow
    expect(result.label.length).toBeGreaterThan('Foo'.length)
  })
})

// ============================================================================
// createEnhancedSuggestions
// ============================================================================

describe('createEnhancedSuggestions', () => {
  it('maps each config to an enhanced suggestion in order', () => {
    const result = createEnhancedSuggestions(
      [
        { key: 'shop', href: '/shop' },
        { key: 'repair', href: '/services/repair' },
      ],
      'de',
    )
    expect(result).toHaveLength(2)
    expect(result[0].href).toBe('/shop')
    expect(result[1].href).toBe('/services/repair')
  })

  it('returns [] for an empty config list', () => {
    expect(createEnhancedSuggestions([], 'de')).toEqual([])
  })

  it('passes per-config options through to getEnhancedSuggestion', () => {
    const result = createEnhancedSuggestions(
      [{ key: 'shop', href: '/shop', options: { priority: 99 } }],
      'de',
    )
    expect(result[0].priority).toBe(99)
  })

  it('uses the same language for every entry', () => {
    const enResults = createEnhancedSuggestions([{ key: 'shop', href: '/shop' }], 'en')
    const deResults = createEnhancedSuggestions([{ key: 'shop', href: '/shop' }], 'de')
    expect(enResults[0].label).not.toBe(deResults[0].label)
  })
})

// ============================================================================
// ENHANCED_SUGGESTIONS data integrity
// ============================================================================

describe('ENHANCED_SUGGESTIONS', () => {
  it('every template has both de and en entries (no missing locale)', () => {
    for (const [key, byLanguage] of Object.entries(ENHANCED_SUGGESTIONS)) {
      expect(byLanguage.de).toBeDefined()
      expect(byLanguage.en).toBeDefined()
      expect(byLanguage.de.label).toBeTruthy()
      expect(byLanguage.en.label).toBeTruthy()
      expect(byLanguage.de.description).toBeTruthy()
      expect(byLanguage.en.description).toBeTruthy()
      // Keys can be enumerated for debug if any check fails:
      void key
    }
  })

  it('contains the canonical keys used by callers (shop, repair, linux, web)', () => {
    expect(ENHANCED_SUGGESTIONS).toHaveProperty('shop')
    expect(ENHANCED_SUGGESTIONS).toHaveProperty('repair')
    expect(ENHANCED_SUGGESTIONS).toHaveProperty('linux')
    expect(ENHANCED_SUGGESTIONS).toHaveProperty('web')
  })
})
