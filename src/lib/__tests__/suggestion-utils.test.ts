/**
 * Tests for src/lib/suggestion-utils/iconMapping.ts
 *
 * getSuggestionIcon: maps labels/hrefs to emoji strings.
 * ensureIconInLabel: prefixes emoji to labels that don't have one already.
 *
 * Both are pure string functions used in the chatbot suggestion panel and
 * page-contextual navigation suggestions.
 */

import { getSuggestionIcon, ensureIconInLabel, SUGGESTION_ICONS } from '../suggestion-utils/iconMapping'

// ─── getSuggestionIcon ────────────────────────────────────────────────────────

describe('getSuggestionIcon', () => {
  it('always returns a non-empty string', () => {
    const icon = getSuggestionIcon('test', '/test')
    expect(icon.length).toBeGreaterThan(0)
    expect(typeof icon).toBe('string')
  })

  it('label containing "repair" → repair emoji', () => {
    const icon = getSuggestionIcon('Repair Service', '/services/repair')
    expect(icon).toBe(SUGGESTION_ICONS['repair'].emoji)
  })

  it('label containing "laptop" → laptop emoji', () => {
    // Href "/x" has no substring matches for any SUGGESTION_ICONS key
    // label "Laptop" only matches the 'laptop' key
    const icon = getSuggestionIcon('Laptop', '/x')
    expect(icon).toBe(SUGGESTION_ICONS['laptop'].emoji)
  })

  it('label matching "shop" → shop emoji', () => {
    const icon = getSuggestionIcon('Shop durchsuchen', '/shop')
    expect(icon).toBe(SUGGESTION_ICONS['shop'].emoji)
  })

  it('label matching "volunteer" → volunteer emoji', () => {
    const icon = getSuggestionIcon('Volunteer Programme', '/get-involved/volunteer')
    expect(icon).toBe(SUGGESTION_ICONS['volunteer'].emoji)
  })

  it('href containing "/service" → service emoji when label is unmatched', () => {
    // No keyword in label that matches, but href has /service
    const icon = getSuggestionIcon('Informationen', '/service/help')
    expect(icon).toBe(SUGGESTION_ICONS['service'].emoji)
  })

  it('href containing "about" → about emoji', () => {
    const icon = getSuggestionIcon('Some Page', '/about/us')
    expect(icon).toBe(SUGGESTION_ICONS['about'].emoji)
  })

  it('href containing "volunteer" → volunteer emoji', () => {
    const icon = getSuggestionIcon('Mitmachen', '/get-involved/volunteer')
    expect(icon).toBe(SUGGESTION_ICONS['volunteer'].emoji)
  })

  it('category match overrides default when label/href unmatched', () => {
    const icon = getSuggestionIcon('Something Generic', '/something', 'donate')
    expect(icon).toBe(SUGGESTION_ICONS['donate'].emoji)
  })

  it('completely unknown label/href → default fallback emoji "📄"', () => {
    const icon = getSuggestionIcon('xyz completely unknown', '/xyz/unknown')
    expect(icon).toBe('📄')
  })

  it('search is case-insensitive for label', () => {
    const lower = getSuggestionIcon('laptop', '/x')
    const upper = getSuggestionIcon('LAPTOP', '/x')
    expect(lower).toBe(upper)
  })

  it('search is case-insensitive for href', () => {
    const lower = getSuggestionIcon('x', '/shop')
    const upper = getSuggestionIcon('x', '/SHOP')
    expect(lower).toBe(upper)
  })
})

// ─── ensureIconInLabel ────────────────────────────────────────────────────────

describe('ensureIconInLabel', () => {
  it('label without emoji → prefixed with icon + space', () => {
    const result = ensureIconInLabel('Repair Service', '/services/repair')
    expect(result).toMatch(/^.+\s.*/)  // starts with some char(s), space, then label
  })

  it('label without emoji starts with the icon emoji', () => {
    const icon = getSuggestionIcon('Repair Service', '/services/repair')
    const result = ensureIconInLabel('Repair Service', '/services/repair')
    expect(result.startsWith(icon)).toBe(true)
  })

  it('label with existing emoji → returned unchanged', () => {
    const withEmoji = '🔧 Repair Service'
    const result = ensureIconInLabel(withEmoji, '/services/repair')
    expect(result).toBe(withEmoji)
  })

  it('label with 🛒 emoji → not double-prefixed', () => {
    const withEmoji = '🛒 Shop'
    expect(ensureIconInLabel(withEmoji, '/shop')).toBe(withEmoji)
  })

  it('result includes original label text', () => {
    const label = 'Volunteer Programme'
    const result = ensureIconInLabel(label, '/get-involved/volunteer')
    expect(result).toContain(label)
  })

  it('format is "<emoji> <label>"', () => {
    const label = 'Laptop kaufen'
    const result = ensureIconInLabel(label, '/shop/laptops')
    const icon = getSuggestionIcon(label, '/shop/laptops')
    expect(result).toBe(`${icon} ${label}`)
  })

  it('always returns a non-empty string', () => {
    const result = ensureIconInLabel('X', '/x')
    expect(result.length).toBeGreaterThan(0)
  })

  it('category param is passed to getSuggestionIcon', () => {
    const icon = getSuggestionIcon('Generic', '/x', 'donate')
    const result = ensureIconInLabel('Generic', '/x', 'donate')
    expect(result.startsWith(icon)).toBe(true)
  })
})
