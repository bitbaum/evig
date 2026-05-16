/**
 * Tests for config/service-categories.ts — service category styling helpers.
 *
 * Mission-relevant: service categories drive the visual styling of the public
 * services page. If getCategoryStyle returns the 'general' fallback for a
 * known category like 'repair', the service hero section loses its blue
 * branding. If getCategoryLabel returns the raw key instead of 'Reparatur',
 * the service card header shows an untranslated English key to German speakers.
 *
 * Behaviors locked:
 *   getCategoryStyle
 *   - returns 'general' style for null input
 *   - returns correct style for known category
 *   - returns 'general' fallback for unknown category
 *
 *   getCategoryBadgeClasses
 *   - returns a non-empty string for known categories
 *   - returns badge classes for null (uses general fallback)
 *
 *   getCategoryLabel
 *   - returns 'Allgemein' for null input
 *   - returns German label for known categories
 *   - falls back to raw value for unknown category
 */

import {
  getCategoryStyle,
  getCategoryBadgeClasses,
  getCategoryLabel,
  CATEGORY_STYLES,
} from '../service-categories'

// ============================================================================
// getCategoryStyle
// ============================================================================

describe('getCategoryStyle', () => {
  it('returns general style for null', () => {
    const style = getCategoryStyle(null)
    expect(style).toBe(CATEGORY_STYLES.general)
  })

  it('returns repair style for "repair"', () => {
    const style = getCategoryStyle('repair')
    expect(style).toBe(CATEGORY_STYLES.repair)
    expect(style.primary).toContain('primary')
  })

  it('returns data style for "data"', () => {
    const style = getCategoryStyle('data')
    expect(style.primary).toContain('primary')
  })

  it('returns recycling style for "recycling"', () => {
    const style = getCategoryStyle('recycling')
    expect(style.primary).toContain('primary')
  })

  it('returns general fallback for unknown category', () => {
    const style = getCategoryStyle('unknown_category')
    expect(style).toBe(CATEGORY_STYLES.general)
  })

  it('returns an object with expected shape', () => {
    const style = getCategoryStyle('repair')
    expect(style.primary).toBeTruthy()
    expect(style.badge).toBeDefined()
    expect(style.badge.bg).toBeTruthy()
    expect(style.gradient).toBeTruthy()
  })
})

// ============================================================================
// getCategoryBadgeClasses
// ============================================================================

describe('getCategoryBadgeClasses', () => {
  it('returns a non-empty string for "repair"', () => {
    const classes = getCategoryBadgeClasses('repair')
    expect(typeof classes).toBe('string')
    expect(classes.length).toBeGreaterThan(0)
  })

  it('includes bg and text classes', () => {
    const classes = getCategoryBadgeClasses('data')
    expect(classes).toContain('bg-')
    expect(classes).toContain('text-')
  })

  it('returns classes for null (uses general fallback)', () => {
    const classes = getCategoryBadgeClasses(null)
    const generalClasses = getCategoryBadgeClasses('general')
    expect(classes).toBe(generalClasses)
  })
})

// ============================================================================
// getCategoryLabel
// ============================================================================

describe('getCategoryLabel', () => {
  it('returns "Allgemein" for null', () => {
    expect(getCategoryLabel(null)).toBe('Allgemein')
  })

  it('returns "Reparatur" for "repair"', () => {
    expect(getCategoryLabel('repair')).toBe('Reparatur')
  })

  it('returns "Daten" for "data"', () => {
    expect(getCategoryLabel('data')).toBe('Daten')
  })

  it('returns "Recycling" for "recycling"', () => {
    expect(getCategoryLabel('recycling')).toBe('Recycling')
  })

  it('returns "Software" for "software"', () => {
    expect(getCategoryLabel('software')).toBe('Software')
  })

  it('returns "Web" for "web"', () => {
    expect(getCategoryLabel('web')).toBe('Web')
  })

  it('falls back to raw value for unknown category', () => {
    expect(getCategoryLabel('unknown_cat')).toBe('unknown_cat')
  })
})
